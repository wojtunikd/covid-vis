/*
    Resources:
        a) https://www.d3-graph-gallery.com/graph/scatter_basic.html
        b) https://observablehq.com/@d3/scatterplot-with-shapes
        c) http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html

*/

const loadDataForScatterplotMedian = withDensity => {
    let recentCovid = [];
    let medianAge = [];

    d3
    .csv("data/covid-recent.csv", data => {
        recentCovid.push(data);
    })
    .then(() => {
        d3
        .csv("data/median-age.csv", data => {
            medianAge.push(data)
        })
        .then(async () => {
            const data = await bindDatasets(recentCovid, medianAge, "median", "median");

            if(!!withDensity) return createDensityScatterplot(data, "median");

            createScatterplot(data, "median");
        })
    })
}

const loadDataForScatterplotOver60 = withDensity => {
    let recentCovid = [];
    let peopleOver60 = [];

    d3
    .csv("data/covid-recent.csv", data => {
        recentCovid.push(data);
    })
    .then(() => {
        d3
        .csv("data/people-over-60.csv", data => {
            peopleOver60.push(data)
        })
        .then(async () => {
            const data = await bindDatasets(recentCovid, peopleOver60, "percentage", "agedOver60");

            if(!!withDensity) return createDensityScatterplot(data, "agedOver60");

            createScatterplot(data, "agedOver60");
        })
    })
}

const loadDataForBarMedian = (order, limit) => {
    let recentCovid = [];
    let medianAge = [];

    d3
    .csv("data/covid-recent.csv", data => {
        recentCovid.push(data);
    })
    .then(() => {
        d3
        .csv("data/median-age.csv", data => {
            medianAge.push(data)
        })
        .then(async () => {
            let data = await bindDatasets(recentCovid, medianAge, "median", "median");
            data.sort((a, b) => sortByProperty(a, b, "median", order));
            const dataSubset = data.slice(0, limit);

            createBarChart(dataSubset, "median");
        })
    })
}

const loadDataForBarOver60 = (order, limit) => {
    let recentCovid = [];
    let peopleOver60 = [];

    d3
    .csv("data/covid-recent.csv", data => {
        recentCovid.push(data);
    })
    .then(() => {
        d3
        .csv("data/people-over-60.csv", data => {
            peopleOver60.push(data)
        })
        .then(async () => {
            let data = await bindDatasets(recentCovid, peopleOver60, "percentage", "agedOver60");
            data.sort((a, b) => sortByProperty(a, b, "agedOver60", order));
            const dataSubset = data.slice(0, limit);

            createBarChart(dataSubset, "agedOver60");
        })
    })
}

const loadDataForBarMortality = (order, limit) => {
    let recentCovid = [];

    d3
    .csv("data/covid-recent.csv", data => {
        recentCovid.push(data);
    })
    .then(() => {
        recentCovid.sort((a, b) => sortByProperty(a, b, "total_deaths_per_million", order));
        const dataSubset = recentCovid.slice(0, limit);

        console.log(dataSubset)

        createBarChart(dataSubset, "total_deaths_per_million");
    })
}

const bindDatasets = async (covidData, ageData, sourceColumn, newAttributeName) => {
    let bindedDataset = [];

    for(const entry of covidData) {
        const ageEntry = ageData.filter(object => {
            return object.country === entry.country;
        })

        if(!!ageEntry[0]) {
            bindedDataset.push({
                ...entry,
                [newAttributeName]: ageEntry[0][sourceColumn]
            })
        }
    }
    return bindedDataset;
}

const getMinMaxAttribute = (data, property) => {
    return {
        min: d3.min(data, entry => +entry[property]),
        max: d3.max(data, entry => +entry[property])
    }
}

const getMinMaxObjects = (data, property) => {
    return {
        min: data[d3.minIndex(data, entry => +entry[property])],
        max: data[d3.maxIndex(data, entry => +entry[property])]
    }
}

// 
const getTrendData = (figure, property) => {
    const param = +figure;

    if(property === "median") return 37.6997 * param - 523.136;

    return 33.2846 * param + 220.199;
}

const sortByProperty = (a, b, property, order) => {
    const firstFigure = +a[property];
    const secondFigure = +b[property];
    let comparison = 0;

    if(firstFigure > secondFigure) {
        comparison = 1;
    } else if(firstFigure < secondFigure) {
        comparison = -1;
    }

    return comparison * order;
};

const createBarChart = (data, property) => {
    let propertyName = ""; 

    switch(property) {
        case "median":
            propertyName = "Median Age";
            break;
        case "agedOver60":
            propertyName = "People Aged 60+ (%)";
            break;
        case "total_deaths_per_million":
            propertyName = "Deaths Per Million";
            break;
    }

    const minMaxProperty = getMinMaxAttribute(data, property);
    const margins = { top: 10, right: 30, bottom: 45, left: 70 };
    let width = 850 - margins.left - margins.right;
    let height = 500 - margins.top - margins.bottom;

    if(window.matchMedia('(max-device-width: 767px)').matches) {
        width = width / 2.75;
        height = height / 2;
    }

    const svg = d3.select("#canvas")
        .attr("width", width + margins.left + margins.right)
        .attr("height", height + margins.top + margins.bottom)
        .append("g")
        .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

    const x = d3.scaleLinear()
        .domain([0, minMaxProperty.max])
        .range([0, width - 150]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    
    // y-axis and bars as advised at D3-Graph-Gallery
    // Available here: https://www.d3-graph-gallery.com/graph/barplot_horizontal.html
    const y = d3.scaleBand()
        .range([0, height])
        .domain(data.map(entry => entry.country))
        .padding(0.1);

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("text")             
        .attr("transform", "translate(" + (width / 2) + ", " + (height + margins.top + 30) + ")")
        .style("text-anchor", "middle")
        .text(propertyName);

    const colorScale = d3.scaleOrdinal()
        .range(d3.schemePastel1)
        .domain(data.map(entry => entry.continent));

    const detailsField = d3.select("body")
        .append("div")
        .attr("class", "mark-details")
        .style("opacity", 0);

    svg.selectAll("bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", x(0))
        .attr("y", entry => y(entry.country))
        .attr("width", entry => x(entry[property]))
        .attr("height", y.bandwidth())
        .attr("fill", entry => colorScale(entry.continent))
        .on("mouseover", event => {
            const details = event.target["__data__"];

            detailsField
                .transition()
                .duration(350)
                .style("opacity", 0.95);

            detailsField
                .style("left", `${event.clientX + 40}px`)
                .style("top", `${event.clientY - 50}px`)

            const text = propertyName == "Deaths Per Million" ? `Continent: <b>${details.continent}</b><br />Country: <b>${details.country}</b><br />Cases Per Million: <b>${details["total_cases_per_million"]}</b><br />Deaths Per Million: <b>${details["total_deaths_per_million"]}</b>` : `Continent: <b>${details.continent}</b><br />Country: <b>${details.country}</b><br />Cases Per Million: <b>${details["total_cases_per_million"]}</b><br />Deaths Per Million: <b>${details["total_deaths_per_million"]}</b><br />${propertyName}: <b>${details[property]}</b>`;

            detailsField
                .html(text);
        })
        .on("mouseout", () => {
            detailsField
                .transition()
                .duration(350)
                .style("opacity", 0);
        })

    const colourLegend = svg
        .selectAll(".colour-categories")
        .data(colorScale.domain())
        .enter()
        .append("g")
        .attr("class", "colour-categories")
        .attr("transform", (d, i) => "translate(0," + i * 22 + ")");

    colourLegend
        .append("rect")
        .attr("width", 17)
        .attr("height", 17)
        .attr("transform", `translate(${width - 6}, 0)`)
        .style("fill", colour => colorScale(colour))

    colourLegend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", "0.16em")
        .style("text-anchor", "end")
        .attr("class", "legend-text")
        .text(text => text)

    generateSingleSummary(data, property);
}

const createScatterplot = (data, property) => {
    const propertyName = property === "median" ? "Age Median" : "People Aged 60+ (%)";
    const minHue = property === "median" ? "#d3e6f2" : "#f0e8dd";
    const maxHue = property === "median" ? "#0e1647" : "#451900";

    const margins = { top: 10, right: 30, bottom: 40, left: 60 };
    let width = 850 - margins.left - margins.right;
    let height = 500 - margins.top - margins.bottom;

    if(window.matchMedia('(max-device-width: 767px)').matches) {
        width = width / 2.75;
        height = height / 2;
    }

    const svg = d3.select("#canvas")
        .attr("width", width + margins.left + margins.right)
        .attr("height", height + margins.top + margins.bottom)
        .append("g")
        .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

    const minMaxProperty = getMinMaxAttribute(data, property);
    const minMaxDeaths = getMinMaxAttribute(data, "total_deaths_per_million");
    const minMaxCases = getMinMaxAttribute(data, "total_cases_per_million");

    const colourValue = entry => entry["total_cases_per_million"];
    const colour = d3.scaleLinear()
        .domain([minMaxCases.min, minMaxCases.max - 1])
        .range([minHue, maxHue])

    const shape = d3.scaleOrdinal(data.map(entry => entry.continent), d3.symbols.map(s => d3.symbol().type(s)()));
    
    const x = d3.scaleLinear()
        .domain([minMaxProperty.min, minMaxProperty.max])
        .range([0, width - 150]);

    const xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    
    const y = d3.scaleLinear()
        .domain([minMaxDeaths.min - 20, minMaxDeaths.max])
        .range([height, 0]);
    
    const yAxis = svg.append("g")
        .call(d3.axisLeft(y));

    // Appending axis labels as adviced at Bl.ocks in 2016
    // https://bl.ocks.org/d3noob/23e42c8f67210ac6c678db2cd07a747e

    svg.append("text")             
        .attr("transform", "translate(" + (width / 2) + ", " + (height + margins.top + 25) + ")")
        .style("text-anchor", "middle")
        .text(propertyName);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margins.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Deaths Per Million");

    const detailsField = d3.select("body")
        .append("div")
        .attr("class", "mark-details")
        .style("opacity", 0);
    
    svg.append("g")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("transform", entry => `translate(${x(entry[property])}, ${y(entry["total_deaths_per_million"])})`)
        .attr("d", entry => shape(entry.continent))
        .style("fill", entry => colour(colourValue(entry)))
        .on("mouseover", event => {
            const details = event.target["__data__"];

            detailsField
                .transition()
                .duration(350)
                .style("opacity", 0.95);

            detailsField
                .style("left", `${event.clientX + 10}px`)
                .style("top", `${event.clientY - 28}px`)

            detailsField
                .html(`Continent: <b>${details.continent}</b><br />Country: <b>${details.country}</b><br />Cases Per Million: <b>${details["total_cases_per_million"]}</b><br />Deaths Per Million: <b>${details["total_deaths_per_million"]}</b><br />${propertyName}: <b>${details[property]}</b>`);
        })
        .on("mouseout", () => {
            detailsField
                .transition()
                .duration(350)
                .style("opacity", 0);
        })

    svg.append("g")
        .selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "country-name")
        .text(entry => entry.country)
        .attr("transform", entry => `translate(${x(entry[property]) + 8}, ${y(entry["total_deaths_per_million"]) + 3})`)

    // Legend inspired by Michele Weigle's code (2019)
    // Available at http://bl.ocks.org/weiglemc/6185069

    const shapeLegend = svg
        .selectAll(".shape-legend")
        .data(shape.domain())
        .enter()
        .append("g")
        .attr("class", "shape-legend")
        .attr("transform", (d, i) => "translate(0," + i * 16 + ")");

    shapeLegend
        .append("path")
        .attr("transform", `translate(${width - 6}, 10)`)
        .attr("d", symbol => shape(symbol))
        .style("fill", "black")

    shapeLegend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .style("text-anchor", "end")
        .attr("class", "legend-text")
        .text(text => text)

    // Gradient as explained in the tutorial by Pablo Navarro in 2018
    // Available here: http://bl.ocks.org/pnavarrc/20950640812489f13246

    const svgDefsLegend = svg.append("defs");

    const legendGradient = svgDefsLegend.append("linearGradient")
        .attr("id", "legendGradient");
    
    legendGradient.append("stop")
        .style("stop-color", minHue)
        .attr("offset", "0");

    legendGradient.append("stop")
        .style("stop-color", maxHue)
        .attr("offset", "1");

    const gradentDimentions = {
        width: 120,
        height: 20
    }

    svg.append("rect")
        .classed("filled", true)
        .attr("width", gradentDimentions.width)
        .attr("height", gradentDimentions.height)
        .attr("transform", `translate(${width - 100}, 150)`)

    svg.append("text")
        .attr("class", "legend-text")
        .text("Cases per Million")
        .attr("transform", `translate(${width - 100}, 142)`)

    svg.append("text")
        .attr("class", "legend-text")
        .text(minMaxCases.min.toFixed())
        .attr("transform", `translate(${width - 100}, ${150 + gradentDimentions.height + 15})`)

    svg.append("text")
        .attr("class", "legend-text")
        .text(minMaxCases.max.toFixed())
        .attr("transform", `translate(${width - 100 + gradentDimentions.width - 35}, ${150 + gradentDimentions.height + 15})`)

    const dataObjects = getMinMaxObjects(data, property);
    const trendData = [+dataObjects.min[property], getTrendData(dataObjects.min[property], property), +dataObjects.max[property], getTrendData(dataObjects.max[property], property)];

    // Trend line inspired by Ben Van Dyke's code
    // Available here: http://bl.ocks.org/benvandyke/8459843

    svg.selectAll(".trend-line")
        .data(trendData)
        .enter()
        .append("line")
        .attr("class", "trend-line")
        .style("display", "none")
        .attr("x1", x(trendData[0]))
        .attr("y1", y(trendData[1]))
        .attr("x2", x(trendData[2]))
        .attr("y2", y(trendData[3]))
        .attr("stroke", "black")
        .attr("stroke-width", 0.35);

    generateSummary(data, property);
}

const createDensityScatterplot = (data, property) => {
    const propertyName = property === "median" ? "Age Median" : "People Aged 60+ (%)";
    const hue = property === "median" ? "rgba(196, 57, 29, 0.18)" : "rgba(9, 156, 51, 0.18)";

    const margins = { top: 10, right: 30, bottom: 40, left: 60 };
    let width = 700 - margins.left - margins.right;
    let height = 500 - margins.top - margins.bottom;

    if(window.matchMedia('(max-device-width: 767px)').matches) {
        width = width / 2.75;
        height = height / 2;
    }

    const svg = d3.select("#canvas")
        .attr("width", width + margins.left + margins.right)
        .attr("height", height + margins.top + margins.bottom)
        .append("g")
        .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

    const minMaxProperty = getMinMaxAttribute(data, property);
    const minMaxDeaths = getMinMaxAttribute(data, "total_deaths_per_million");
    
    const x = d3.scaleLinear()
        .domain([minMaxProperty.min, minMaxProperty.max])
        .range([0, width]);

    const xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    
    const y = d3.scaleLinear()
        .domain([minMaxDeaths.min - 50, minMaxDeaths.max + 100])
        .range([height, 0]);
    
    const yAxis = svg.append("g")
        .call(d3.axisLeft(y));

    // Appending axis labels as adviced at Bl.ocks in 2016
    // https://bl.ocks.org/d3noob/23e42c8f67210ac6c678db2cd07a747e

    svg.append("text")             
        .attr("transform", "translate(" + (width / 2) + ", " + (height + margins.top + 25) + ")")
        .style("text-anchor", "middle")
        .text(propertyName);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margins.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Deaths Per Million");

    svg.append("g")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", entry => x(entry[property]) )
        .attr("cy", entry => y(entry["total_deaths_per_million"]))
        .attr("r", 15)
        .attr("class", "density-mark")
        .style("fill", hue)

    generateSummary(data, property);
}

const generateSummary = (data, property) => {
    const minEntryProperty = data[d3.minIndex(data, entry => +entry[property])];
    const maxEntryProperty = data[d3.maxIndex(data, entry => +entry[property])];
    const minEntryDeaths = data[d3.minIndex(data, entry => +entry["total_deaths_per_million"])];
    const maxEntryDeaths = data[d3.maxIndex(data, entry => +entry["total_deaths_per_million"])];
    const propertyName = property === "median" ? "median age" : "% of people aged 60+";

    document.querySelector("#data-summary").value = `<p>Lowest ${propertyName}: <b>${minEntryProperty.country}</b> (${minEntryProperty[property]})</p><p>Largest ${propertyName}: <b>${maxEntryProperty.country}</b> (${maxEntryProperty[property]})</p><p>Lowest deaths per million: <b>${minEntryDeaths.country}</b> (${minEntryDeaths["total_deaths_per_million"]})</p><p>Highest deaths per million: <b>${maxEntryDeaths.country}</b> (${maxEntryDeaths["total_deaths_per_million"]})</p>`;
}

const generateSingleSummary = (data, property) => {
    const objects = data.slice(0, 5);
    let count = 1; 
    let text = "";

    for(const object of objects) {
        text = text + `<p>${count}. <b>${object.country}</b> - ${object[property]}</p>`;
        count++;
    }

    document.querySelector("#data-summary").value = text;
}

const emptyParent = parent => {
    while(parent.firstChild) {
        parent.firstChild.remove()
    }
}

const removeOrderOption = () => {
    try {
        document.querySelector("#order-option").remove();
    } catch(error) {}
    
    document.querySelector("#trend-option").style.display = "flex";
    document.querySelector("#names-option").style.display = "flex";
}

const appendOrderOption = () => {
    try {
        document.querySelector("#order-option").remove();
    } catch(error) {}

    let option = document.createElement("div");
    option.className = "user-option";
    option.id = "order-option";

    let optionIcon = document.createElement("div");
    optionIcon.classList = "option-icon pointer";

    let switchBtn = document.createElement("label");
    switchBtn.className = "switch";

    let checkbox = document.createElement("input");
    checkbox.id = "toggle-order";
    checkbox.type = "checkbox";

    let slider = document.createElement("span");
    slider.classList = "slider round";

    let optionLabel = document.createElement("span");
    optionLabel.className = "option-label";
    optionLabel.innerText = "Switch to ascending order";
    
    switchBtn.appendChild(checkbox);
    switchBtn.appendChild(slider);
    optionIcon.appendChild(switchBtn);
    option.appendChild(optionIcon);
    option.appendChild(optionLabel);

    option.style.marginBottom = "1.5rem";

    option.addEventListener("change", event => {
        let property = null;
        const isChecked = !!event.target.checked;

        switch(document.querySelector("#data-menu").value) {
            case "countries-median":
                property = "median";
                emptyParent(document.querySelector("svg"));
                document.querySelector("#order-option .option-label").innerHTML = isChecked ? "Switch to descending order" : "Switch to ascending order";
                return loadDataForBarMedian(isChecked ? 1 : -1, 15);
            case "countries-over60":
                property = "over60";
                emptyParent(document.querySelector("svg"));
                document.querySelector("#order-option .option-label").innerHTML = isChecked ? "Switch to descending order" : "Switch to ascending order";
                return loadDataForBarOver60(isChecked ? 1 : -1, 15);
            case "countries-deaths":
                emptyParent(document.querySelector("svg"));
                property = "total_deaths_per_million";
                document.querySelector("#order-option .option-label").innerHTML = isChecked ? "Switch to descending order" : "Switch to ascending order";
                return loadDataForBarMortality(isChecked ? 1 : -1, 15);
        }

        return alert("There has been a problem while sorting the entries");
    })

    document.querySelector("#trend-option").style.display = "none";
    document.querySelector("#names-option").style.display = "none";

    document.querySelector(".info-area").insertBefore(option, document.querySelector("#trend-option"));
}

const handleMenuChange = event => {
    const option = event.target.value;
    document.querySelector("#toggle-names").checked = false;
    document.querySelector("#toggle-trend").checked = false;

    switch(option) {
        case "median":
            emptyParent(document.querySelector("svg"));
            document.querySelector(".title-area h2").innerText = "Relationship between the median age of a population and the number of Covid-19 deaths per million";
            document.querySelector(".graph-description").innerHTML = "This scatter plot investigates a possible correlation between the <b>median age</b> of the population and the Covid-19 mortality measures as <b>deaths per million</b>. Shapes represent continents, while colour saturation - cases per million. Hover over the mark to read the details. Toggle the trend line and country names using <i>button switches</i> below.";
            removeOrderOption();
            return loadDataForScatterplotMedian(false);
        case "agedOver60":
            emptyParent(document.querySelector("svg"));
            document.querySelector(".title-area h2").innerText = "Relationship between the proportion of population aged 60+ and the number of Covid-19 deaths per million";
            document.querySelector(".graph-description").innerHTML = "This scatter plot investigates a possible correlation between the <b>proportion of population aged 60+</b> of the population and the Covid-19 mortality measures as <b>deaths per million</b>. Shapes represent continents, while colour saturation - cases per million. Hover over the mark to read the details. Toggle the trend line and country names using <i>button switches</i> below.";
            removeOrderOption();
            return loadDataForScatterplotOver60(false);
        case "density-median":
            emptyParent(document.querySelector("svg"));
            document.querySelector(".title-area h2").innerText = "Relationship between the median age of a population and the number of Covid-19 deaths per million - Density";
            document.querySelector(".graph-description").innerHTML = "This scatter plot show the densities of marks when investigating correlation between the <b>median age</b> of the population and the Covid-19 mortality measures as <b>deaths per million</b>. The higher the colour intensity, the higher the density.";
            removeOrderOption();
            return loadDataForScatterplotMedian(true);
        case "density-over60":
            emptyParent(document.querySelector("svg"));
            document.querySelector(".title-area h2").innerText = "Relationship between the proportion of population aged 60+ and the number of Covid-19 deaths per million - Density";
            document.querySelector(".graph-description").innerHTML = "This scatter plot show the densities of marks when investigating correlation between the <b>proportion of population aged 60+</b> of the population and the Covid-19 mortality measures as <b>deaths per million</b>. The higher the colour intensity, the higher the density.";
            removeOrderOption();
            return loadDataForScatterplotOver60(true);
        case "countries-median":
            emptyParent(document.querySelector("svg"));
            document.querySelector(".title-area h2").innerText = "Top 15 Countries by Median Age";
            document.querySelector(".graph-description").innerHTML = "This bar chart presents the top fifteen countries by the <b>median age</b>. Bar colours represent continents. Toggle the order to ascending or descending using the <i>button switch</i> below.";
            appendOrderOption();
            return loadDataForBarMedian(-1, 15);
        case "countries-over60":
            emptyParent(document.querySelector("svg"));
            document.querySelector(".title-area h2").innerText = "Top 15 Countries by Proportion of People Aged Over 60";
            document.querySelector(".graph-description").innerHTML = "This bar chart presents the top fifteen countries by the <b>proportion of population aged 60+</b>. Bar colours represent continents. Toggle the order to ascending or descending using the <i>button switch</i> below.";
            appendOrderOption();
            return loadDataForBarOver60(-1, 15);
        case "countries-deaths":
            emptyParent(document.querySelector("svg"));
            document.querySelector(".title-area h2").innerText = "Top 15 Countries by Covid-19 Deaths Per Million";
            document.querySelector(".graph-description").innerHTML = "This bar chart presents the top fifteen countries by the <b>Covid-19 deaths per million</b>. Bar colours represent continents. Toggle the order to ascending or descending using the <i>button switch</i> below.";
            appendOrderOption();
            return loadDataForBarMortality(-1, 15);
        default:
            return alert("This functionality is not supported yet.");
    }
}

window.addEventListener("load", () => {
    const params = new URLSearchParams(window.location.search);
    if(params.has("vis")) {
        const customEvent = new Event("change");
        document.querySelector("#data-menu").addEventListener("change", handleMenuChange);

        switch(params.get("vis")) {
            case "median":
                document.querySelector("#data-menu option[value='median']").selected = "true";
                document.querySelector("#data-menu").dispatchEvent(customEvent);
                break;
            case "agedOver60":
                document.querySelector("#data-menu option[value='agedOver60']").selected = "true";
                document.querySelector("#data-menu").dispatchEvent(customEvent);
                break;
            case "density-median":
                document.querySelector("#data-menu option[value='density-median']").selected = "true";
                document.querySelector("#data-menu").dispatchEvent(customEvent);
                break;
            case "density-over60":
                document.querySelector("#data-menu option[value='density-over60']").selected = "true";
                document.querySelector("#data-menu").dispatchEvent(customEvent);
                break;
            case "countries-median":
                document.querySelector("#data-menu option[value='countries-median']").selected = "true";
                document.querySelector("#data-menu").dispatchEvent(customEvent);
                break;
            case "countries-over60":
                document.querySelector("#data-menu option[value='countries-over60']").selected = "true";
                document.querySelector("#data-menu").dispatchEvent(customEvent);
                break;
            case "countries-deaths":
                document.querySelector("#data-menu option[value='countries-deaths']").selected = "true";
                document.querySelector("#data-menu").dispatchEvent(customEvent);
                break;
        }

        document.querySelector("#data-menu").removeEventListener("change");
    } else {
        loadDataForScatterplotMedian(false);
    }

    document.querySelector("#pdf-option").addEventListener("click", () => {
        window.print();
    });

    document.querySelector("#summary-option").addEventListener("click", () => {
        try {
            document.querySelector("#summary-window").remove();
        } catch(error) {}

        const summary = document.createElement("div");
        summary.id = "summary-window";

        const windowBar = document.createElement("div");
        windowBar.className = "window-bar";
        const closeWindow = document.createElement("span");
        closeWindow.className = "close-window";
        closeWindow.innerHTML = "✖";
        closeWindow.addEventListener("click", () => document.querySelector("#summary-window").remove());
        windowBar.appendChild(closeWindow);

        const summaryTitle = document.createElement("h3");
        summaryTitle.innerText = "Summary";

        const summaryContent = document.createElement("div");
        summaryContent.innerHTML = document.querySelector("#data-summary").value;

        summary.appendChild(windowBar);
        summary.appendChild(summaryTitle);
        summary.appendChild(summaryContent);

        document.querySelector("body").appendChild(summary);
    })

    document.getElementById("data-menu").addEventListener("change", event => handleMenuChange(event))

    document.getElementById("toggle-names").addEventListener("change", event => {
        const names = document.getElementsByClassName("country-name");

        if(document.querySelector("#data-menu").value.startsWith("density")) {
            return document.querySelector("#toggle-names").checked = false;
        }

        if(!!event.target.checked) {
            for(const name of names) {
                name.style.display = "initial";
                document.querySelector("#names-option .option-label").innerHTML = "Hide country names";
            }
        } else {
            for(const name of names) {
                name.style.display = "none";
                document.querySelector("#names-option .option-label").innerHTML = "Show country names";
            }
        }
    })

    document.getElementById("toggle-trend").addEventListener("change", event => {

        if(document.querySelector("#data-menu").value.startsWith("density")) {
            return document.querySelector("#toggle-trend").checked = false;
        }

        if(!!event.target.checked) {
            document.querySelector(".trend-line").style.display = "initial";
            document.querySelector("#trend-option .option-label").innerHTML = "Hide trend line";
        } else {
            document.querySelector(".trend-line").style.display = "none";
            document.querySelector("#trend-option .option-label").innerHTML = "Show trend line";

        }
    })
})




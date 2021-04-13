const loadDataForMedian = withDensity => {
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
            const data = await bindDatasets(recentCovid, medianAge, "2020", "median");

            if(!!withDensity) return createDensityScatterplot(data, "median");

            createScatterplot(data, "median");
        })
    })
}

const loadDataForOver60 = withDensity => {
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
        .attr("transform", (d, i) => "translate(0," + i * 22 + ")");

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

    svg
        .append("rect")
        .attr("width", 100)
        .attr("height", 20)
        .attr("transform", `translate(${width - 100}, 200)`)
        .attr("fill-opacity", 0.5)
        .style("background", `-webkit-linear-gradient(${minHue} , ${maxHue})`)


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

const emptyParent = parent => {
    while(parent.firstChild) {
        parent.firstChild.remove()
    }
}

const downloadJPEG = () => {
    alert("This feature has not been implemented yet!");
}

window.addEventListener("load", () => {
    document.querySelector("#image-option").addEventListener("click", () => {
        downloadJPEG();
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

    document.getElementById("data-menu").addEventListener("change", event => {
        const option = event.target.value;
        document.querySelector("#toggle-names").checked = false;

        switch(option) {
            case "median":
                emptyParent(document.querySelector("svg"));
                document.querySelector(".title-area h2").innerText = "Relationship between the median age of a population and the number of Covid-19 deaths per million";
                return loadDataForMedian(false);
            case "agedOver60":
                emptyParent(document.querySelector("svg"));
                document.querySelector(".title-area h2").innerText = "Relationship between the proportion of population aged 60+ and the number of Covid-19 deaths per million";
                return loadDataForOver60(false);
            case "density-median":
                emptyParent(document.querySelector("svg"));
                document.querySelector(".title-area h2").innerText = "Relationship between the median age of a population and the number of Covid-19 deaths per million - Density";
                return loadDataForMedian(true);
            case "density-over60":
                emptyParent(document.querySelector("svg"));
                document.querySelector(".title-area h2").innerText = "Relationship between the proportion of population aged 60+ and the number of Covid-19 deaths per million - Density";
                return loadDataForOver60(true);
            default:
                return alert("This functionality is not supported yet.");
        }
    })

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
})

loadDataForMedian(false)
const loadDataForMedian = () => {
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
            createScatterplot(data, "median");
        })
    })
}

const loadDataForOver60 = () => {
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

const createScatterplot = (data, property) => {
    const margins = { top: 10, right: 30, bottom: 30, left: 60 };
    const width = 700 - margins.left - margins.right;
    const height = 500 - margins.top - margins.bottom;

    const svg = d3.select("#canvas")
        .attr("width", width + margins.left + margins.right)
        .attr("height", height + margins.top + margins.bottom)
        .append("g")
        .attr("transform", "translate(" + margins.left + "," + margins.top + ")");
    
    const x = d3.scaleLinear()
        .domain([0, 50])
        .range([0, width]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    
    const y = d3.scaleLinear()
        .domain([0, 2600])
        .range([height, 0]);
    
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("g")
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", entry => x(entry[property]))
        .attr("cy", entry => y(entry["total_deaths_per_million"]))
        .attr("r", 1.5)
        .style("fill", "#69b3a2")
}

loadDataForOver60()
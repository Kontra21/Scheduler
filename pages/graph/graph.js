var ipcRenderer = require('electron').ipcRenderer;

var largest = 0;
var numList = [];
const DOW = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']

prevCount = [];

ipcRenderer.on('graph-data', function (event, graph) {
    numList = graph.numList;
    largest = graph.largest;
    if (!same(prevCount, graph.SchedCount)) {
        prevCount = graph.SchedCount
        BuildTable(graph.SchedCount);
    }
});

function BuildTable(Schedule) {

    const DOW = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    //Get Table Element from index.html
    const table = document.getElementById('table');
    //Create the HTML for the table
    let tableFormat = '<table class=\"steelBlueCols\">';


    //Build Headers for Table
    tableFormat += '<thead><tr><th></th>'
    //Fill Header Rows with numbers 0 - 23
    for (var i = 0; i <= 23; i++) {
        tableFormat += `<th class="dataColH">${i}</th>`
    }
    //Close Header Rows
    tableFormat += '</tr></thead>'

    //Start Table Body
    tableFormat += '<tbody>';

    //We assume Schedule length == 7
    for (var i = 0; i <= 6; i++) {
        //Start a new Row and add the day of the week to the beginning
        tableFormat += `<tr><td>${DOW[i]}</td>`

        //Add Row Data
        Schedule[i].forEach(hour => {
            tableFormat += `<td class="dataCol">${hour}</td>`
        })
        //Close Row
        tableFormat += '</tr>'
    }


    //Close Table Format
    tableFormat += '</table>'

    table.innerHTML = tableFormat;

    colorTableData();
}

function colorTableData() {

    var colorTDs = document.getElementsByClassName('dataCol');
    // console.log(colorTDs)
    for (var cell of colorTDs) {
        var value = parseInt(cell.innerHTML);
        if (!isNaN(value)) {
            colors = GreenYellowRedDistortSat(numList.findIndex(x => {
                return x == value
            }))
            cell.style.backgroundColor = `hsl(${colors})`
            //cell.style.backgroundColor = `rgb(${colors[0]})`;
            //cell.style.color = `rgb(${colors[1]})`;
        }
    }
}

function GreenYellowRedDistort(value) {
    var r, g, b;
    var Distorion = 2;

    if (value < Distorion) {
        // green to yellow
        r = Math.floor(255 * (value / Distorion));
        g = 255;

    } else {
        // yellow to red
        r = 255;
        g = Math.floor(255 * (1 - value / largest));
    }
    b = 0;
    if (value == -1) r = g = b = 255;
    return [`${r},${g},${b}`, `${255-r},${255-g},${255-b}`];
}

function GreenYellowRedDistortSat(value) {
    var startPoint = 80; //for the first non-zero
    var sat = 70;
    var light = 70;
    var scale = startPoint/(largest);
    if(value == 0) return `120, ${sat}%, ${light}%`
    return `${Math.round(120 - (((value-1)*scale)+(120-startPoint)))}, ${sat}%, ${light}%`;
}

function same(arr1, arr2) {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
}
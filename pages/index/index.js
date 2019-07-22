var fs = require('fs');
var ipcRenderer = require('electron').ipcRenderer;
const DOW = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun']
const saveLocation = './saveData/';
var teamData = require('../../'+saveLocation+'save.json');

const electron = require('electron')
const BrowserWindow = electron.remote.BrowserWindow;

var saving = false;

//Restore Saved Data
restoreSavedData();
//Open the Graph Display Window
createGraphWindow();

//Assign Function to Add Team Button
document.getElementById('addTeam').addEventListener('click', () => {
        addEmployee(addTeam());
})

setInterval(()=>{
    saveData()
}, 1000)

function createGraphWindow(){
    let graphWindow = new BrowserWindow({
        show:false,
        width:  950,
        minWidth: 950,
        height: 300, //285
        minHeight: 300,
        titleBarStyle: 'hidden',
        closable: false
    })
    graphWindow.setMenu(null)
    graphWindow.loadFile('pages/graph/graph.html');
    graphWindow.once('ready-to-show', ()=>{
        graphWindow.show();
        graphWindow.webContents.send('graph-data', GetScheduleInfo())
    })
    graphWindow.webContents.openDevTools()

    setInterval(()=>{
        var ScheduleData = GetScheduleInfo();
        try{
            graphWindow.webContents.send('graph-data', ScheduleData)
        } catch(e){
            
        }
    }, 100)

    window.onbeforeunload = e => {
        graphWindow.destroy();
        saveData();
    }
}

function getDataFromTeamContainer(){
    var teams = document.getElementsByClassName('team');
    //Create entries in the obj for each team and their data
    let teamData = [];
    for(var i = 0; i < teams.length; i++){
        teamData.push([])

        var employees = teams[i].getElementsByClassName('employee');
        for(var n = 0; n < employees.length; n++){

            teamData[i][n] = {};

            var children = employees[n].children;

            teamData[i][n].name = children[0].value
            teamData[i][n].in = parseInt(children[1].children[0].children[0].value) || 0
            teamData[i][n].out = parseInt(children[1].children[2].children[0].value) || 0

            teamData[i][n].daysWorking = {}
            for(day of children[2].getElementsByClassName('checkbox')){
                if(day.checked) teamData[i][n].daysWorking[day.value] = true;
                else teamData[i][n].daysWorking[day.value] = false;
            }

            if(teamData[i][n].in == null) teamData[i][n].in = 0;
            if(teamData[i][n].out == null) teamData[i][n].out = 0;
        }
    }
    return teamData
}

function saveData(){
    saving = true;
    fs.copyFile(saveLocation+'save.json', saveLocation+'save.json.bak', (err)=>{
        if(err) alert(err);
        else{
            fs.writeFile(saveLocation+'save.json', JSON.stringify(teamData), {encoding: 'utf8'}, (err)=>{
                if(err) alert(err);
            })
        }
    })
}

function addTeam(){
    var count = document.getElementsByClassName('team').length
    if (count != 4) {

        var addEmp = document.createElement('button');
        addEmp.className='addEmp';
        addEmp.textContent = 'Add Emp';
        addEmp.onclick = ()=>{
            addEmployee(count);
        }

        var remTeam = document.createElement('button');
        remTeam.className='remTeam';
        remTeam.textContent = 'Remove Team';
        remTeam.onclick = ()=>{
            if(confirm('Do you really want to do delete this team?')){
                teamData.splice(count,1);
                saveData();
                restoreSavedData();
            }
        }

        var teamContainer = document.createElement('div');
        teamContainer.className = 'teamContainer';

        var team = document.createElement('div');
        team.className = 'team';
        team.id = 'iteration_' + count;

        teamContainer.appendChild(team)

        teamContainer.appendChild(addEmp)
        teamContainer.appendChild(remTeam)

        document.getElementById('teamsContainer').appendChild(teamContainer);
    }
    return count
}

function addEmployee(num, options) {
    var teamContainer = document.getElementById('iteration_'+num);

    var count = teamContainer.getElementsByClassName('employee').length

    var options = options || {name:null, timeIn: null, timeOut:null, daysWorking:null}
    //Create and set up the Employee
    var employee = document.createElement('div')
    employee.classList.add('employee');
    employee.classList.add('slider');

    //Create and Add Name input to Employee
    var name = document.createElement('input');
    name.id = 'name';
    name.type = 'text';
    name.placeholder = 'Input Name';
    name.value = "" || options.name
    employee.appendChild(name);

    //Create and Add Time In and Out to Employee
    var time = document.createElement('div');
    time.className = 'time';
    time.innerHTML = `<label><input id="in" type="number" value="${options.timeIn || 0}">IN</label><br><label><input id="out" type="number" value="${options.timeOut || 0}">OUT</label><br>`
    employee.appendChild(time);

    //Create and Add Check Boxes
    var daysWorking = document.createElement('div');
    daysWorking.className = 'daysWorking'
    for(var day in DOW){
        var cbContainer = document.createElement('div')
        cbContainer.className = 'cbContainer';
        var container = document.createElement('label');
        container.className = 'container';
        container.textContent = DOW[day];
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox';
        checkbox.value = DOW[day];
        if(options.daysWorking && options.daysWorking.includes(DOW[day])) checkbox.checked = true;
        container.appendChild(checkbox);
        var checkmark = document.createElement('span');
        checkmark.className = 'checkmark';
        container.appendChild(checkmark);
        cbContainer.appendChild(container);
        daysWorking.appendChild(cbContainer);
    }
    employee.appendChild(daysWorking);

    var delEmp = document.createElement('button');
    delEmp.className = 'delEmp';
    delEmp.textContent = 'X';
    delEmp.onclick = ()=>{
        if(confirm('Do you really want to do delete this Employee?')){
            teamData[num].splice(count,1);
            saveData();
            restoreSavedData();
        }
    }

    employee.appendChild(delEmp)
    //Add the Employee to the container
    teamContainer.appendChild(employee);
}

function GetScheduleInfo(){

    teamData = getDataFromTeamContainer();

    var numList = [];
    var largest = 0;
    //Base days
    var Sched = {
        Mon: {},
        Tues: {},
        Wed: {},
        Thurs: {},
        Fri: {},
        Sat: {},
        Sun: {}
    }

    //Add Time 0 - 23 for each day
    for (var i = 0; i <= 23; i++) {
        Sched.Mon[i + ''] = 0;
        Sched.Tues[i + ''] = 0;
        Sched.Wed[i + ''] = 0;
        Sched.Thurs[i + ''] = 0;
        Sched.Fri[i + ''] = 0;
        Sched.Sat[i + ''] = 0;
        Sched.Sun[i + ''] = 0;
    }

    teamData.forEach(team=>{
        team.forEach(employee =>{
            var daysWorking = []
            for(var day in employee.daysWorking){
                if(employee.daysWorking[day]) daysWorking.push(day);
            }
            daysWorking.forEach(day=>{
                //ALERT:  Don't know why this works. Make sure it actually does
                for (var n = parseInt(employee.in); n != parseInt(employee.out); n++) {
                    //Set 24 to 0 to signify over night
                    if (n == 24) n = 0;
                    Sched[day][n + '']++
                }
            })
        })
    })

    var SchedCount = []


    for (var Day in Sched) {
        var temp = []
        for (var key in Sched[Day]) {
            //Capture Each Unique Number
            if (!numList.includes(Sched[Day][key])) numList.push(Sched[Day][key])
            temp.push(Sched[Day][key])
        }
        SchedCount.push(temp)
    }

    numList.sort((a, b) => {
        return a - b
    })
    largest = numList.length;

    return {SchedCount: SchedCount, numList: numList, largest:largest};
}

function restoreSavedData(){
    document.getElementById('teamsContainer').innerHTML = "";
    for(var team in teamData){
        var teamNum = addTeam();
        for(var employee in teamData[team]){
            var employee = teamData[team][employee]
            var daysWorking = []
            for(var day in employee.daysWorking){
                if(employee.daysWorking[day]) daysWorking.push(day);
            }
            addEmployee(teamNum, {name: employee.name, timeIn: employee.in, timeOut: employee.out, daysWorking:daysWorking})
        }
    }
}


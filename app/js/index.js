
'use strict';

var soundButtons = document.querySelectorAll('.button-sound');
var electron = require("electron");
var ipcRenderer = electron.ipcRenderer;
var npmRun = require("npm-run");
// var remote = electron.remote;
var {Menu, Tray} = electron.remote;
var path = require("path");

var trayIcon = null;
if (process.platform === 'darwin') {
    trayIcon = new Tray(path.join(__dirname, 'img/tray-iconTemplate.png'));
}
else {
    trayIcon = new Tray(path.join(__dirname, 'img/tray-icon-alt.png'));
}

var trayMenuTemplate = [
    {
        label:"Unviel",
        enabled:false
    },
    // {
    //     label: 'Settings',
    //     click: function () {
    //         ipcRenderer.send('open-settings-window');
    //     }
    // },
    {
        label: 'Change Wallpaper',
        click: function () {
            ipcRenderer.send('change-wallpaper');
        }
    },
    {
        label: 'Stop Changing wallpaper',
        click: function () {
            ipcRenderer.send('stop-changing-wallpaper');
        }
    },
    {
        label: 'Start Automatic Change',
        click: function () {
            ipcRenderer.send('start-changing-wallpaper');
        }
    },
    {
        label: 'Quit',
        click: function () {
            ipcRenderer.send('close-main-window');
        }
    }
];

var trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
trayIcon.setContextMenu(trayMenu);

var closeEl = document.querySelector('.close');
closeEl.addEventListener('click', function () {
    ipcRenderer.send("close-main-window");
});


for (var i = 0; i < soundButtons.length; i++) {
    var soundButton = soundButtons[i];
    var soundName = soundButton.attributes['data-sound'].value;
    prepareButton(soundButton, soundName);
}

ipcRenderer.on('global-shortcut', function (arg) {
    var event = new MouseEvent('click');
    soundButtons[arg].dispatchEvent(event);
});

var settingsEl = document.querySelector('.settings');
settingsEl.addEventListener('click', function () {
    ipcRenderer.send('open-settings-window');
});

function prepareButton(buttonEl, soundName) {
    buttonEl.querySelector('span').style.backgroundImage = 'url("img/icons/' + soundName + '.png")';

    var audio = new Audio(__dirname + '/wav/' + soundName + '.wav');
    buttonEl.addEventListener('click', function () {
        audio.currentTime = 0;
        audio.play();
    });
}

function changeWallpaper(){
    console.log(__dirname);
    npmRun.exec("unsplash-wallpaper random",{cwd: __dirname},function (err, stdout, stderr) {
        console.log("I am executed now");
        if(err){
            // console.log("Error");
            // console.log(err);
        }
        // console.log(stdout);
        // console.log(stderr);
        
        // err Error or null if there was no error 
        // stdout Buffer|String 
        // stderr Buffer|String 
    });
}
'use strict';
var electron = require("electron");
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var ipcMain = electron.ipcMain;
var npmRun = require("npm-run");
const globalShortcut = electron.globalShortcut;
var configuration = require('./configuration');

var mainWindow = null;
var settingsWindow = null;

const fs = require('fs');
const os = require('os');
const path = require('path');
// const pify = require('pify');
const request = require('request');
const wallpaper = require('wallpaper');

var mainScreen = null;
var keepOnChanging = true;
const wallpaperDirectory =  app.getPath('userData');
console.log(wallpaperDirectory);
const rp = require("request-promise");

const BASE_URL = "http://localhost:3000";

app.on('ready', function() {
    const screenElectron  = electron.screen;
    mainScreen = screenElectron.getPrimaryDisplay();
    // console.log(mainScreen);
    // console.log(process.platform);
    if (!configuration.readSettings('shortcutKeys')) {
        configuration.saveSettings('shortcutKeys', ['ctrl', 'shift']);
    }
    mainWindow = new BrowserWindow({
        height: 100,
        width: 100,
        frame:false,
        resizable:false,
        show:false
    });
    mainWindow.loadURL('file://' + __dirname + '/app/index.html');
    // Setting A gap of 30 mins between wallpaper update
    setInterval(function(){
        
        if(keepOnChanging){
            // Remove Older Wallpapers from the directory.
            cleanFolder();
            changeWallpaper();
        }else{
            // Do Nothing
        }
        
    },30*60*1000)

    // Adding Global globalShortcut

    /*globalShortcut.register('ctrl+shift+1',function () {
            mainWindow.webContents.send('global-shortcut',0);
    });
    globalShortcut.register('ctrl+shift+2', function () {
        mainWindow.webContents.send('global-shortcut', 1);
    });*/

});



// ipcMain.on('open-settings-window', function () {
//     if (settingsWindow) {
//         return;
//     }

//     settingsWindow = new BrowserWindow({
//         frame: false,
//         height: 200,
//         resizable: false,
//         width: 200
//     });

//     settingsWindow.loadURL('file://' + __dirname + '/app/settings.html');

//     settingsWindow.on('closed', function () {
//         settingsWindow = null;
//     });
// });



ipcMain.on("close-main-window",(event,arg)=>{
    app.quit();
});
ipcMain.on("close-settings-window",(event,arg)=>{
    if(settingsWindow){
        settingsWindow.close();
    }
});
ipcMain.on("stop-changing-wallpaper",(event,arg)=>{
    keepOnChanging=false;
});
ipcMain.on("start-changing-wallpaper",(event,arg)=>{
    changeWallpaper();
    keepOnChanging=true;
});

// ipcMain.on('set-global-shortcuts', function () {
//     setGlobalShortcuts();
// });

ipcMain.on('change-wallpaper', function () {
    changeWallpaper();
});

function setGlobalShortcuts() {
    globalShortcut.unregisterAll();

    var shortcutKeysSetting = configuration.readSettings('shortcutKeys');
    var shortcutPrefix = shortcutKeysSetting.length === 0 ? '' : shortcutKeysSetting.join('+') + '+';

    globalShortcut.register(shortcutPrefix + '1', function () {
        mainWindow.webContents.send('global-shortcut', 0);
    });
    globalShortcut.register(shortcutPrefix + '2', function () {
        mainWindow.webContents.send('global-shortcut', 1);
    });
}

function changeWallpaper(){
    const directory = wallpaperDirectory;
    
    const default_options = { help: false,
        'save-config': false,
        s: false,
        grayscale: false,
        g: false,
        blur: false,
        b: false,
        version: false,
        v: false,
        d: './wallpapers',
        dir: '',
        random: true,
        latest: false };
    default_options.width = mainScreen.size.width * 1.5;
    default_options.height = mainScreen.size.height * 1.5;
    createUrl(default_options).then(url=>{
        downloadWallpaper(url,directory).then(filename=>{
            // console.log(filename);
            wallpaper.set(filename).then(()=>{
                console.log("Wallpaper Changed");
            }).catch(err=>{
                console.log(err);
            });
        });
    }).catch(err=>{
        console.log(err);
    });
    // console.log(url);
    
    
}

function downloadWallpaper(url,directory){
    // const dir = directory ? directory : process.cwd();
    const dir = directory;
    // const rand = Math.random().toString(36).slice(2, 10);
    const rand = Math.random().toString(36).slice(2, 10);
    const uniqueName = path.join(dir, `wallpaper-${rand}.jpg`);


    return new Promise((resolve,reject)=>{
        request(url).pipe(fs.createWriteStream(uniqueName))
        .on('close',()=>{
            resolve(uniqueName);
        });
    });
}

function cleanFolder(){
    const wallpaper_dir = wallpaperDirectory;
    let files = fs.readdirSync(wallpaper_dir);
    files.forEach(file => {
        console.log(file);
        if(file.startsWith("wallpaper-")){
            fs.unlinkSync(path.join(wallpaper_dir,file));
        }
    });
    
}

function parseUri(url) {
        let parsedUrl = {};
        let parts = url.split('?');
        parsedUrl["host"]=parts[0];
        let queryString = parts[1];
        parsedUrl["queries"] = {};
        queryString = queryString.split("&");
        for (var i = 0; i < queryString.length; i++) {
            let pair = queryString[i].split('=');
            if(!pair) continue;
            parsedUrl["queries"][pair[0]] = pair[1] || "";
        }
        // console.log('Query variable %s not found', variable);
        console.log(parsedUrl);
        return parsedUrl;
}
function getResizedPhotoUrl(photo_url,width,height){
    let parsedUrl=parseUri(photo_url);
    if(width){
        parsedUrl["queries"]["w"] = `${width}`;
    }
    if(height){
        parsedUrl["queries"]["h"] = `${height}`;
    }
    parsedUrl["queries"]["crop"] = "entropy";
    parsedUrl["queries"]["fit"] = "crop";
    let queryString = "?";
    for(let item in parsedUrl["queries"]){
        queryString+=`${item}=${parsedUrl["queries"][item]}&`;
    }
    return parsedUrl["host"]+queryString;
}


function createUrl(options){
    /*
    let isRandrom=false;
    // --grayscale
    const grayscale = options.grayscale ? 'g/' : '';

    const params = [];

    // --image #
    if (typeof options.image === 'number' || (typeof options.image === 'string')) {
        params.push(`image=${options.image}`);
    }

    // --gravity north, east, south, west, center
    if (typeof options.gravity === 'string') {
        params.push(`gravity=${options.gravity}`);
    }

    

    // --blur
    if (options.blur) {
        params.push('blur');
    }
    // - width
    if(options.width){
        params.push(`width=${options.width}`);
    }
    if(options.height){
        params.push(`height=${options.height}`);
    }
    */
    // random
    let isRandrom = false;
    if (options.random) {
        isRandrom = true;
    }
    let url = `${BASE_URL}/photos`;
    if(isRandrom){
        url+="/random";
    }

    let requestOption = {
        url:url,
        method:"GET",
        json:true
    }
    let promise = new Promise((resolve,reject)=>{
            rp(requestOption).then(data=>{
                if(data && data.urls){
                    let photo_download_url = data.urls.regular;
                    
                    let imageUrl = getResizedPhotoUrl(photo_download_url, options.width,options.height);
                    // params.push(`url=${encodeURI(imageUrl)}`);
                    // const param = params.length ? `${params.join('&')}` : '';
                    // let cloudinaryUrl = `http://res.cloudinary.com/daga/image/fetch/${image_params}/${imageUrl}`;
                    // let url = `${BASE_URL}/photos/download?${param}`;

                    console.log(imageUrl);
                    return resolve(imageUrl);
                }else{
                    return reject("Image Fetch failed from API");
                }
            }).catch(err=>{
                console.log("Error Occured in Photos API");
                console.log(err);
                return reject(err);
            });
    });
    return promise;
}
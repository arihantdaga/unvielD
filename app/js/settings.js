// Add your settings.js code in this file
'use strict';
var electron = require('electron');
var ipcRenderer = electron.ipcRenderer;
var configuration = require('../configuration.js');
var modifierCheckboxes = document.querySelectorAll('.global-shortcut');


var closeEl = document.querySelector('.close');
closeEl.addEventListener('click', function (e) {
    ipcRenderer.send('close-settings-window');
});

var shortcutKeys = configuration.readSettings('shortcutKeys');
// Setting Initial Check Status
for (var i = 0; i < modifierCheckboxes.length; i++) {
    var modifierKey = modifierCheckboxes[i].attributes['data-modifier-key'].value;
    modifierCheckboxes[i].checked = shortcutKeys.indexOf(modifierKey) !== -1;
     modifierCheckboxes[i].addEventListener('click', function (e) {
        bindModifierCheckboxes(e);
    });
    
}
function bindModifierCheckboxes(e){
    var shortcutKeys = configuration.readSettings('shortcutKeys');
    var modifierKey = e.target.attributes['data-modifier-key'].value;

    if (shortcutKeys.indexOf(modifierKey) !== -1) {
        var shortcutKeyIndex = shortcutKeys.indexOf(modifierKey);
        shortcutKeys.splice(shortcutKeyIndex, 1);
    }
    else {
        shortcutKeys.push(modifierKey);
    }

    configuration.saveSettings('shortcutKeys', shortcutKeys);
    ipcRenderer.send('set-global-shortcuts');
}


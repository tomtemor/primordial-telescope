"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
console.log('Preload script loading...');
try {
    electron_1.contextBridge.exposeInMainWorld('audioApp', {
        openFolder: function (path) { return electron_1.ipcRenderer.invoke('dialog:openFolder', path); },
        saveProject: function (content) { return electron_1.ipcRenderer.invoke('dialog:saveProject', content); },
        loadProject: function () { return electron_1.ipcRenderer.invoke('dialog:loadProject'); },
        saveProjectToPath: function (filePath, content) { return electron_1.ipcRenderer.invoke('project:saveToPath', filePath, content); },
        loadProjectFromPath: function (filePath) { return electron_1.ipcRenderer.invoke('project:loadFromPath', filePath); },
        getSettings: function () { return electron_1.ipcRenderer.invoke('settings:get'); },
        setSettings: function (data) { return electron_1.ipcRenderer.invoke('settings:set', data); },
        renameFile: function (oldPath, newPath) { return electron_1.ipcRenderer.invoke('file:rename', oldPath, newPath); },
        exportText: function (content, defaultName) { return electron_1.ipcRenderer.invoke('dialog:exportText', content, defaultName); }
    });
    console.log('audioApp exposed successfully');
}
catch (error) {
    console.error('Failed to expose audioApp:', error);
}
//# sourceMappingURL=preload.js.map
import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script loading...');
try {
    contextBridge.exposeInMainWorld('audioApp', {
        openFolder: (path?: string) => ipcRenderer.invoke('dialog:openFolder', path),
        saveProject: (content: string) => ipcRenderer.invoke('dialog:saveProject', content),
        loadProject: () => ipcRenderer.invoke('dialog:loadProject'),
        saveProjectToPath: (filePath: string, content: string) => ipcRenderer.invoke('project:saveToPath', filePath, content),
        loadProjectFromPath: (filePath: string) => ipcRenderer.invoke('project:loadFromPath', filePath),
        getSettings: () => ipcRenderer.invoke('settings:get'),
        setSettings: (data: Record<string, unknown>) => ipcRenderer.invoke('settings:set', data),
        renameFile: (oldPath: string, newPath: string) => ipcRenderer.invoke('file:rename', oldPath, newPath),
        exportText: (content: string, defaultName?: string) => ipcRenderer.invoke('dialog:exportText', content, defaultName)
    });
    console.log('audioApp exposed successfully');
} catch (error) {
    console.error('Failed to expose audioApp:', error);
}


import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script loading...');
try {
    contextBridge.exposeInMainWorld('audioApp', {
        openFolder: (path?: string) => ipcRenderer.invoke('dialog:openFolder', path),
        saveProject: (content: string) => ipcRenderer.invoke('dialog:saveProject', content),
        loadProject: () => ipcRenderer.invoke('dialog:loadProject')
    });
    console.log('audioApp exposed successfully');
} catch (error) {
    console.error('Failed to expose audioApp:', error);
}


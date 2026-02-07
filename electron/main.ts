import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.


let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: 'Wavejotter',
        width: 1280,
        height: 800,
        backgroundColor: '#0a0a0e', // Void background
        frame: true, // Native frame for now, can be custom later
        titleBarStyle: 'default',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true, // Secure
            webSecurity: false, // Allow loading local files via file:// protocol
            sandbox: false
        },
    });

    // Remove menu for cleaner look
    mainWindow.setMenuBarVisibility(false);

    // In production, load the local index.html
    // In development, load the vite dev server
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
};

// IPC Handlers
ipcMain.handle('dialog:openFolder', async (_, pathArg?: string) => {
    let folderPath = pathArg;

    if (!folderPath) {
        if (!mainWindow) return null;
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });

        if (canceled || filePaths.length === 0) {
            return null;
        }
        folderPath = filePaths[0];
    }

    try {
        const files = await fs.promises.readdir(folderPath);
        const audioFiles = files
            .filter(file => /\.(wav|mp3|ogg)$/i.test(file))
            .map(file => ({
                name: file,
                path: path.join(folderPath!, file).replace(/\\/g, '/')
            }));

        return { folderName: path.basename(folderPath), folderPath: folderPath.replace(/\\/g, '/'), files: audioFiles };
    } catch (error) {
        console.error('Failed to read folder:', error);
        return null;
    }
});

ipcMain.handle('dialog:saveProject', async (_, content: string) => {
    if (!mainWindow) return { success: false };
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: 'Audio Project', extensions: ['json'] }]
    });

    if (canceled || !filePath) return { success: false };

    try {
        await fs.promises.writeFile(filePath, content, 'utf-8');
        return { success: true, filePath: filePath.replace(/\\/g, '/') };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
});

ipcMain.handle('dialog:loadProject', async () => {
    if (!mainWindow) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        filters: [{ name: 'Audio Project', extensions: ['json'] }],
        properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) return null;

    try {
        const content = await fs.promises.readFile(filePaths[0], 'utf-8');
        const data = JSON.parse(content);
        data._filePath = filePaths[0].replace(/\\/g, '/');
        return data;
    } catch (e) {
        console.error(e);
        return null;
    }
});

// Save project to a known path (no dialog) — used by auto-save
ipcMain.handle('project:saveToPath', async (_, filePath: string, content: string) => {
    try {
        await fs.promises.writeFile(filePath, content, 'utf-8');
        return { success: true };
    } catch (e) {
        console.error('Auto-save error:', e);
        return { success: false };
    }
});

// Load project from a known path (no dialog) — used by startup auto-load
ipcMain.handle('project:loadFromPath', async (_, filePath: string) => {
    try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        data._filePath = filePath.replace(/\\/g, '/');
        return data;
    } catch (e) {
        console.error('Load from path error:', e);
        return null;
    }
});

// Settings persistence
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

ipcMain.handle('settings:get', async () => {
    try {
        const content = await fs.promises.readFile(settingsPath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return {};
    }
});

ipcMain.handle('settings:set', async (_, data: Record<string, unknown>) => {
    try {
        let existing: Record<string, unknown> = {};
        try {
            const content = await fs.promises.readFile(settingsPath, 'utf-8');
            existing = JSON.parse(content);
        } catch { /* file doesn't exist yet */ }
        const merged = { ...existing, ...data };
        await fs.promises.writeFile(settingsPath, JSON.stringify(merged, null, 2), 'utf-8');
        return { success: true };
    } catch (e) {
        console.error('Settings save error:', e);
        return { success: false };
    }
});

// Export text file (save dialog for .txt)
ipcMain.handle('dialog:exportText', async (_, content: string, defaultName?: string) => {
    if (!mainWindow) return { success: false };
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName || 'annotations.txt',
        filters: [{ name: 'Text File', extensions: ['txt'] }]
    });

    if (canceled || !filePath) return { success: false };

    try {
        await fs.promises.writeFile(filePath, content, 'utf-8');
        return { success: true, filePath: filePath.replace(/\\/g, '/') };
    } catch (e) {
        console.error('Export text error:', e);
        return { success: false };
    }
});

// Rename a file on disk
ipcMain.handle('file:rename', async (_, oldPath: string, newPath: string) => {
    try {
        await fs.promises.rename(oldPath, newPath);
        return { success: true };
    } catch (e: any) {
        console.error('Rename error:', e);
        return { success: false, error: e.message };
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

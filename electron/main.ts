import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.


let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
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
        return { success: true, filePath };
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
        return JSON.parse(content);
    } catch (e) {
        console.error(e);
        return null;
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

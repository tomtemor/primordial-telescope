"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
var mainWindow = null;
var createWindow = function () {
    // Create the browser window.
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#0a0a0e', // Void background
        frame: true, // Native frame for now, can be custom later
        titleBarStyle: 'default',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
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
    var isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
};
// IPC Handlers
electron_1.ipcMain.handle('dialog:openFolder', function (_, pathArg) { return __awaiter(void 0, void 0, void 0, function () {
    var folderPath, _a, canceled, filePaths, files, audioFiles, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                folderPath = pathArg;
                if (!!folderPath) return [3 /*break*/, 2];
                if (!mainWindow)
                    return [2 /*return*/, null];
                return [4 /*yield*/, electron_1.dialog.showOpenDialog(mainWindow, {
                        properties: ['openDirectory']
                    })];
            case 1:
                _a = _b.sent(), canceled = _a.canceled, filePaths = _a.filePaths;
                if (canceled || filePaths.length === 0) {
                    return [2 /*return*/, null];
                }
                folderPath = filePaths[0];
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 5]);
                return [4 /*yield*/, fs_1.default.promises.readdir(folderPath)];
            case 3:
                files = _b.sent();
                audioFiles = files
                    .filter(function (file) { return /\.(wav|mp3|ogg)$/i.test(file); })
                    .map(function (file) { return ({
                    name: file,
                    path: path_1.default.join(folderPath, file).replace(/\\/g, '/')
                }); });
                return [2 /*return*/, { folderName: path_1.default.basename(folderPath), folderPath: folderPath.replace(/\\/g, '/'), files: audioFiles }];
            case 4:
                error_1 = _b.sent();
                console.error('Failed to read folder:', error_1);
                return [2 /*return*/, null];
            case 5: return [2 /*return*/];
        }
    });
}); });
electron_1.ipcMain.handle('dialog:saveProject', function (_, content) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, canceled, filePath, e_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!mainWindow)
                    return [2 /*return*/, { success: false }];
                return [4 /*yield*/, electron_1.dialog.showSaveDialog(mainWindow, {
                        filters: [{ name: 'Audio Project', extensions: ['json'] }]
                    })];
            case 1:
                _a = _b.sent(), canceled = _a.canceled, filePath = _a.filePath;
                if (canceled || !filePath)
                    return [2 /*return*/, { success: false }];
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 5]);
                return [4 /*yield*/, fs_1.default.promises.writeFile(filePath, content, 'utf-8')];
            case 3:
                _b.sent();
                return [2 /*return*/, { success: true, filePath: filePath.replace(/\\/g, '/') }];
            case 4:
                e_1 = _b.sent();
                console.error(e_1);
                return [2 /*return*/, { success: false }];
            case 5: return [2 /*return*/];
        }
    });
}); });
electron_1.ipcMain.handle('dialog:loadProject', function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, canceled, filePaths, content, data, e_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!mainWindow)
                    return [2 /*return*/, null];
                return [4 /*yield*/, electron_1.dialog.showOpenDialog(mainWindow, {
                        filters: [{ name: 'Audio Project', extensions: ['json'] }],
                        properties: ['openFile']
                    })];
            case 1:
                _a = _b.sent(), canceled = _a.canceled, filePaths = _a.filePaths;
                if (canceled || filePaths.length === 0)
                    return [2 /*return*/, null];
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 5]);
                return [4 /*yield*/, fs_1.default.promises.readFile(filePaths[0], 'utf-8')];
            case 3:
                content = _b.sent();
                data = JSON.parse(content);
                data._filePath = filePaths[0].replace(/\\/g, '/');
                return [2 /*return*/, data];
            case 4:
                e_2 = _b.sent();
                console.error(e_2);
                return [2 /*return*/, null];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Save project to a known path (no dialog) — used by auto-save
electron_1.ipcMain.handle('project:saveToPath', function (_, filePath, content) { return __awaiter(void 0, void 0, void 0, function () {
    var e_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs_1.default.promises.writeFile(filePath, content, 'utf-8')];
            case 1:
                _a.sent();
                return [2 /*return*/, { success: true }];
            case 2:
                e_3 = _a.sent();
                console.error('Auto-save error:', e_3);
                return [2 /*return*/, { success: false }];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Load project from a known path (no dialog) — used by startup auto-load
electron_1.ipcMain.handle('project:loadFromPath', function (_, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var content, data, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs_1.default.promises.readFile(filePath, 'utf-8')];
            case 1:
                content = _a.sent();
                data = JSON.parse(content);
                data._filePath = filePath.replace(/\\/g, '/');
                return [2 /*return*/, data];
            case 2:
                e_4 = _a.sent();
                console.error('Load from path error:', e_4);
                return [2 /*return*/, null];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Settings persistence
var settingsPath = path_1.default.join(electron_1.app.getPath('userData'), 'settings.json');
electron_1.ipcMain.handle('settings:get', function () { return __awaiter(void 0, void 0, void 0, function () {
    var content, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs_1.default.promises.readFile(settingsPath, 'utf-8')];
            case 1:
                content = _b.sent();
                return [2 /*return*/, JSON.parse(content)];
            case 2:
                _a = _b.sent();
                return [2 /*return*/, {}];
            case 3: return [2 /*return*/];
        }
    });
}); });
electron_1.ipcMain.handle('settings:set', function (_, data) { return __awaiter(void 0, void 0, void 0, function () {
    var existing, content, _a, merged, e_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                existing = {};
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fs_1.default.promises.readFile(settingsPath, 'utf-8')];
            case 2:
                content = _b.sent();
                existing = JSON.parse(content);
                return [3 /*break*/, 4];
            case 3:
                _a = _b.sent();
                return [3 /*break*/, 4];
            case 4:
                merged = __assign(__assign({}, existing), data);
                return [4 /*yield*/, fs_1.default.promises.writeFile(settingsPath, JSON.stringify(merged, null, 2), 'utf-8')];
            case 5:
                _b.sent();
                return [2 /*return*/, { success: true }];
            case 6:
                e_5 = _b.sent();
                console.error('Settings save error:', e_5);
                return [2 /*return*/, { success: false }];
            case 7: return [2 /*return*/];
        }
    });
}); });
// Rename a file on disk
electron_1.ipcMain.handle('file:rename', function (_, oldPath, newPath) { return __awaiter(void 0, void 0, void 0, function () {
    var e_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs_1.default.promises.rename(oldPath, newPath)];
            case 1:
                _a.sent();
                return [2 /*return*/, { success: true }];
            case 2:
                e_6 = _a.sent();
                console.error('Rename error:', e_6);
                return [2 /*return*/, { success: false, error: e_6.message }];
            case 3: return [2 /*return*/];
        }
    });
}); });
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
electron_1.app.whenReady().then(function () {
    createWindow();
    electron_1.app.on('activate', function () {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// Quit when all windows are closed, except on macOS.
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
//# sourceMappingURL=main.js.map
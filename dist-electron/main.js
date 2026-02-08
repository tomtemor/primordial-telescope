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
        title: 'Wavejotter',
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
    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(function (_a) {
        var url = _a.url;
        if (url.startsWith('https:') || url.startsWith('http:')) {
            electron_1.shell.openExternal(url);
        }
        return { action: 'deny' };
    });
};
// IPC Handlers
// Helper for recursive scanning
function scanFolder(folderPath, recursive) {
    return __awaiter(this, void 0, void 0, function () {
        var results, entries, _i, entries_1, entry, fullPath, _a, _b, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    results = [];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, fs_1.default.promises.readdir(folderPath, { withFileTypes: true })];
                case 2:
                    entries = _c.sent();
                    _i = 0, entries_1 = entries;
                    _c.label = 3;
                case 3:
                    if (!(_i < entries_1.length)) return [3 /*break*/, 8];
                    entry = entries_1[_i];
                    fullPath = path_1.default.join(folderPath, entry.name);
                    if (!entry.isDirectory()) return [3 /*break*/, 6];
                    if (!recursive) return [3 /*break*/, 5];
                    _b = (_a = results).concat;
                    return [4 /*yield*/, scanFolder(fullPath, recursive)];
                case 4:
                    results = _b.apply(_a, [_c.sent()]);
                    _c.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    if (/\.(wav|mp3|ogg)$/i.test(entry.name)) {
                        results.push({
                            name: entry.name,
                            path: fullPath.replace(/\\/g, '/')
                        });
                    }
                    _c.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_1 = _c.sent();
                    console.error("Failed to scan ".concat(folderPath, ":"), error_1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/, results];
            }
        });
    });
}
// IPC Handlers
electron_1.ipcMain.handle('dialog:openFolder', function (_, options) { return __awaiter(void 0, void 0, void 0, function () {
    var folderPath, recursive, _a, canceled, filePaths, audioFiles, error_2;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                folderPath = options === null || options === void 0 ? void 0 : options.path;
                recursive = (_b = options === null || options === void 0 ? void 0 : options.recursive) !== null && _b !== void 0 ? _b : false;
                if (!!folderPath) return [3 /*break*/, 2];
                if (!mainWindow)
                    return [2 /*return*/, null];
                return [4 /*yield*/, electron_1.dialog.showOpenDialog(mainWindow, {
                        properties: ['openDirectory']
                    })];
            case 1:
                _a = _c.sent(), canceled = _a.canceled, filePaths = _a.filePaths;
                if (canceled || filePaths.length === 0) {
                    return [2 /*return*/, null];
                }
                folderPath = filePaths[0];
                _c.label = 2;
            case 2:
                _c.trys.push([2, 4, , 5]);
                return [4 /*yield*/, scanFolder(folderPath, recursive)];
            case 3:
                audioFiles = _c.sent();
                return [2 /*return*/, { folderName: path_1.default.basename(folderPath), folderPath: folderPath.replace(/\\/g, '/'), files: audioFiles }];
            case 4:
                error_2 = _c.sent();
                console.error('Failed to read folder:', error_2);
                return [2 /*return*/, null];
            case 5: return [2 /*return*/];
        }
    });
}); });
electron_1.ipcMain.handle('dialog:openFiles', function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, canceled, filePaths;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!mainWindow)
                    return [2 /*return*/, null];
                return [4 /*yield*/, electron_1.dialog.showOpenDialog(mainWindow, {
                        properties: ['openFile', 'multiSelections'],
                        filters: [{ name: 'Audio Files', extensions: ['wav', 'mp3', 'ogg'] }]
                    })];
            case 1:
                _a = _b.sent(), canceled = _a.canceled, filePaths = _a.filePaths;
                if (canceled || filePaths.length === 0)
                    return [2 /*return*/, null];
                return [2 /*return*/, filePaths.map(function (fp) { return ({
                        name: path_1.default.basename(fp),
                        path: fp.replace(/\\/g, '/')
                    }); })];
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
// Export text file (save dialog for .txt)
electron_1.ipcMain.handle('dialog:exportText', function (_, content, defaultName) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, canceled, filePath, e_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!mainWindow)
                    return [2 /*return*/, { success: false }];
                return [4 /*yield*/, electron_1.dialog.showSaveDialog(mainWindow, {
                        defaultPath: defaultName || 'annotations.txt',
                        filters: [{ name: 'Text File', extensions: ['txt'] }]
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
                e_6 = _b.sent();
                console.error('Export text error:', e_6);
                return [2 /*return*/, { success: false }];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Rename a file on disk
electron_1.ipcMain.handle('file:rename', function (_, oldPath, newPath) { return __awaiter(void 0, void 0, void 0, function () {
    var e_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs_1.default.promises.rename(oldPath, newPath)];
            case 1:
                _a.sent();
                return [2 /*return*/, { success: true }];
            case 2:
                e_7 = _a.sent();
                console.error('Rename error:', e_7);
                return [2 /*return*/, { success: false, error: e_7.message }];
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
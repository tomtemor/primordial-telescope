/// <reference types="vite/client" />

interface AudioFile {
    name: string;
    path: string;
}

interface FolderResult {
    folderName: string;
    folderPath: string;
    files: AudioFile[];
}

interface AudioAppAPI {
    openFolder: (options?: { path?: string; recursive?: boolean }) => Promise<FolderResult | null>;
    openFiles: () => Promise<AudioFile[] | null>;
    saveProject: (content: string) => Promise<{ success: boolean; filePath?: string }>;
    loadProject: () => Promise<any | null>;
    saveProjectToPath: (filePath: string, content: string) => Promise<{ success: boolean }>;
    loadProjectFromPath: (filePath: string) => Promise<any | null>;
    getSettings: () => Promise<Record<string, any>>;
    setSettings: (data: Record<string, unknown>) => Promise<{ success: boolean }>;
    renameFile: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
    exportText: (content: string, defaultName?: string) => Promise<{ success: boolean; filePath?: string }>;
}

interface Window {
    audioApp: AudioAppAPI;
}

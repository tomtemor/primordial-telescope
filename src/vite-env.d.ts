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
    openFolder: (path?: string) => Promise<FolderResult | null>;
    saveProject: (content: string) => Promise<{ success: boolean; filePath?: string }>;
    loadProject: () => Promise<any | null>;
}

interface Window {
    audioApp: AudioAppAPI;
}

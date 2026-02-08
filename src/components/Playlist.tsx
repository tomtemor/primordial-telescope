import { useState, useRef, useCallback } from 'react';
import { FolderOpen, Music } from 'lucide-react';
import styles from './Playlist.module.css';

interface AudioFile {
    name: string;
    path: string;
}

interface PlaylistProps {
    folderName?: string;
    files: AudioFile[];
    currentTrack?: string;
    onTrackSelect: (path: string) => void;
    onOpenFolder: () => void;
    onAddFolder: () => void;
    onAddFiles: () => void;
    onRenameFile: (oldPath: string, newName: string) => void;
    isRecursive: boolean;
    onToggleRecursive: () => void;
}

export const Playlist = ({ folderName, files, currentTrack, onTrackSelect, onOpenFolder, onAddFolder, onAddFiles, onRenameFile, isRecursive, onToggleRecursive }: PlaylistProps) => {
    const [editingPath, setEditingPath] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editExt, setEditExt] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Use a ref callback to focus & select once when the input mounts
    const setInputRef = useCallback((el: HTMLInputElement | null) => {
        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
        if (el) {
            el.focus();
            el.select();
        }
    }, []);

    const handleDoubleClick = (e: React.MouseEvent, file: AudioFile) => {
        e.stopPropagation();
        const dotIndex = file.name.lastIndexOf('.');
        if (dotIndex > 0) {
            setEditName(file.name.substring(0, dotIndex));
            setEditExt(file.name.substring(dotIndex));
        } else {
            setEditName(file.name);
            setEditExt('');
        }
        setEditingPath(file.path);
    };

    const handleRenameConfirm = () => {
        if (!editingPath || !editName.trim()) {
            setEditingPath(null);
            return;
        }
        const newFullName = editName.trim() + editExt;
        const originalFile = files.find(f => f.path === editingPath);
        if (originalFile && newFullName !== originalFile.name) {
            onRenameFile(editingPath, newFullName);
        }
        setEditingPath(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleRenameConfirm();
        } else if (e.key === 'Escape') {
            setEditingPath(null);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.controlsRow}>
                    <button className={styles.openBtn} onClick={onOpenFolder} title="Clear library and open new folder">
                        <FolderOpen size={16} />
                        <span>Open</span>
                    </button>
                    <button className={styles.addBtn} onClick={onAddFolder} title="Add folder to current library">
                        <span>+ Folder</span>
                    </button>
                    <button className={styles.addBtn} onClick={onAddFiles} title="Add files to current library">
                        <span>+ Files</span>
                    </button>
                </div>
                <div className={styles.optionsRow}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={isRecursive}
                            onChange={onToggleRecursive}
                        />
                        <span>Include Subfolders</span>
                    </label>
                </div>
            </div>

            {folderName && <div className={styles.folderInfo}>{folderName}</div>}

            <div className={styles.list}>
                {files.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No audio files found or no folder selected.</p>
                    </div>
                ) : (
                    files.map((file) => (
                        <div
                            key={file.path}
                            className={`${styles.item} ${currentTrack === file.path ? styles.active : ''}`}
                            onClick={() => {
                                if (editingPath !== file.path) onTrackSelect(file.path);
                            }}
                        >
                            <Music size={14} className={styles.icon} />
                            {editingPath === file.path ? (
                                <span className={styles.renameWrap}>
                                    <input
                                        ref={setInputRef}
                                        className={styles.renameInput}
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onBlur={handleRenameConfirm}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className={styles.renameExt}>{editExt}</span>
                                </span>
                            ) : (
                                <span
                                    className={styles.name}
                                    onDoubleClick={(e) => handleDoubleClick(e, file)}
                                >
                                    {file.name}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

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
}

export const Playlist = ({ folderName, files, currentTrack, onTrackSelect, onOpenFolder }: PlaylistProps) => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.openBtn} onClick={onOpenFolder}>
                    <FolderOpen size={16} />
                    <span>Open Folder</span>
                </button>
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
                            onClick={() => onTrackSelect(file.path)}
                        >
                            <Music size={14} className={styles.icon} />
                            <span className={styles.name}>{file.name}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

import { useMemo } from 'react';
import { FileAudio } from 'lucide-react';
import styles from './AllAnnotationList.module.css';
import type { Annotation } from './AnnotationList';

interface AllAnnotationListProps {
    projectAnnotations: Record<string, Annotation[]>;
    files: Array<{ name: string; path: string }>;
    currentTrack?: string;
    onSelect: (fileUrl: string, time: number) => void;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
};

export const AllAnnotationList = ({ projectAnnotations, files, currentTrack, onSelect }: AllAnnotationListProps) => {
    // Build a lookup from file URL to display name
    const urlToName = useMemo(() => {
        const map: Record<string, string> = {};
        files.forEach(f => {
            const url = f.path.startsWith('file:') ? f.path : `file:///${f.path}`;
            map[url] = f.name;
        });
        return map;
    }, [files]);

    // Get all file URLs that have annotations, sorted by display name
    const annotatedFiles = useMemo(() => {
        return Object.entries(projectAnnotations)
            .filter(([, anns]) => anns.length > 0)
            .sort(([urlA], [urlB]) => {
                const nameA = urlToName[urlA] || urlA;
                const nameB = urlToName[urlB] || urlB;
                return nameA.localeCompare(nameB);
            });
    }, [projectAnnotations, urlToName]);

    const getDisplayName = (url: string): string => {
        if (urlToName[url]) return urlToName[url];
        // Fallback: extract filename from URL
        const decoded = decodeURIComponent(url);
        return decoded.split('/').pop() || url;
    };

    const totalCount = annotatedFiles.reduce((sum, [, anns]) => sum + anns.length, 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>All Annotations ({totalCount})</div>
            <div className={styles.list}>
                {annotatedFiles.length === 0 ? (
                    <div className={styles.empty}>No annotations in this project yet</div>
                ) : (
                    annotatedFiles.map(([fileUrl, anns]) => {
                        const isCurrent = fileUrl === currentTrack;
                        const sorted = [...anns].sort((a, b) => a.start - b.start);

                        return (
                            <div key={fileUrl} className={`${styles.group} ${isCurrent ? styles.currentGroup : ''}`}>
                                <div className={styles.groupHeader}>
                                    <FileAudio size={14} />
                                    <span className={styles.fileName}>{getDisplayName(fileUrl)}</span>
                                    <span className={styles.count}>{anns.length}</span>
                                </div>
                                {sorted.map(ann => (
                                    <div
                                        key={ann.id}
                                        className={styles.item}
                                        onClick={() => onSelect(fileUrl, ann.start)}
                                    >
                                        <span className={styles.time}>
                                            {formatTime(ann.start)} - {formatTime(ann.end)}
                                        </span>
                                        <span className={styles.text}>
                                            {ann.text || '(no label)'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

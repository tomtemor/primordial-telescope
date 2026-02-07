import { Trash2 } from 'lucide-react';
import styles from './AnnotationList.module.css';

export interface Annotation {
    id: string;
    start: number;
    end: number;
    text: string;
}

interface AnnotationListProps {
    annotations: Annotation[];
    currentTime: number;
    onUpdate: (id: string, text: string) => void;
    onDelete: (id: string) => void;
    onSeek: (time: number) => void;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
};

export const AnnotationList = ({ annotations, currentTime, onUpdate, onDelete, onSeek }: AnnotationListProps) => {
    // Sort by start time
    const sorted = [...annotations].sort((a, b) => a.start - b.start);

    return (
        <div className={styles.container}>
            <div className={styles.header}>Annotations</div>
            <div className={styles.list}>
                {sorted.length === 0 ? (
                    <div className={styles.empty}>Select Annotate button and drag on the waveform to create an annotation</div>
                ) : (
                    sorted.map(ann => {
                        const isActive = currentTime >= ann.start && currentTime <= ann.end;
                        return (
                            <div
                                key={ann.id}
                                className={`${styles.item} ${isActive ? styles.active : ''}`}
                            >
                                <div className={styles.time} onClick={() => onSeek(ann.start)}>
                                    {formatTime(ann.start)} - {formatTime(ann.end)}
                                </div>
                                <input
                                    className={styles.input}
                                    value={ann.text}
                                    onChange={(e) => onUpdate(ann.id, e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                    }}
                                    placeholder="Add comments..."
                                />
                                <button className={styles.deleteBtn} onClick={() => onDelete(ann.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

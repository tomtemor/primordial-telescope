import { X, Github, Coffee } from 'lucide-react';
import styles from './AboutModal.module.css';
import changelog from '../../CHANGELOG.md?raw';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <div className={styles.logo}>🌊</div>
                    <h2>Wavejotter</h2>
                    <span className={styles.version}>v{__APP_VERSION__}</span>
                </div>

                <div className={styles.content}>
                    <p>
                        A powerful, lightweight audio annotation tool built for researchers,
                        musicians, and data analysts.
                    </p>

                    <div className={styles.changelog}>
                        <h3>Recent Changes</h3>
                        <pre>{changelog}</pre>
                    </div>

                    <div className={styles.links}>
                        <a
                            href="https://github.com/tomtemor/primordial-telescope/releases"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.linkBtn}
                        >
                            <Github size={18} />
                            GitHub
                        </a>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); alert("Coming soon!"); }}
                            className={styles.linkBtn}
                        >
                            <Coffee size={18} />
                            Buy me a coffee
                        </a>
                    </div>
                </div>

                <div className={styles.footer}>
                    &copy; {new Date().getFullYear()} Wavejotter Team. MIT License.
                </div>
            </div>
        </div>
    );
};

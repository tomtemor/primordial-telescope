import { useRef, useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';
import { Play, Pause, Square, ZoomIn, ZoomOut, MousePointer2, Highlighter, ListMusic, SkipBack, SkipForward, AudioLines } from 'lucide-react';
import styles from './Player.module.css';
import type { Annotation } from './AnnotationList';

interface PlayerProps {
    url?: string;
    annotations: Annotation[];
    seekTo?: number | null;
    autoPlay: boolean;
    hasPrev: boolean;
    hasNext: boolean;
    onToggleAutoPlay: () => void;
    onFinished: () => void;
    onPrev: () => void;
    onNext: () => void;
    onAnnotationCreated: (annotation: Annotation) => void;
    onAnnotationUpdated: (annotation: Annotation) => void;
    onTimeUpdate?: (time: number) => void;
}

export const Player = ({ url, annotations, seekTo, autoPlay, hasPrev, hasNext, onToggleAutoPlay, onFinished, onPrev, onNext, onAnnotationCreated, onAnnotationUpdated, onTimeUpdate }: PlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsRef = useRef<RegionsPlugin | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [zoom, setZoom] = useState(10); // Min px per sec
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAnnotationMode, setIsAnnotationMode] = useState(false);
    const [viewMode, setViewMode] = useState<'waveform' | 'spectrogram'>('waveform');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const lastTimeUpdateRef = useRef(0);

    // Refs for callbacks to ensure stable closures in effects without re-running them
    const onTimeUpdateRef = useRef(onTimeUpdate);
    const onAnnotationCreatedRef = useRef(onAnnotationCreated);
    const onAnnotationUpdatedRef = useRef(onAnnotationUpdated);
    const onFinishedRef = useRef(onFinished);

    // Ref to prevent infinite loops when syncing regions from props
    // We track IDs that we are currently adding programmatically
    const processingRegionsRef = useRef(new Set<string>());
    const isSyncingRef = useRef(false);
    const shouldAutoStartRef = useRef(false);
    const pendingSeekRef = useRef<number | null>(null);

    useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
    useEffect(() => { onAnnotationCreatedRef.current = onAnnotationCreated; }, [onAnnotationCreated]);
    useEffect(() => { onAnnotationUpdatedRef.current = onAnnotationUpdated; }, [onAnnotationUpdated]);
    useEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);

    const autoPlayRef = useRef(autoPlay);
    useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

    // Initialize WaveSurfer once (no URL in constructor — loaded via separate effect)
    useEffect(() => {
        if (!containerRef.current) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#4d4dff', // Neon Blue
            progressColor: '#00f0ff', // Electric Cyan
            cursorColor: '#ffffff',
            barWidth: 2,
            barGap: 3,
            height: 250,
            minPxPerSec: 10,
            fillParent: true,
            // Do NOT pass url here — let the URL effect handle loading
        });

        const wsRegions = RegionsPlugin.create();
        ws.registerPlugin(wsRegions);
        regionsRef.current = wsRegions;

        // Timeline plugin — shows time markers below the waveform
        const wsTimeline = TimelinePlugin.create({
            height: 20,
            timeInterval: 5,
            primaryLabelInterval: 10,
            style: { fontSize: '10px', color: '#888899' },
        });
        ws.registerPlugin(wsTimeline);

        // Spectrogram plugin — alternative frequency view
        // Note: the plugin always appends itself inside the WaveSurfer wrapper.
        // We toggle its wrapper's visibility via an effect on viewMode.
        const wsSpectrogram = SpectrogramPlugin.create({
            height: 250,
            labels: true,
            labelsColor: '#888899',
            labelsBackground: 'transparent',
            frequencyMax: 8000,
            fftSamples: 512,
            colorMap: 'roseus',
        });
        ws.registerPlugin(wsSpectrogram);

        // Tag the spectrogram wrapper so we can find it later for view toggling.
        // onInit() runs synchronously during registerPlugin, appending the wrapper
        // as the last child of the WaveSurfer wrapper element.
        const wsWrapperEl = ws.getWrapper();
        const specEl = wsWrapperEl.lastElementChild as HTMLElement | null;
        if (specEl) {
            specEl.setAttribute('data-spectrogram', 'true');
            // Position absolutely on top of the waveform so it overlays without layout shift.
            // Hidden by default (waveform mode). Shown by the viewMode toggle effect.
            specEl.style.position = 'absolute';
            specEl.style.top = '0';
            specEl.style.left = '0';
            specEl.style.width = '100%';
            specEl.style.height = '100%';
            specEl.style.zIndex = '10';
            specEl.style.display = 'none';
        }
        // Ensure the WaveSurfer wrapper is a positioning context
        wsWrapperEl.style.position = 'relative';

        ws.on('ready', () => {
            setIsReady(true);
            setDuration(ws.getDuration());
            if (pendingSeekRef.current !== null) {
                const seekTime = pendingSeekRef.current;
                pendingSeekRef.current = null;
                ws.setTime(seekTime);
            }
            if (shouldAutoStartRef.current) {
                shouldAutoStartRef.current = false;
                ws.play();
            }
            // Force a redraw on next frame so the timeline plugin
            // recalculates with the correct container width
            requestAnimationFrame(() => {
                ws.zoom(ws.options.minPxPerSec);
            });
        });
        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => {
            setIsPlaying(false);
            onFinishedRef.current?.();
        });
        // Throttle timeupdate to ~10fps to reduce React re-renders
        ws.on('timeupdate', (time) => {
            const now = performance.now();
            if (now - lastTimeUpdateRef.current >= 100) {
                lastTimeUpdateRef.current = now;
                setCurrentTime(time);
                onTimeUpdateRef.current?.(time);
            }
        });
        ws.on('error', (e) => {
            console.error("WaveSurfer internal error:", e);
            setError(typeof e === 'string' ? e : "Playback error occurred");
        });

        // Region Events
        wsRegions.on('region-created', (region) => {
            // Ignore all events during programmatic sync
            if (isSyncingRef.current) return;
            // Ignore regions we added programmatically
            if (processingRegionsRef.current.has(region.id)) return;
            // Ignore regions that already have an external ID (synced from props)
            if (region.id.startsWith('ann-external')) return;

            const newId = `ann-external-${Math.random().toString(36).substr(2, 9)}`;
            const newAnn: Annotation = {
                id: newId,
                start: region.start,
                end: region.end,
                text: ''
            };

            onAnnotationCreatedRef.current?.(newAnn);
            region.remove();
        });

        wsRegions.on('region-updated', (region) => {
            // Ignore all events during programmatic sync
            if (isSyncingRef.current) return;

            if (region.id.startsWith('ann-external')) {
                onAnnotationUpdatedRef.current?.({
                    id: region.id,
                    start: region.start,
                    end: region.end,
                    text: ''
                });
            }
        });

        wavesurferRef.current = ws;

        return () => {
            ws.destroy();
        };
    }, []);

    // Track previous annotations to avoid unnecessary re-syncs
    const prevAnnotationsRef = useRef<Annotation[]>([]);

    // Sync Regions from Props
    useEffect(() => {
        if (!regionsRef.current || !isReady) return;

        // Skip sync if annotations haven't actually changed in content
        const prev = prevAnnotationsRef.current;
        const changed = annotations.length !== prev.length ||
            annotations.some((a, i) => {
                const p = prev[i];
                return !p || a.id !== p.id || a.start !== p.start || a.end !== p.end || a.text !== p.text;
            });
        if (!changed) return;

        prevAnnotationsRef.current = annotations;

        isSyncingRef.current = true;

        // Populate processing set with incoming IDs so creation events ignore them
        processingRegionsRef.current = new Set(annotations.map(a => a.id));

        regionsRef.current.clearRegions();

        annotations.forEach(ann => {
            regionsRef.current?.addRegion({
                id: ann.id,
                start: ann.start,
                end: ann.end,
                color: 'rgba(0, 240, 255, 0.2)',
                drag: true,
                resize: true,
                content: ann.text
            });
        });

        // Defer unsetting the flag so any synchronous event handlers triggered
        // by clearRegions/addRegion are still guarded
        requestAnimationFrame(() => {
            isSyncingRef.current = false;
        });
    }, [annotations, isReady]);

    // Ref to store the disable function from enableDragSelection
    const disableDragSelectionRef = useRef<(() => void) | null>(null);

    // Handle Interaction Mode (Annotation vs Navigation)
    useEffect(() => {
        if (!wavesurferRef.current || !regionsRef.current) return;

        // Always clean up previous drag selection handler if it exists
        if (disableDragSelectionRef.current) {
            disableDragSelectionRef.current();
            disableDragSelectionRef.current = null;
        }

        if (isAnnotationMode) {
            // Annotation Mode: Disable seek, enable region drag creation
            wavesurferRef.current.setOptions({ interact: false });
            disableDragSelectionRef.current = regionsRef.current.enableDragSelection({
                color: 'rgba(0, 240, 255, 0.4)',
            });
        } else {
            // Navigation Mode: Enable seek, disable region drag creation (implicit by cleaning up above)
            wavesurferRef.current.setOptions({ interact: true });
        }
    }, [isAnnotationMode, isReady]); // Re-run when mode changes or player becomes ready

    // Handle Seek
    useEffect(() => {
        if (seekTo !== undefined && seekTo !== null) {
            if (wavesurferRef.current && isReady) {
                wavesurferRef.current.setTime(seekTo);
            } else {
                // Track is loading — queue the seek for the ready handler
                pendingSeekRef.current = seekTo;
            }
        }
    }, [seekTo, isReady]);

    // Handle URL changes
    useEffect(() => {
        if (wavesurferRef.current && url) {
            console.log('Loading URL:', url);
            shouldAutoStartRef.current = autoPlayRef.current;
            setIsReady(false);
            setError(null);
            wavesurferRef.current.load(url).catch(e => {
                console.error("WaveSurfer load error:", e);
                setError(e.message);
            });
        }
    }, [url]);

    // Handle Zoom changes
    useEffect(() => {
        if (wavesurferRef.current && isReady) {
            wavesurferRef.current.zoom(zoom);
        }
    }, [zoom, isReady]);

    // Toggle spectrogram overlay visibility.
    // The spectrogram is absolutely positioned on top of the waveform.
    // We simply show/hide it. The waveform + cursor stay rendered underneath.
    useEffect(() => {
        const wsWrapper = wavesurferRef.current?.getWrapper();
        if (!wsWrapper) return;

        const spectrogramWrapper = wsWrapper.querySelector('[data-spectrogram]') as HTMLElement | null;
        if (!spectrogramWrapper) return;

        if (viewMode === 'spectrogram') {
            spectrogramWrapper.style.display = 'block';
            // Force the spectrogram canvases to fill the container height
            const canvasContainer = spectrogramWrapper.querySelector('div') as HTMLElement | null;
            if (canvasContainer) {
                canvasContainer.style.height = '100%';
            }
        } else {
            spectrogramWrapper.style.display = 'none';
        }
    }, [viewMode, isReady]);

    // Spacebar play/pause
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input/textarea
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            if (e.code === 'Space') {
                e.preventDefault();
                wavesurferRef.current?.playPause();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Scroll to zoom on waveform
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            setZoom(prev => {
                const delta = e.deltaY > 0 ? -20 : 20;
                return Math.max(10, Math.min(500, prev + delta));
            });
        };
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const togglePlay = useCallback(() => {
        wavesurferRef.current?.playPause();
    }, []);

    const stop = useCallback(() => {
        wavesurferRef.current?.stop();
    }, []);

    return (
        <div className={styles.playerContainer}>
            {error && <div style={{ color: 'red', padding: '10px', background: 'rgba(255,0,0,0.1)', borderRadius: '4px', marginBottom: '10px' }}>Error: {error}</div>}

            <div className={styles.topControls}>
                <div className={styles.modeSwitch}>
                    <button
                        className={`${styles.modeBtn} ${viewMode === 'waveform' ? styles.active : ''}`}
                        onClick={() => setViewMode('waveform')}
                        title="Waveform View"
                    >
                        <AudioLines size={16} />
                        <span>Waveform</span>
                    </button>
                    <button
                        className={`${styles.modeBtn} ${viewMode === 'spectrogram' ? styles.active : ''}`}
                        onClick={() => setViewMode('spectrogram')}
                        title="Spectrogram View"
                    >
                        <AudioLines size={16} />
                        <span>Spectrogram</span>
                    </button>
                </div>
                <button
                    className={`${styles.autoPlayBtn} ${autoPlay ? styles.active : ''}`}
                    onClick={onToggleAutoPlay}
                    title={autoPlay ? 'Auto-play On' : 'Auto-play Off'}
                >
                    <ListMusic size={16} />
                    <span>Auto-play</span>
                </button>
                <div className={styles.modeSwitch}>
                    <button
                        className={`${styles.modeBtn} ${!isAnnotationMode ? styles.active : ''}`}
                        onClick={() => setIsAnnotationMode(false)}
                        title="Navigation Mode (Click to Seek)"
                    >
                        <MousePointer2 size={16} />
                        <span>Navigate</span>
                    </button>
                    <button
                        className={`${styles.modeBtn} ${isAnnotationMode ? styles.active : ''}`}
                        onClick={() => setIsAnnotationMode(true)}
                        title="Annotation Mode (Drag to Mark)"
                    >
                        <Highlighter size={16} />
                        <span>Annotate</span>
                    </button>
                </div>
            </div>

            <div className={styles.waveform} ref={containerRef} />

            <div className={styles.controls}>
                <div className={styles.transport}>
                    <button className={styles.btn} onClick={onPrev} disabled={!hasPrev} title="Previous Track">
                        <SkipBack size={20} />
                    </button>
                    <button className={styles.btn} onClick={togglePlay} disabled={!isReady}>
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button className={styles.btn} onClick={stop} disabled={!isReady}>
                        <Square size={20} />
                    </button>
                    <button className={styles.btn} onClick={onNext} disabled={!hasNext} title="Next Track">
                        <SkipForward size={20} />
                    </button>
                    <span className={styles.timeDisplay}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>

                <div className={styles.zoomControls}>
                    <ZoomOut size={16} />
                    <input
                        type="range"
                        min="10"
                        max="500"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className={styles.slider}
                    />
                    <ZoomIn size={16} />
                </div>
            </div>
        </div>
    );
};

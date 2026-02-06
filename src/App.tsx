import { useState, useCallback, useMemo } from 'react';
import { Player } from './components/Player';
import { Playlist } from './components/Playlist';
import { AnnotationList } from './components/AnnotationList';
import type { Annotation } from './components/AnnotationList';
import { Save, FolderInput } from 'lucide-react';
import './App.css';

function App() {
  const [currentTrack, setCurrentTrack] = useState<string | undefined>(undefined);
  const [folderName, setFolderName] = useState<string | undefined>(undefined);
  const [folderPath, setFolderPath] = useState<string | undefined>(undefined);
  const [files, setFiles] = useState<Array<{ name: string; path: string }>>([]);

  // Map track path to annotations
  const [projectAnnotations, setProjectAnnotations] = useState<Record<string, Annotation[]>>({});
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);

  const handleOpenFolder = useCallback(async () => {
    try {
      const result = await window.audioApp.openFolder();
      if (result) {
        setFolderName(result.folderName);
        setFolderPath(result.folderPath);
        setFiles(result.files);
        setCurrentTrack(undefined);
      }
    } catch (err) {
      console.error("Error opening folder:", err);
    }
  }, []);

  const handleSaveProject = async () => {
    const project = {
      version: 1,
      folderPath,
      annotations: projectAnnotations
    };
    await window.audioApp.saveProject(JSON.stringify(project, null, 2));
  };

  const handleLoadProject = async () => {
    const data = await window.audioApp.loadProject();
    if (data) {
      if (data.annotations) setProjectAnnotations(data.annotations);

      if (data.folderPath) {
        // Open the folder automatically
        const result = await window.audioApp.openFolder(data.folderPath);
        if (result) {
          setFolderName(result.folderName);
          setFolderPath(result.folderPath);
          setFiles(result.files);
          setCurrentTrack(undefined);
        }
      }
    }
  };

  const handleTrackSelect = useCallback((path: string) => {
    const fileUrl = path.startsWith('file:') ? path : `file:///${path}`;
    setCurrentTrack(fileUrl);
  }, []);

  const currentAnnotations = useMemo(() => {
    return (currentTrack && projectAnnotations[currentTrack]) || [];
  }, [currentTrack, projectAnnotations]);

  const handleAnnotationCreated = useCallback((ann: Annotation) => {
    if (!currentTrack) return;
    setProjectAnnotations(prev => ({
      ...prev,
      [currentTrack]: [...(prev[currentTrack] || []), ann]
    }));
  }, [currentTrack]);

  const handleAnnotationUpdated = useCallback((updatedAnn: Annotation) => {
    if (!currentTrack) return;
    setProjectAnnotations(prev => {
      const existing = (prev[currentTrack] || []);
      const target = existing.find(a => a.id === updatedAnn.id);
      // Skip update if start/end haven't actually changed
      if (target && target.start === updatedAnn.start && target.end === updatedAnn.end) {
        return prev;
      }
      return {
        ...prev,
        [currentTrack]: existing.map(a => a.id === updatedAnn.id ? { ...a, start: updatedAnn.start, end: updatedAnn.end } : a)
      };
    });
  }, [currentTrack]);

  const handleAnnotationTextUpdate = useCallback((id: string, text: string) => {
    if (!currentTrack) return;
    setProjectAnnotations(prev => ({
      ...prev,
      [currentTrack]: (prev[currentTrack] || []).map(a => a.id === id ? { ...a, text } : a)
    }));
  }, [currentTrack]);

  const handleAnnotationDelete = useCallback((id: string) => {
    if (!currentTrack) return;
    setProjectAnnotations(prev => ({
      ...prev,
      [currentTrack]: (prev[currentTrack] || []).filter(a => a.id !== id)
    }));
  }, [currentTrack]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleSeek = useCallback((time: number) => {
    // Reset first so re-seeking to the same time triggers the effect
    setSeekTo(null);
    requestAnimationFrame(() => setSeekTo(time));
  }, []);

  const handleToggleAutoPlay = useCallback(() => {
    setAutoPlay(prev => !prev);
  }, []);

  const handleTrackFinished = useCallback(() => {
    if (!autoPlay || !currentTrack || files.length === 0) return;
    const currentIndex = files.findIndex(f => {
      const fileUrl = f.path.startsWith('file:') ? f.path : `file:///${f.path}`;
      return fileUrl === currentTrack;
    });
    if (currentIndex >= 0 && currentIndex < files.length - 1) {
      const nextFile = files[currentIndex + 1];
      const nextUrl = nextFile.path.startsWith('file:') ? nextFile.path : `file:///${nextFile.path}`;
      setCurrentTrack(nextUrl);
    }
  }, [autoPlay, currentTrack, files]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Library</h2>
        </div>
        <div className="playlist">
          <Playlist
            folderName={folderName}
            files={files}
            currentTrack={currentTrack ? decodeURIComponent(currentTrack.replace('file:///', '')) : undefined}
            onTrackSelect={handleTrackSelect}
            onOpenFolder={handleOpenFolder}
          />
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div style={{ flex: 1 }}>
            <h1>{folderName ? folderName : 'My Project'}</h1>
          </div>
          <div className="project-controls">
            <button className="icon-btn" onClick={handleLoadProject} title="Load Project">
              <FolderInput size={20} />
            </button>
            <button className="icon-btn" onClick={handleSaveProject} title="Save Project">
              <Save size={20} />
            </button>
          </div>
        </header>

        <div className="player-wrapper">
          <Player
            url={currentTrack}
            annotations={currentAnnotations}
            seekTo={seekTo}
            autoPlay={autoPlay}
            onToggleAutoPlay={handleToggleAutoPlay}
            onFinished={handleTrackFinished}
            onAnnotationCreated={handleAnnotationCreated}
            onAnnotationUpdated={handleAnnotationUpdated}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>

        <div className="annotation-layer">
          {currentTrack ? (
            <AnnotationList
              annotations={currentAnnotations}
              currentTime={currentTime}
              onUpdate={handleAnnotationTextUpdate}
              onDelete={handleAnnotationDelete}
              onSeek={handleSeek}
            />
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>Select a track to start annotating</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

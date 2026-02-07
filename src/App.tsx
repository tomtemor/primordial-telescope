import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Player } from './components/Player';
import { Playlist } from './components/Playlist';
import { AnnotationList } from './components/AnnotationList';
import type { Annotation } from './components/AnnotationList';
import { Save, FolderInput, FilePlus } from 'lucide-react';
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
  const [projectFilePath, setProjectFilePath] = useState<string | null>(null);

  // Derive project name from file path
  const projectName = useMemo(() => {
    if (!projectFilePath) return 'Untitled Project';
    const fileName = projectFilePath.split('/').pop() || '';
    return fileName.replace(/\.json$/i, '');
  }, [projectFilePath]);

  // Flag to skip auto-save when loading a project
  const isLoadingRef = useRef(false);

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
      currentTrack,
      annotations: projectAnnotations
    };
    const result = await window.audioApp.saveProject(JSON.stringify(project, null, 2));
    if (result.success && result.filePath) {
      setProjectFilePath(result.filePath);
      await window.audioApp.setSettings({ lastProjectPath: result.filePath });
    }
  };

  const applyProjectData = useCallback(async (data: any) => {
    isLoadingRef.current = true;
    if (data.annotations) setProjectAnnotations(data.annotations);
    if (data._filePath) {
      setProjectFilePath(data._filePath);
      await window.audioApp.setSettings({ lastProjectPath: data._filePath });
    }

    if (data.folderPath) {
      const result = await window.audioApp.openFolder(data.folderPath);
      if (result) {
        setFolderName(result.folderName);
        setFolderPath(result.folderPath);
        setFiles(result.files);
        // Restore current track if saved, otherwise clear
        setCurrentTrack(data.currentTrack || undefined);
      }
    }
    // Allow auto-save again after a tick
    requestAnimationFrame(() => { isLoadingRef.current = false; });
  }, []);

  const handleLoadProject = async () => {
    const data = await window.audioApp.loadProject();
    if (data) await applyProjectData(data);
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

  const currentTrackIndex = useMemo(() => {
    if (!currentTrack || files.length === 0) return -1;
    return files.findIndex(f => {
      const fileUrl = f.path.startsWith('file:') ? f.path : `file:///${f.path}`;
      return fileUrl === currentTrack;
    });
  }, [currentTrack, files]);

  const hasPrev = currentTrackIndex > 0;
  const hasNext = currentTrackIndex >= 0 && currentTrackIndex < files.length - 1;

  const handlePrev = useCallback(() => {
    if (!hasPrev) return;
    const prevFile = files[currentTrackIndex - 1];
    const prevUrl = prevFile.path.startsWith('file:') ? prevFile.path : `file:///${prevFile.path}`;
    setCurrentTrack(prevUrl);
  }, [hasPrev, files, currentTrackIndex]);

  const handleNext = useCallback(() => {
    if (!hasNext) return;
    const nextFile = files[currentTrackIndex + 1];
    const nextUrl = nextFile.path.startsWith('file:') ? nextFile.path : `file:///${nextFile.path}`;
    setCurrentTrack(nextUrl);
  }, [hasNext, files, currentTrackIndex]);

  const handleTrackFinished = useCallback(() => {
    if (!autoPlay || !hasNext) return;
    handleNext();
  }, [autoPlay, hasNext, handleNext]);

  const handleRenameFile = useCallback(async (oldPath: string, newName: string) => {
    // Build the new full path from the old path's directory + new name
    const dir = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = `${dir}/${newName}`;

    const result = await window.audioApp.renameFile(oldPath, newPath);
    if (!result.success) {
      console.error('Rename failed:', result.error);
      return;
    }

    // Update files list
    setFiles(prev => prev.map(f =>
      f.path === oldPath ? { name: newName, path: newPath } : f
    ));

    // Migrate annotation keys
    const oldUrl = `file:///${oldPath}`;
    const newUrl = `file:///${newPath}`;
    setProjectAnnotations(prev => {
      if (!(oldUrl in prev)) return prev;
      const { [oldUrl]: annotations, ...rest } = prev;
      return { ...rest, [newUrl]: annotations };
    });

    // Update current track if it was the renamed file
    setCurrentTrack(prev => {
      if (prev === oldUrl) return newUrl;
      return prev;
    });
  }, []);

  const handleNewProject = useCallback(() => {
    if (!window.confirm('Create a new project? Any unsaved changes will be lost.')) return;
    setCurrentTrack(undefined);
    setFolderName(undefined);
    setFolderPath(undefined);
    setFiles([]);
    setProjectAnnotations({});
    setProjectFilePath(null);
    setCurrentTime(0);
    setSeekTo(null);
  }, []);

  // Auto-save: debounced write when annotations/track change and project has a save path
  useEffect(() => {
    if (!projectFilePath || isLoadingRef.current) return;

    const timer = setTimeout(async () => {
      const project = {
        version: 1,
        folderPath,
        currentTrack,
        annotations: projectAnnotations
      };
      await window.audioApp.saveProjectToPath(projectFilePath, JSON.stringify(project, null, 2));
    }, 2000);

    return () => clearTimeout(timer);
  }, [projectAnnotations, currentTrack, folderPath, projectFilePath]);

  // Startup: auto-load last project
  useEffect(() => {
    const loadLastProject = async () => {
      try {
        const settings = await window.audioApp.getSettings();
        if (settings.lastProjectPath) {
          const data = await window.audioApp.loadProjectFromPath(settings.lastProjectPath);
          if (data) await applyProjectData(data);
        }
      } catch (err) {
        console.error('Failed to load last project:', err);
      }
    };
    loadLastProject();
  }, [applyProjectData]);

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
            onRenameFile={handleRenameFile}
          />
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <div style={{ flex: 1 }}>
            <h1>{projectName}</h1>
            {folderName && <span className="folder-label">{folderName}</span>}
          </div>
          <div className="project-controls">
            <button className="icon-btn" onClick={handleNewProject} title="New Project">
              <FilePlus size={20} />
            </button>
            <button className="icon-btn" onClick={handleLoadProject} title="Load Project">
              <FolderInput size={20} />
            </button>
            <button className="icon-btn" onClick={handleSaveProject} title="Save Project As">
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
            hasPrev={hasPrev}
            hasNext={hasNext}
            onToggleAutoPlay={handleToggleAutoPlay}
            onFinished={handleTrackFinished}
            onPrev={handlePrev}
            onNext={handleNext}
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

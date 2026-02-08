import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Player } from './components/Player';
import { Playlist } from './components/Playlist';
import { AnnotationList } from './components/AnnotationList';
import { AllAnnotationList } from './components/AllAnnotationList';
import type { Annotation } from './components/AnnotationList';
import { Save, FolderInput, FilePlus, FileText } from 'lucide-react';
import './App.css';

function App() {
  const [currentTrack, setCurrentTrack] = useState<string | undefined>(undefined);
  const [folderName, setFolderName] = useState<string | undefined>(undefined);
  const [folderPath, setFolderPath] = useState<string | undefined>(undefined);
  const [files, setFiles] = useState<Array<{ name: string; path: string }>>([]);
  const [isRecursive, setIsRecursive] = useState(false);

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
      const result = await window.audioApp.openFolder({ recursive: isRecursive });
      if (result) {
        setFolderName(result.folderName);
        setFolderPath(result.folderPath);
        setFiles(result.files);
        setCurrentTrack(undefined);
      }
    } catch (err) {
      console.error("Error opening folder:", err);
    }
  }, [isRecursive]);

  const handleAddFolder = useCallback(async () => {
    try {
      const result = await window.audioApp.openFolder({ recursive: isRecursive });
      if (result) {
        // If we already have files, this becomes a "Custom Library"
        setFolderName(prev => prev ? "Custom Library" : result.folderName);
        setFolderPath(prev => prev ? undefined : result.folderPath); // Clear explicit folder path if mixed

        setFiles(prev => {
          // Filter duplicates
          const newFiles = result.files.filter(nf => !prev.some(pf => pf.path === nf.path));
          return [...prev, ...newFiles];
        });
      }
    } catch (err) {
      console.error("Error adding folder:", err);
    }
  }, [isRecursive]);

  const handleAddFiles = useCallback(async () => {
    try {
      const newFiles = await window.audioApp.openFiles();
      if (newFiles && newFiles.length > 0) {
        setFolderName(prev => prev ? "Custom Library" : "Selected Files");
        setFolderPath(undefined);

        setFiles(prev => {
          // Filter duplicates
          const uniqueNew = newFiles.filter(nf => !prev.some(pf => pf.path === nf.path));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (err) {
      console.error("Error adding files:", err);
    }
  }, []);

  const handleToggleRecursive = useCallback(() => {
    setIsRecursive(prev => !prev);
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

  const formatExportTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleExportAnnotations = async () => {
    const lines: string[] = [];
    const projectLabel = projectName || 'Untitled Project';
    lines.push(`Annotations Export — ${projectLabel}`);
    lines.push(`Exported: ${new Date().toLocaleString()}`);
    lines.push('='.repeat(60));
    lines.push('');

    const entries = Object.entries(projectAnnotations).filter(([, anns]) => anns.length > 0);
    if (entries.length === 0) {
      lines.push('(No annotations in this project)');
    } else {
      for (const [fileUrl, anns] of entries) {
        // Derive display name from files list or URL
        const match = files.find(f => {
          const url = f.path.startsWith('file:') ? f.path : `file:///${f.path}`;
          return url === fileUrl;
        });
        const displayName = match?.name || decodeURIComponent(fileUrl.split('/').pop() || fileUrl);

        lines.push(`File: ${displayName}`);
        lines.push('-'.repeat(40));

        const sorted = [...anns].sort((a, b) => a.start - b.start);
        for (const ann of sorted) {
          const timeRange = `[${formatExportTime(ann.start)} - ${formatExportTime(ann.end)}]`;
          const label = ann.text || '(no label)';
          lines.push(`  ${timeRange}  ${label}`);
        }
        lines.push('');
      }
    }

    const content = lines.join('\n');
    const defaultName = `${projectLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}_annotations.txt`;
    await window.audioApp.exportText(content, defaultName);
  };

  const applyProjectData = useCallback(async (data: any) => {
    isLoadingRef.current = true;
    if (data.annotations) setProjectAnnotations(data.annotations);
    if (data._filePath) {
      setProjectFilePath(data._filePath);
      await window.audioApp.setSettings({ lastProjectPath: data._filePath });
    }

    if (data.folderPath) {
      // Pass recursive: true if we assume loaded projects might need it, or we could store that setting in the project file
      // For now default to false or whatever the current state is? 
      // Actually, better to just load what is there. The recursive flag is mostly for the *initial* scan.
      // But scanFolder needs it. Let's assume false for legacy or store it.
      // For now, let's just fix the argument structure.
      const result = await window.audioApp.openFolder({ path: data.folderPath, recursive: true });
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

  const handleAnnotationSelect = useCallback((fileUrl: string, time: number) => {
    if (fileUrl === currentTrack) {
      // Same file — just seek
      handleSeek(time);
    } else {
      // Different file — switch track and queue seek.
      // Player will apply the seek after the new track's ready event
      // via pendingSeekRef.
      setCurrentTrack(fileUrl);
      handleSeek(time);
    }
  }, [currentTrack, handleSeek]);

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
            onAddFolder={handleAddFolder}
            onAddFiles={handleAddFiles}
            onRenameFile={handleRenameFile}
            isRecursive={isRecursive}
            onToggleRecursive={handleToggleRecursive}
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
            <button className="icon-btn" onClick={handleExportAnnotations} title="Export Annotations as Text">
              <FileText size={20} />
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
          <div className="annotation-panels">
            <div className="annotation-panel-left">
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
            <div className="annotation-panel-right">
              <AllAnnotationList
                projectAnnotations={projectAnnotations}
                files={files}
                currentTrack={currentTrack}
                onSelect={handleAnnotationSelect}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

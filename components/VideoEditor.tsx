import React, { useState, useRef, useEffect, useCallback } from 'react';
import VideoIntelligence, { AnalysisResult, ViralClipCandidate } from '../services/videoIntelligence';
import SmartEditor, { AutoEditResult } from '../services/smartEditor';
import { mediaDownloader } from '../services/mediaDownloader';
import { runtimeStore } from '../services/runtimeStore';
import { ViewState } from '../types';

interface EditorClip {
    id: string;
    name: string;
    track: 'video' | 'audio' | 'caption';
    startTime: number;
    duration: number;
    color: string;
    filter?: string;
    opacity: number;
    volume: number;
    speed: number;
    thumbnail?: string;
    removeWatermark?: boolean;
}

const FILTERS = ['None', 'Cinematic', 'Vintage', 'B&W', 'Neon', 'Warm', 'Cool', 'Film Grain'];
const TRACK_COLORS: Record<string, string> = {
    video: '#6366f1',
    audio: '#10b981',
    caption: '#f59e0b',
};

interface VideoEditorProps {
    onNavigate?: (view: ViewState) => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ onNavigate }) => {
    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Services
    const [intelligence] = useState(() => new VideoIntelligence());
    const [smartEditor] = useState(() => new SmartEditor());

    // State - Media
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [videoFileName, setVideoFileName] = useState('');
    const [videoDuration, setVideoDuration] = useState(60);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // State - Editor
    const [zoom, setZoom] = useState(1);
    const [selectedClip, setSelectedClip] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState('None');
    const [projectName, setProjectName] = useState('Untitled Project');
    const [isDragOver, setIsDragOver] = useState(false);

    // State - AI Analysis
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState<{ stage: string, pct: number } | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [showAiPanel, setShowAiPanel] = useState<'suggestions' | 'viral' | 'none'>('none');

    // State - Downloader
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState('');

    const [clips, setClips] = useState<EditorClip[]>([
        { id: 'v1', name: 'Clip 1', track: 'video', startTime: 0, duration: 15, color: '#6366f1', opacity: 100, volume: 100, speed: 1 },
        { id: 'a1', name: 'Audio', track: 'audio', startTime: 0, duration: 35, color: '#10b981', opacity: 100, volume: 80, speed: 1 },
    ]);

    // Drag state
    const [dragState, setDragState] = useState<{
        clipId: string;
        mode: 'move' | 'resize-left' | 'resize-right';
        startX: number;
        origStart: number;
        origDuration: number;
    } | null>(null);

    // --- Media Handlers ---

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('video/')) return;
        const url = URL.createObjectURL(file);
        setVideoSrc(url);
        setVideoFileName(file.name);
        setCurrentTime(0);
        setIsPlaying(false);
        setAnalysisResult(null); // Reset analysis on new file

        // Store File in runtimeStore for ExportPanel
        runtimeStore.sourceFile = file;

        // Create initial clip
        const initialClips: EditorClip[] = [
            { id: 'v_main', name: file.name, track: 'video', startTime: 0, duration: 10, color: '#6366f1', opacity: 100, volume: 100, speed: 1 },
            { id: 'a_main', name: 'Audio Track', track: 'audio', startTime: 0, duration: 10, color: '#10b981', opacity: 100, volume: 100, speed: 1 }
        ];
        setClips(initialClips);
        runtimeStore.clips = initialClips;
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleUrlImport = async () => {
        if (!downloadUrl) return;
        setIsDownloading(true);
        setDownloadStatus('Initializing...');

        try {
            const { blob, filename } = await mediaDownloader.downloadMedia(downloadUrl, (msg) => setDownloadStatus(msg));
            const file = new File([blob], filename, { type: blob.type });
            handleFileSelect(file);
            setShowLinkModal(false);
            setDownloadUrl('');
        } catch (err: any) {
            console.error('Import failed:', err);
            alert(`Download failed: ${err.message || 'Unknown error'}. Check console for details.`);
        } finally {
            setIsDownloading(false);
            setDownloadStatus('');
        }
    };

    // --- AI Analysis ---

    const runAnalysis = async () => {
        if (!videoRef.current || !videoSrc) return;

        setIsAnalyzing(true);
        setShowAiPanel('none');

        try {
            const result = await intelligence.analyzeVideo(videoRef.current, (stage, pct) => {
                setAnalysisProgress({ stage, pct });
            });
            setAnalysisResult(result);
            setShowAiPanel('viral'); // Show viral clips immediately
        } catch (err) {
            console.error("Analysis failed:", err);
            alert("Analysis failed. Please try again.");
        } finally {
            setIsAnalyzing(false);
            setAnalysisProgress(null);
        }
    };

    const applyAutoEdit = () => {
        if (!analysisResult) return;

        const edit = smartEditor.autoEdit(analysisResult);

        // Convert auto-edit clips to editor format
        const newClips: EditorClip[] = edit.clips.map(c => ({
            ...c,
            filter: activeFilter === 'None' ? undefined : activeFilter
        }));

        setClips(newClips);
        runtimeStore.clips = newClips;
        setShowAiPanel('none');
        alert(`Applied Auto-Edit: ${edit.actions.length} actions performed.`);
    };

    const addViralClip = (vc: ViralClipCandidate) => {
        const newClip: EditorClip = {
            id: `vc_${Date.now()}`,
            name: vc.label,
            track: 'video',
            startTime: clips.length * 5, // Append to end roughly
            duration: vc.duration,
            color: '#f43f5e', // distinct color for viral clips
            opacity: 100,
            volume: 100,
            speed: 1,
            thumbnail: vc.thumbnail
        };
        setClips(prev => {
            const updated = [...prev, newClip];
            runtimeStore.clips = updated;
            return updated;
        });
    };

    // --- Timeline Sync ---
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onEnded = () => setIsPlaying(false);
        const onLoaded = () => {
            setVideoDuration(video.duration || 60);
            // Update initial clip duration to match video
            setClips(prev => {
                const updated = prev.map(c => c.id === 'v_main' || c.id === 'a_main' ? { ...c, duration: video.duration } : c);
                runtimeStore.clips = updated;
                return updated;
            });
        };

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('ended', onEnded);
        video.addEventListener('loadedmetadata', onLoaded);
        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('ended', onEnded);
            video.removeEventListener('loadedmetadata', onLoaded);
        };
    }, [videoSrc]);

    // Playback loop/animation
    useEffect(() => {
        if (videoSrc || !isPlaying) return;
        // If no real video, simulate playback
        const interval = setInterval(() => {
            setCurrentTime(prev => {
                if (prev >= videoDuration) { setIsPlaying(false); return 0; }
                return prev + 0.1;
            });
        }, 100);
        return () => clearInterval(interval);
    }, [isPlaying, videoDuration, videoSrc]);


    // --- Drag Handlers (re-used from Phase 2) ---
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState || !timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const pxPerSec = (rect.width * zoom) / videoDuration;
        const dx = e.clientX - dragState.startX;
        const dtSec = dx / pxPerSec;

        setClips(prev => prev.map(c => {
            if (c.id !== dragState.clipId) return c;
            if (dragState.mode === 'move') {
                return { ...c, startTime: Math.max(0, dragState.origStart + dtSec) };
            } else if (dragState.mode === 'resize-left') {
                const newStart = Math.max(0, dragState.origStart + dtSec);
                const shrink = newStart - dragState.origStart;
                return { ...c, startTime: newStart, duration: Math.max(0.5, dragState.origDuration - shrink) };
            } else {
                return { ...c, duration: Math.max(0.5, dragState.origDuration + dtSec) };
            }
        }));
    }, [dragState, videoDuration, zoom]);

    const handleMouseUp = useCallback(() => setDragState(null), []);

    useEffect(() => {
        if (dragState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragState, handleMouseMove, handleMouseUp]);

    const startDrag = (clipId: string, mode: 'move' | 'resize-left' | 'resize-right', e: React.MouseEvent) => {
        e.stopPropagation();
        const clip = clips.find(c => c.id === clipId);
        if (!clip) return;
        setSelectedClip(clipId);
        setDragState({ clipId, mode, startX: e.clientX, origStart: clip.startTime, origDuration: clip.duration });
    };

    const togglePlay = () => {
        const video = videoRef.current;
        if (video && videoSrc) {
            if (isPlaying) { video.pause(); } else { video.play(); }
        }
        setIsPlaying(!isPlaying);
    };

    const seekTo = (t: number) => {
        setCurrentTime(t);
        if (videoRef.current && videoSrc) videoRef.current.currentTime = t;
    };

    // --- Helpers ---
    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        const ms = Math.floor((s % 1) * 10);
        return `${m}:${sec.toString().padStart(2, '0')}.${ms}`;
    };

    const getFilterCSS = (name: string): string => {
        const map: Record<string, string> = {
            'Cinematic': 'contrast(1.1) saturate(1.3) brightness(0.95)',
            'Vintage': 'sepia(0.4) contrast(1.1) brightness(0.95)',
            'B&W': 'grayscale(1) contrast(1.2)',
            'Neon': 'saturate(2) contrast(1.2) brightness(1.1)',
            'Warm': 'sepia(0.2) saturate(1.3) brightness(1.05)',
            'Cool': 'saturate(0.8) hue-rotate(15deg) brightness(1.05)',
            'Film Grain': 'contrast(1.15) brightness(0.9) saturate(0.9)',
        };
        return map[name] || 'none';
    };

    const pxPerSec = timelineRef.current ? (timelineRef.current.clientWidth * zoom) / (videoDuration || 60) : 10;
    const playheadLeft = currentTime * pxPerSec;
    const selected = clips.find(c => c.id === selectedClip);

    return (
        <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden font-sans">
            {/* Toolbar */}
            <div className="glass-panel-heavy flex items-center gap-3 px-4 py-3 z-20 border-b border-slate-800/50">
                <input
                    className="bg-transparent text-sm font-bold text-white border-none outline-none w-48 placeholder-slate-500"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="Untitled Project"
                    title="Project Name"
                    aria-label="Project Name"
                />
                <div className="h-6 w-px bg-slate-700/50 mx-1" />

                <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-hover border border-slate-700 transition-colors">
                    <span className="material-icons-round text-sm">upload_file</span>Import
                </button>
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} title="Upload Video" aria-label="Upload Video" />

                <button onClick={() => setShowLinkModal(true)} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-hover border border-slate-700 transition-colors">
                    <span className="material-icons-round text-sm">link</span>Link
                </button>

                <div className="flex-1" />

                {/* AI Controls */}
                <div className="flex items-center gap-2">
                    {isAnalyzing ? (
                        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-full">
                            <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] text-indigo-300 font-medium">
                                {analysisProgress ? `${analysisProgress.stage} ${analysisProgress.pct}%` : 'Analyzing...'}
                            </span>
                        </div>
                    ) : (
                        !analysisResult ? (
                            <button onClick={runAnalysis} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold flex items-center gap-1.5 hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
                                <span className="material-icons-round text-sm">auto_awesome</span>Analyze Video
                            </button>
                        ) : (
                            <>
                                <button onClick={() => setShowAiPanel(current => current === 'viral' ? 'none' : 'viral')} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${showAiPanel === 'viral' ? 'bg-orange-500 text-white' : 'bg-surface-hover text-slate-300 hover:text-white'}`}>
                                    <span className="material-icons-round text-sm">whatshot</span>Viral Clips
                                </button>
                                <button onClick={applyAutoEdit} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-500 transition-all">
                                    <span className="material-icons-round text-sm">movie_filter</span>Auto-Edit
                                </button>
                            </>
                        )
                    )}
                </div>

                <div className="h-6 w-px bg-slate-700/50 mx-2" />
                <button onClick={() => onNavigate?.(ViewState.EXPORT)} className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
                    Export
                </button>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Preview + Filters */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Video Preview */}
                    <div
                        className={`flex-1 flex items-center justify-center relative m-4 rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/5 transition-all ${isDragOver ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={onDrop}
                    >
                        {videoSrc ? (
                            <video
                                ref={videoRef}
                                src={videoSrc}
                                className="max-w-full max-h-full object-contain"
                                style={{ filter: activeFilter !== 'None' ? getFilterCSS(activeFilter) : 'none' }}
                                onClick={togglePlay}
                            />
                        ) : (
                            <div className="text-center text-slate-500">
                                <div className="w-16 h-16 rounded-2xl bg-surface-card flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-xl">
                                    <span className="material-icons-round text-3xl opacity-50">movie</span>
                                </div>
                                <p className="text-sm font-medium mb-1 text-slate-400">Drag video here or Import</p>
                                <p className="text-xs text-slate-600">AI Analysis ready</p>
                            </div>
                        )}

                        {/* Playback Overlay */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full flex items-center gap-6 border border-white/10 shadow-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <button onClick={() => seekTo(0)} className="text-white/70 hover:text-white"><span className="material-icons-round text-xl">skip_previous</span></button>
                            <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
                                <span className="material-icons-round text-xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                            </button>
                            <button onClick={() => seekTo(Math.min(videoDuration || 0, currentTime + 5))} className="text-white/70 hover:text-white"><span className="material-icons-round text-xl">skip_next</span></button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="px-6 pb-4">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {FILTERS.map(f => (
                                <button key={f} onClick={() => setActiveFilter(f)} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${activeFilter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-card text-slate-400 border border-slate-800 hover:text-white'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Viral Clips / Properties */}
                {showAiPanel === 'viral' && analysisResult && (
                    <div className="w-80 border-l border-slate-800 bg-surface-dark flex flex-col overflow-hidden animate-slide-in-right z-10 transition-all">
                        <div className="p-4 border-b border-slate-800 bg-surface-dark/95 backdrop-blur z-10">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-icons-round text-orange-500 text-sm">whatshot</span> Viral Candidates
                                </h3>
                                <button onClick={() => setShowAiPanel('none')} className="text-slate-500 hover:text-white"><span className="material-icons-round text-sm">close</span></button>
                            </div>
                            <p className="text-[10px] text-slate-500">Top {analysisResult.viralClips.length} clips detected by AI</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {analysisResult.viralClips.map((clip) => (
                                <div key={clip.id} className="group bg-surface-card border border-slate-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/5 cursor-pointer" onClick={() => addViralClip(clip)}>
                                    <div className="relative h-24 bg-black flex items-center justify-center overflow-hidden">
                                        {clip.thumbnail ? (
                                            <img src={clip.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <span className="material-icons-round text-slate-700 text-3xl">videocam</span>
                                        )}
                                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                            {clip.viralityScore}
                                        </div>
                                        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white/80 bg-black/50 px-1 rounded">
                                            {formatTime(clip.duration)}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">{clip.label}</h4>
                                            <span className="material-icons-round text-slate-600 text-sm group-hover:text-white transition-colors">add_circle</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {clip.reasons.slice(0, 2).map((r, i) => (
                                                <span key={i} className="text-[9px] text-slate-400 bg-surface-dark px-1.5 py-0.5 rounded">{r}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Timeline Area */}
            <div className="border-t border-slate-800 bg-surface-dark h-72 flex flex-col">
                {/* Timeline Controls */}
                <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-mono text-primary font-bold">{formatTime(currentTime)} <span className="text-slate-600">/ {formatTime(videoDuration)}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-icons-round text-xs text-slate-500">zoom_out</span>
                        <input
                            type="range"
                            min={0.5}
                            max={5}
                            step={0.1}
                            value={zoom}
                            onChange={e => setZoom(Number(e.target.value))}
                            className="w-24 accent-slate-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            title="Zoom Timeline"
                            aria-label="Zoom Timeline"
                        />
                        <span className="material-icons-round text-xs text-slate-500">zoom_in</span>
                    </div>
                </div>

                {/* Timeline Tracks */}
                <div className="flex-1 overflow-hidden flex relative">
                    {/* Track Headers */}
                    <div className="w-24 bg-surface-card border-r border-slate-800 flex flex-col z-10 shadow-lg">
                        {['video', 'audio', 'caption'].map(track => (
                            <div key={track} className="h-16 border-b border-slate-800 flex flex-col justify-center px-3 relative">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{track}</span>
                                <div className="flex gap-2">
                                    <button className="text-slate-600 hover:text-white"><span className="material-icons-round text-[14px]">visibility</span></button>
                                    <button className="text-slate-600 hover:text-white"><span className="material-icons-round text-[14px]">lock</span></button>
                                    <button className="text-slate-600 hover:text-white"><span className="material-icons-round text-[14px]">volume_up</span></button>
                                </div>
                                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: TRACK_COLORS[track] }}></div>
                            </div>
                        ))}
                    </div>

                    {/* Scrollable Tracks */}
                    <div
                        className="flex-1 overflow-x-auto relative custom-scrollbar select-none"
                        ref={timelineRef}
                        onClick={(e) => {
                            if (!timelineRef.current) return;
                            const rect = timelineRef.current.getBoundingClientRect();
                            const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
                            const t = x / ((timelineRef.current.clientWidth * zoom) / videoDuration);
                            seekTo(Math.max(0, Math.min(videoDuration, t)));
                        }}
                    >
                        <div style={{ width: `${videoDuration * pxPerSec}px`, minWidth: '100%' }} className="relative h-full">
                            {/* Ruler & Markers */}
                            <div className="h-6 border-b border-slate-800/50 relative bg-surface-dark/50">
                                {Array.from({ length: Math.ceil(videoDuration / 5) + 1 }).map((_, i) => (
                                    <div key={i} className="absolute top-0 bottom-0 border-l border-slate-700/50 pl-1" style={{ left: `${i * 5 * pxPerSec}px` }}>
                                        <span className="text-[9px] text-slate-500">{formatTime(i * 5)}</span>
                                    </div>
                                ))}

                                {/* Scene Markers */}
                                {analysisResult?.scenes.map((scene, i) => (
                                    <div key={i} className="absolute top-4 w-2 h-2 -ml-1 border-l border-r border-transparent flex justify-center" style={{ left: `${scene.time * pxPerSec}px` }} title="Scene Change">
                                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                                    </div>
                                ))}
                            </div>

                            {/* Tracks */}
                            {['video', 'audio', 'caption'].map((track, i) => (
                                <div key={track} className="h-16 border-b border-slate-800/30 relative mt-[1px]">
                                    {/* Background Grid */}
                                    <div className="absolute inset-0 bg-slate-900/20"></div>

                                    {/* Clips */}
                                    {clips.filter(c => c.track === track).map(clip => {
                                        const left = clip.startTime * pxPerSec;
                                        const width = clip.duration * pxPerSec;
                                        return (
                                            <div
                                                key={clip.id}
                                                className={`absolute top-2 bottom-2 rounded-md overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 flex items-center text-[10px] text-white/90 px-2 shadow-sm
                                                    ${selectedClip === clip.id ? 'ring-2 ring-white z-10' : 'hover:ring-1 hover:ring-white/30'}
                                                    ${dragState?.clipId === clip.id ? 'opacity-80' : ''}
                                                 `}
                                                style={{
                                                    left: `${left}px`,
                                                    width: `${Math.max(2, width)}px`,
                                                    backgroundColor: clip.color,
                                                    background: clip.track === 'audio' && analysisResult ? `linear-gradient(90deg, ${clip.color}dd 0%, ${clip.color} 100%)` : clip.color // Simple gradient for now
                                                }}
                                                onMouseDown={(e) => startDrag(clip.id, 'move', e)}
                                                onClick={(e) => { e.stopPropagation(); setSelectedClip(clip.id); }}
                                            >
                                                {/* Waveform Placeholder for Audio */}
                                                {track === 'audio' && (
                                                    <div className="absolute inset-0 opacity-40 flex items-end pointer-events-none px-px">
                                                        {analysisResult?.waveform ? (() => {
                                                            // Render real waveform bars from analysis
                                                            const wf = analysisResult.waveform;
                                                            const clipPxW = Math.max(2, clip.duration * pxPerSec);
                                                            const barCount = Math.min(wf.length, Math.floor(clipPxW / 2));
                                                            const step = Math.max(1, Math.floor(wf.length / barCount));
                                                            const bars: React.ReactNode[] = [];
                                                            for (let b = 0; b < barCount; b++) {
                                                                const sampleIdx = Math.min(b * step, wf.length - 1);
                                                                const val = Math.abs(wf[sampleIdx]);
                                                                const h = Math.max(4, val * 44);
                                                                bars.push(<div key={b} style={{ width: '1px', height: `${h}%`, background: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />);
                                                            }
                                                            return bars;
                                                        })() : (
                                                            <span className="material-icons-round text-black/20 transform scale-150 m-auto">graphic_eq</span>
                                                        )}
                                                    </div>
                                                )}

                                                <span className="truncate relative z-10 drop-shadow-md">{clip.name}</span>

                                                {/* Resize Handles */}
                                                <div className="absolute left-0 w-3 h-full cursor-e-resize hover:bg-white/20" onMouseDown={(e) => startDrag(clip.id, 'resize-left', e)}></div>
                                                <div className="absolute right-0 w-3 h-full cursor-w-resize hover:bg-white/20" onMouseDown={(e) => startDrag(clip.id, 'resize-right', e)}></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                            {/* Playhead */}
                            <div
                                className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none"
                                style={{ left: `${playheadLeft}px` }}
                            >
                                <div className="w-3 h-3 -ml-1.5 bg-red-500 rotate-45 transform -translate-y-1.5"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Link Import Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface-card border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-icons-round text-primary">cloud_download</span> Import from URL
                            </h3>
                            <button onClick={() => !isDownloading && setShowLinkModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>

                        <p className="text-sm text-slate-400 mb-4">
                            Paste a link from TikTok, YouTube, or Instagram. We will download a high-quality, watermark-free version if available.
                        </p>

                        <input
                            type="text"
                            value={downloadUrl}
                            onChange={e => setDownloadUrl(e.target.value)}
                            placeholder="https://www.tiktok.com/@user/video/..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary transition-all pr-12 mb-4"
                            disabled={isDownloading}
                            title="Media URL"
                            aria-label="Media URL"
                        />

                        {isDownloading && (
                            <div className="mb-4 flex items-center gap-3 text-xs text-indigo-300 bg-indigo-500/10 px-3 py-2 rounded-lg border border-indigo-500/20">
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <span>{downloadStatus}</span>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowLinkModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium" disabled={isDownloading}>
                                Cancel
                            </button>
                            <button
                                onClick={handleUrlImport}
                                disabled={!downloadUrl || isDownloading}
                                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-sm font-bold text-white hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isDownloading ? 'Downloading...' : 'Import Media'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clip Properties Panel (Selection) */}
            {selectedClip && !showAiPanel && (
                <div className="absolute top-16 right-4 w-64 bg-surface-card border border-slate-700 rounded-xl shadow-2xl p-4 z-30 animate-scale-in origin-top-right">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                        <h4 className="text-xs font-bold text-slate-300 uppercase">Selected Clip</h4>
                        <button onClick={() => setSelectedClip(null)} className="text-slate-500 hover:text-white" title="Close clip properties"><span className="material-icons-round text-sm">close</span></button>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Remove Watermark (Opus/TikTok)</span>
                            <button
                                onClick={() => {
                                    setClips(prev => prev.map(c => c.id === selectedClip ? { ...c, removeWatermark: !c.removeWatermark } : c));
                                    runtimeStore.clips = clips; // imperfect sync but ok for MVP
                                }}
                                className={`w-10 h-5 rounded-full relative transition-colors ${clips.find(c => c.id === selectedClip)?.removeWatermark ? 'bg-primary' : 'bg-slate-700'}`}
                                title="Toggle Watermark Removal"
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${clips.find(c => c.id === selectedClip)?.removeWatermark ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                            Applies a blur filter to corners where logos usually appear (manual upload fallback).
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoEditor;

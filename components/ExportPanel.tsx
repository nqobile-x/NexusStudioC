import React, { useState } from 'react';
import { Platform, ExportSettings, AspectRatio } from '../types';
import { ffmpegService } from '../services/ffmpegService';
import { runtimeStore } from '../services/runtimeStore';

/** Platform definitions */
const PLATFORMS: Platform[] = [
    { id: 'tiktok', name: 'TikTok', icon: 'music_note', aspectRatio: '9:16', maxDuration: 180, maxFileSize: '287 MB', resolution: '1080x1920' },
    { id: 'reels', name: 'Instagram Reels', icon: 'camera', aspectRatio: '9:16', maxDuration: 90, maxFileSize: '250 MB', resolution: '1080x1920' },
    { id: 'shorts', name: 'YouTube Shorts', icon: 'play_circle', aspectRatio: '9:16', maxDuration: 60, maxFileSize: '256 MB', resolution: '1080x1920' },
    { id: 'instagram', name: 'Instagram Feed', icon: 'grid_view', aspectRatio: '1:1', maxDuration: 60, maxFileSize: '250 MB', resolution: '1080x1080' },
    { id: 'youtube', name: 'YouTube', icon: 'smart_display', aspectRatio: '16:9', maxDuration: 43200, maxFileSize: '128 GB', resolution: '3840x2160' },
    { id: 'facebook', name: 'Facebook', icon: 'public', aspectRatio: '16:9', maxDuration: 240, maxFileSize: '4 GB', resolution: '1920x1080' },
];

/** Platform colors */
const PLATFORM_COLORS: Record<string, string> = {
    tiktok: '#00f2ea',
    reels: '#e1306c',
    shorts: '#ff0000',
    instagram: '#c13584',
    youtube: '#ff0000',
    facebook: '#1877f2',
};

/** Aspect ratio visual dimensions */
const ASPECT_DIMS: Record<AspectRatio, { w: number; h: number }> = {
    '16:9': { w: 160, h: 90 },
    '9:16': { w: 90, h: 160 },
    '1:1': { w: 120, h: 120 },
    '4:3': { w: 140, h: 105 },
    '3:4': { w: 105, h: 140 },
};

const ExportPanel: React.FC = () => {
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>(PLATFORMS[0]);
    const [settings, setSettings] = useState<ExportSettings>({
        platform: PLATFORMS[0],
        resolution: '1080p',
        fps: 30,
        aspectRatio: '9:16',
        codec: 'H.264',
        quality: 'high',
    });
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportStage, setExportStage] = useState('');
    const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);
    const [autoReframe, setAutoReframe] = useState(true);
    const [addCaptions, setAddCaptions] = useState(true);
    const [batchMode, setBatchMode] = useState(false);

    const handlePlatformSelect = (p: Platform) => {
        setSelectedPlatform(p);
        setSettings(prev => ({ ...prev, platform: p, aspectRatio: p.aspectRatio }));
    };

    const handleExport = async () => {
        const clips = runtimeStore.getExportableClips();
        if (clips.length === 0) {
            setExportError('No video clips to export. Import a video in the Video Editor first.');
            return;
        }

        setIsExporting(true);
        setExportProgress(0);
        setExportStage('Initializing...');
        setExportError(null);
        setExportedBlob(null);

        try {
            const blob = await ffmpegService.exportVideo(clips, (stage, pct) => {
                setExportStage(stage);
                setExportProgress(Math.round(pct));
            });
            setExportedBlob(blob);
            setExportProgress(100);
            setExportStage('Done');
        } catch (err) {
            console.error('Export failed:', err);
            setExportError(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}. Try again or use a smaller clip.`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownload = () => {
        if (!exportedBlob) return;
        const url = URL.createObjectURL(exportedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexus_export_${selectedPlatform.id}_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const resetExport = () => {
        setExportProgress(0);
        setIsExporting(false);
        setExportedBlob(null);
        setExportError(null);
        setExportStage('');
    };

    const dims = ASPECT_DIMS[settings.aspectRatio];

    return (
        <div className="p-4 lg:p-8 h-full overflow-y-auto custom-scrollbar pb-24 animate-fade-in">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="material-icons-round text-primary">ios_share</span>
                            Export & Publish
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Optimize and export for any platform with one click</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setBatchMode(!batchMode)} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all border ${batchMode ? 'border-primary bg-primary/10 text-primary' : 'border-slate-700 bg-surface-card text-slate-400 hover:text-white'}`}>
                            <span className="material-icons-round text-base">queue</span>Batch Mode
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Platform Selection */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="glass-panel rounded-2xl p-5">
                            <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-4">Choose Platform</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {PLATFORMS.map(p => (
                                    <button key={p.id} onClick={() => handlePlatformSelect(p)} className={`p-4 rounded-xl border transition-all text-left group relative overflow-hidden ${selectedPlatform.id === p.id ? 'border-primary/50 bg-primary/5 shadow-lg' : 'border-slate-800/50 bg-surface-card hover:border-slate-600'}`}>
                                        {selectedPlatform.id === p.id && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: PLATFORM_COLORS[p.id] }} />}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${PLATFORM_COLORS[p.id]}15` }}>
                                                <span className="material-icons-round text-lg" style={{ color: PLATFORM_COLORS[p.id] }}>{p.icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{p.name}</p>
                                                <p className="text-[10px] text-slate-500">{p.aspectRatio} · {p.resolution}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-[9px] text-slate-600">
                                            <span>Max {p.maxDuration < 600 ? `${p.maxDuration}s` : `${Math.floor(p.maxDuration / 3600)}h`}</span>
                                            <span>·</span>
                                            <span>{p.maxFileSize}</span>
                                        </div>
                                        {selectedPlatform.id === p.id && <span className="absolute top-3 right-3 material-icons-round text-primary text-sm">check_circle</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Export Settings */}
                        <div className="glass-panel rounded-2xl p-5">
                            <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-4">Export Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Resolution */}
                                <div>
                                    <label className="text-[10px] text-slate-500 block mb-2">Resolution</label>
                                    <div className="flex gap-1.5">
                                        {(['720p', '1080p', '4K'] as const).map(r => (
                                            <button key={r} onClick={() => setSettings(prev => ({ ...prev, resolution: r }))} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${settings.resolution === r ? 'bg-primary text-white' : 'bg-surface-card text-slate-400 border border-slate-800 hover:border-slate-600'}`}>{r}</button>
                                        ))}
                                    </div>
                                </div>
                                {/* FPS */}
                                <div>
                                    <label className="text-[10px] text-slate-500 block mb-2">Frame Rate</label>
                                    <div className="flex gap-1.5">
                                        {([24, 30, 60] as const).map(f => (
                                            <button key={f} onClick={() => setSettings(prev => ({ ...prev, fps: f }))} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${settings.fps === f ? 'bg-primary text-white' : 'bg-surface-card text-slate-400 border border-slate-800 hover:border-slate-600'}`}>{f} fps</button>
                                        ))}
                                    </div>
                                </div>
                                {/* Codec */}
                                <div>
                                    <label className="text-[10px] text-slate-500 block mb-2">Codec</label>
                                    <div className="flex gap-1.5">
                                        {(['H.264', 'H.265', 'VP9'] as const).map(c => (
                                            <button key={c} onClick={() => setSettings(prev => ({ ...prev, codec: c }))} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${settings.codec === c ? 'bg-primary text-white' : 'bg-surface-card text-slate-400 border border-slate-800 hover:border-slate-600'}`}>{c}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 border-t border-slate-800/40 pt-4">
                                <label className="text-[10px] text-slate-500 block mb-2">Quality</label>
                                <div className="flex gap-1.5">
                                    {(['draft', 'standard', 'high', 'ultra'] as const).map(q => (
                                        <button key={q} onClick={() => setSettings(prev => ({ ...prev, quality: q }))} className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${settings.quality === q ? 'bg-primary text-white' : 'bg-surface-card text-slate-400 border border-slate-800 hover:border-slate-600'}`}>{q}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* AI Enhancements */}
                        <div className="glass-panel rounded-2xl p-5">
                            <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-4">AI Enhancements</h3>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between p-3 rounded-lg bg-surface-card border border-slate-800/50 cursor-pointer hover:border-slate-600 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                            <span className="material-icons-round text-sm">crop_free</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-medium">Smart Reframe</p>
                                            <p className="text-[10px] text-slate-500">AI tracks subjects during aspect ratio changes</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full transition-all relative cursor-pointer ${autoReframe ? 'bg-primary' : 'bg-slate-700'}`} onClick={() => setAutoReframe(!autoReframe)}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${autoReframe ? 'left-5' : 'left-1'}`} />
                                    </div>
                                </label>
                                <label className="flex items-center justify-between p-3 rounded-lg bg-surface-card border border-slate-800/50 cursor-pointer hover:border-slate-600 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all">
                                            <span className="material-icons-round text-sm">subtitles</span>
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-medium">Burn-in Captions</p>
                                            <p className="text-[10px] text-slate-500">Embed captions directly into the video</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full transition-all relative cursor-pointer ${addCaptions ? 'bg-amber-500' : 'bg-slate-700'}`} onClick={() => setAddCaptions(!addCaptions)}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${addCaptions ? 'left-5' : 'left-1'}`} />
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Preview & Export */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Aspect Ratio Preview */}
                        <div className="glass-panel rounded-2xl p-5 flex flex-col items-center">
                            <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-4 self-start">Preview</h3>
                            <div className="bg-black border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden relative" style={{ width: `${dims.w}px`, height: `${dims.h}px` }}>
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 to-slate-900" />
                                <div className="text-center z-10">
                                    <span className="material-icons-round text-white/20 text-3xl">videocam</span>
                                    <p className="text-[8px] text-white/30 mt-1">{settings.aspectRatio}</p>
                                </div>
                                {/* Platform badge */}
                                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-0.5 rounded-full">
                                    <span className="material-icons-round text-[10px]" style={{ color: PLATFORM_COLORS[selectedPlatform.id] }}>{selectedPlatform.icon}</span>
                                    <span className="text-[8px] text-white/60">{selectedPlatform.name}</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-600 mt-3">{selectedPlatform.resolution} · {settings.fps}fps · {settings.codec}</p>
                        </div>

                        {/* Export Summary */}
                        <div className="glass-panel rounded-2xl p-5">
                            <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">Export Summary</h3>
                            <div className="space-y-2 text-xs">
                                {[
                                    ['Platform', selectedPlatform.name],
                                    ['Resolution', settings.resolution],
                                    ['Frame Rate', `${settings.fps} fps`],
                                    ['Codec', settings.codec],
                                    ['Quality', settings.quality],
                                    ['Smart Reframe', autoReframe ? 'On' : 'Off'],
                                    ['Captions', addCaptions ? 'Burn-in' : 'Off'],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex items-center justify-between py-1 border-b border-slate-800/30 last:border-0">
                                        <span className="text-slate-500">{label}</span>
                                        <span className="text-white font-medium">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Export Button */}
                        {isExporting ? (
                            <div className="glass-panel rounded-2xl p-5 animate-fade-in">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-white font-medium">{exportStage || 'Exporting...'}</span>
                                    <span className="text-xs text-primary font-mono">{Math.min(100, exportProgress)}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all ease-linear" style={{ width: `${Math.min(100, exportProgress)}%` }} />
                                </div>
                                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                                    <span className="material-icons-round text-xs animate-spin text-primary">sync</span>
                                    {exportStage || 'Processing...'}
                                </div>
                            </div>
                        ) : exportError ? (
                            <div className="glass-panel rounded-2xl p-5 border-red-500/30 animate-fade-in">
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-3">
                                        <span className="material-icons-round text-2xl text-red-400">error</span>
                                    </div>
                                    <p className="text-white font-bold">Export Failed</p>
                                    <p className="text-xs text-slate-500 mt-1">{exportError}</p>
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={handleExport} className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"><span className="material-icons-round text-sm">refresh</span>Retry</button>
                                        <button onClick={resetExport} className="flex-1 bg-surface-card hover:bg-surface-hover text-white py-2.5 rounded-lg text-xs font-medium border border-slate-700 transition-all">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        ) : exportedBlob ? (
                            <div className="glass-panel rounded-2xl p-5 border-emerald-500/30 animate-fade-in">
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                                        <span className="material-icons-round text-2xl text-emerald-400">check_circle</span>
                                    </div>
                                    <p className="text-white font-bold">Export Complete!</p>
                                    <p className="text-xs text-slate-500 mt-1">Ready to download or publish</p>
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={handleDownload} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"><span className="material-icons-round text-sm">download</span>Download ({(exportedBlob.size / 1024 / 1024).toFixed(1)} MB)</button>
                                    </div>
                                    <button onClick={resetExport} className="mt-3 text-[10px] text-slate-500 hover:text-white transition-colors">Export Another</button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={handleExport} className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 text-sm">
                                <span className="material-icons-round">file_download</span>
                                Export Video
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportPanel;

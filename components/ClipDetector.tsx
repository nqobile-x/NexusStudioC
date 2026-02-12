import React, { useState } from 'react';
import { ViralClip } from '../types';
import { detectViralClips } from '../services/geminiService';

/** Emotion badge colors */
const EMOTION_COLORS: Record<string, { bg: string; text: string }> = {
    humorous: { bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
    inspiring: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
    controversial: { bg: 'bg-red-500/15', text: 'text-red-400' },
    educational: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    dramatic: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
};

/** Platform icon mapping */
const PLATFORM_ICONS: Record<string, { icon: string; color: string }> = {
    tiktok: { icon: 'music_note', color: '#00f2ea' },
    reels: { icon: 'camera', color: '#e1306c' },
    shorts: { icon: 'play_circle', color: '#ff0000' },
    youtube: { icon: 'smart_display', color: '#ff0000' },
    facebook: { icon: 'public', color: '#1877f2' },
};

/** Virality score color */
const scoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-yellow-400' : s >= 40 ? 'text-orange-400' : 'text-red-400';
const scoreBg = (s: number) => s >= 80 ? 'from-emerald-500' : s >= 60 ? 'from-yellow-500' : s >= 40 ? 'from-orange-500' : 'from-red-500';

/** Format seconds */
const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

/** Demo clips (shown when no real analysis) */
const DEMO_CLIPS: ViralClip[] = [
    { id: '1', title: 'The Surprising Reveal', startTime: 45, endTime: 78, viralityScore: 94, emotion: 'dramatic', platforms: ['tiktok', 'reels', 'shorts'], summary: 'Speaker reveals an unexpected personal story that creates emotional impact and strong viewer engagement.', keywords: ['reveal', 'personal', 'story'], hookType: 'Emotional Hook', narrativeComplete: true },
    { id: '2', title: 'Hot Take on AI', startTime: 120, endTime: 155, viralityScore: 87, emotion: 'controversial', platforms: ['tiktok', 'shorts', 'youtube'], summary: 'Bold, contrarian opinion on AI replacing creative jobs that sparks debate and high comment engagement.', keywords: ['AI', 'opinion', 'future'], hookType: 'Controversial Statement', narrativeComplete: true },
    { id: '3', title: 'The Perfect Analogy', startTime: 210, endTime: 238, viralityScore: 76, emotion: 'educational', platforms: ['reels', 'youtube'], summary: 'Complex concept explained using a brilliantly simple analogy that makes viewers feel smarter.', keywords: ['analogy', 'explain', 'learn'], hookType: 'Knowledge Drop', narrativeComplete: true },
    { id: '4', title: 'Hilarious Blooper', startTime: 340, endTime: 358, viralityScore: 91, emotion: 'humorous', platforms: ['tiktok', 'reels', 'shorts', 'facebook'], summary: 'Unexpected blooper catches everyone off guard, with genuine laughter creating relatable, shareable content.', keywords: ['blooper', 'funny', 'outtake'], hookType: 'Comedy Gold', narrativeComplete: false },
    { id: '5', title: 'Inspirational Close', startTime: 500, endTime: 545, viralityScore: 68, emotion: 'inspiring', platforms: ['youtube', 'reels'], summary: 'Powerful closing statement with a call to action that motivates viewers to take the next step.', keywords: ['motivation', 'growth', 'action'], hookType: 'Motivational Speech', narrativeComplete: true },
];

const ClipDetector: React.FC = () => {
    const [clips, setClips] = useState<ViralClip[]>(DEMO_CLIPS);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [sortBy, setSortBy] = useState<'score' | 'time'>('score');
    const [filterEmotion, setFilterEmotion] = useState<string>('all');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [selectedClip, setSelectedClip] = useState<string | null>(null);

    const sortedClips = [...clips]
        .filter(c => filterEmotion === 'all' || c.emotion === filterEmotion)
        .sort((a, b) => sortBy === 'score' ? b.viralityScore - a.viralityScore : a.startTime - b.startTime);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setUploadedFile(file);
    };

    const handleAnalyze = async () => {
        if (!uploadedFile) return;
        setIsAnalyzing(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const mimeType = uploadedFile.type;
                const result = await detectViralClips(base64, mimeType);
                if (result && result.length > 0) setClips(result);
                setIsAnalyzing(false);
            };
            reader.readAsDataURL(uploadedFile);
        } catch {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="p-4 lg:p-8 h-full overflow-y-auto custom-scrollbar pb-24 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="material-icons-round text-primary">content_cut</span>
                        AI Clip Detector
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Automatically detect viral-worthy moments from your long-form content</p>
                </div>
                <div className="flex gap-2">
                    <label className="cursor-pointer bg-surface-card hover:bg-surface-hover border border-slate-700/50 hover:border-primary/40 text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm font-medium">
                        <span className="material-icons-round text-base">upload_file</span>
                        {uploadedFile ? uploadedFile.name.substring(0, 20) : 'Upload Video'}
                        <input type="file" accept="video/*" onChange={handleUpload} className="hidden" />
                    </label>
                    <button onClick={handleAnalyze} disabled={!uploadedFile || isAnalyzing} className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all">
                        {isAnalyzing ? <span className="material-icons-round animate-spin text-base">sync</span> : <span className="material-icons-round text-base">auto_awesome</span>}
                        {isAnalyzing ? 'Analyzing...' : 'Detect Clips'}
                    </button>
                </div>
            </div>

            {/* Analysis Progress */}
            {isAnalyzing && (
                <div className="glass-panel rounded-2xl p-6 mb-6 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div>
                            <p className="text-white font-medium">AI is analyzing your video...</p>
                            <p className="text-slate-500 text-xs mt-1">Detecting hooks, emotional peaks, and viral moments</p>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        {['Transcribing audio...', 'Detecting speakers...', 'Analyzing sentiment...', 'Scoring virality...'].map((step, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="material-icons-round text-xs text-emerald-400">check_circle</span>
                                {step}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2 bg-surface-card rounded-lg p-1 border border-slate-800/50">
                    <button onClick={() => setSortBy('score')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sortBy === 'score' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}>
                        <span className="material-icons-round text-xs mr-1 align-middle">trending_up</span>Virality
                    </button>
                    <button onClick={() => setSortBy('time')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sortBy === 'time' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}>
                        <span className="material-icons-round text-xs mr-1 align-middle">schedule</span>Timeline
                    </button>
                </div>
                <div className="h-5 w-px bg-slate-800" />
                {['all', 'humorous', 'inspiring', 'controversial', 'educational', 'dramatic'].map(emo => (
                    <button key={emo} onClick={() => setFilterEmotion(emo)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${filterEmotion === emo ? 'border-primary bg-primary/10 text-primary' : 'border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'}`}>
                        {emo === 'all' ? 'All' : emo}
                    </button>
                ))}
                <span className="ml-auto text-xs text-slate-600">{sortedClips.length} clips found</span>
            </div>

            {/* Clip Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {sortedClips.map((clip) => (
                    <div key={clip.id} onClick={() => setSelectedClip(selectedClip === clip.id ? null : clip.id)} className={`glass-panel rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-primary/30 ${selectedClip === clip.id ? 'ring-1 ring-primary border-primary/30' : ''}`}>
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0 mr-3">
                                    <h3 className="text-base font-bold text-white truncate">{clip.title}</h3>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                        <span className="material-icons-round text-xs">schedule</span>
                                        {fmt(clip.startTime)} → {fmt(clip.endTime)}
                                        <span className="text-slate-700">·</span>
                                        <span>{fmt(clip.endTime - clip.startTime)} duration</span>
                                    </div>
                                </div>
                                {/* Virality Score */}
                                <div className="text-center min-w-[56px]">
                                    <div className={`text-2xl font-black ${scoreColor(clip.viralityScore)}`}>{clip.viralityScore}</div>
                                    <div className="text-[8px] uppercase tracking-widest text-slate-600 font-bold">Score</div>
                                    <div className="w-full h-1 rounded-full bg-slate-800 mt-1 overflow-hidden">
                                        <div className={`h-full rounded-full bg-gradient-to-r ${scoreBg(clip.viralityScore)} to-transparent`} style={{ width: `${clip.viralityScore}%` }} />
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed mb-3">{clip.summary}</p>

                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                {/* Emotion Badge */}
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${EMOTION_COLORS[clip.emotion]?.bg} ${EMOTION_COLORS[clip.emotion]?.text}`}>
                                    {clip.emotion}
                                </span>
                                {/* Hook Type */}
                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-slate-800/50 text-slate-400 border border-slate-700/50">
                                    {clip.hookType}
                                </span>
                                {clip.narrativeComplete && (
                                    <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                                        <span className="material-icons-round text-[10px]">check_circle</span>Complete
                                    </span>
                                )}
                            </div>

                            {/* Platforms */}
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Best for:</span>
                                {clip.platforms.map(p => (
                                    <span key={p} className="flex items-center gap-1 text-[10px] font-medium" style={{ color: PLATFORM_ICONS[p]?.color }}>
                                        <span className="material-icons-round text-xs">{PLATFORM_ICONS[p]?.icon}</span>
                                        <span className="capitalize">{p}</span>
                                    </span>
                                ))}
                            </div>

                            {/* Keywords */}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {clip.keywords.map(kw => (
                                    <span key={kw} className="text-[9px] px-2 py-0.5 rounded-full bg-surface-card border border-slate-800/50 text-slate-500">#{kw}</span>
                                ))}
                            </div>
                        </div>

                        {/* Action bar (expanded) */}
                        {selectedClip === clip.id && (
                            <div className="border-t border-slate-800/40 px-5 py-3 flex items-center gap-2 bg-surface-dark/50 animate-fade-in">
                                <button className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                                    <span className="material-icons-round text-sm">movie_edit</span>Send to Editor
                                </button>
                                <button className="flex items-center gap-1.5 bg-surface-card hover:bg-surface-hover text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-slate-700/50">
                                    <span className="material-icons-round text-sm">download</span>Export
                                </button>
                                <button className="flex items-center gap-1.5 bg-surface-card hover:bg-surface-hover text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-slate-700/50">
                                    <span className="material-icons-round text-sm">play_circle</span>Preview
                                </button>
                                <button className="flex items-center gap-1.5 bg-surface-card hover:bg-surface-hover text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border border-slate-700/50 ml-auto">
                                    <span className="material-icons-round text-sm">subtitles</span>Add Captions
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClipDetector;

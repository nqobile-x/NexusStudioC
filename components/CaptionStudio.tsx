import React, { useState } from 'react';
import { CaptionEntry, CaptionStyle } from '../types';
import { generateCaptions } from '../services/geminiService';

/** Caption style definitions with visual properties */
const CAPTION_STYLES: { id: CaptionStyle; name: string; preview: React.CSSProperties; description: string }[] = [
    { id: 'bold-impact', name: 'Bold Impact', preview: { fontWeight: 900, fontSize: '18px', color: '#fff', textShadow: '2px 2px 0 #000, -2px -2px 0 #000', textTransform: 'uppercase' as const, letterSpacing: '1px' }, description: 'Heavy, attention-grabbing text' },
    { id: 'minimal', name: 'Minimal', preview: { fontWeight: 400, fontSize: '14px', color: '#e2e8f0', background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '4px' }, description: 'Clean, understated style' },
    { id: 'neon-glow', name: 'Neon Glow', preview: { fontWeight: 700, fontSize: '16px', color: '#22d3ee', textShadow: '0 0 10px #22d3ee, 0 0 20px #22d3ee, 0 0 40px #06b6d4' }, description: 'Glowing neon effect' },
    { id: 'gradient-pop', name: 'Gradient Pop', preview: { fontWeight: 800, fontSize: '17px', background: 'linear-gradient(135deg, #f472b6, #c084fc, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }, description: 'Colorful gradient text' },
    { id: 'typewriter', name: 'Typewriter', preview: { fontFamily: 'monospace', fontSize: '14px', color: '#a3e635', background: 'rgba(0,0,0,0.8)', padding: '6px 14px', borderRadius: '2px', borderLeft: '3px solid #a3e635' }, description: 'Vintage typing effect' },
    { id: 'karaoke', name: 'Karaoke', preview: { fontWeight: 700, fontSize: '16px', color: '#fbbf24', textShadow: '1px 1px 0 #78350f', textDecoration: 'underline' as const, textDecorationColor: '#fbbf24', textUnderlineOffset: '4px' }, description: 'Word-by-word highlight' },
    { id: 'subtitle', name: 'Subtitle', preview: { fontWeight: 500, fontSize: '14px', color: '#fff', background: 'rgba(0,0,0,0.75)', padding: '4px 16px', borderRadius: '2px' }, description: 'Classic subtitle look' },
    { id: 'comic', name: 'Comic', preview: { fontWeight: 900, fontSize: '17px', color: '#fff', textShadow: '2px 2px 0 #6366f1', fontStyle: 'italic' as const, letterSpacing: '0.5px' }, description: 'Fun comic book style' },
    { id: 'elegant', name: 'Elegant', preview: { fontWeight: 300, fontSize: '15px', color: '#e2e8f0', fontStyle: 'italic' as const, letterSpacing: '3px', textTransform: 'uppercase' as const }, description: 'Sophisticated serif style' },
    { id: 'glitch', name: 'Glitch', preview: { fontWeight: 800, fontSize: '16px', color: '#ef4444', textShadow: '2px 0 #3b82f6, -2px 0 #22c55e', letterSpacing: '2px' }, description: 'Digital glitch effect' },
];

/** Demo captions */
const DEMO_CAPTIONS: CaptionEntry[] = [
    { id: 'c1', text: 'Welcome to the future of content creation', startTime: 0, endTime: 3.5, style: 'bold-impact' },
    { id: 'c2', text: "where AI meets creativity", startTime: 3.5, endTime: 6, style: 'gradient-pop' },
    { id: 'c3', text: "Let me show you something incredible", startTime: 6, endTime: 9, speaker: 'Speaker 1', style: 'neon-glow' },
    { id: 'c4', text: "This technology is changing everything", startTime: 9, endTime: 12.5, speaker: 'Speaker 1', style: 'bold-impact' },
    { id: 'c5', text: "And the best part? Anyone can do it.", startTime: 12.5, endTime: 16, speaker: 'Speaker 2', style: 'bold-impact' },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}.${Math.floor((s % 1) * 10)}`;

const CaptionStudio: React.FC = () => {
    const [captions, setCaptions] = useState<CaptionEntry[]>(DEMO_CAPTIONS);
    const [selectedStyle, setSelectedStyle] = useState<CaptionStyle>('bold-impact');
    const [selectedCaption, setSelectedCaption] = useState<string | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [fontSize, setFontSize] = useState(18);
    const [position, setPosition] = useState<'top' | 'center' | 'bottom'>('bottom');

    const currentStyle = CAPTION_STYLES.find(s => s.id === selectedStyle)!;
    const activeCaption = captions.find(c => c.id === selectedCaption);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setUploadedFile(file);
    };

    const handleTranscribe = async () => {
        if (!uploadedFile) return;
        setIsTranscribing(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const mimeType = uploadedFile.type;
                const result = await generateCaptions(base64, mimeType);
                if (result && result.length > 0) {
                    setCaptions(result.map((c: any, i: number) => ({ ...c, id: `ai_${i}`, style: selectedStyle })));
                }
                setIsTranscribing(false);
            };
            reader.readAsDataURL(uploadedFile);
        } catch {
            setIsTranscribing(false);
        }
    };

    const applyStyleToAll = () => {
        setCaptions(prev => prev.map(c => ({ ...c, style: selectedStyle })));
    };

    return (
        <div className="p-4 lg:p-8 h-full overflow-y-auto custom-scrollbar pb-24 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="material-icons-round text-primary">subtitles</span>
                        Caption Studio
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Auto-generate and style captions for your videos with AI</p>
                </div>
                <div className="flex gap-2">
                    <label className="cursor-pointer bg-surface-card hover:bg-surface-hover border border-slate-700/50 text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm font-medium">
                        <span className="material-icons-round text-base">upload_file</span>
                        {uploadedFile ? uploadedFile.name.substring(0, 15) : 'Upload'}
                        <input type="file" accept="video/*,audio/*" onChange={handleUpload} className="hidden" aria-label="Upload media for captions" />
                    </label>
                    <button onClick={handleTranscribe} disabled={!uploadedFile || isTranscribing} className="bg-gradient-to-r from-primary to-indigo-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all">
                        {isTranscribing ? <span className="material-icons-round animate-spin text-base">sync</span> : <span className="material-icons-round text-base">mic</span>}
                        {isTranscribing ? 'Transcribing...' : 'Auto-Caption'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Preview */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800/50 shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900" />
                        {/* Caption overlay */}
                        <div className={`absolute left-0 right-0 flex justify-center px-8 z-10 ${position === 'top' ? 'top-8' : position === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-8'}`}>
                            <div style={{ ...currentStyle.preview, fontSize: `${fontSize}px`, maxWidth: '90%', textAlign: 'center' as const }}>
                                {activeCaption?.text || captions[0]?.text || 'Your captions appear here'}
                            </div>
                        </div>
                        {/* Video placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            <span className="material-icons-round text-5xl text-white/20">play_circle</span>
                        </div>
                    </div>

                    {/* Position controls */}
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Position</span>
                        {(['top', 'center', 'bottom'] as const).map(p => (
                            <button key={p} onClick={() => setPosition(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${position === p ? 'bg-primary text-white' : 'bg-surface-card text-slate-400 border border-slate-800 hover:border-slate-600'}`}>{p}</button>
                        ))}
                        <div className="h-5 w-px bg-slate-800 mx-1" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Size</span>
                        <input type="range" min={12} max={32} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-20 accent-primary h-1" title="Font Size" aria-label="Font Size" />
                        <span className="text-xs text-slate-500 font-mono">{fontSize}px</span>
                    </div>

                    {/* Caption Timeline */}
                    <div className="glass-panel rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Caption List</h3>
                            <button onClick={applyStyleToAll} className="text-[10px] text-primary hover:text-primary/80 font-medium transition-colors">Apply style to all</button>
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                            {captions.map(cap => (
                                <div key={cap.id} onClick={() => setSelectedCaption(cap.id)} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${selectedCaption === cap.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-surface-hover border border-transparent'}`}>
                                    <span className="text-[10px] text-slate-600 font-mono w-16 shrink-0">{fmt(cap.startTime)}</span>
                                    <p className="text-xs text-white flex-1 truncate">{cap.text}</p>
                                    {cap.speaker && <span className="text-[9px] bg-surface-card text-slate-500 px-2 py-0.5 rounded-full border border-slate-800/50 shrink-0">{cap.speaker}</span>}
                                    <span className="text-[9px] text-primary/60 capitalize shrink-0">{cap.style.replace('-', ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Style Picker */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="glass-panel rounded-2xl p-5">
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-4">Caption Styles</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {CAPTION_STYLES.map(style => (
                                <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={`relative p-4 rounded-xl border transition-all text-left group overflow-hidden ${selectedStyle === style.id ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-slate-800/50 bg-surface-card hover:border-slate-600'}`}>
                                    <div className="h-8 flex items-center mb-2">
                                        <span style={style.preview} className="text-xs leading-tight">Aa</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-white">{style.name}</p>
                                    <p className="text-[9px] text-slate-500 mt-0.5">{style.description}</p>
                                    {selectedStyle === style.id && <div className="absolute top-2 right-2"><span className="material-icons-round text-primary text-sm">check_circle</span></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Edit Selected Caption */}
                    {activeCaption && (
                        <div className="glass-panel rounded-2xl p-5 animate-fade-in">
                            <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">Edit Caption</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-slate-500 block mb-1">Text</label>
                                    <textarea value={activeCaption.text} onChange={e => setCaptions(prev => prev.map(c => c.id === activeCaption.id ? { ...c, text: e.target.value } : c))} className="w-full bg-surface-card border border-slate-700/50 rounded-lg p-2 text-white text-sm outline-none focus:border-primary" rows={2} title="Caption Text" aria-label="Caption Text" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-500 block mb-1">Start</label>
                                        <input type="number" step={0.1} value={activeCaption.startTime} onChange={e => setCaptions(prev => prev.map(c => c.id === activeCaption.id ? { ...c, startTime: Number(e.target.value) } : c))} className="w-full bg-surface-card border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-primary" title="Start Time" aria-label="Start Time" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 block mb-1">End</label>
                                        <input type="number" step={0.1} value={activeCaption.endTime} onChange={e => setCaptions(prev => prev.map(c => c.id === activeCaption.id ? { ...c, endTime: Number(e.target.value) } : c))} className="w-full bg-surface-card border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-primary" title="End Time" aria-label="End Time" />
                                    </div>
                                </div>
                                <button onClick={() => setCaptions(prev => prev.filter(c => c.id !== activeCaption.id))} className="w-full py-2 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-all flex items-center justify-center gap-1">
                                    <span className="material-icons-round text-sm">delete</span>Delete Caption
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CaptionStudio;

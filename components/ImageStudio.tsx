import React, { useState } from 'react';
import { generateProImage, editImageFlash } from '../services/geminiService';

const ImageStudio: React.FC = () => {
    const [mode, setMode] = useState<'generate' | 'edit'>('generate');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    
    // Generate Config
    const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    
    // Edit Config
    const [uploadImage, setUploadImage] = useState<string | null>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setUploadImage(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAction = async () => {
        setIsLoading(true);
        setResultImage(null);
        try {
            if (mode === 'generate') {
                const img = await generateProImage(prompt, size, aspectRatio);
                setResultImage(img);
            } else {
                if (!uploadImage) return;
                const base64Data = uploadImage.split(',')[1];
                const mimeType = uploadImage.substring(uploadImage.indexOf(':') + 1, uploadImage.indexOf(';'));
                const img = await editImageFlash(prompt, base64Data, mimeType);
                setResultImage(img);
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 lg:p-8 h-full flex flex-col overflow-y-auto lg:overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8 border-b border-slate-800 pb-4 shrink-0">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="material-icons-round text-primary">auto_fix_high</span>
                    Image Lab
                </h2>
                <div className="flex bg-surface-card rounded-lg p-1 border border-slate-700/50 w-full sm:w-auto">
                    <button 
                        onClick={() => setMode('generate')}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${mode === 'generate' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Generate (Pro)
                    </button>
                    <button 
                        onClick={() => setMode('edit')}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${mode === 'edit' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Edit (Flash)
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 min-h-0">
                {/* Controls - scrollable on desktop */}
                <div className="space-y-6 lg:overflow-y-auto lg:pr-2 custom-scrollbar pb-10">
                    <div className="glass-panel p-5 rounded-2xl">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Prompt</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={mode === 'generate' ? "A futuristic city on Mars..." : "Add a retro filter, remove background..."}
                            className="w-full bg-surface-card border border-slate-700/50 rounded-xl p-3 text-white focus:ring-2 focus:ring-primary outline-none"
                            rows={4}
                        />
                    </div>

                    {mode === 'generate' && (
                        <div className="glass-panel p-5 rounded-2xl space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3">Image Size</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['1K', '2K', '4K'].map((s) => (
                                        <button 
                                            key={s}
                                            onClick={() => setSize(s as any)}
                                            className={`py-2 rounded-lg border text-sm transition-all ${size === s ? 'border-primary bg-primary/20 text-white' : 'border-slate-700/50 bg-surface-card text-slate-400 hover:bg-surface-hover'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3">Aspect Ratio</label>
                                <select 
                                    value={aspectRatio}
                                    onChange={(e) => setAspectRatio(e.target.value)}
                                    className="w-full bg-surface-card border border-slate-700/50 rounded-lg p-3 text-white outline-none focus:border-primary transition-colors"
                                >
                                    <option value="1:1">Square (1:1)</option>
                                    <option value="3:4">Portrait (3:4)</option>
                                    <option value="4:3">Landscape (4:3)</option>
                                    <option value="9:16">Mobile (9:16)</option>
                                    <option value="16:9">Widescreen (16:9)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {mode === 'edit' && (
                        <div className="glass-panel p-5 rounded-2xl">
                            <label className="block text-sm font-medium text-slate-400 mb-3">Source Image</label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-surface-card hover:bg-surface-hover transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <span className="material-icons-round text-slate-400 mb-2">cloud_upload</span>
                                    <p className="text-sm text-slate-500">Click to upload image</p>
                                </div>
                                <input type="file" onChange={handleUpload} className="hidden" />
                            </label>
                            {uploadImage && <img src={uploadImage} alt="Source" className="mt-4 rounded-lg max-h-40 w-full object-cover border border-slate-700" />}
                        </div>
                    )}

                    <button 
                        onClick={handleAction}
                        disabled={isLoading || !prompt || (mode === 'edit' && !uploadImage)}
                        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {isLoading ? <span className="material-icons-round animate-spin">sync</span> : <span className="material-icons-round">bolt</span>}
                        {mode === 'generate' ? 'Generate Image' : 'Edit Image'}
                    </button>
                </div>

                {/* Result - fills remaining space */}
                <div className="lg:col-span-2 glass-panel rounded-2xl flex items-center justify-center bg-black/40 relative min-h-[350px] lg:h-auto overflow-hidden">
                    {resultImage ? (
                        <img src={resultImage} alt="Result" className="w-full h-full object-contain p-4" />
                    ) : (
                        <div className="text-center text-slate-600">
                             <div className="w-24 h-24 rounded-full bg-surface-card border border-slate-800 flex items-center justify-center mx-auto mb-4 animate-pulse">
                                 <span className="material-icons-round text-5xl opacity-30">image_search</span>
                             </div>
                             <p>Your masterpiece will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageStudio;

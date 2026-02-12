import React, { useState } from 'react';
import { generateVeoVideo } from '../services/geminiService';

const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // strip prefix
                const base64Data = base64.split(',')[1];
                setUploadedImage(base64Data);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setVideoUrl(null);
        try {
            const url = await generateVeoVideo(prompt, aspectRatio, uploadedImage || undefined);
            setVideoUrl(url);
        } catch (err: any) {
            setError(err.message || 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-24">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 animate-fade-in">
                <span className="material-icons-round text-primary">movie_filter</span>
                Veo Video Generator
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-6 animate-fade-in">
                    <div className="glass-panel p-5 lg:p-6 rounded-2xl">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Prompt</label>
                        <textarea 
                            className="w-full bg-surface-card border border-slate-700/50 rounded-xl p-4 text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-600"
                            rows={4}
                            placeholder="Describe your video in detail..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    <div className="glass-panel p-5 lg:p-6 rounded-2xl">
                        <label className="block text-sm font-medium text-slate-400 mb-3">Reference Image (Optional)</label>
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <label className="cursor-pointer bg-surface-card hover:bg-surface-hover border border-slate-700/50 hover:border-primary/50 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium">
                                <span className="material-icons-round text-base">upload_file</span>
                                Choose File
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </label>
                            {uploadedImage && <span className="text-xs text-green-400 flex items-center gap-1"><span className="material-icons-round text-sm">check_circle</span> Image Loaded</span>}
                        </div>
                         {uploadedImage && (
                            <div className="mt-4 relative group w-fit">
                                <img src={`data:image/png;base64,${uploadedImage}`} alt="Preview" className="h-24 rounded-lg border border-slate-700/50 shadow-md" />
                                <button onClick={() => setUploadedImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="material-icons-round text-sm">close</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="glass-panel p-5 lg:p-6 rounded-2xl">
                        <label className="block text-sm font-medium text-slate-400 mb-3">Aspect Ratio</label>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setAspectRatio('16:9')}
                                className={`flex-1 px-4 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${aspectRatio === '16:9' ? 'border-primary bg-primary/10 text-primary shadow-inner' : 'border-slate-700/50 bg-surface-card text-slate-500 hover:text-white'}`}
                            >
                                <span className="material-icons-round text-lg">crop_landscape</span>
                                Landscape (16:9)
                            </button>
                            <button 
                                onClick={() => setAspectRatio('9:16')}
                                className={`flex-1 px-4 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${aspectRatio === '9:16' ? 'border-primary bg-primary/10 text-primary shadow-inner' : 'border-slate-700/50 bg-surface-card text-slate-500 hover:text-white'}`}
                            >
                                <span className="material-icons-round text-lg">crop_portrait</span>
                                Portrait (9:16)
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt}
                        className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                    >
                        {isGenerating ? (
                            <>
                                <span className="material-icons-round animate-spin">sync</span>
                                Generating Video...
                            </>
                        ) : (
                            <>
                                <span className="material-icons-round">play_arrow</span>
                                Generate
                            </>
                        )}
                    </button>
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2"><span className="material-icons-round text-sm">error</span>{error}</div>}
                </div>

                <div className="glass-panel rounded-2xl p-2 flex items-center justify-center min-h-[300px] lg:min-h-[500px] bg-black/40 animate-fade-in" style={{animationDelay: '100ms'}}>
                    {videoUrl ? (
                         <video controls autoPlay loop className="w-full h-full rounded-xl object-contain max-h-[600px]">
                             <source src={videoUrl} type="video/mp4" />
                             Your browser does not support the video tag.
                         </video>
                    ) : (
                        <div className="text-center text-slate-600">
                            <div className="w-20 h-20 rounded-full bg-surface-card border border-slate-800 flex items-center justify-center mx-auto mb-4">
                                <span className="material-icons-round text-4xl opacity-50">movie</span>
                            </div>
                            <p className="text-sm">Video preview will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoGenerator;

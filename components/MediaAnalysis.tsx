import React, { useState } from 'react';
import { analyzeMedia, transcribeAudio, generateSpeech } from '../services/geminiService';

const MediaAnalysis: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'analyze' | 'transcribe' | 'tts'>('analyze');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [textInput, setTextInput] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const processAction = async () => {
        setLoading(true);
        setResult(null);
        try {
            if (activeTab === 'analyze' && preview && textInput) {
                const base64 = preview.split(',')[1];
                const mime = preview.substring(preview.indexOf(':') + 1, preview.indexOf(';'));
                const res = await analyzeMedia(textInput, base64, mime);
                setResult(res || 'No analysis returned');
            } else if (activeTab === 'transcribe' && preview) {
                 const base64 = preview.split(',')[1];
                 const mime = preview.substring(preview.indexOf(':') + 1, preview.indexOf(';'));
                 const res = await transcribeAudio(base64, mime);
                 setResult(res || 'No transcription returned');
            } else if (activeTab === 'tts' && textInput) {
                const audioBase64 = await generateSpeech(textInput);
                const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
                audio.play();
                setResult("Audio playing...");
            }
        } catch (err: any) {
            setResult(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
             <div className="flex bg-surface-dark rounded-xl p-1 border border-slate-700 w-fit">
                {['analyze', 'transcribe', 'tts'].map(t => (
                    <button 
                        key={t}
                        onClick={() => { setActiveTab(t as any); setFile(null); setPreview(null); setResult(null); }}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="glass-panel p-8 rounded-xl min-h-[400px]">
                {activeTab === 'analyze' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Media Analysis</h3>
                        <p className="text-slate-400 text-sm">Upload an image or video and ask questions about it.</p>
                        <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                        {preview && (
                            file?.type.startsWith('video') 
                            ? <video src={preview} controls className="max-h-64 rounded-lg border border-slate-700" />
                            : <img src={preview} className="max-h-64 rounded-lg border border-slate-700" />
                        )}
                        <textarea value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="What's happening in this media?" className="w-full bg-surface-dark border border-slate-700 rounded-lg p-3 text-white outline-none" rows={2} />
                    </div>
                )}

                {activeTab === 'transcribe' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">Audio Transcription</h3>
                        <input type="file" accept="audio/*" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                        {preview && <audio src={preview} controls className="w-full" />}
                    </div>
                )}

                {activeTab === 'tts' && (
                    <div className="space-y-4">
                         <h3 className="text-xl font-bold text-white">Text to Speech</h3>
                         <textarea value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Enter text to speak..." className="w-full bg-surface-dark border border-slate-700 rounded-lg p-3 text-white outline-none" rows={4} />
                    </div>
                )}

                <div className="mt-8">
                     <button onClick={processAction} disabled={loading} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
                        {loading && <span className="material-icons-round animate-spin">sync</span>}
                        Process
                     </button>
                </div>

                {result && (
                    <div className="mt-8 p-4 bg-surface-dark rounded-lg border border-slate-700">
                        <h4 className="text-sm font-bold text-slate-400 mb-2 uppercase">Result</h4>
                        <p className="text-white whitespace-pre-wrap">{result}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaAnalysis;

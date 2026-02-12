import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { getLiveModel, createPcmBlob } from '../services/geminiService';

const LiveSession: React.FC = () => {
    const [connected, setConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Refs for cleanup
    const sessionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const intervalRef = useRef<number | null>(null);

    const startSession = async () => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const model = getLiveModel();

            // Audio Setup
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = outputCtx;
            
            let nextStartTime = 0;
            const sources = new Set<AudioBufferSourceNode>();
            const outputNode = outputCtx.createGain();
            outputNode.connect(outputCtx.destination);

            // Get Media Stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Connect Live
            const sessionPromise = ai.live.connect({
                model,
                callbacks: {
                    onopen: () => {
                        console.log("Live Session Open");
                        setConnected(true);

                        // Audio Input Processing
                        const source = inputCtx.createMediaStreamSource(stream);
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (e) => {
                            if (isMuted) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);

                        // Video Frame Processing
                        intervalRef.current = window.setInterval(() => {
                            if (canvasRef.current && videoRef.current) {
                                const ctx = canvasRef.current.getContext('2d');
                                if (ctx) {
                                    canvasRef.current.width = videoRef.current.videoWidth;
                                    canvasRef.current.height = videoRef.current.videoHeight;
                                    ctx.drawImage(videoRef.current, 0, 0);
                                    
                                    const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                                    sessionPromise.then(session => {
                                        session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                                    });
                                }
                            }
                        }, 1000); // 1 FPS for video to save bandwidth
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            nextStartTime = Math.max(nextStartTime, outputCtx.currentTime);
                            
                            // Manual Decode (simplified for this context, ideally use provided example's full decode)
                            // Re-implementing simplified decode for brevity as full implementation is long
                            const binary = atob(audioData);
                            const len = binary.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
                            
                            const dataInt16 = new Int16Array(bytes.buffer);
                            const buffer = outputCtx.createBuffer(1, dataInt16.length, 24000);
                            const channelData = buffer.getChannelData(0);
                            for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

                            const source = outputCtx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(outputNode);
                            source.addEventListener('ended', () => sources.delete(source));
                            source.start(nextStartTime);
                            nextStartTime += buffer.duration;
                            sources.add(source);
                        }
                    },
                    onclose: () => {
                        setConnected(false);
                    },
                    onerror: (e) => {
                        console.error(e);
                        setConnected(false);
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                         voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' }}
                    }
                }
            });

            sessionRef.current = sessionPromise;

        } catch (err) {
            console.error("Failed to start live session", err);
        }
    };

    const stopSession = () => {
        if (sessionRef.current) {
            sessionRef.current.then((s: any) => s.close());
        }
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (inputAudioContextRef.current) inputAudioContextRef.current.close();
        if (outputAudioContextRef.current) outputAudioContextRef.current.close();
        if (intervalRef.current) clearInterval(intervalRef.current);
        setConnected(false);
    };

    useEffect(() => {
        return () => stopSession();
    }, []);

    return (
        <div className="p-4 lg:p-8 h-full flex flex-col items-center justify-center">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800/50">
                <video ref={videoRef} className="w-full h-full object-cover opacity-80" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Overlay UI */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-t from-black/80 via-transparent to-black/20">
                    {!connected ? (
                        <div className="text-center p-6">
                            <h2 className="text-2xl lg:text-4xl font-bold text-white mb-4 drop-shadow-md">Gemini Live</h2>
                            <p className="text-slate-300 mb-8 max-w-md mx-auto text-sm lg:text-base">Real-time multimodal conversation. Speak naturally and show things to the camera.</p>
                            <button 
                                onClick={startSession}
                                className="bg-white text-black hover:bg-slate-200 text-base lg:text-lg font-bold py-3 px-8 lg:py-4 lg:px-12 rounded-full transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-3 mx-auto"
                            >
                                <span className="material-icons-round">mic</span>
                                Start Conversation
                            </button>
                        </div>
                    ) : (
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 lg:gap-6">
                            <button onClick={() => setIsMuted(!isMuted)} className={`p-4 lg:p-5 rounded-full ${isMuted ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/10 hover:bg-white/20 border border-white/20'} text-white backdrop-blur-md transition-all`}>
                                <span className="material-icons-round text-2xl">{isMuted ? 'mic_off' : 'mic'}</span>
                            </button>
                            <button onClick={stopSession} className="p-4 lg:p-5 rounded-full bg-red-600 hover:bg-red-700 text-white backdrop-blur-md shadow-lg transition-all">
                                <span className="material-icons-round text-2xl">call_end</span>
                            </button>
                        </div>
                    )}
                </div>
                
                {connected && (
                    <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]"></span>
                        <span className="text-xs font-mono text-white uppercase tracking-widest">Live</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveSession;

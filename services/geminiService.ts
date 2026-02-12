import { GoogleGenAI, Type, Modality, FunctionDeclaration, GenerateContentResponse } from "@google/genai";

// Helper to check and request API key for paid features
export const ensureApiKey = async (): Promise<void> => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
             await window.aistudio.openSelectKey();
        }
    }
};

const getClient = (forceNew = false) => {
    // We create a new client to pick up potentially newly selected keys
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Video Generation (Veo) ---
export const generateVeoVideo = async (
    prompt: string, 
    aspectRatio: '16:9' | '9:16' = '16:9',
    imageBytes?: string
) => {
    await ensureApiKey(); // Mandatory for Veo
    const ai = getClient(true);
    
    let operation;
    const config = {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: aspectRatio
    };

    if (imageBytes) {
         operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt, // Prompt is optional when image is present but good practice
            image: {
                imageBytes: imageBytes,
                mimeType: 'image/png' // Assuming PNG, but could be dynamic
            },
            config: config
        });
    } else {
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: config
        });
    }

    // Polling
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
    }

    if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        return `${operation.response.generatedVideos[0].video.uri}&key=${process.env.API_KEY}`;
    }
    throw new Error("Video generation failed or no URI returned.");
};

// --- Image Generation (Pro) ---
export const generateProImage = async (prompt: string, size: '1K' | '2K' | '4K', aspectRatio: string) => {
    await ensureApiKey(); // Mandatory for Pro Image
    const ai = getClient(true);
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio,
                imageSize: size
            }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
             return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated.");
};

// --- Image Editing (Flash) ---
export const editImageFlash = async (prompt: string, imageBase64: string, mimeType: string) => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType
                    }
                },
                { text: prompt }
            ]
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
             return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No edited image generated.");
};

// --- Chat (Pro & Search & Thinking) ---
export const sendChatMessage = async (
    message: string, 
    history: any[], 
    mode: 'normal' | 'search' | 'thinking'
) => {
    const ai = getClient();
    
    let model = 'gemini-3-pro-preview';
    let tools = undefined;
    let thinkingConfig = undefined;

    if (mode === 'search') {
        model = 'gemini-3-flash-preview'; // Flash is often preferred for Search grounding unless user needs deep reasoning
        tools = [{ googleSearch: {} }];
    } else if (mode === 'thinking') {
        model = 'gemini-3-pro-preview';
        thinkingConfig = { thinkingBudget: 32768 };
    }

    const chat = ai.chats.create({
        model: model,
        history: history,
        config: {
            tools: tools,
            thinkingConfig: thinkingConfig
        }
    });

    const response = await chat.sendMessage({ message });
    return response;
};

// --- Analysis (Vision/Audio) ---
export const analyzeMedia = async (prompt: string, mediaBase64: string, mimeType: string) => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Good for video/image understanding
        contents: {
            parts: [
                {
                    inlineData: {
                        data: mediaBase64,
                        mimeType: mimeType
                    }
                },
                { text: prompt }
            ]
        }
    });
    return response.text;
};

// --- Transcription ---
export const transcribeAudio = async (audioBase64: string, mimeType: string) => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: audioBase64,
                        mimeType: mimeType
                    }
                },
                { text: "Transcribe this audio." }
            ]
        }
    });
    return response.text;
};

// --- Text to Speech ---
export const generateSpeech = async (text: string) => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
        return base64Audio;
    }
    throw new Error("No audio generated");
};

// --- Helpers for Live API (Used in Component) ---
export const getLiveModel = () => 'gemini-2.5-flash-native-audio-preview-12-2025';

export const createPcmBlob = (data: Float32Array): { data: string, mimeType: string } => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    
    // Manual base64 encoding for Uint8Array
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    
    return {
        data: btoa(binary),
        mimeType: 'audio/pcm;rate=16000',
    };
};

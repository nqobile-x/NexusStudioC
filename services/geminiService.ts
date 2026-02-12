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
        operation = await ai.operations.getVideosOperation({ operation: operation });
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

/**
 * Detect viral-worthy clips from a video using Gemini AI.
 * Returns an array of ViralClip objects with virality scores and metadata.
 */
export const detectViralClips = async (videoBase64: string, mimeType: string) => {
    await ensureApiKey();
    const ai = getClient();
    const prompt = `Analyze this video and identify the most viral-worthy clips/segments. For each clip, return a JSON array with objects containing:
- title: catchy title for the clip
- startTime: start time in seconds
- endTime: end time in seconds
- viralityScore: 1-100 score based on shareability, emotional impact, and hook strength
- emotion: one of "humorous", "inspiring", "controversial", "educational", "dramatic"
- platforms: array of best platforms from ["tiktok", "reels", "shorts", "youtube", "facebook"]
- summary: 1-2 sentence description of why this moment is compelling
- keywords: array of 3-5 relevant keywords
- hookType: type of hook used (e.g. "Emotional Hook", "Question Hook", "Controversial Statement")
- narrativeComplete: boolean, whether the clip tells a complete story

Return ONLY a valid JSON array, no other text.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{
            role: 'user',
            parts: [
                { inlineData: { data: videoBase64, mimeType } },
                { text: prompt }
            ]
        }]
    });
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        return [];
    }
};

/**
 * Auto-generate captions/transcription from video or audio using Gemini AI.
 * Returns an array of CaptionEntry-like objects with text and timestamps.
 */
export const generateCaptions = async (mediaBase64: string, mimeType: string) => {
    await ensureApiKey();
    const ai = getClient();
    const prompt = `Transcribe this media with precise timestamps. Return a JSON array of caption segments, each with:
- text: the transcribed text for this segment (keep segments short, 5-12 words max)
- startTime: start time in seconds (decimal)
- endTime: end time in seconds (decimal)
- speaker: speaker label if multiple speakers detected (e.g. "Speaker 1"), or null

Return ONLY a valid JSON array, no other text.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{
            role: 'user',
            parts: [
                { inlineData: { data: mediaBase64, mimeType } },
                { text: prompt }
            ]
        }]
    });
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        return [];
    }
};

/**
 * Get AI edit suggestions for a video timeline.
 * Analyzes clip layout and returns actionable editing tips.
 */
export const getEditSuggestions = async (
    clips: Array<{ name: string; track: string; startTime: number; duration: number }>,
    totalDuration: number
): Promise<Array<{ icon: string; text: string; type: string }>> => {
    await ensureApiKey();
    const ai = getClient();
    const clipSummary = clips.map(c => `${c.name} (${c.track}) at ${c.startTime}s for ${c.duration}s`).join('\n');
    const prompt = `You are a professional video editor AI. Analyze this timeline and suggest 5 improvements.

Timeline (total ${totalDuration}s):
${clipSummary}

Return JSON array with objects: { "icon": "material_icon_name", "text": "suggestion", "type": "category" }
Categories: Transition, Audio, Engagement, Captions, Pacing.
Icons should be valid Material Icons names.`;

    const res = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
    });
    const text = typeof res.text === 'string' ? res.text : '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        return [
            { icon: 'swap_horiz', text: 'Add transitions between clips for smoother flow', type: 'Transition' },
            { icon: 'volume_up', text: 'Normalize audio levels across all clips', type: 'Audio' },
            { icon: 'trending_up', text: 'Move your hook to the first 3 seconds', type: 'Engagement' },
            { icon: 'subtitles', text: 'Add captions for accessibility and engagement', type: 'Captions' },
            { icon: 'speed', text: 'Speed up slow sections to maintain viewer attention', type: 'Pacing' },
        ];
    }
};


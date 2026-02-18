import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

/**
 * FFmpegService — Handling real video export via WebAssembly.
 * Uses @ffmpeg/ffmpeg 0.12.x loaded from CDN to avoid large bundle size.
 */

export class FFmpegService {
    private ffmpeg: FFmpeg;
    private loaded = false;

    constructor() {
        this.ffmpeg = new FFmpeg();
    }

    /**
     * Load FFmpeg.wasm from CDN.
     * This is a heavy operation (~25MB), so only call when needed.
     */
    async load(onProgress?: (pct: number) => void) {
        if (this.loaded) return;

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

        this.ffmpeg.on('progress', ({ progress, time }) => {
            if (onProgress) onProgress(Math.round(progress * 100));
        });

        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        this.loaded = true;
    }

    /**
     * Export video by concatenating clips and applying trims/effects.
     */
    async exportVideo(
        clips: Array<{ id: string; file: File; startTime: number; duration: number; removeWatermark?: boolean }>,
        onProgress?: (stage: string, pct: number) => void
    ): Promise<Blob> {
        if (!this.loaded) await this.load(p => onProgress?.('Loading Engine', p));

        const { ffmpeg } = this;
        const inputFiles: string[] = [];

        onProgress?.('Preparing Files', 0);

        // 1. Write files to memory & Transcode
        for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const name = `clip_${i}.mp4`;
            const data = await fetchFile(clip.file);
            await ffmpeg.writeFile(name, data);

            const trimmedName = `trim_${i}.mp4`;
            const duration = clip.duration.toFixed(2);

            // Build filter complex
            // Basic scale to 720p + standard fps
            let filters = 'scale=1280:720,setsar=1:1,fps=30';

            // Add delogo if requested
            if (clip.removeWatermark) {
                // "Simple" delogo for common corners (TikTok/Reels usually bottom-right or top-left)
                // Opus Clip often uses Top-Right.
                // We'll apply delogo to Top-Left, Top-Right, and Bottom-Right to be safe.
                // 1280x720
                // Top-Left: x=20:y=20:w=220:h=90
                // Top-Right: x=1040:y=20:w=220:h=90
                // Bottom-Right: x=1040:y=610:w=220:h=90
                filters += `,delogo=x=20:y=20:w=220:h=90,delogo=x=1040:y=20:w=220:h=90,delogo=x=1040:y=610:w=220:h=90`;
            }

            onProgress?.(`Processing Clip ${i + 1}/${clips.length}`, 10 + (i / clips.length) * 40);

            // Transcode 
            await ffmpeg.exec([
                '-i', name,
                '-ss', clip.startTime.toFixed(2),
                '-t', duration,
                '-vf', filters,
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-c:a', 'aac',
                '-ar', '44100',
                '-ac', '2',
                trimmedName
            ]);

            inputFiles.push(trimmedName);
            await ffmpeg.deleteFile(name);
        }

        onProgress?.('Merging Clips', 60);

        // 2. Concatenate
        const listName = 'list.txt';
        const fileList = inputFiles.map(f => `file '${f}'`).join('\n');
        await ffmpeg.writeFile(listName, fileList);

        const outputName = 'output.mp4';
        await ffmpeg.exec([
            '-f', 'concat',
            '-safe', '0',
            '-i', listName,
            '-c', 'copy',
            outputName
        ]);

        onProgress?.('Finalizing', 90);

        // 3. Read result
        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data as any], { type: 'video/mp4' });

        // Cleanup
        for (const f of inputFiles) await ffmpeg.deleteFile(f);
        await ffmpeg.deleteFile(listName);
        await ffmpeg.deleteFile(outputName);

        onProgress?.('Done', 100);
        return blob;
    }
}

export const ffmpegService = new FFmpegService();

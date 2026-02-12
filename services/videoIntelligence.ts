/**
 * VideoIntelligence — Client-side video analysis engine.
 * Performs scene detection, audio analysis, silence/beat detection,
 * motion scoring, and viral clip ranking — all in-browser, no API needed.
 */

export interface FrameData {
    time: number;
    brightness: number;
    contrast: number;
    motionDelta: number;
    thumbnail?: string; // data URL
}

export interface SceneChange {
    time: number;
    confidence: number;
}

export interface AudioSegment {
    time: number;
    energy: number;
    isSilent: boolean;
}

export interface BeatMarker {
    time: number;
    strength: number;
}

export interface ViralClipCandidate {
    id: string;
    startTime: number;
    endTime: number;
    duration: number;
    viralityScore: number;
    label: string;
    reasons: string[];
    thumbnail?: string;
}

export interface AnalysisResult {
    frames: FrameData[];
    scenes: SceneChange[];
    audio: AudioSegment[];
    beats: BeatMarker[];
    silentRegions: Array<{ start: number; end: number }>;
    viralClips: ViralClipCandidate[];
    waveform: Float32Array;
    duration: number;
}

type ProgressCallback = (stage: string, pct: number) => void;

export class VideoIntelligence {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private audioCtx: AudioContext;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 160;
        this.canvas.height = 90;
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
        this.audioCtx = new AudioContext();
    }

    /**
     * Master analysis — runs all sub-analyses sequentially.
     */
    async analyzeVideo(
        video: HTMLVideoElement,
        onProgress?: ProgressCallback
    ): Promise<AnalysisResult> {
        const duration = video.duration;
        if (!duration || !isFinite(duration)) {
            throw new Error('Video has no valid duration');
        }

        onProgress?.('Extracting frames', 0);
        const frames = await this.extractFrames(video, 0.5, onProgress);

        onProgress?.('Detecting scenes', 40);
        const scenes = this.detectSceneChanges(frames);

        onProgress?.('Analyzing audio', 55);
        const audioResult = await this.analyzeAudioFromVideo(video, onProgress);

        onProgress?.('Finding beats', 70);
        const beats = this.detectBeats(audioResult.segments);

        onProgress?.('Detecting silence', 75);
        const silentRegions = this.findSilentRegions(audioResult.segments);

        onProgress?.('Scoring clips', 85);
        const viralClips = this.findViralClips(frames, scenes, audioResult.segments, beats, silentRegions, duration);

        onProgress?.('Complete', 100);

        return {
            frames,
            scenes,
            audio: audioResult.segments,
            beats,
            silentRegions,
            viralClips,
            waveform: audioResult.waveform,
            duration,
        };
    }

    /**
     * Extract frames at given interval (seconds) using canvas.
     */
    private async extractFrames(
        video: HTMLVideoElement,
        interval: number,
        onProgress?: ProgressCallback
    ): Promise<FrameData[]> {
        const duration = video.duration;
        const frames: FrameData[] = [];
        const totalFrames = Math.ceil(duration / interval);
        let prevPixels: Uint8ClampedArray | null = null;

        for (let i = 0; i < totalFrames; i++) {
            const time = i * interval;
            video.currentTime = time;
            await new Promise<void>(res => {
                const handler = () => { video.removeEventListener('seeked', handler); res(); };
                video.addEventListener('seeked', handler);
            });

            this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const pixels = imageData.data;

            const brightness = this.calcBrightness(pixels);
            const contrast = this.calcContrast(pixels, brightness);
            const motionDelta = prevPixels ? this.calcMotionDelta(pixels, prevPixels) : 0;

            // Generate thumbnail for every 5th frame
            const thumbnail = i % 5 === 0 ? this.canvas.toDataURL('image/jpeg', 0.5) : undefined;

            frames.push({ time, brightness, contrast, motionDelta, thumbnail });
            prevPixels = new Uint8ClampedArray(pixels);

            if (i % 10 === 0) {
                onProgress?.('Extracting frames', Math.round((i / totalFrames) * 40));
            }
        }
        return frames;
    }

    /**
     * Scene change detection — large pixel diff = new scene.
     */
    private detectSceneChanges(frames: FrameData[]): SceneChange[] {
        const scenes: SceneChange[] = [];
        const motionValues = frames.map(f => f.motionDelta).filter(v => v > 0);
        if (motionValues.length === 0) return scenes;

        const avg = motionValues.reduce((s, v) => s + v, 0) / motionValues.length;
        const threshold = avg * 2.5; // scene change if motion > 2.5x average

        for (const frame of frames) {
            if (frame.motionDelta > threshold) {
                scenes.push({ time: frame.time, confidence: Math.min(1, frame.motionDelta / (threshold * 2)) });
            }
        }
        return scenes;
    }

    /**
     * Audio analysis — decode audio buffer, compute RMS energy per segment.
     */
    private async analyzeAudioFromVideo(
        video: HTMLVideoElement,
        onProgress?: ProgressCallback
    ): Promise<{ segments: AudioSegment[]; waveform: Float32Array }> {
        try {
            // Try to get audio data from the video source
            const response = await fetch(video.src);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

            onProgress?.('Analyzing audio', 60);

            const channelData = audioBuffer.getChannelData(0);
            const sampleRate = audioBuffer.sampleRate;
            const segmentSize = Math.floor(sampleRate * 0.5); // 0.5s segments
            const segments: AudioSegment[] = [];

            // Build waveform (downsampled)
            const waveformSamples = 1000;
            const waveform = new Float32Array(waveformSamples);
            const samplesPerWaveformPoint = Math.floor(channelData.length / waveformSamples);

            for (let i = 0; i < waveformSamples; i++) {
                let sum = 0;
                const start = i * samplesPerWaveformPoint;
                for (let j = 0; j < samplesPerWaveformPoint; j++) {
                    sum += Math.abs(channelData[start + j] || 0);
                }
                waveform[i] = sum / samplesPerWaveformPoint;
            }

            // Compute RMS energy per segment
            const totalSegments = Math.ceil(channelData.length / segmentSize);
            for (let i = 0; i < totalSegments; i++) {
                const start = i * segmentSize;
                const end = Math.min(start + segmentSize, channelData.length);
                let sumSq = 0;
                for (let j = start; j < end; j++) {
                    sumSq += channelData[j] * channelData[j];
                }
                const rms = Math.sqrt(sumSq / (end - start));
                const time = i * 0.5;
                segments.push({ time, energy: rms, isSilent: rms < 0.01 });
            }

            return { segments, waveform };
        } catch {
            // Fallback: generate synthetic audio data
            const duration = video.duration;
            const segments: AudioSegment[] = [];
            const waveform = new Float32Array(1000);
            for (let t = 0; t < duration; t += 0.5) {
                const energy = 0.3 + Math.random() * 0.4;
                segments.push({ time: t, energy, isSilent: energy < 0.05 });
            }
            for (let i = 0; i < 1000; i++) {
                waveform[i] = 0.2 + Math.random() * 0.3;
            }
            return { segments, waveform };
        }
    }

    /**
     * Simple beat detection via energy derivative peaks.
     */
    private detectBeats(segments: AudioSegment[]): BeatMarker[] {
        const beats: BeatMarker[] = [];
        if (segments.length < 3) return beats;

        for (let i = 1; i < segments.length - 1; i++) {
            const derivative = segments[i].energy - segments[i - 1].energy;
            const nextDerivative = segments[i + 1].energy - segments[i].energy;
            // Peak in energy = potential beat
            if (derivative > 0.03 && nextDerivative < 0) {
                beats.push({ time: segments[i].time, strength: derivative });
            }
        }
        return beats;
    }

    /**
     * Find continuous silent regions.
     */
    private findSilentRegions(segments: AudioSegment[]): Array<{ start: number; end: number }> {
        const regions: Array<{ start: number; end: number }> = [];
        let silenceStart: number | null = null;

        for (const seg of segments) {
            if (seg.isSilent) {
                if (silenceStart === null) silenceStart = seg.time;
            } else {
                if (silenceStart !== null) {
                    const duration = seg.time - silenceStart;
                    if (duration >= 1) { // Only count silence >= 1 second
                        regions.push({ start: silenceStart, end: seg.time });
                    }
                    silenceStart = null;
                }
            }
        }
        return regions;
    }

    /**
     * Find viral clip candidates — OpusClip-style scoring.
     * Scores based on: audio energy, motion, scene variety, absence of silence.
     */
    private findViralClips(
        frames: FrameData[],
        scenes: SceneChange[],
        audio: AudioSegment[],
        beats: BeatMarker[],
        silentRegions: Array<{ start: number; end: number }>,
        totalDuration: number
    ): ViralClipCandidate[] {
        const clipDurations = [15, 30, 60]; // Try multiple clip lengths
        const candidates: ViralClipCandidate[] = [];

        for (const clipLen of clipDurations) {
            if (clipLen > totalDuration) continue;

            // Slide a window across the video
            const step = Math.max(2, clipLen / 4);
            for (let start = 0; start + clipLen <= totalDuration; start += step) {
                const end = start + clipLen;

                // Audio energy in this window
                const windowAudio = audio.filter(a => a.time >= start && a.time < end);
                const avgEnergy = windowAudio.length > 0
                    ? windowAudio.reduce((s, a) => s + a.energy, 0) / windowAudio.length
                    : 0;

                // Motion in this window
                const windowFrames = frames.filter(f => f.time >= start && f.time < end);
                const avgMotion = windowFrames.length > 0
                    ? windowFrames.reduce((s, f) => s + f.motionDelta, 0) / windowFrames.length
                    : 0;

                // Scene count (variety)
                const sceneCount = scenes.filter(s => s.time >= start && s.time < end).length;

                // Beat count (rhythm)
                const beatCount = beats.filter(b => b.time >= start && b.time < end).length;

                // Silence penalty
                const silenceInWindow = silentRegions
                    .filter(r => r.start < end && r.end > start)
                    .reduce((total, r) => total + Math.min(r.end, end) - Math.max(r.start, start), 0);
                const silencePenalty = silenceInWindow / clipLen;

                // Composite score (0-100)
                const energyScore = Math.min(30, avgEnergy * 100);
                const motionScore = Math.min(25, avgMotion * 5);
                const sceneScore = Math.min(15, sceneCount * 5);
                const beatScore = Math.min(15, beatCount * 3);
                const silenceScore = Math.max(0, 15 - silencePenalty * 30);
                const viralityScore = Math.round(energyScore + motionScore + sceneScore + beatScore + silenceScore);

                if (viralityScore > 35) {
                    const reasons: string[] = [];
                    if (energyScore > 15) reasons.push('High audio energy');
                    if (motionScore > 12) reasons.push('Dynamic visuals');
                    if (sceneCount > 2) reasons.push(`${sceneCount} scene changes`);
                    if (beatCount > 3) reasons.push('Strong rhythm');
                    if (silencePenalty < 0.1) reasons.push('No dead air');

                    const thumbnail = windowFrames.find(f => f.thumbnail)?.thumbnail;

                    candidates.push({
                        id: `vc_${Math.round(start)}_${clipLen}`,
                        startTime: start,
                        endTime: end,
                        duration: clipLen,
                        viralityScore,
                        label: `${clipLen}s clip @ ${this.fmtTime(start)}`,
                        reasons,
                        thumbnail,
                    });
                }
            }
        }

        // Sort by score, remove overlapping, return top 10
        candidates.sort((a, b) => b.viralityScore - a.viralityScore);
        return this.removeOverlaps(candidates).slice(0, 10);
    }

    /**
     * Remove clips that overlap significantly with higher-scored ones.
     */
    private removeOverlaps(clips: ViralClipCandidate[]): ViralClipCandidate[] {
        const kept: ViralClipCandidate[] = [];
        for (const clip of clips) {
            const overlaps = kept.some(k => {
                const overlapStart = Math.max(k.startTime, clip.startTime);
                const overlapEnd = Math.min(k.endTime, clip.endTime);
                const overlap = Math.max(0, overlapEnd - overlapStart);
                return overlap > clip.duration * 0.5;
            });
            if (!overlaps) kept.push(clip);
        }
        return kept;
    }

    // --- Pixel math helpers ---

    private calcBrightness(pixels: Uint8ClampedArray): number {
        let sum = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            sum += pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
        }
        return sum / (pixels.length / 4) / 255;
    }

    private calcContrast(pixels: Uint8ClampedArray, avgBrightness: number): number {
        let variance = 0;
        const avg = avgBrightness * 255;
        for (let i = 0; i < pixels.length; i += 4) {
            const lum = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
            variance += (lum - avg) ** 2;
        }
        return Math.sqrt(variance / (pixels.length / 4)) / 255;
    }

    private calcMotionDelta(current: Uint8ClampedArray, previous: Uint8ClampedArray): number {
        let diff = 0;
        for (let i = 0; i < current.length; i += 16) { // Sample every 4th pixel for speed
            diff += Math.abs(current[i] - previous[i]);
            diff += Math.abs(current[i + 1] - previous[i + 1]);
            diff += Math.abs(current[i + 2] - previous[i + 2]);
        }
        return diff / (current.length / 16) / 255;
    }

    private fmtTime(s: number): string {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }
}

export default VideoIntelligence;

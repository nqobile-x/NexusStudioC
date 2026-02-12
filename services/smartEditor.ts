/**
 * SmartEditor — Autonomous editing agent.
 * Uses VideoIntelligence analysis results to make editing decisions.
 * Think: OpusClip + CapCut's auto-edit, running fully in-browser.
 */

import type { AnalysisResult, ViralClipCandidate } from './videoIntelligence';

export interface EditAction {
    type: 'cut' | 'trim' | 'split' | 'speed' | 'transition';
    startTime: number;
    endTime: number;
    label: string;
    confidence: number;
    icon: string;
}

export interface HighlightReel {
    clips: ViralClipCandidate[];
    totalDuration: number;
    estimatedViralScore: number;
}

export interface AutoEditResult {
    clips: Array<{
        id: string;
        name: string;
        track: 'video' | 'audio' | 'caption';
        startTime: number;
        duration: number;
        color: string;
        opacity: number;
        volume: number;
        speed: number;
    }>;
    actions: EditAction[];
    highlightReel: HighlightReel;
}

export class SmartEditor {
    /**
     * One-click auto-edit: analyze results → produce a clean edit.
     */
    autoEdit(analysis: AnalysisResult): AutoEditResult {
        const actions: EditAction[] = [];

        // 1. Mark silence for removal
        for (const region of analysis.silentRegions) {
            actions.push({
                type: 'cut',
                startTime: region.start,
                endTime: region.end,
                label: `Remove ${(region.end - region.start).toFixed(1)}s silence`,
                confidence: 0.9,
                icon: 'volume_off',
            });
        }

        // 2. Suggest transitions at scene changes
        for (const scene of analysis.scenes) {
            if (scene.confidence > 0.5) {
                actions.push({
                    type: 'transition',
                    startTime: scene.time - 0.2,
                    endTime: scene.time + 0.2,
                    label: `Add transition at scene change`,
                    confidence: scene.confidence,
                    icon: 'swap_horiz',
                });
            }
        }

        // 3. Speed up low-energy segments
        const avgEnergy = analysis.audio.reduce((s, a) => s + a.energy, 0) / (analysis.audio.length || 1);
        const lowEnergySegments = this.findConsecutiveSegments(
            analysis.audio.filter(a => a.energy < avgEnergy * 0.4 && !a.isSilent),
            1.5
        );

        for (const seg of lowEnergySegments) {
            actions.push({
                type: 'speed',
                startTime: seg.start,
                endTime: seg.end,
                label: `Speed up slow section (1.5x)`,
                confidence: 0.7,
                icon: 'speed',
            });
        }

        // 4. Generate cleaned-up clips (no silence)
        const clips = this.buildClipsWithoutSilence(analysis);

        // 5. Build highlight reel from top viral clips
        const highlightReel = this.createHighlightReel(analysis.viralClips, 60);

        return { clips, actions, highlightReel };
    }

    /**
     * Auto-trim silence from timeline → return new clip boundaries.
     */
    autoTrimSilence(analysis: AnalysisResult): Array<{ start: number; end: number }> {
        const silentSet = new Set<number>();
        for (const region of analysis.silentRegions) {
            for (let t = region.start; t < region.end; t += 0.5) {
                silentSet.add(Math.round(t * 2) / 2);
            }
        }

        const segments: Array<{ start: number; end: number }> = [];
        let segStart: number | null = null;

        for (let t = 0; t < analysis.duration; t += 0.5) {
            const rounded = Math.round(t * 2) / 2;
            if (!silentSet.has(rounded)) {
                if (segStart === null) segStart = rounded;
            } else {
                if (segStart !== null) {
                    segments.push({ start: segStart, end: rounded });
                    segStart = null;
                }
            }
        }
        if (segStart !== null) {
            segments.push({ start: segStart, end: analysis.duration });
        }
        return segments;
    }

    /**
     * Create a highlight reel from the best viral clips.
     */
    createHighlightReel(viralClips: ViralClipCandidate[], targetDuration: number): HighlightReel {
        const sorted = [...viralClips].sort((a, b) => b.viralityScore - a.viralityScore);
        const selected: ViralClipCandidate[] = [];
        let totalDur = 0;

        for (const clip of sorted) {
            if (totalDur + clip.duration <= targetDuration) {
                selected.push(clip);
                totalDur += clip.duration;
            }
            if (totalDur >= targetDuration) break;
        }

        // Sort selected by time order for smooth playback
        selected.sort((a, b) => a.startTime - b.startTime);

        const estimatedViralScore = selected.length > 0
            ? Math.round(selected.reduce((s, c) => s + c.viralityScore, 0) / selected.length)
            : 0;

        return { clips: selected, totalDuration: totalDur, estimatedViralScore };
    }

    /**
     * Suggest where to add beats-synced cuts.
     */
    suggestBeatSyncCuts(analysis: AnalysisResult): EditAction[] {
        return analysis.beats
            .filter(b => b.strength > 0.05)
            .map(b => ({
                type: 'split' as const,
                startTime: b.time,
                endTime: b.time,
                label: `Cut on beat`,
                confidence: Math.min(1, b.strength * 10),
                icon: 'music_note',
            }));
    }

    // --- Private helpers ---

    private buildClipsWithoutSilence(analysis: AnalysisResult) {
        const segments = this.autoTrimSilence(analysis);
        const colors = ['#6366f1', '#818cf8', '#a78bfa', '#c084fc', '#e879f9'];

        return segments.map((seg, i) => ({
            id: `auto_v${i}`,
            name: `Clip ${i + 1}`,
            track: 'video' as const,
            startTime: seg.start,
            duration: seg.end - seg.start,
            color: colors[i % colors.length],
            opacity: 100,
            volume: 100,
            speed: 1,
        }));
    }

    private findConsecutiveSegments(
        segments: Array<{ time: number }>,
        minDuration: number
    ): Array<{ start: number; end: number }> {
        const results: Array<{ start: number; end: number }> = [];
        if (segments.length === 0) return results;

        let start = segments[0].time;
        let prevTime = segments[0].time;

        for (let i = 1; i < segments.length; i++) {
            if (segments[i].time - prevTime > 1) {
                if (prevTime - start >= minDuration) {
                    results.push({ start, end: prevTime + 0.5 });
                }
                start = segments[i].time;
            }
            prevTime = segments[i].time;
        }
        if (prevTime - start >= minDuration) {
            results.push({ start, end: prevTime + 0.5 });
        }
        return results;
    }
}

export default SmartEditor;

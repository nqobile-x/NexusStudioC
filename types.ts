export enum ViewState {
    DASHBOARD = 'DASHBOARD',
    PROJECTS = 'PROJECTS',
    AI_LAB_VIDEO = 'AI_LAB_VIDEO',
    AI_LAB_IMAGE = 'AI_LAB_IMAGE',
    AI_ASSISTANT = 'AI_ASSISTANT',
    LIVE_SESSION = 'LIVE_SESSION',
    MEDIA_ANALYSIS = 'MEDIA_ANALYSIS',
    ASSETS = 'ASSETS',
    // Video Editing Suite
    VIDEO_EDITOR = 'VIDEO_EDITOR',
    CLIP_DETECTOR = 'CLIP_DETECTOR',
    CAPTION_STUDIO = 'CAPTION_STUDIO',
    EXPORT = 'EXPORT',
    TEMPLATES = 'TEMPLATES'
}

export interface NavItem {
    id: ViewState;
    label: string;
    icon: string;
    beta?: boolean;
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";

/** Video Editor types */
export interface TimelineClip {
    id: string;
    name: string;
    type: 'video' | 'audio' | 'caption';
    startTime: number;   // seconds on timeline
    duration: number;     // seconds
    color: string;        // track color
    track: number;        // track index (0 = video, 1 = audio, 2 = captions)
    thumbnail?: string;
    volume?: number;
    speed?: number;
    opacity?: number;
}

export interface CaptionEntry {
    id: string;
    text: string;
    startTime: number;
    endTime: number;
    speaker?: string;
    style: CaptionStyle;
}

export type CaptionStyle =
    | 'bold-impact'
    | 'minimal'
    | 'neon-glow'
    | 'gradient-pop'
    | 'typewriter'
    | 'karaoke'
    | 'subtitle'
    | 'comic'
    | 'elegant'
    | 'glitch';

export interface ViralClip {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    viralityScore: number;   // 1-100
    emotion: 'humorous' | 'inspiring' | 'controversial' | 'educational' | 'dramatic';
    platforms: ('tiktok' | 'reels' | 'shorts' | 'youtube' | 'facebook')[];
    summary: string;
    keywords: string[];
    hookType: string;
    narrativeComplete: boolean;
}

export interface ExportSettings {
    platform: Platform;
    resolution: '720p' | '1080p' | '4K';
    fps: 24 | 30 | 60;
    aspectRatio: AspectRatio;
    codec: 'H.264' | 'H.265' | 'VP9';
    quality: 'draft' | 'standard' | 'high' | 'ultra';
}

export interface Platform {
    id: string;
    name: string;
    icon: string;
    aspectRatio: AspectRatio;
    maxDuration: number;     // seconds
    maxFileSize: string;     // human readable
    resolution: string;
}

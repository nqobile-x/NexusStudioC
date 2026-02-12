export enum ViewState {
    DASHBOARD = 'DASHBOARD',
    PROJECTS = 'PROJECTS',
    AI_LAB_VIDEO = 'AI_LAB_VIDEO',
    AI_LAB_IMAGE = 'AI_LAB_IMAGE',
    AI_ASSISTANT = 'AI_ASSISTANT',
    LIVE_SESSION = 'LIVE_SESSION',
    MEDIA_ANALYSIS = 'MEDIA_ANALYSIS',
    ASSETS = 'ASSETS'
}

export interface NavItem {
    id: ViewState;
    label: string;
    icon: string;
    beta?: boolean;
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";

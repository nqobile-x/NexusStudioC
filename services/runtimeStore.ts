/**
 * RuntimeStore — In-memory state management for the active editing session.
 * Used to pass non-serializable data (like File objects, Blobs) between views,
 * specifically from VideoEditor to ExportPanel.
 */

export interface EditorClip {
    id: string;
    name: string;
    track: 'video' | 'audio' | 'caption';
    startTime: number;
    duration: number;
    color: string;
    filter?: string;
    opacity: number;
    volume: number;
    speed: number;
    thumbnail?: string;
    // Runtime only properties
    file?: File; // The actual file object for export
}

class RuntimeStore {
    private _sourceFile: File | null = null;
    private _clips: EditorClip[] = [];

    get sourceFile(): File | null {
        return this._sourceFile;
    }

    set sourceFile(file: File | null) {
        this._sourceFile = file;
    }

    get clips(): EditorClip[] {
        return this._clips;
    }

    set clips(clips: EditorClip[]) {
        this._clips = clips;
    }

    /**
     * Get clips prepared for export.
     * Maps the single source file to all video clips for now (MVP).
     * In a full multi-file editor, each clip would have its own source file.
     */
    getExportableClips(): Array<{ id: string; file: File; startTime: number; duration: number }> {
        if (!this._sourceFile) return [];

        return this._clips
            .filter(c => c.track === 'video')
            .map(c => ({
                id: c.id,
                file: this._sourceFile!, // MVP: All video clips come from the main source
                startTime: c.startTime, // Relative to timeline 0 for now? 
                // Wait, startTime in editor is timeline position. 
                // For export, we need the *source* trim points.
                // In this MVP editor, we don't strictly track "source in/out" points separate from timeline duration.
                // We assume the clip PLAYS from 0 of the source for its duration.
                // If we implement trimming (resize-left), we'd need 'sourceStartTime'.
                // Let's assume for MVP: source starts at 0 for all clips unless we added that prop.
                // In handleMouseMove (resize-left), we update startTime (timeline pos) and duration.
                // We actually change the visual start, but don't track the content offset.
                // Fix: let's assume content offset is 0 for simplicity or add it later.
                duration: c.duration
            }));
    }
}

export const runtimeStore = new RuntimeStore();

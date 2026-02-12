/**
 * Project Service — localStorage-based save/load for video editing projects
 */

export interface Project {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    clips: Array<{
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
    }>;
    settings: {
        videoDuration: number;
        activeFilter: string;
        zoom: number;
    };
    videoFileName?: string;
}

const STORAGE_KEY = 'nexusstudio_projects';

function getAll(): Project[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function persist(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export const projectService = {
    /** List all saved projects, newest first */
    listProjects(): Project[] {
        return getAll().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },

    /** Save a new project or update existing by ID */
    saveProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Project {
        const all = getAll();
        const now = new Date().toISOString();

        if (project.id) {
            const idx = all.findIndex(p => p.id === project.id);
            if (idx >= 0) {
                all[idx] = { ...all[idx], ...project, updatedAt: now };
                persist(all);
                return all[idx];
            }
        }

        const newProject: Project = {
            ...project,
            id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            createdAt: now,
            updatedAt: now,
        } as Project;

        all.push(newProject);
        persist(all);
        return newProject;
    },

    /** Load a specific project by ID */
    loadProject(id: string): Project | null {
        return getAll().find(p => p.id === id) || null;
    },

    /** Delete a project by ID */
    deleteProject(id: string): void {
        persist(getAll().filter(p => p.id !== id));
    },

    /** Get project count */
    count(): number {
        return getAll().length;
    },
};

export default projectService;

import React from 'react';
import { ViewState } from '../types';

interface SidebarProps {
    currentView: ViewState;
    onNavigate: (view: ViewState) => void;
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
    const navItemClass = (isActive: boolean) => 
        `flex items-center gap-3 px-3 py-3 rounded-xl transition-all group cursor-pointer ${
            isActive 
            ? 'bg-primary/10 text-primary font-medium shadow-sm border border-primary/10' 
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-hover hover:text-slate-900 dark:hover:text-white border border-transparent'
        }`;

    return (
        <>
            {/* Mobile Overlay */}
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-72 h-full 
                bg-white dark:bg-surface-dark 
                border-r border-slate-200 dark:border-slate-800 
                flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Brand */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <span className="material-icons-round text-xl">movie_filter</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Nexus<span className="text-primary">Studio</span></span>
                    </div>
                    <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                    <div className="mb-6">
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Workspace</p>
                        <div onClick={() => onNavigate(ViewState.DASHBOARD)} className={navItemClass(currentView === ViewState.DASHBOARD)}>
                            <span className="material-icons-round">dashboard</span>
                            Dashboard
                        </div>
                        <div onClick={() => onNavigate(ViewState.PROJECTS)} className={navItemClass(currentView === ViewState.PROJECTS)}>
                            <span className="material-icons-round group-hover:text-primary transition-colors">folder_open</span>
                            Projects
                        </div>
                        
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-8">Creative Suite</p>
                        <div onClick={() => onNavigate(ViewState.AI_LAB_VIDEO)} className={navItemClass(currentView === ViewState.AI_LAB_VIDEO)}>
                            <span className="material-icons-round group-hover:text-primary transition-colors">video_library</span>
                            Veo Studio
                            <span className="ml-auto bg-gradient-to-r from-primary to-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg shadow-primary/20">NEW</span>
                        </div>
                        <div onClick={() => onNavigate(ViewState.AI_LAB_IMAGE)} className={navItemClass(currentView === ViewState.AI_LAB_IMAGE)}>
                            <span className="material-icons-round group-hover:text-primary transition-colors">auto_fix_high</span>
                            Image Lab
                        </div>
                        <div onClick={() => onNavigate(ViewState.AI_ASSISTANT)} className={navItemClass(currentView === ViewState.AI_ASSISTANT)}>
                            <span className="material-icons-round group-hover:text-primary transition-colors">smart_toy</span>
                            Assistant
                        </div>
                        <div onClick={() => onNavigate(ViewState.LIVE_SESSION)} className={navItemClass(currentView === ViewState.LIVE_SESSION)}>
                            <span className="material-icons-round group-hover:text-primary transition-colors">mic</span>
                            Live Session
                        </div>
                        <div onClick={() => onNavigate(ViewState.MEDIA_ANALYSIS)} className={navItemClass(currentView === ViewState.MEDIA_ANALYSIS)}>
                            <span className="material-icons-round group-hover:text-primary transition-colors">analytics</span>
                            Analysis
                        </div>
                    </div>
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="glass-panel rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="relative">
                            <img alt="User Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-primary/50 transition-all" src="https://picsum.photos/100/100" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface-dark rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Alex Creator</p>
                            <p className="text-xs text-slate-400 truncate group-hover:text-primary transition-colors">Pro Plan</p>
                        </div>
                        <span className="material-icons-round text-slate-500">more_vert</span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

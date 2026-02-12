import React from 'react';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    return (
        <header className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 glass-panel-heavy sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <span className="material-icons-round">menu</span>
                </button>
                <div className="hidden md:block">
                    <h1 className="text-base lg:text-lg font-bold text-slate-900 dark:text-white">Good evening, Alex</h1>
                    <p className="text-[10px] lg:text-xs text-slate-500">Ready to create something amazing?</p>
                </div>
                {/* Mobile Title */}
                <div className="md:hidden flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-xs">
                         <span className="material-icons-round text-sm">movie_filter</span>
                    </span>
                    <span className="font-bold text-white">Nexus</span>
                </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
                {/* Search - Hidden on small mobile */}
                <div className="relative group hidden sm:block">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors material-icons-round text-lg">search</span>
                    <input className="w-48 lg:w-64 bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white text-sm rounded-full pl-10 pr-4 py-1.5 lg:py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-surface-hover transition-all outline-none" placeholder="Search..." type="text"/>
                </div>
                
                {/* Notification */}
                <button className="relative w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-surface-hover text-slate-500 hover:text-white transition-colors">
                    <span className="material-icons-round">notifications_none</span>
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface-dark"></span>
                </button>
                
                {/* Export Button */}
                <button className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-white/5">
                    <span className="material-icons-round text-sm lg:text-base">upload</span>
                    <span className="hidden sm:inline">Export</span>
                </button>
            </div>
        </header>
    );
};

export default Header;

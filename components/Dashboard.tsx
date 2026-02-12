import React from 'react';
import { ViewState } from '../types';

interface DashboardProps {
    onNavigate: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    return (
        <div className="p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-20 lg:pb-8">
            {/* Left Column (Main Actions & Projects) */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-8 animate-fade-in">
                {/* Hero / New Project Actions */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start Creating</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* AI Generate Card */}
                        <button onClick={() => onNavigate(ViewState.AI_LAB_VIDEO)} className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface-card to-surface-card hover:from-primary/20 hover:to-surface-hover transition-all duration-300 p-6 text-left h-auto md:h-52 flex flex-col justify-between shadow-lg shadow-black/20">
                            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-icons-round text-primary transform group-hover:rotate-45 transition-transform">arrow_outward</span>
                            </div>
                            <div className="z-10 relative">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-inner">
                                    <span className="material-icons-round text-2xl">auto_awesome</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">AI Video (Veo)</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Transform text prompts into cinematic video scenes instantly with our most advanced model.</p>
                            </div>
                        </button>

                        {/* Image Lab Card */}
                        <button onClick={() => onNavigate(ViewState.AI_LAB_IMAGE)} className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-card hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 p-6 text-left h-auto md:h-52 flex flex-col justify-between shadow-lg shadow-black/20">
                            <div className="z-10">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-surface-dark text-slate-600 dark:text-slate-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-slate-200 dark:border-slate-700">
                                    <span className="material-icons-round text-2xl">image</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Image Lab</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Generate high-fidelity Pro images or edit existing assets with generative fill.</p>
                            </div>
                            <div className="z-10 flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium text-xs uppercase tracking-wider mt-6 group-hover:text-white transition-colors">
                                <span>Open Lab</span>
                                <span className="material-icons-round text-base transition-transform group-hover:translate-x-1">arrow_forward</span>
                            </div>
                        </button>
                    </div>
                </section>
                
                {/* Recent Projects Placeholder */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Projects</h2>
                        <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                         <div className="group bg-white dark:bg-surface-card rounded-2xl border border-slate-200 dark:border-slate-800/60 overflow-hidden hover:border-primary/50 transition-all shadow-sm hover:shadow-lg dark:shadow-black/40 p-8 flex flex-col items-center justify-center text-slate-500 h-48 border-dashed">
                             <span className="material-icons-round text-4xl mb-2 opacity-50 group-hover:text-primary group-hover:scale-110 transition-all">folder_open</span>
                             <p className="text-sm">No recent projects</p>
                             <button className="mt-4 text-xs bg-slate-100 dark:bg-surface-hover px-3 py-1.5 rounded-lg hover:text-white transition-colors">Start New</button>
                         </div>
                    </div>
                </section>
            </div>

            {/* Right Column (AI Insights & Side Widgets) */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-6 animate-fade-in" style={{animationDelay: '100ms'}}>
                {/* AI Insights Panel */}
                <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/30 transition-colors duration-500"></div>
                    <div className="flex items-center gap-2 mb-6 relative z-10">
                        <div className="p-1.5 bg-primary/20 rounded-lg">
                             <span className="material-icons-round text-primary text-sm">insights</span>
                        </div>
                        <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">AI Insights</h2>
                    </div>
                    <div className="mb-2 relative z-10">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs text-slate-400 font-medium">Weekly Usage</span>
                            <span className="text-2xl font-bold text-white">85<span className="text-sm text-slate-500 font-normal">%</span></span>
                        </div>
                        <div className="w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-primary to-purple-500 h-full w-[85%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">You're generating 20% more than last week.</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-surface-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800/60">
                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h3>
                     <div className="space-y-2">
                        <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover transition-colors text-left group">
                            <span className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center material-icons-round text-sm group-hover:bg-blue-500 group-hover:text-white transition-all">add_photo_alternate</span>
                            <span className="text-sm text-slate-300 group-hover:text-white">Upscale Image</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover transition-colors text-left group">
                            <span className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center material-icons-round text-sm group-hover:bg-purple-500 group-hover:text-white transition-all">mic</span>
                            <span className="text-sm text-slate-300 group-hover:text-white">Record Voiceover</span>
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

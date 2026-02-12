import React, { useState } from 'react';
import { ViewState } from '../types';

interface Template {
    id: string;
    name: string;
    category: 'Social' | 'Business' | 'Education' | 'Entertainment';
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
    duration: string;
    description: string;
    icon: string;
    gradient: string;
    tags: string[];
    clips: number;
    captionStyle: string;
}

const TEMPLATES: Template[] = [
    {
        id: 'tiktok-trend', name: 'TikTok Trend', category: 'Social',
        aspectRatio: '9:16', duration: '15-60s', icon: 'trending_up',
        gradient: 'from-pink-500 to-rose-600', tags: ['Vertical', 'Fast-paced', 'Hook-driven'],
        description: 'Eye-catching vertical format with quick cuts, trending transitions, and bold captions optimized for TikTok\'s algorithm.',
        clips: 5, captionStyle: 'Bold Impact',
    },
    {
        id: 'yt-intro', name: 'YouTube Intro', category: 'Entertainment',
        aspectRatio: '16:9', duration: '5-15s', icon: 'play_circle',
        gradient: 'from-red-500 to-red-700', tags: ['Widescreen', 'Branding', 'Animation'],
        description: 'Professional channel intro with logo reveal, subscribe CTA, and custom branding elements.',
        clips: 3, captionStyle: 'Gradient Pop',
    },
    {
        id: 'product-showcase', name: 'Product Showcase', category: 'Business',
        aspectRatio: '1:1', duration: '30-60s', icon: 'storefront',
        gradient: 'from-indigo-500 to-purple-600', tags: ['Square', 'E-commerce', 'Clean'],
        description: 'Clean product highlight with zoom-ins, feature callouts, and pricing overlay perfect for Instagram and ads.',
        clips: 4, captionStyle: 'Minimal Clean',
    },
    {
        id: 'podcast-clip', name: 'Podcast Clip', category: 'Entertainment',
        aspectRatio: '9:16', duration: '30-90s', icon: 'podcasts',
        gradient: 'from-emerald-500 to-teal-600', tags: ['Vertical', 'Audio-driven', 'Captions'],
        description: 'Auto-captioned podcast snippet with waveform visualization and speaker identification.',
        clips: 1, captionStyle: 'Karaoke Highlight',
    },
    {
        id: 'tutorial', name: 'Tutorial', category: 'Education',
        aspectRatio: '16:9', duration: '2-10min', icon: 'school',
        gradient: 'from-blue-500 to-cyan-600', tags: ['Widescreen', 'Step-by-step', 'Overlay'],
        description: 'Structured tutorial template with numbered steps, zoom callouts, and annotation overlays.',
        clips: 6, captionStyle: 'Typewriter',
    },
    {
        id: 'story-highlight', name: 'Story Highlight', category: 'Social',
        aspectRatio: '9:16', duration: '15s', icon: 'auto_stories',
        gradient: 'from-amber-500 to-orange-600', tags: ['Vertical', 'Stories', 'Quick'],
        description: 'Instagram/Facebook story format with sticker-style text, poll placeholders, and swipe-up CTA.',
        clips: 3, captionStyle: 'Neon Glow',
    },
    {
        id: 'comparison', name: 'Before & After', category: 'Business',
        aspectRatio: '9:16', duration: '15-30s', icon: 'compare',
        gradient: 'from-violet-500 to-fuchsia-600', tags: ['Split-screen', 'Transformation', 'Viral'],
        description: 'Side-by-side or wipe-reveal comparison format popular for transformations and results content.',
        clips: 2, captionStyle: 'Bold Impact',
    },
    {
        id: 'news-recap', name: 'News Recap', category: 'Education',
        aspectRatio: '9:16', duration: '60-90s', icon: 'newspaper',
        gradient: 'from-slate-500 to-slate-700', tags: ['Vertical', 'Informational', 'Lower thirds'],
        description: 'Quick news-style breakdown with lower thirds, data overlays, and source citations.',
        clips: 4, captionStyle: 'Subtitle Classic',
    },
];

const CATEGORIES = ['All', 'Social', 'Business', 'Education', 'Entertainment'] as const;

interface TemplateLibraryProps {
    onNavigate?: (view: ViewState) => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onNavigate }) => {
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const filtered = TEMPLATES.filter(t => {
        const matchCat = activeCategory === 'All' || t.category === activeCategory;
        const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchCat && matchSearch;
    });

    return (
        <div className="p-4 lg:p-8 pb-20 lg:pb-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="material-icons-round text-primary">dashboard_customize</span>
                        Template Library
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Start with a professional template, customize it your way</p>
                </div>
                <div className="relative">
                    <span className="material-icons-round text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 text-lg">search</span>
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-surface-card border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white w-64 focus:border-primary/50 focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-primary text-white' : 'bg-surface-card text-slate-400 border border-slate-800 hover:text-white hover:border-slate-600'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filtered.map(t => (
                    <div
                        key={t.id}
                        className="group bg-surface-card border border-slate-800/60 rounded-2xl overflow-hidden hover:border-primary/40 transition-all hover:shadow-xl hover:shadow-primary/5 cursor-pointer"
                        onMouseEnter={() => setHoveredId(t.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        {/* Preview area */}
                        <div className={`relative h-40 bg-gradient-to-br ${t.gradient} flex items-center justify-center`}>
                            <span className="material-icons-round text-5xl text-white/30">{t.icon}</span>

                            {/* Aspect ratio badge */}
                            <span className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">{t.aspectRatio}</span>
                            <span className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">{t.duration}</span>

                            {/* Hover overlay */}
                            {hoveredId === t.id && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-3 animate-fade-in">
                                    <button
                                        onClick={() => onNavigate?.(ViewState.VIDEO_EDITOR)}
                                        className="px-4 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1.5"
                                    >
                                        <span className="material-icons-round text-sm">edit</span>Use Template
                                    </button>
                                    <button className="px-3 py-2 bg-white/10 text-white text-xs font-medium rounded-lg hover:bg-white/20 transition-colors">
                                        <span className="material-icons-round text-sm">visibility</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-1.5">
                                <h3 className="text-sm font-bold text-white">{t.name}</h3>
                                <span className="text-[10px] text-slate-500 bg-surface-dark px-2 py-0.5 rounded-full">{t.category}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed mb-3 line-clamp-2">{t.description}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {t.tags.map(tag => (
                                    <span key={tag} className="text-[9px] bg-surface-dark text-slate-500 px-2 py-0.5 rounded-full">{tag}</span>
                                ))}
                            </div>
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800/40 text-[10px] text-slate-600">
                                <span className="flex items-center gap-1"><span className="material-icons-round text-xs">movie</span>{t.clips} clips</span>
                                <span className="flex items-center gap-1"><span className="material-icons-round text-xs">subtitles</span>{t.captionStyle}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-slate-600">
                    <span className="material-icons-round text-4xl mb-2 block opacity-40">search_off</span>
                    <p className="text-sm">No templates match your search</p>
                </div>
            )}
        </div>
    );
};

export default TemplateLibrary;

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import VideoGenerator from './components/VideoGenerator';
import ImageStudio from './components/ImageStudio';
import AiAssistant from './components/AiAssistant';
import LiveSession from './components/LiveSession';
import MediaAnalysis from './components/MediaAnalysis';
import VideoEditor from './components/VideoEditor';
import ClipDetector from './components/ClipDetector';
import CaptionStudio from './components/CaptionStudio';
import ExportPanel from './components/ExportPanel';
import TemplateLibrary from './components/TemplateLibrary';
import { ViewState } from './types';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleNavigate = (view: ViewState) => {
        setCurrentView(view);
        setIsMobileMenuOpen(false); // Close menu on navigation on mobile
    };

    const renderView = () => {
        switch (currentView) {
            case ViewState.DASHBOARD:
                return <Dashboard onNavigate={handleNavigate} />;
            case ViewState.AI_LAB_VIDEO:
                return <VideoGenerator />;
            case ViewState.AI_LAB_IMAGE:
                return <ImageStudio />;
            case ViewState.AI_ASSISTANT:
                return <AiAssistant />;
            case ViewState.LIVE_SESSION:
                return <LiveSession />;
            case ViewState.MEDIA_ANALYSIS:
                return <MediaAnalysis />;
            case ViewState.VIDEO_EDITOR:
                return <VideoEditor onNavigate={handleNavigate} />;
            case ViewState.CLIP_DETECTOR:
                return <ClipDetector />;
            case ViewState.CAPTION_STUDIO:
                return <CaptionStudio />;
            case ViewState.EXPORT:
                return <ExportPanel />;
            case ViewState.TEMPLATES:
                return <TemplateLibrary onNavigate={handleNavigate} />;
            default:
                return <Dashboard onNavigate={handleNavigate} />;
        }
    };

    return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 font-display">
            <Sidebar
                currentView={currentView}
                onNavigate={handleNavigate}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300">
                <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {renderView()}
                </div>
            </main>
        </div>
    );
};

export default App;

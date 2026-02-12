import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../services/geminiService';

interface Message {
    role: 'user' | 'model';
    parts: { text: string }[];
}

const AiAssistant: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [useSearch, setUseSearch] = useState(false);
    const [useThinking, setUseThinking] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg: Message = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Determine mode
            let mode: 'normal' | 'search' | 'thinking' = 'normal';
            if (useSearch) mode = 'search';
            else if (useThinking) mode = 'thinking';

            const response = await sendChatMessage(input, messages, mode);
            
            const text = response.text || "I couldn't generate a response.";
            let groundingText = '';
            
            // Extract grounding chunks manually if available
            // @ts-ignore - access raw response structure for grounding
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (groundingChunks) {
                groundingText = '\n\n**Sources:**\n' + groundingChunks.map((c: any) => 
                    c.web?.uri ? `- [${c.web.title}](${c.web.uri})` : ''
                ).filter(Boolean).join('\n');
            }

            const modelMsg: Message = { role: 'model', parts: [{ text: text + groundingText }] };
            setMessages(prev => [...prev, modelMsg]);

        } catch (error) {
            console.error(error);
            const errorMsg: Message = { role: 'model', parts: [{ text: "Sorry, I encountered an error." }] };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-black/20">
            {/* Header */}
            <div className="h-16 lg:h-20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-surface-dark shrink-0">
                <div className="flex items-center gap-2">
                    <span className="material-icons-round text-primary">smart_toy</span>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm lg:text-base">Gemini Assistant</h2>
                </div>
                <div className="flex items-center gap-2 lg:gap-4 text-[10px] lg:text-xs">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-surface-card px-2 py-1 rounded-lg">
                        <input type="checkbox" checked={useSearch} onChange={(e) => { setUseSearch(e.target.checked); if(e.target.checked) setUseThinking(false); }} className="form-checkbox w-3 h-3 rounded bg-slate-700 border-slate-600 text-primary focus:ring-0" />
                        <span className="text-slate-500 dark:text-slate-300">Web</span>
                    </label>
                     <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-surface-card px-2 py-1 rounded-lg">
                        <input type="checkbox" checked={useThinking} onChange={(e) => { setUseThinking(e.target.checked); if(e.target.checked) setUseSearch(false); }} className="form-checkbox w-3 h-3 rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-0" />
                        <span className="text-slate-500 dark:text-slate-300">Reasoning</span>
                    </label>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
                {messages.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 px-4 text-center">
                         <span className="material-icons-round text-5xl lg:text-6xl mb-4">forum</span>
                         <p>Ask me anything. Toggle Web for search or Reasoning for complex tasks.</p>
                     </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] lg:max-w-[80%] rounded-2xl px-4 py-3 lg:px-5 lg:py-3 shadow-md ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-surface-card border border-slate-200 dark:border-slate-800/50 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                            <div className="markdown-body text-sm whitespace-pre-wrap leading-relaxed">{msg.parts[0].text}</div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                     <div className="flex justify-start">
                        <div className="bg-white dark:bg-surface-card border border-slate-200 dark:border-slate-800/50 rounded-2xl rounded-bl-none px-4 py-3">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef}></div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark shrink-0 pb-6 lg:pb-4">
                <div className="flex gap-2 relative max-w-4xl mx-auto">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={useThinking ? "Ask a complex question..." : "Type a message..."}
                        className="flex-1 bg-slate-100 dark:bg-surface-card border border-transparent focus:border-primary rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none shadow-inner transition-all"
                    />
                    <button onClick={handleSend} disabled={!input.trim()} className="bg-primary hover:bg-primary-dark text-white rounded-xl w-12 flex items-center justify-center transition-colors disabled:opacity-50 shadow-lg shadow-primary/20">
                        <span className="material-icons-round">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;

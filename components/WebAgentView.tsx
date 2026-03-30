import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { Persona, Message, AgentStatus, LlmProvider, Source } from '../types';
import { getLlmService } from '../services/llmService';
import { MessageBubble } from './MessageBubble';

interface WebAgentViewProps {
  personas: Persona[];
  apiKeys: { [key in LlmProvider]?: string } | null;
}

export const WebAgentView: React.FC<WebAgentViewProps> = ({ personas, apiKeys }) => {
    const { t } = useTranslation();
    const [url, setUrl] = useState('');
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<AgentStatus>(AgentStatus.Idle);
    
    const conversationEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim() || !prompt.trim() || status !== AgentStatus.Idle) return;

        const webAgentPersona = personas.find(p => p.id === 'web-agent');
        if (!webAgentPersona) {
            console.error("Web Agent persona not found!");
            return;
        }

        const combinedPrompt = `Tarefa: "${prompt}"\nURL para análise: ${url}`;
        const userMessage: Message = { role: 'user', content: combinedPrompt };
        const agentMessagePlaceholder: Message = { role: 'agent', content: '', sources: [], variants: [], activeVariantIndex: 0 };

        setMessages(prev => [...prev, userMessage, agentMessagePlaceholder]);
        setStatus(AgentStatus.Thinking);
        
        const provider = webAgentPersona.provider || 'gemini';
        const apiKey = apiKeys?.[provider];

        if (!apiKey) {
            setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: t('errors.apiKeyMissing') } : m));
            setStatus(AgentStatus.Error);
            return;
        }

        // Fix: Use a local flag to correctly manage state transitions in the finally block,
        // avoiding a race condition caused by stale state closures.
        let errorOccurred = false;
        try {
            const llmService = getLlmService(provider);
            const stream = llmService.streamAiChatResponse(
                combinedPrompt,
                [], 
                webAgentPersona.model || 'gemini-3.1-pro-preview',
                apiKey,
                webAgentPersona
            );

            let fullText = '';
            let sources: Source[] = [];

            for await (const chunk of stream) {
                if (chunk.text) {
                    fullText += chunk.text;
                    setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: fullText } : m));
                }
                 if (chunk.sources) {
                    sources = [...new Map([...sources, ...chunk.sources].map(item => [item.uri, item])).values()];
                    setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, sources } : m));
                }
                if (chunk.error) {
                    fullText = t(chunk.error) || t('webAgent.error');
                    setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: fullText } : m));
                    setStatus(AgentStatus.Error);
                    errorOccurred = true;
                    break;
                }
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: t('webAgent.error') } : m));
            setStatus(AgentStatus.Error);
            errorOccurred = true;
        } finally {
            if (!errorOccurred) {
                setStatus(AgentStatus.Idle);
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4 h-full">
            <header className="py-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-white">{t('webAgent.title')}</h1>
                <p className="text-gray-400 mt-1">{t('webAgent.description')}</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-3 mb-6 flex-shrink-0">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t('webAgent.urlPlaceholder')}
                    className="w-full pl-4 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    required
                />
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('webAgent.promptPlaceholder')}
                    className="w-full pl-4 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    required
                />
                <button
                    type="submit"
                    disabled={status === AgentStatus.Thinking}
                    className="w-full px-4 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:bg-purple-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {status === AgentStatus.Thinking ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                            <span>{t('agentStatus.thinking')}</span>
                        </>
                    ) : (
                        t('webAgent.submitButton')
                    )}
                </button>
            </form>

            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4 pb-4">
                {messages.map((msg, index) => (
                    <MessageBubble
                        key={index}
                        index={index}
                        message={msg}
                        isLastMessage={index === messages.length - 1}
                        isThinking={status === AgentStatus.Thinking && index === messages.length - 1}
                    />
                ))}
                 <div ref={conversationEndRef} />
            </div>
        </div>
    );
};
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, AgentStatus, Chat, Persona, OperatingMode, LlmProvider, GenerationConfig } from '../types';
import { useTranslation } from '../i18n';
import { MessageBubble } from './MessageBubble';
import { AdvancedChatControls } from './AdvancedChatControls';
import ProfessionalReferralModal from './ProfessionalReferralModal';

interface ChatViewProps {
  chat: Chat;
  chats: Chat[];
  personas: Persona[];
  onGoBack: () => void;
  onProcessCommand: (command: string, chat: Chat, persona: Persona, updatedChats: Chat[], nextMessageConfig?: GenerationConfig) => Promise<void>;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  apiKeys: { [key in LlmProvider]?: string } | null;
  status: AgentStatus;
  // Fix: Corrected the type for setStatus to align with the state it manages (AgentStatus).
  setStatus: React.Dispatch<React.SetStateAction<AgentStatus>>;
  isAdvancedInterfaceEnabled: boolean;
  isSingleAgentMode: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  chat, chats, personas, onGoBack, onProcessCommand, setChats, apiKeys, status, setStatus, isAdvancedInterfaceEnabled, isSingleAgentMode
}) => {
    const { t } = useTranslation();
    const [inputText, setInputText] = useState('');
    const [isAdvancedControlsOpen, setIsAdvancedControlsOpen] = useState(false);
    
    const [isUserAtBottom, setIsUserAtBottom] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);
    
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
    const [referralModalPersonaId, setReferralModalPersonaId] = useState<string | null>(null);

    const [isExiting, setIsExiting] = useState(false);

    const activePersona = personas.find(p => p.id === chat.personaId);
    
    const [nextMessageConfig, setNextMessageConfig] = useState<GenerationConfig>({
        temperature: chat.temperature ?? activePersona?.temperature,
        topK: chat.topK ?? activePersona?.topK,
        topP: chat.topP ?? activePersona?.topP,
    });
    
    const advancedControlsAnchorRef = useRef<HTMLButtonElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const conversationEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleGoBack = () => {
        setIsExiting(true);
        setTimeout(onGoBack, 300); // Match animation duration
    };

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
        conversationEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        if (isUserAtBottom) {
            scrollToBottom('smooth');
        }
    }, [chat.messages.length, chat.messages[chat.messages.length - 1]?.content, isUserAtBottom]);
    
    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (container) {
            const threshold = 50; // pixels
            const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
            setIsUserAtBottom(atBottom);
            setShowScrollButton(!atBottom);
        }
    }, []);
    
    useEffect(() => {
        const container = scrollContainerRef.current;
        container?.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleTextSubmit = (event?: React.FormEvent) => {
        event?.preventDefault();
        if (inputText.trim() && activePersona) {
            
            const command = inputText.trim();
            const userMessage: Message = { role: 'user', content: command };
            const agentMessagePlaceholder: Message = { role: 'agent', content: '', sources: [], variants: [], activeVariantIndex: 0 };
            
            const chatsForCommand = chats.map(c => {
                if (c.id === chat.id) {
                    const isNewChat = c.messages.length <= 1 && !isSingleAgentMode;
                    return {
                        ...c,
                        title: isNewChat ? command.substring(0, 40) + (command.length > 40 ? '...' : '') : c.title,
                        messages: [...c.messages, userMessage, agentMessagePlaceholder],
                    };
                }
                return c;
            });
            
            const chatForCommand = chatsForCommand.find(c => c.id === chat.id)!;
            onProcessCommand(command, chatForCommand, activePersona, chatsForCommand, nextMessageConfig);
            setInputText('');
        }
    };

    const handleRegenerate = () => {
        if (!activePersona || status !== AgentStatus.Idle) return;

        let lastUserMessage: Message | null = null;

        for (let i = chat.messages.length - 1; i >= 0; i--) {
            if (chat.messages[i].role === 'user') {
                lastUserMessage = chat.messages[i];
                break;
            }
        }
        
        if (!lastUserMessage) return;

        const commandToRegen = lastUserMessage.content;
        
        const chatsForCommand = chats.map(c => {
            if (c.id === chat.id) {
                const messages = [...c.messages];
                const lastAgentMessage = messages[messages.length - 1];

                if (lastAgentMessage?.role === 'agent') {
                    lastAgentMessage.content = '';
                    lastAgentMessage.sources = [];
                }
                return { ...c, messages };
            }
            return c;
        });
        
        const chatForCommand = chatsForCommand.find(c => c.id === chat.id)!;
        onProcessCommand(commandToRegen, chatForCommand, activePersona, chatsForCommand);
    };
    
    const handleEditUserMessage = (messageIndex: number, newContent: string) => {
        if (!activePersona || status !== AgentStatus.Idle) return;

        const chatsForCommand = chats.map(c => {
            if (c.id === chat.id) {
                const truncatedMessages = c.messages.slice(0, messageIndex);
                const updatedUserMessage: Message = { ...c.messages[messageIndex], content: newContent };
                truncatedMessages.push(updatedUserMessage);
                
                const agentMessagePlaceholder: Message = { role: 'agent', content: '' };
                truncatedMessages.push(agentMessagePlaceholder);

                return { ...c, messages: truncatedMessages };
            }
            return c;
        });

        const chatForCommand = chatsForCommand.find(c => c.id === chat.id)!;
        onProcessCommand(newContent, chatForCommand, activePersona, chatsForCommand);
    };

    const handleVariantChange = (direction: 'prev' | 'next') => {
        setChats(prevChats => prevChats.map(c => {
            if (c.id === chat.id) {
                const messages = [...c.messages];
                const lastMessage = messages[messages.length - 1];
                if (lastMessage?.role === 'agent' && lastMessage.variants && lastMessage.activeVariantIndex !== undefined) {
                    const totalVariants = lastMessage.variants.length;
                    let newIndex = lastMessage.activeVariantIndex;
                    if (direction === 'prev' && newIndex > 0) {
                        newIndex--;
                    } else if (direction === 'next' && newIndex < totalVariants - 1) {
                        newIndex++;
                    }

                    const newVariant = lastMessage.variants[newIndex];
                    if (newVariant) {
                        lastMessage.content = newVariant.content;
                        lastMessage.sources = newVariant.sources;
                        lastMessage.activeVariantIndex = newIndex;
                    }
                }
                return { ...c, messages };
            }
            return c;
        }));
    };
    
    const SUGGESTION_CHIPS = [
        t('chat.suggestionChipComplex'),
        t('chat.suggestionChipProject'),
        t('chat.suggestionChipCompare'),
        t('chat.suggestionChipActAs'),
    ];

    const handleSuggestionClick = (suggestion: string) => {
      setInputText('');
      if (activePersona) {
          const userMessage: Message = { role: 'user', content: suggestion };
          const agentMessagePlaceholder: Message = { role: 'agent', content: '' };
          const updatedChatsArray = chats.map(c => {
              if (c.id === chat.id) {
                  return { ...c, messages: [...c.messages, userMessage, agentMessagePlaceholder] };
              }
              return c;
          });
          const updatedChat = updatedChatsArray.find(c => c.id === chat.id)!;
          onProcessCommand(suggestion, updatedChat, activePersona, updatedChatsArray);
      }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTextSubmit();
        }
    };
    
    const handleChatUpdate = (key: keyof Chat, value: any) => {
        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, [key]: value } : c));
    };

    const handlePersonaChange = (newPersonaId: string) => {
        const newPersona = personas.find(p => p.id === newPersonaId);
        if (newPersona) {
            setChats(prev => prev.map(c => {
                if (c.id === chat.id) {
                    return {
                        ...c,
                        personaId: newPersona.id,
                        model: newPersona.model || 'gemini-3-flash-preview',
                        operatingMode: newPersona.operatingMode || OperatingMode.None,
                        temperature: newPersona.temperature,
                        topK: newPersona.topK,
                        topP: newPersona.topP,
                    };
                }
                return c;
            }));
        }
    };

    const handleNextMessageConfigChange = (key: keyof GenerationConfig, value: number) => {
        setNextMessageConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleResetNextMessageConfig = () => {
        setNextMessageConfig({
            temperature: chat.temperature ?? activePersona?.temperature,
            topK: chat.topK ?? activePersona?.topK,
            topP: chat.topP ?? activePersona?.topP,
        });
    };
    
    const handleExportChat = () => {
        const chatData = JSON.stringify(chat, null, 2);
        const blob = new Blob([chatData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${safeTitle || 'conversa'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const isNextMessageConfigModified = 
        nextMessageConfig.temperature !== (chat.temperature ?? activePersona?.temperature ?? undefined) ||
        nextMessageConfig.topK !== (chat.topK ?? activePersona?.topK ?? undefined) ||
        nextMessageConfig.topP !== (chat.topP ?? activePersona?.topP ?? undefined);

    const isSessionConfigModified = chat.operatingMode !== (activePersona?.operatingMode ?? OperatingMode.None);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [inputText]);

    if (!activePersona) return null; // Or a loading/error state

    return (
        <div className={`h-screen flex flex-col ${isSingleAgentMode ? 'bg-transparent' : 'bg-gray-900'} ${isExiting ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}>
             <header className="py-3 bg-gray-950/70 backdrop-blur-lg sticky top-0 z-10 border-b border-gray-800 flex items-center gap-2 px-4 flex-shrink-0">
               {!isSingleAgentMode && (
                <button onClick={handleGoBack} className="p-2 text-gray-400 hover:bg-gray-800 rounded-full transition-colors flex-shrink-0" aria-label={t('header.backToChats')}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
               )}
              <div className="flex-grow flex flex-col min-w-0">
                  <h1 className="text-lg font-semibold text-white truncate">
                    {chat.title}
                  </h1>
                  {!isSingleAgentMode && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <label htmlFor="persona-select" className="text-xs text-gray-500 font-medium flex-shrink-0">{t('chat.activePersonaLabel')}:</label>
                        <select
                            id="persona-select"
                            value={chat.personaId}
                            onChange={(e) => handlePersonaChange(e.target.value)}
                            className="bg-transparent text-xs text-purple-300 font-semibold focus:outline-none appearance-none cursor-pointer"
                            style={{ maxWidth: '150px' }}
                        >
                            {personas.map(p => (
                                <option key={p.id} value={p.id} className="bg-gray-800 text-white">{p.name}</option>
                            ))}
                        </select>
                    </div>
                  )}
              </div>
              <button onClick={handleExportChat} className="p-2 text-gray-400 hover:bg-gray-800 rounded-full transition-colors flex-shrink-0" aria-label={t('chat.exportConversation')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </header>
            
            <main ref={scrollContainerRef} className="relative flex-grow flex flex-col p-4 overflow-y-auto min-h-0">
              <div className="flex-grow space-y-6 pb-4">
                {chat?.messages.map((msg, index) => {
                    const isLastMessage = index === chat.messages.length - 1;
                    return (
                        <MessageBubble 
                            key={index}
                            index={index} 
                            message={msg}
                            isLastMessage={isLastMessage}
                            onRegenerate={handleRegenerate}
                            onVariantChange={handleVariantChange}
                            onEdit={(newContent) => handleEditUserMessage(index, newContent)}
                            isThinking={status === AgentStatus.Thinking}
                            personaId={chat.personaId}
                            onShowReferralModal={() => {
                                setReferralModalPersonaId(chat.personaId);
                                setIsReferralModalOpen(true);
                            }}
                        />
                    )
                 })}
                {chat.messages.length <= 1 && !isSingleAgentMode && (
                  <div className="w-full max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                        {SUGGESTION_CHIPS.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="bg-gray-800/70 p-4 rounded-lg text-left hover:bg-gray-700/80 transition-all duration-200 border border-gray-700/50 transform hover:scale-[1.02]"
                            >
                                <p className="text-sm font-medium text-gray-200">{suggestion}</p>
                            </button>
                        ))}
                    </div>
                  </div>
                )}
                <div ref={conversationEndRef} />
              </div>
                <div className="sticky bottom-4 w-full flex justify-end pr-4 pointer-events-none">
                    {showScrollButton && (
                        <button 
                            onClick={() => {
                                scrollToBottom();
                                setShowScrollButton(false);
                                setIsUserAtBottom(true);
                            }}
                            className="pointer-events-auto bg-gray-800/80 backdrop-blur-sm text-white p-2 rounded-lg shadow-lg hover:bg-gray-700/80 transition-all animate-fade-in-fast"
                            aria-label={t('chat.scrollToBottom')}
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}
                </div>
            </main>

            <footer className="w-full bg-gray-950/70 backdrop-blur-lg p-4 border-t border-gray-800 flex-shrink-0">
              <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                  <form onSubmit={handleTextSubmit} className="w-full flex items-start gap-3">
                      {isAdvancedInterfaceEnabled && (
                           <button 
                            ref={advancedControlsAnchorRef}
                            type="button" 
                            onClick={() => setIsAdvancedControlsOpen(o => !o)}
                            className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center self-end transition-colors ${isAdvancedControlsOpen ? 'bg-purple-600/50 text-purple-300' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                            aria-label="Open advanced controls"
                           >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                {(isNextMessageConfigModified || isSessionConfigModified) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-gray-950"></span>}
                           </button>
                      )}
                      <div className="relative flex-grow">
                          <textarea
                              ref={textareaRef}
                              value={inputText}
                              onChange={(e) => setInputText(e.target.value)}
                              onKeyDown={handleInputKeyDown}
                              placeholder={t(status !== AgentStatus.Idle ? 'chat.inputPlaceholderThinking' : 'chat.inputPlaceholder')}
                              disabled={status !== AgentStatus.Idle}
                              className="w-full min-h-[48px] max-h-48 py-3 pl-4 pr-24 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 resize-none overflow-y-auto transition-colors"
                              aria-label="Caixa de entrada de comando"
                              rows={1}
                          />
                          <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
                          </div>
                      </div>
                      <button
                        type="submit"
                        disabled={!inputText.trim() || status !== AgentStatus.Idle}
                        className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:bg-gray-600 self-end"
                        aria-label={t('chat.send')}
                      >
                        {status === AgentStatus.Thinking ? (
                           <div className="w-6 h-6 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        )}
                      </button>
                  </form>
              </div>
            </footer>
            {isAdvancedInterfaceEnabled && activePersona && (
                <AdvancedChatControls
                    isOpen={isAdvancedControlsOpen}
                    onClose={() => setIsAdvancedControlsOpen(false)}
                    chat={chat}
                    onChatUpdate={handleChatUpdate}
                    nextMessageConfig={nextMessageConfig}
                    onNextMessageConfigChange={handleNextMessageConfigChange}
                    onResetNextMessageConfig={handleResetNextMessageConfig}
                    anchorRef={advancedControlsAnchorRef}
                />
            )}
            <ProfessionalReferralModal 
                isOpen={isReferralModalOpen}
                onClose={() => setIsReferralModalOpen(false)}
                personaId={referralModalPersonaId}
            />
        </div>
    );
};

export default ChatView;
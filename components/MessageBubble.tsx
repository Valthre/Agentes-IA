import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Message } from '../types';
import CodeBlock from './CodeBlock';
import { useTranslation } from '../i18n';

interface MessageBubbleProps {
  message: Message;
  isLastMessage?: boolean;
  isThinking?: boolean;
  onRegenerate?: () => void;
  onVariantChange?: (direction: 'prev' | 'next') => void;
  onEdit?: (newContent: string) => void;
  personaId?: string;
  onShowReferralModal?: () => void;
  index: number;
}

const AgentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const TypingIndicator = () => (
    <div className="flex items-center gap-1.5 p-2">
        <span className="h-2 w-2 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 bg-blue-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"></span>
    </div>
);


export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLastMessage, onRegenerate, onVariantChange, isThinking, onEdit, personaId, onShowReferralModal, index }) => {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.style.height = 'auto';
        editInputRef.current.style.height = `${editInputRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent.trim() !== message.content) {
        onEdit?.(editedContent.trim());
    }
    setIsEditing(false);
  };
  
  const bubbleClasses = isUser
    ? 'bg-gradient-to-br from-gray-700 to-gray-800 self-end'
    : 'bg-gradient-to-br from-blue-900/60 to-gray-900/50 self-start';

  const containerClasses = isUser
    ? 'justify-end'
    : 'justify-start';
  
  const renderMarkdown = (text: string) => (
    <ReactMarkdown 
        rehypePlugins={[rehypeRaw]}
        components={{
            code({ node, inline, className, children, ...props }) {
                return !inline ? (
                    <CodeBlock className={className} {...props}>
                        {String(children).replace(/\n$/, '')}
                    </CodeBlock>
                ) : (
                    <code className="bg-gray-800 text-purple-300 px-1.5 py-0.5 rounded-md font-mono text-xs" {...props}>
                        {children}
                    </code>
                );
            },
            hr: ({...props}) => <hr className="my-4 border-gray-700/50" {...props} />,
            h3: ({node, ...props}) => <h3 className="mt-4 font-semibold" {...props} />,
        }}
    >{text}</ReactMarkdown>
  );

  const content = message.content;
  const reasoningRegex = /<thinking>([\s\S]*?)<\/thinking>/;
  const reasoningMatch = content.match(reasoningRegex);
  const reasoningText = reasoningMatch ? reasoningMatch[1].trim() : null;
  const mainContent = content.replace(reasoningRegex, '').trim();
  
  const hasVariants = message.variants && message.variants.length > 1;
  const activeVariantIndex = message.activeVariantIndex ?? 0;
  const totalVariants = message.variants?.length ?? 1;

  const handleCopy = () => {
    navigator.clipboard.writeText(mainContent).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  const SENSITIVE_PERSONAS = ['legal-informant', 'financial-advisor', 'finance-guide'];
  const isLegalInformant = personaId === 'legal-informant';

  return (
    <div 
        className={`group flex items-start gap-3 w-full max-w-2xl mx-auto ${containerClasses} animate-fade-in-up opacity-0`}
        style={{ animationDelay: `${Math.min(index * 75, 750)}ms`}}
    >
       {!isUser && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mt-1"><AgentIcon /></div>}
      <div className="w-full max-w-[80%]">
        <div
          className={`px-4 py-3 rounded-2xl text-white shadow-md ${bubbleClasses} border border-white/5`}
        >
          {isEditing && isUser ? (
            <div>
                <textarea
                    ref={editInputRef}
                    value={editedContent}
                    onChange={(e) => {
                        setEditedContent(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    className="w-full bg-transparent text-white border-none focus:outline-none focus:ring-0 resize-none"
                    rows={1}
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs font-semibold text-gray-300 bg-gray-600/50 hover:bg-gray-600 rounded-md transition-colors">
                        {t('messageBubble.cancel')}
                    </button>
                    <button onClick={handleSaveEdit} className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                        {t('messageBubble.saveAndRegenerate')}
                    </button>
                </div>
            </div>
          ) : (
              <>
                {reasoningText && !isUser && (
                    <details className="mb-3 bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                        <summary className="cursor-pointer text-xs font-semibold text-purple-400 hover:text-purple-300 select-none">
                            {t('messageBubble.showReasoning')}
                        </summary>
                        <div className="prose prose-invert prose-sm max-w-none mt-2 pt-2 border-t border-gray-700/50">
                            {renderMarkdown(reasoningText)}
                        </div>
                    </details>
                )}
                <div className="prose prose-invert prose-sm max-w-none break-words prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2">
                    {!isUser && isLastMessage && isThinking && mainContent.trim() === '' ? (
                      <TypingIndicator />
                    ) : (
                      <>
                        {renderMarkdown(mainContent)}
                        {isThinking && isLastMessage && <span className="inline-block w-1 h-4 bg-white/70 ml-1 animate-pulse" />}
                      </>
                    )}
                </div>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-600/50">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">{t('messageBubble.sources')}</h4>
                    <ul className="space-y-1">
                      {message.sources.map((source, index) => (
                        <li key={index} className="truncate">
                          <a 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline text-sm flex items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span className="truncate">{source.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
          )}
        </div>
        
        <div className="mt-2 flex items-center gap-2 flex-wrap">
            {/* Copy Button */}
            {!isUser && (
                 <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={t('messageBubble.copy')}
                >
                    {isCopied ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-green-400">{t('messageBubble.copied')}</span>
                        </>
                    ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                       </svg>
                    )}
                </button>
            )}
            {/* Edit Button */}
            {isUser && !isEditing && (
                 <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={t('messageBubble.editMessage')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                    </svg>
                </button>
            )}

            {/* Regenerate Button - Special order for Legal Informant */}
            {isLastMessage && !isUser && isLegalInformant && (
                <button 
                    onClick={onRegenerate}
                    disabled={isThinking}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-wait transition-colors"
                    aria-label={t('messageBubble.regenerate')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120 12M20 20l-1.5-1.5A9 9 0 004 12" />
                    </svg>
                </button>
            )}
            
            {/* Professional Referral Button */}
             {!isUser && SENSITIVE_PERSONAS.includes(personaId ?? '') && (
                <button
                    onClick={onShowReferralModal}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={t('messageBubble.whenToSeekProfessional')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{t('messageBubble.whenToSeekProfessional')}</span>
                </button>
            )}
            
            {/* Last Message Actions - Standard Order */}
            {isLastMessage && !isUser && (
                <>
                    {hasVariants && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-md">
                            <button 
                                onClick={() => onVariantChange?.('prev')}
                                disabled={activeVariantIndex === 0}
                                className="disabled:opacity-50 hover:text-white transition-colors"
                                aria-label={t('messageBubble.prevResponse')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span>{activeVariantIndex + 1} / {totalVariants}</span>
                             <button 
                                onClick={() => onVariantChange?.('next')}
                                disabled={activeVariantIndex === totalVariants - 1}
                                className="disabled:opacity-50 hover:text-white transition-colors"
                                aria-label={t('messageBubble.nextResponse')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    )}
                    {/* Regenerate Button - for non-legal agents */}
                    {!isLegalInformant && (
                        <button 
                            onClick={onRegenerate}
                            disabled={isThinking}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-wait transition-colors"
                            aria-label={t('messageBubble.regenerate')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120 12M20 20l-1.5-1.5A9 9 0 004 12" />
                            </svg>
                        </button>
                    )}
                </>
            )}
        </div>
      </div>
      {isUser && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mt-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>}
    </div>
  );
};
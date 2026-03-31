import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import CodeBlock from './CodeBlock';
import { useTranslation } from '../i18n';

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface ThinkingExtractionResult {
  thinkingBlocks: string[];
  mainContent: string;
  isComplete: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SENSITIVE_PERSONAS = [
  'legal-informant',
  'financial-advisor',
  'finance-guide',
  'wise-investor',
];

// Patterns to match thinking/reasoning blocks (order matters: most specific first)
const THINKING_PATTERNS: { open: RegExp; close: RegExp; tag: string }[] = [
  { open: /<thinking>/i, close: /<\/thinking>/i, tag: 'thinking' },
  { open: /<think>/i, close: /<\/think>/i, tag: 'think' },
  { open: /<reasoning>/i, close: /<\/reasoning>/i, tag: 'reasoning' },
  { open: /<reason>/i, close: /<\/reason>/i, tag: 'reason' },
  { open: /<inner_monologue>/i, close: /<\/inner_monologue>/i, tag: 'inner_monologue' },
  { open: /<reflection>/i, close: /<\/reflection>/i, tag: 'reflection' },
  { open: /```thinking\s*\n/i, close: /```/i, tag: '```thinking' },
];

// ─── Thinking Extraction (robust, multi-block, multi-tag) ────────────────────

function extractThinking(content: string): ThinkingExtractionResult {
  const thinkingBlocks: string[] = [];
  let remaining = content;
  let allComplete = true;

  for (const pattern of THINKING_PATTERNS) {
    let safety = 0;
    while (safety++ < 50) {
      const openMatch = pattern.open.exec(remaining);
      if (!openMatch) break;

      const afterOpen = remaining.slice(openMatch.index + openMatch[0].length);
      const closeMatch = pattern.close.exec(afterOpen);

      if (closeMatch) {
        // Complete block
        const blockContent = afterOpen.slice(0, closeMatch.index).trim();
        if (blockContent) thinkingBlocks.push(blockContent);
        // Remove the full block from remaining
        remaining =
          remaining.slice(0, openMatch.index) +
          afterOpen.slice(closeMatch.index + closeMatch[0].length);
      } else {
        // Unclosed block — still streaming
        const blockContent = afterOpen.trim();
        if (blockContent) thinkingBlocks.push(blockContent);
        remaining = remaining.slice(0, openMatch.index);
        allComplete = false;
        break; // no point continuing this pattern
      }
    }
  }

  // Clean up leftover whitespace / blank lines
  remaining = remaining.replace(/\n{3,}/g, '\n\n').trim();

  return {
    thinkingBlocks,
    mainContent: remaining,
    isComplete: allComplete,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const AgentAvatar: React.FC = () => (
  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mt-0.5 shadow-lg shadow-blue-900/30 ring-1 ring-white/10">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  </div>
);

const UserAvatar: React.FC = () => (
  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center mt-0.5 shadow-lg shadow-gray-900/30 ring-1 ring-white/10">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  </div>
);

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1.5 py-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-2 w-2 rounded-full bg-blue-400/80"
        style={{
          animation: 'messagePulse 1.4s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes messagePulse {
        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1.1); }
      }
    `}</style>
  </div>
);

// ─── Thinking Panel ─────────────────────────────────────────────────────────

interface ThinkingPanelProps {
  blocks: string[];
  isComplete: boolean;
  renderMarkdown: (text: string) => React.ReactNode;
  t: (key: string) => string;
}

const ThinkingPanel: React.FC<ThinkingPanelProps> = ({
  blocks,
  isComplete,
  renderMarkdown,
  t,
}) => {
  const [isOpen, setIsOpen] = useState(!isComplete);

  // Auto-open while streaming, but let user toggle
  useEffect(() => {
    if (!isComplete) setIsOpen(true);
  }, [isComplete]);

  const combinedText = blocks.join('\n\n---\n\n');

  return (
    <div className="mb-3 rounded-xl border border-purple-500/20 bg-gray-950/60 overflow-hidden shadow-inner backdrop-blur-sm">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/5 transition-all duration-200 select-none"
        aria-expanded={isOpen}
      >
        {/* Icon */}
        <div
          className={`flex-shrink-0 p-1 rounded-lg ${
            isComplete
              ? 'bg-purple-500/10 text-purple-400'
              : 'bg-purple-500/20 text-purple-300'
          }`}
        >
          {isComplete ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
        </div>

        {/* Label */}
        <span className="flex-1 text-left">
          {isComplete
            ? t('messageBubble.showReasoning')
            : t('messageBubble.thinking')}
        </span>

        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Collapsible content with smooth transition */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-2 border-t border-purple-500/10">
          <div className="prose prose-invert prose-sm max-w-none text-gray-400 leading-relaxed">
            {renderMarkdown(combinedText)}
            {!isComplete && (
              <span className="inline-block w-1.5 h-4 bg-purple-400/70 ml-0.5 rounded-sm animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Action Button ──────────────────────────────────────────────────────────

interface ActionButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  icon: React.ReactNode;
  text?: string;
  variant?: 'default' | 'warning' | 'success';
  alwaysVisible?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled,
  label,
  icon,
  text,
  variant = 'default',
  alwaysVisible = false,
}) => {
  const colorClasses = {
    default: 'text-gray-500 hover:text-gray-200 hover:bg-gray-700/50',
    warning: 'text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10',
    success: 'text-green-400 hover:text-green-300',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
        ${colorClasses[variant]}
        ${alwaysVisible ? '' : 'opacity-0 group-hover:opacity-100'}
      `}
      aria-label={label}
    >
      {icon}
      {text && <span className="hidden sm:inline">{text}</span>}
    </button>
  );
};

// ─── Edit Panel ─────────────────────────────────────────────────────────────

interface EditPanelProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

const EditPanel: React.FC<EditPanelProps> = ({
  initialContent,
  onSave,
  onCancel,
  t,
}) => {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  const handleSave = () => {
    const trimmed = content.trim();
    if (trimmed && trimmed !== initialContent) {
      onSave(trimmed);
    }
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
  };

  return (
    <div className="space-y-3">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        onKeyDown={handleKeyDown}
        className="w-full bg-gray-900/50 text-white border border-gray-600/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none text-sm leading-relaxed"
        rows={1}
      />
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-gray-500">
          Ctrl+Enter to save · Esc to cancel
        </span>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
          >
            {t('messageBubble.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm shadow-blue-900/30"
          >
            {t('messageBubble.saveAndRegenerate')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Sources Panel ──────────────────────────────────────────────────────────

interface SourcesPanelProps {
  sources: { uri: string; title: string }[];
  t: (key: string) => string;
}

const SourcesPanel: React.FC<SourcesPanelProps> = ({ sources, t }) => (
  <div className="mt-3 pt-3 border-t border-gray-700/40">
    <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
      {t('messageBubble.sources')}
    </h4>
    <ul className="space-y-1.5">
      {sources.map((source, i) => (
        <li key={i}>
          <a
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400/90 hover:text-blue-300 hover:underline text-sm flex items-center gap-2 group/link py-0.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 flex-shrink-0 opacity-60 group-hover/link:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span className="truncate">{source.title}</span>
          </a>
        </li>
      ))}
    </ul>
  </div>
);

// ─── Icons ──────────────────────────────────────────────────────────────────

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"
    />
  </svg>
);

const RegenerateIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120 12M20 20l-1.5-1.5A9 9 0 004 12"
    />
  </svg>
);

const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 5l7 7-7 7"
    />
  </svg>
);

// ─── Main Component ─────────────────────────────────────────────────────────

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLastMessage,
  onRegenerate,
  onVariantChange,
  isThinking,
  onEdit,
  personaId,
  onShowReferralModal,
  index,
}) => {
  const { t } = useTranslation();
  const isUser = message.role === 'user';

  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // ── Thinking extraction (memoized) ──────────────────────────────────────

  const { thinkingBlocks, mainContent, isComplete } = useMemo(() => {
    if (isUser) {
      return { thinkingBlocks: [], mainContent: message.content, isComplete: true };
    }
    return extractThinking(message.content);
  }, [message.content, isUser]);

  const hasThinking = thinkingBlocks.length > 0;

  // ── Variant state ───────────────────────────────────────────────────────

  const hasVariants = (message.variants?.length ?? 0) > 1;
  const activeVariantIndex = message.activeVariantIndex ?? 0;
  const totalVariants = message.variants?.length ?? 1;
  const isSensitivePersona = SENSITIVE_PERSONAS.includes(personaId ?? '');
  const isLegalInformant = personaId === 'legal-informant';

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(mainContent).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [mainContent]);

  const handleEdit = useCallback(
    (newContent: string) => {
      onEdit?.(newContent);
      setIsEditing(false);
    },
    [onEdit],
  );

  // ── Markdown renderer ──────────────────────────────────────────────────

  const renderMarkdown = useCallback(
    (text: string) => (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Safety: if thinking tags leak through
          // @ts-ignore
          thinking: ({ children }) => (
            <div className="italic text-gray-400 border-l-2 border-purple-500/30 pl-3 my-2">
              {children}
            </div>
          ),
          // @ts-ignore
          think: ({ children }) => (
            <div className="italic text-gray-400 border-l-2 border-purple-500/30 pl-3 my-2">
              {children}
            </div>
          ),
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <CodeBlock className={className}>
                {String(children).replace(/\n$/, '')}
              </CodeBlock>
            ) : (
              <code
                className="bg-gray-800/80 text-purple-300 px-1.5 py-0.5 rounded-md font-mono text-[13px] border border-gray-700/50"
                {...rest}
              >
                {children}
              </code>
            );
          },
          table: ({ node, ...props }) => (
            <div className="not-prose my-5 w-full overflow-x-auto rounded-xl border border-gray-700/50 bg-gray-900/40 shadow-sm">
              <table
                className="w-full text-sm text-left border-collapse text-gray-200"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              className="bg-gray-800/80 text-xs uppercase text-gray-400 tracking-wider border-b border-gray-700/50"
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 font-semibold" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-gray-700/40" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr
              className="hover:bg-gray-800/40 transition-colors duration-150"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 align-top leading-relaxed" {...props} />
          ),
          hr: ({ ...props }) => (
            <hr className="my-5 border-gray-700/40" {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1
              className="text-xl font-bold mt-6 mb-3 text-gray-100"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-lg font-semibold mt-5 mb-2 text-gray-100"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-base font-semibold mt-4 mb-2 text-gray-200"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-3 border-blue-500/40 pl-4 my-3 text-gray-400 italic"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 decoration-blue-400/30 hover:decoration-blue-300/50 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    ),
    [],
  );

  // ── Render ─────────────────────────────────────────────────────────────

  const showStreamingCursor =
    isThinking && isLastMessage && isComplete && !isUser;
  const showTypingIndicator =
    !isUser &&
    isLastMessage &&
    isThinking &&
    mainContent.trim() === '' &&
    isComplete;

  return (
    <div
      className={`group flex items-start gap-3 w-full max-w-2xl mx-auto ${
        isUser ? 'justify-end' : 'justify-start'
      } animate-fade-in-up opacity-0`}
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
    >
      {/* Avatar (left for assistant) */}
      {!isUser && <AgentAvatar />}

      {/* Content column */}
      <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} min-w-0 max-w-[85%] sm:max-w-[80%]`}>
        {/* Bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl text-white shadow-lg transition-shadow duration-200 ${
            isUser
              ? 'bg-gradient-to-br from-gray-700/90 to-gray-800/90 rounded-tr-md'
              : 'bg-gradient-to-br from-blue-950/50 to-gray-900/60 rounded-tl-md'
          } border border-white/[0.06] backdrop-blur-sm`}
        >
          {isEditing && isUser ? (
            <EditPanel
              initialContent={message.content}
              onSave={handleEdit}
              onCancel={() => setIsEditing(false)}
              t={t}
            />
          ) : (
            <>
              {/* Thinking panel */}
              {hasThinking && !isUser && (
                <ThinkingPanel
                  blocks={thinkingBlocks}
                  isComplete={isComplete || !isThinking}
                  renderMarkdown={renderMarkdown}
                  t={t}
                />
              )}

              {/* Main content */}
              <div
                className="prose prose-invert prose-sm max-w-none break-words
                  prose-p:my-1.5 prose-p:leading-relaxed
                  prose-headings:my-3 
                  prose-ul:my-2 prose-ol:my-2
                  prose-li:my-0.5
                  prose-pre:my-3"
              >
                {showTypingIndicator ? (
                  <TypingIndicator />
                ) : (
                  <>
                    {renderMarkdown(mainContent)}
                    {showStreamingCursor && (
                      <span className="inline-block w-0.5 h-[1.1em] bg-white/70 ml-0.5 rounded-full animate-pulse align-text-bottom" />
                    )}
                  </>
                )}
              </div>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <SourcesPanel sources={message.sources} t={t} />
              )}
            </>
          )}
        </div>

        {/* Action toolbar */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 px-1 flex-wrap min-h-[28px]">
            {/* Copy (assistant only) */}
            {!isUser && (
              <ActionButton
                onClick={handleCopy}
                label={t('messageBubble.copy')}
                icon={isCopied ? <CheckIcon /> : <CopyIcon />}
                text={isCopied ? t('messageBubble.copied') : undefined}
                variant={isCopied ? 'success' : 'default'}
                alwaysVisible={isCopied}
              />
            )}

            {/* Edit (user only) */}
            {isUser && (
              <ActionButton
                onClick={() => setIsEditing(true)}
                label={t('messageBubble.editMessage')}
                icon={<EditIcon />}
              />
            )}

            {/* Regenerate (legal agent gets it always visible) */}
            {isLastMessage && !isUser && isLegalInformant && (
              <ActionButton
                onClick={onRegenerate}
                disabled={isThinking}
                label={t('messageBubble.regenerate')}
                icon={<RegenerateIcon />}
                alwaysVisible
              />
            )}

            {/* Professional referral */}
            {!isUser && isSensitivePersona && (
              <ActionButton
                onClick={onShowReferralModal}
                label={t('messageBubble.whenToSeekProfessional')}
                icon={<InfoIcon />}
                text={t('messageBubble.whenToSeekProfessional')}
                variant="warning"
              />
            )}

            {/* Variant navigation + regenerate for last message */}
            {isLastMessage && !isUser && (
              <>
                {hasVariants && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-800/40 px-2 py-1 rounded-lg border border-gray-700/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onVariantChange?.('prev')}
                      disabled={activeVariantIndex === 0}
                      className="disabled:opacity-30 hover:text-white transition-colors p-0.5"
                      aria-label={t('messageBubble.prevResponse')}
                    >
                      <ChevronLeftIcon />
                    </button>
                    <span className="tabular-nums min-w-[3ch] text-center">
                      {activeVariantIndex + 1}/{totalVariants}
                    </span>
                    <button
                      onClick={() => onVariantChange?.('next')}
                      disabled={activeVariantIndex === totalVariants - 1}
                      className="disabled:opacity-30 hover:text-white transition-colors p-0.5"
                      aria-label={t('messageBubble.nextResponse')}
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                )}

                {!isLegalInformant && (
                  <ActionButton
                    onClick={onRegenerate}
                    disabled={isThinking}
                    label={t('messageBubble.regenerate')}
                    icon={<RegenerateIcon />}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Avatar (right for user) */}
      {isUser && <UserAvatar />}
    </div>
  );
};
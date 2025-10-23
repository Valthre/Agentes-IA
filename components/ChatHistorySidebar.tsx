import React, { useState, useMemo } from 'react';
import { Chat } from '../types';
import { useTranslation } from '../i18n';

interface ChatHistoryViewProps {
  chats: Chat[];
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
}

const ChatListItem: React.FC<{
    chat: Chat;
    onSelect: () => void;
    onDelete: () => void;
    onRename: (newTitle: string) => void;
}> = ({ chat, onSelect, onDelete, onRename }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(chat.title);
    const { t } = useTranslation();

    const handleRename = () => {
        if (title.trim()) {
            onRename(title.trim());
        }
        setIsEditing(false);
    };
    
    const handleDelete = () => {
        if (window.confirm(t('chatHistory.confirmDelete', { title: chat.title }))) {
            onDelete();
        }
    };

    return (
        <div className="group flex items-center gap-2 p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
            <div className="flex-grow min-w-0" onClick={() => !isEditing && onSelect()}>
                {isEditing ? (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                    />
                ) : (
                    <p className="text-white font-medium truncate text-sm">{chat.title}</p>
                )}
                <p className="text-gray-400 text-xs truncate mt-1">
                    {chat.messages.slice(-1)[0]?.content || t('chatHistory.empty')}
                </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-400 hover:text-white"
                    aria-label={t('chatHistory.rename')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                </button>
                <button
                    onClick={handleDelete}
                    className="p-2 text-gray-400 hover:text-red-500"
                    aria-label={t('chatHistory.delete')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        </div>
    );
};


export const ChatHistoryView: React.FC<ChatHistoryViewProps> = ({ chats, onSelectChat, onDeleteChat, onRenameChat }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useTranslation();

    const filteredChats = useMemo(() => {
        if (!searchQuery) return chats;
        return chats.filter(chat =>
            chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [chats, searchQuery]);

    return (
        <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4">
            <header className="py-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-white">{t('chatHistory.title')}</h1>
                <div className="relative mt-4">
                    <input
                        type="text"
                        placeholder={t('chatHistory.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </header>

            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
                {filteredChats.length > 0 ? (
                    filteredChats.map(chat => (
                        <ChatListItem
                            key={chat.id}
                            chat={chat}
                            onSelect={() => onSelectChat(chat.id)}
                            onDelete={() => onDeleteChat(chat.id)}
                            onRename={(newTitle) => onRenameChat(chat.id, newTitle)}
                        />
                    ))
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-400">{t('chatHistory.noChats')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
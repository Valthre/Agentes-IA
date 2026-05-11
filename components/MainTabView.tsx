import React from 'react';
import { Persona, Chat, LlmProvider } from '../types';
import { AppTab } from '../App';
import { HubView } from './HubView';
import { BottomNavBar } from './BottomNavBar';
import { ChatHistoryView } from './ChatHistorySidebar';
import { WebAgentView } from './WebAgentView';
import { SettingsView } from './SettingsModal';


interface MainTabViewProps {
    activeTab: AppTab;
    setActiveTab: (tab: AppTab) => void;
    personas: Persona[];
    chats: Chat[];
    onSelectChat: (id: string) => void;
    onSelectAgent: (agent: Persona) => void;
    onNewChat: (persona?: Persona) => void;
    onDeleteChat: (id: string) => void;
    onClearAll: () => void;
    onRenameChat: (id: string, newTitle: string) => void;
    onSavePersonas: (personas: Persona[]) => void;
    apiKeys: { [key in LlmProvider]?: string };
    onSaveApiKeys: (apiKeys: { [key in LlmProvider]?: string }, defaultProvider: LlmProvider) => void;
    defaultProvider: LlmProvider;
    advancedInterfaceEnabled: boolean;
    onSetAdvancedInterface: (enabled: boolean) => void;
    onImportChats: (chats: Chat[]) => void;
}

const MainTabView: React.FC<MainTabViewProps> = (props) => {
    
    const renderActiveTab = () => {
        switch (props.activeTab) {
            case 'hub':
                return <HubView 
                            personas={props.personas} 
                            chats={props.chats} 
                            onSelectChat={props.onSelectChat} 
                            onSelectAgent={props.onSelectAgent} 
                        />;
            case 'chats':
                return <ChatHistoryView 
                            chats={props.chats}
                            onSelectChat={props.onSelectChat}
                            onDeleteChat={props.onDeleteChat}
                            onClearAll={props.onClearAll}
                            onRenameChat={props.onRenameChat}
                            onImportChats={props.onImportChats}
                        />;
            case 'web':
                return <WebAgentView
                            personas={props.personas}
                            apiKeys={props.apiKeys}
                        />;
            case 'settings':
                return <SettingsView 
                            personas={props.personas}
                            onSavePersonas={props.onSavePersonas}
                            apiKeys={props.apiKeys}
                            onSaveApiKeys={props.onSaveApiKeys}
                            defaultProvider={props.defaultProvider}
                            advancedInterfaceEnabled={props.advancedInterfaceEnabled}
                            onSetAdvancedInterface={props.onSetAdvancedInterface}
                        />;
            default:
                return <HubView 
                            personas={props.personas} 
                            chats={props.chats} 
                            onSelectChat={props.onSelectChat} 
                            onSelectAgent={props.onSelectAgent} 
                        />;
        }
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <main className="flex-1 overflow-y-auto pb-24">
                {renderActiveTab()}
            </main>
            <BottomNavBar 
                activeTab={props.activeTab} 
                onTabChange={props.setActiveTab} 
                onNewChat={props.onNewChat}
            />
        </div>
    );
};

export default MainTabView;
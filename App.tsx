import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Chat, Persona, Message, AgentStatus, LlmProvider, GenerationConfig, OperatingMode } from './types';
// Fix: Corrected import path to point to the module in the 'personas' directory.
import { initialPersonas } from './personas/index';
import { getLlmService } from './services/llmService';
import * as usageService from './services/usageService';
import ApiKeyModal from './components/ApiKeyModal';
import ChatView from './components/ChatView';
import MainTabView from './components/MainTabView';
import { useTranslation } from './i18n';

const API_KEYS_KEY = 'llm-api-keys';
const PERSONAS_KEY = 'ai-agent-personas';
const CHATS_KEY = 'ai-agent-chats';
const ADVANCED_UI_KEY = 'ai-agent-advanced-ui';
const DEFAULT_PROVIDER_KEY = 'llm-default-provider';

export type AppTab = 'hub' | 'chats' | 'web' | 'settings';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<{ [key in LlmProvider]?: string } | null>(null);
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('hub');
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.Idle);
  const [isAdvancedInterfaceEnabled, setAdvancedInterfaceEnabled] = useState<boolean>(false);
  const [defaultProvider, setDefaultProvider] = useState<LlmProvider>('gemini');
  
  const [isSingleAgentMode, setIsSingleAgentMode] = useState(false);
  const [singleAgentModeError, setSingleAgentModeError] = useState<string | null>(null);
  const [isInitialising, setIsInitialising] = useState(true);
  const [toast, setToast] = useState<string | null>(null);


  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Initial load from localStorage and URL check
  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem(API_KEYS_KEY);
      const savedPersonas = localStorage.getItem(PERSONAS_KEY);
      const savedChats = localStorage.getItem(CHATS_KEY);
      const savedAdvancedUI = localStorage.getItem(ADVANCED_UI_KEY);
      const savedDefaultProvider = localStorage.getItem(DEFAULT_PROVIDER_KEY);

      const loadedKeys = savedKeys ? JSON.parse(savedKeys) : {};
      setApiKeys(loadedKeys);
      if (savedPersonas) setPersonas(JSON.parse(savedPersonas));
      if (savedChats) setChats(JSON.parse(savedChats));
      if (savedAdvancedUI) setAdvancedInterfaceEnabled(JSON.parse(savedAdvancedUI));
      if (savedDefaultProvider) setDefaultProvider(JSON.parse(savedDefaultProvider));

      // Single Agent Mode Check - Now using hash routing
      const hash = window.location.hash.substring(1); // Remove '#'
      const urlParams = new URLSearchParams(hash.startsWith('?') ? hash.substring(1) : hash);
      const agentId = urlParams.get('agent');
      const expires = urlParams.get('expires');

      if (agentId) {
        if (expires && new Date().getTime() > parseInt(expires)) {
          setSingleAgentModeError(t('errors.linkExpired'));
          return;
        }
        
        const allPersonas = savedPersonas ? JSON.parse(savedPersonas) : initialPersonas;
        const agent = allPersonas.find((p: Persona) => p.id === agentId);

        if (agent) {
          setIsSingleAgentMode(true);
          document.body.className = 'bg-transparent';
          
          const newChat: Chat = {
            id: uuidv4(),
            title: agent.name,
            personaId: agent.id,
            model: agent.model || 'gemini-3-flash-preview',
            provider: agent.provider || (savedDefaultProvider ? JSON.parse(savedDefaultProvider) : 'gemini'),
            operatingMode: agent.operatingMode || OperatingMode.None,
            temperature: agent.temperature,
            topK: agent.topK,
            topP: agent.topP,
            messages: agent.greeting ? [{ role: 'agent', content: agent.greeting }] : [],
          };
          // This state update needs to be consistent with how chats are managed
          setChats(prev => [newChat, ...prev]);
          setActiveChatId(newChat.id);

        } else {
          setSingleAgentModeError(t('errors.agentNotFound'));
        }
      }

    } catch (error) {
      console.error("Error loading data", error);
      setApiKeys({});
      setSingleAgentModeError(t('errors.invalidLink'));
    } finally {
        setIsInitialising(false);
    }
  }, [t]);

  useEffect(() => { if (apiKeys !== null) localStorage.setItem(API_KEYS_KEY, JSON.stringify(apiKeys)); }, [apiKeys]);
  useEffect(() => { localStorage.setItem(PERSONAS_KEY, JSON.stringify(personas)); }, [personas]);
  useEffect(() => { localStorage.setItem(CHATS_KEY, JSON.stringify(chats)); }, [chats]);
  useEffect(() => { localStorage.setItem(ADVANCED_UI_KEY, JSON.stringify(isAdvancedInterfaceEnabled)); }, [isAdvancedInterfaceEnabled]);
  useEffect(() => { localStorage.setItem(DEFAULT_PROVIDER_KEY, JSON.stringify(defaultProvider)); }, [defaultProvider]);

  const handleSaveApiKeys = (keys: { [key in LlmProvider]?: string }, provider: LlmProvider) => {
    setApiKeys(keys);
    setDefaultProvider(provider);
  };

  const processCommand = useCallback(async (
    command: string, 
    chatForCommand: Chat, 
    activePersona: Persona, 
    updatedChats: Chat[],
    nextMessageConfig?: GenerationConfig
  ) => {
      
    setChats(updatedChats);
    setStatus(AgentStatus.Thinking);

    const provider = chatForCommand.provider;
    const apiKey = apiKeys?.[provider];

    if (!apiKey) {
        setStatus(AgentStatus.Error);
        // Handle error display in chat window
        return;
    }

    try {
      const llmService = getLlmService(provider);
      // We take all messages except the last one (which is the agent's placeholder)
      const history = chatForCommand.messages.slice(0, -1);
      
      const generationConfig: GenerationConfig = {
          ...nextMessageConfig
      };
      
      // Inject available agents into the prompt so the agent knows who to recommend
      const availableAgentsList = personas.map(p => `- **${p.name}**: ${p.description || 'Especialista'}`).join('\n');
      
      const globalThinkingInstruction = `\n\n**DIRETRIZ OBRIGATÓRIA DE RACIOCÍNIO (THINKING):**\nAntes de fornecer sua resposta final ao usuário, você DEVE estruturar todo o seu raciocínio, planejamento e análise dentro de tags <thinking> e </thinking>. NADA deve ser escrito antes de abrir a tag <thinking>. Sua resposta final ao usuário deve começar EXATAMENTE após o fechamento da tag </thinking>.`;
      
      const injectedPrompt = `${activePersona.prompt}\n\n---\n\n**Agentes Disponíveis no Sistema:**\nVocê pode recomendar os seguintes agentes caso a necessidade do usuário fuja da sua especialidade:\n${availableAgentsList}${globalThinkingInstruction}`;
      const personaWithContext = { ...activePersona, prompt: injectedPrompt };
      
      const stream = llmService.streamAiChatResponse(
          command, 
          history, 
          chatForCommand.model, 
          apiKey, 
          personaWithContext,
          generationConfig
      );

      let fullText = '';
      let sources: any[] = [];
      let error = '';

      if (provider === 'gemini') {
        usageService.recordRequest(chatForCommand.model as any);
      }

      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
          setChats(prev => prev.map(c => 
            c.id === chatForCommand.id 
              ? { ...c, messages: c.messages.map((m, i) => i === c.messages.length - 1 ? { ...m, content: fullText } : m) }
              : c
          ));
        }
        if (chunk.sources) {
          sources = [...new Map([...sources, ...chunk.sources].map(item => [item.uri, item])).values()];
          setChats(prev => prev.map(c => 
            c.id === chatForCommand.id 
              ? { ...c, messages: c.messages.map((m, i) => i === c.messages.length - 1 ? { ...m, sources } : m) }
              : c
          ));
        }
        if (chunk.error) {
          error = chunk.error;
          setChats(prev => prev.map(c => 
            c.id === chatForCommand.id 
              ? { ...c, messages: c.messages.map((m, i) => i === c.messages.length - 1 ? { ...m, content: `Error: ${error}` } : m) }
              : c
          ));
          break;
        }
      }
      
      // After streaming is complete, update variants for regeneration
      setChats(prev => prev.map(c => {
        if (c.id === chatForCommand.id) {
          const messages = [...c.messages];
          const lastMessage = messages[messages.length - 1];
          if (lastMessage?.role === 'agent') {
            const newVariant = { content: fullText, sources: sources };
            const existingVariants = lastMessage.variants || [];
            lastMessage.variants = [...existingVariants, newVariant];
            lastMessage.activeVariantIndex = existingVariants.length;
          }
          return { ...c, messages };
        }
        return c;
      }));


    } catch (e) {
      console.error(e);
      setChats(prev => prev.map(c => 
        c.id === chatForCommand.id 
          ? { ...c, messages: c.messages.map((m, i) => i === c.messages.length - 1 ? { ...m, content: `An unexpected error occurred.` } : m) }
          : c
      ));
    } finally {
      setStatus(AgentStatus.Idle);
    }
  }, [apiKeys]);
  
  const handleNewChat = (persona?: Persona) => {
    const activePersona = persona || personas.find(p => p.id === 'default') || personas[0];
    const newChat: Chat = {
      id: uuidv4(),
      title: 'Nova Conversa',
      personaId: activePersona.id,
      model: activePersona.model || 'gemini-3-flash-preview',
      provider: activePersona.provider || defaultProvider,
      operatingMode: activePersona.operatingMode || OperatingMode.None,
      temperature: activePersona.temperature,
      topK: activePersona.topK,
      topP: activePersona.topP,
      messages: activePersona.greeting ? [{ role: 'agent', content: activePersona.greeting }] : [],
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };
  
  const handleSelectAgent = (agent: Persona) => {
      handleNewChat(agent);
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
  };

  const handleGoBack = () => {
    setActiveChatId(null);
  };

  const handleDeleteChat = (id: string) => {
      setChats(prev => prev.filter(c => c.id !== id));
      if (activeChatId === id) {
          setActiveChatId(null);
      }
  };
  
  const handleRenameChat = (id: string, newTitle: string) => {
      setChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };
  
  const handleSavePersonas = (updatedPersonas: Persona[]) => {
      setPersonas(updatedPersonas);
  };

  const handleImportChats = (importedChats: Chat[]) => {
    const combinedChats = [...importedChats, ...chats];
    const chatMap = new Map(combinedChats.map(c => [c.id, c]));
    const uniqueChats = Array.from(chatMap.values());
    
    // Sort by the last message timestamp if available
    uniqueChats.sort((a, b) => {
        const lastMsgA = a.messages[a.messages.length - 1] as any;
        const lastMsgB = b.messages[b.messages.length - 1] as any;
        const timeA = lastMsgA?.timestamp || 0;
        const timeB = lastMsgB?.timestamp || 0;
        return timeB - timeA;
    });

    setChats(uniqueChats);
    showToast(t('chatHistory.importSuccess', { count: importedChats.length }));
  };
  
  const handleSetAdvancedInterface = (enabled: boolean) => {
    setAdvancedInterfaceEnabled(enabled);
  };
  
  const activeChat = chats.find(c => c.id === activeChatId);
  const needsApiKey = apiKeys === null || !Object.values(apiKeys).some(k => k);

  if (isInitialising || (apiKeys === null && !isSingleAgentMode)) {
    return <div className="bg-gray-950 w-full h-screen"></div>; // Loading state
  }
  
  if (singleAgentModeError) {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center text-center p-4 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 className="text-2xl font-bold mb-2">{singleAgentModeError}</h2>
            <p className="text-gray-400 mb-6">{t('errors.invalidLink')}</p>
            <button onClick={() => window.location.href = window.location.origin + window.location.pathname} className="px-4 py-2 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                {t('errors.backToApp')}
            </button>
        </div>
    );
  }

  if (needsApiKey && !isSingleAgentMode) {
    return <ApiKeyModal onSave={handleSaveApiKeys} />;
  }
  
  const AppUI = (
    <>
      {activeChat ? (
        <ChatView
          chat={activeChat}
          chats={chats}
          personas={personas}
          onGoBack={handleGoBack}
          onProcessCommand={processCommand}
          setChats={setChats}
          apiKeys={apiKeys}
          status={status}
          setStatus={setStatus}
          isAdvancedInterfaceEnabled={isAdvancedInterfaceEnabled}
          isSingleAgentMode={isSingleAgentMode}
        />
      ) : (
        <MainTabView
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          personas={personas}
          chats={chats}
          onSelectChat={handleSelectChat}
          onSelectAgent={handleSelectAgent}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          onSavePersonas={handleSavePersonas}
          onImportChats={handleImportChats}
          apiKeys={apiKeys}
          onSaveApiKeys={handleSaveApiKeys}
          defaultProvider={defaultProvider}
          advancedInterfaceEnabled={isAdvancedInterfaceEnabled}
          onSetAdvancedInterface={handleSetAdvancedInterface}
        />
      )}
    </>
  );

  return (
    <>
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 animate-toast-in border border-green-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
      {AppUI}
    </>
  );
};

export default App;
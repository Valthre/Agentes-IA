import React, { useState, useEffect } from 'react';
import { Persona, LlmProvider } from '../types';
import { useTranslation } from '../i18n';
import { ApiUsageView } from './ApiUsageView';

interface SettingsViewProps {
  personas: Persona[];
  onSavePersonas: (personas: Persona[]) => void;
  apiKeys: { [key in LlmProvider]?: string };
  onSaveApiKeys: (apiKeys: { [key in LlmProvider]?: string }, defaultProvider: LlmProvider) => void;
  defaultProvider: LlmProvider;
  advancedInterfaceEnabled: boolean;
  onSetAdvancedInterface: (enabled: boolean) => void;
}

type SettingsTab = 'personas' | 'language' | 'apiKey' | 'apiUsage' | 'interface';

export const SettingsView: React.FC<SettingsViewProps> = ({ 
    personas, onSavePersonas, 
    apiKeys, onSaveApiKeys, defaultProvider,
    advancedInterfaceEnabled, onSetAdvancedInterface
}) => {
  const [localPersonas, setLocalPersonas] = useState<Persona[]>([]);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('personas');
  const [localApiKeys, setLocalApiKeys] = useState(apiKeys);
  const [localDefaultProvider, setLocalDefaultProvider] = useState(defaultProvider);
  const { t, language, changeLanguage } = useTranslation();
  const [toast, setToast] = useState<string | null>(null);
  
  const [apiKeyActiveTab, setApiKeyActiveTab] = useState<LlmProvider>('gemini');

  useEffect(() => {
      setLocalPersonas(personas);
      setLocalApiKeys(apiKeys);
      setLocalDefaultProvider(defaultProvider);
  }, [personas, apiKeys, defaultProvider]);
  
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    onSavePersonas(localPersonas);
    onSaveApiKeys(localApiKeys, localDefaultProvider);
    showToast(t('modals.settings.saved'));
  };
  
  const handleAddNew = () => {
    const newPersona: Persona = {
        id: `custom-${Date.now()}`,
        name: 'Novo Agente Personalizado',
        prompt: 'Descreva a personalidade e as instruções aqui.',
        description: 'Um agente feito por você.',
        greeting: 'Olá! Como posso te ajudar?',
        provider: localDefaultProvider
    };
    setEditingPersona(newPersona);
  }

  const handleUpdateEditing = (field: keyof Persona, value: string) => {
    if (editingPersona) {
        setEditingPersona({ ...editingPersona, [field]: value });
    }
  }

  const handleSaveEditing = () => {
    if (!editingPersona) return;
    const index = localPersonas.findIndex(p => p.id === editingPersona.id);
    if (index > -1) {
        setLocalPersonas(localPersonas.map(p => p.id === editingPersona.id ? editingPersona : p));
    } else {
        setLocalPersonas([...localPersonas, editingPersona]);
    }
    setEditingPersona(null);
  }

  const handleDelete = (id: string) => {
      const personaToDelete = localPersonas.find(p => p.id === id);
      if (!personaToDelete) return;

      if (!personaToDelete.id.startsWith('custom-')) {
          showToast(t('modals.settings.cannotDeleteDefaultAgent'));
          return;
      }

      if (window.confirm(t('modals.settings.confirmDeletePersona', { name: personaToDelete.name }))) {
          setLocalPersonas(localPersonas.filter(p => p.id !== id));
      }
  }

  const renderInterfaceSettings = () => (
    <div>
        <h3 className="text-xl font-bold text-white">{t('modals.settings.interface.title')}</h3>
        <p className="text-gray-400 mt-2 mb-6 text-sm">
            {t('modals.settings.interface.description')}
        </p>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700/50">
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="font-medium text-white">{t('modals.settings.interface.advancedUIToggle')}</h4>
                    <p className="text-xs text-gray-400 mt-1">{t('modals.settings.interface.advancedUIToggleDesc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={advancedInterfaceEnabled} onChange={(e) => onSetAdvancedInterface(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
            </div>
        </div>
    </div>
  );

  const renderPersonaManager = () => (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">{t('modals.settings.personasManagerTitle')}</h3>
        <button onClick={handleAddNew} className="px-3 py-1.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
          {t('modals.settings.addNew')}
        </button>
      </div>
      <p className="text-gray-400 mb-4 text-sm">
        {t('modals.settings.personasIntro')}
      </p>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-2 -mr-2">
        {localPersonas.filter(p => p.id.startsWith('custom-')).map(persona => (
            <div key={persona.id} className="bg-gray-900 p-3 rounded-lg flex items-center justify-between border border-gray-700/50">
                <span className="text-white font-medium truncate" title={persona.name}>{persona.name}</span>
                <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditingPersona(persona)} className="text-blue-400 hover:text-blue-300 text-sm font-semibold">{t('common.edit')}</button>
                    <button onClick={() => handleDelete(persona.id)} className="text-red-500 hover:text-red-400 text-sm font-semibold">{t('common.delete')}</button>
                </div>
            </div>
        ))}
      </div>
    </>
  );
  
  const renderPersonaEditor = () => (
    <>
        <h3 className="text-xl font-bold text-white mb-4">{editingPersona?.id.startsWith('custom-') ? t('modals.settings.editPersonaTitle') : t('modals.settings.createPersonaTitle')}</h3>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modals.settings.personaName')}</label>
                <input 
                    type="text"
                    value={editingPersona?.name || ''}
                    onChange={(e) => handleUpdateEditing('name', e.target.value)}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('common.provider')}</label>
                 <select 
                    value={editingPersona?.provider || 'gemini'}
                    onChange={(e) => handleUpdateEditing('provider', e.target.value)}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI</option>
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('modals.settings.personaPrompt')}</label>
                <textarea
                    value={editingPersona?.prompt || ''}
                    onChange={(e) => handleUpdateEditing('prompt', e.target.value)}
                    placeholder={t('modals.settings.personaPromptPlaceholder')}
                    className="w-full h-40 p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-colors"
                />
            </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setEditingPersona(null)} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">{t('common.back')}</button>
          <button onClick={handleSaveEditing} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">{t('common.save')} Persona</button>
        </div>
    </>
  )

  const renderLanguageSettings = () => (
    <div>
        <h3 className="text-xl font-bold text-white mb-2">{t('modals.settings.languageTitle')}</h3>
        <p className="text-gray-400 mb-4 text-sm">
            {t('modals.settings.languageIntro')}
        </p>
        <div>
            <label htmlFor="language-select" className="block text-sm font-medium text-gray-300 mb-1">
                {t('modals.settings.appLanguage')}
            </label>
            <select 
                id="language-select"
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
            >
                <option value="pt-BR">{t('modals.settings.lang.ptBR')}</option>
                <option value="en">{t('modals.settings.lang.en')}</option>
                <option value="es">{t('modals.settings.lang.es')}</option>
            </select>
        </div>
    </div>
  );

  const renderApiKeySettings = () => (
    <div>
        <h3 className="text-xl font-bold text-white">{t('modals.settings.apiKeyTitle')}</h3>
        <p className="text-gray-400 mb-4 text-sm">{t('modals.apiKey.intro')}</p>
        
        <div className="mb-4 border-b border-gray-700">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                <button onClick={() => setApiKeyActiveTab('gemini')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all ${apiKeyActiveTab === 'gemini' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>
                    Google Gemini
                </button>
                 <button onClick={() => setApiKeyActiveTab('openai')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all ${apiKeyActiveTab === 'openai' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>
                    OpenAI
                </button>
            </nav>
        </div>

        <div className="mb-6">
            {apiKeyActiveTab === 'gemini' && (
                <div>
                     <label className="block text-sm font-medium text-gray-300 mb-1">Gemini API Key</label>
                    <input
                        type="password"
                        value={localApiKeys.gemini || ''}
                        onChange={(e) => setLocalApiKeys(prev => ({...prev, gemini: e.target.value}))}
                        className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono transition-colors"
                    />
                     <p className="text-xs text-gray-500 mt-2">
                      {t('modals.apiKey.getAKey')}{' '}
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {t('modals.apiKey.googleAIStudio')}
                      </a>.
                    </p>
                </div>
            )}
             {apiKeyActiveTab === 'openai' && (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">OpenAI API Key</label>
                    <input
                        type="password"
                        value={localApiKeys.openai || ''}
                        onChange={(e) => setLocalApiKeys(prev => ({...prev, openai: e.target.value}))}
                        className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {t('modals.apiKey.getAKey')}{' '}
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {t('modals.apiKey.openaiPlatform')}
                      </a>.
                    </p>
                </div>
            )}
        </div>
        
        <div className="border-t border-gray-700 pt-5">
            <h3 className="text-sm font-medium text-gray-300 mb-2">{t('modals.apiKey.defaultProvider')}</h3>
            <fieldset className="flex gap-4">
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer text-sm border-2 transition-all ${localDefaultProvider === 'gemini' ? 'border-purple-500 bg-purple-900/50' : 'border-gray-600 hover:border-gray-500'}`}>
                    <input type="radio" name="provider" value="gemini" checked={localDefaultProvider === 'gemini'} onChange={() => setLocalDefaultProvider('gemini')} className="hidden" />
                    Google Gemini
                </label>
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer text-sm border-2 transition-all ${localDefaultProvider === 'openai' ? 'border-purple-500 bg-purple-900/50' : 'border-gray-600 hover:border-gray-500'}`}>
                    <input type="radio" name="provider" value="openai" checked={localDefaultProvider === 'openai'} onChange={() => setLocalDefaultProvider('openai')} className="hidden" />
                    OpenAI
                </label>
            </fieldset>
        </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4">
       {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 animate-toast-in border border-green-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
       <header className="py-6 flex-shrink-0 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">{t('modals.settings.title')}</h1>
            <button 
                onClick={handleSave} 
                className="px-4 py-2 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-colors"
            >
                {t('common.save')}
            </button>
       </header>

      <div className="flex-1 flex bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-800 overflow-hidden mb-4">
        {/* Navigation Sidebar */}
        <div className="w-1/3 md:w-1/4 bg-gray-900/40 p-4 border-r border-gray-800 flex flex-col">
            <nav className="space-y-2">
                <button 
                    onClick={() => setActiveTab('personas')}
                    className={`flex items-center gap-3 w-full p-2 rounded-lg text-sm transition-colors ${activeTab === 'personas' ? 'bg-purple-600/50 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {t('modals.settings.tabs.personas')}
                </button>
                 <button 
                    onClick={() => setActiveTab('language')}
                    className={`flex items-center gap-3 w-full p-2 rounded-lg text-sm transition-colors ${activeTab === 'language' ? 'bg-purple-600/50 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10-5-10M19.75 11a9.75 9.75 0 11-19.5 0 9.75 9.75 0 0119.5 0z" /></svg>
                    {t('modals.settings.tabs.language')}
                </button>
                <button 
                    onClick={() => setActiveTab('apiKey')}
                    className={`flex items-center gap-3 w-full p-2 rounded-lg text-sm transition-colors ${activeTab === 'apiKey' ? 'bg-purple-600/50 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h4a6 6 0 016 6z" /></svg>
                    {t('modals.settings.tabs.apiKey')}
                </button>
                <button 
                    onClick={() => setActiveTab('apiUsage')}
                    className={`flex items-center gap-3 w-full p-2 rounded-lg text-sm transition-colors ${activeTab === 'apiUsage' ? 'bg-purple-600/50 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t('modals.settings.tabs.apiUsage')}
                </button>
                 <button 
                    onClick={() => setActiveTab('interface')}
                    className={`flex items-center gap-3 w-full p-2 rounded-lg text-sm transition-colors ${activeTab === 'interface' ? 'bg-purple-600/50 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5v-5.714c0-.597-.237-1.17-.659-1.591L14.25 3.104M19 14.5M19 14.5l-1.5 1.5M5 14.5l-1.5 1.5M5 14.5l1.5-1.5M14.25 3.104l-1.5-1.5M9.75 3.104l1.5-1.5M12 9.75l-1.5 1.5M12 9.75l1.5 1.5M12 9.75v4.5m0-4.5l-1.5-1.5M12 9.75l1.5-1.5" />
                    </svg>
                    {t('modals.settings.tabs.interface')}
                </button>
            </nav>
        </div>

        {/* Content Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'personas' && (editingPersona ? renderPersonaEditor() : renderPersonaManager())}
            {activeTab === 'language' && renderLanguageSettings()}
            {activeTab === 'apiKey' && renderApiKeySettings()}
            {activeTab === 'apiUsage' && <ApiUsageView />}
            {activeTab === 'interface' && renderInterfaceSettings()}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
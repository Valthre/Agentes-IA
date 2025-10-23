import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { LlmProvider } from '../types';

interface ApiKeyModalProps {
  onSave: (apiKeys: { [key in LlmProvider]?: string }, defaultProvider: LlmProvider) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [keys, setKeys] = useState<{ [key in LlmProvider]?: string }>({ gemini: '', openai: '' });
  const [activeTab, setActiveTab] = useState<LlmProvider>('gemini');
  const [defaultProvider, setDefaultProvider] = useState<LlmProvider>('gemini');
  const { t } = useTranslation();

  const handleSave = () => {
    // Fix: Check if key is a string before calling trim()
    if (Object.values(keys).some(key => typeof key === 'string' && key.trim())) {
      onSave(keys, defaultProvider);
    }
  };

  const handleKeyChange = (provider: LlmProvider, value: string) => {
    setKeys(prev => ({ ...prev, [provider]: value }));
  };
  
  // Fix: Check if key is a string before calling trim()
  const isSaveDisabled = !Object.values(keys).some(key => typeof key === 'string' && key.trim());

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-700/50 text-white animate-fade-in-scale">
        <h2 className="text-2xl font-bold mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          {t('modals.apiKey.welcome')}
        </h2>
        <p className="text-gray-400 mb-6 text-center text-sm">
          {t('modals.apiKey.intro')}
        </p>

        <div className="mb-4 border-b border-gray-700">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                <button onClick={() => setActiveTab('gemini')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === 'gemini' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>
                    Google Gemini
                </button>
                 <button onClick={() => setActiveTab('openai')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === 'openai' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>
                    OpenAI
                </button>
            </nav>
        </div>

        <div className="mb-6">
            {activeTab === 'gemini' && (
                <div>
                    <input
                        type="password"
                        value={keys.gemini}
                        onChange={(e) => handleKeyChange('gemini', e.target.value)}
                        placeholder={t('modals.apiKey.placeholder')}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono transition-colors"
                        aria-label={`Gemini ${t('modals.apiKey.ariaLabel')}`}
                    />
                     <p className="text-xs text-gray-500 mt-2 text-center">
                      {t('modals.apiKey.getAKey')}{' '}
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {t('modals.apiKey.googleAIStudio')}
                      </a>.
                    </p>
                </div>
            )}
             {activeTab === 'openai' && (
                <div>
                    <input
                        type="password"
                        value={keys.openai}
                        onChange={(e) => handleKeyChange('openai', e.target.value)}
                        placeholder={t('modals.apiKey.placeholder')}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono transition-colors"
                        aria-label={`OpenAI ${t('modals.apiKey.ariaLabel')}`}
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {t('modals.apiKey.getAKey')}{' '}
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {t('modals.apiKey.openaiPlatform')}
                      </a>.
                    </p>
                </div>
            )}
        </div>

        <div className="mb-6 border-t border-gray-700 pt-5">
            <h3 className="text-sm font-medium text-gray-300 mb-2 text-center">{t('modals.apiKey.defaultProvider')}</h3>
            <fieldset className="flex justify-center gap-4">
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer text-sm border-2 transition-all ${defaultProvider === 'gemini' ? 'border-purple-500 bg-purple-900/50' : 'border-gray-600 hover:border-gray-500'}`}>
                    <input type="radio" name="provider" value="gemini" checked={defaultProvider === 'gemini'} onChange={() => setDefaultProvider('gemini')} className="hidden" />
                    Google Gemini
                </label>
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer text-sm border-2 transition-all ${defaultProvider === 'openai' ? 'border-purple-500 bg-purple-900/50' : 'border-gray-600 hover:border-gray-500'}`}>
                    <input type="radio" name="provider" value="openai" checked={defaultProvider === 'openai'} onChange={() => setDefaultProvider('openai')} className="hidden" />
                    OpenAI
                </label>
            </fieldset>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('modals.apiKey.saveAndStart')}
        </button>
      </div>
    </div>
  );
};

export default ApiKeyModal;
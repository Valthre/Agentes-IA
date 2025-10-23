import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { Persona } from '../types';

interface ShareAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Persona;
}

type ExpirationOption = '1' | '7' | '30' | 'never';

const getBaseShareUrl = (): string | null => {
    // Method 1: Try accessing `window.top.location`. This is the most reliable method
    // for getting the URL of the top-level page when inside an iframe.
    try {
        const topHref = window.top?.location.href;
        if (topHref && (topHref.startsWith('http:') || topHref.startsWith('https:'))) {
            const topUrl = new URL(topHref);
            // Return the URL without query parameters or hash, as they will be added later.
            return topUrl.origin + topUrl.pathname;
        }
    } catch (e) {
        // This will fail in cross-origin sandboxed iframes, so we proceed to other methods.
        console.warn('Could not access window.top.location, trying fallback methods.');
    }

    // Method 2: Use `document.referrer` as a fallback. This can provide the parent URL.
    if (document.referrer) {
        try {
            const referrerUrl = new URL(document.referrer);
            // Ensure the referrer is a valid, non-local URL.
            if (referrerUrl.origin && referrerUrl.origin !== 'null' && (referrerUrl.protocol === 'http:' || referrerUrl.protocol === 'https:')) {
                return referrerUrl.origin + referrerUrl.pathname;
            }
        } catch (e) {
            // Referrer might not be a valid URL, so we ignore it.
        }
    }
    
    // Method 3: As a last resort, use the current window's location. This might be
    // the iframe's URL, which may not be ideal but is better than nothing.
    const { href } = window.location;
    if (href && (href.startsWith('http:') || href.startsWith('https:'))) {
         const currentUrl = new URL(href);
         return currentUrl.origin + currentUrl.pathname;
    }

    // If all methods fail, return null. This will trigger the UI to allow manual URL entry.
    console.error("Failed to determine a shareable base URL through all available methods.");
    return null;
};


const ShareAgentModal: React.FC<ShareAgentModalProps> = ({ isOpen, onClose, agent }) => {
  const { t } = useTranslation();
  const [expiration, setExpiration] = useState<ExpirationOption>('7');
  const [finalShareUrl, setFinalShareUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isEmbedCopied, setIsEmbedCopied] = useState(false);
  const [isUrlEditable, setIsUrlEditable] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setIsLinkCopied(false);
        setIsEmbedCopied(false);

        const detectedBaseUrl = getBaseShareUrl();
        let baseUrl = detectedBaseUrl;

        if (!baseUrl) {
            setIsUrlEditable(true);
            baseUrl = `https://[${t('modals.shareAgentModal.urlPlaceholder')}]/`;
        } else {
            setIsUrlEditable(false);
        }

        try {
            const cleanHref = baseUrl.split('?')[0].split('#')[0];
            const params = new URLSearchParams();
            params.set('agent', agent.id);

            if (expiration !== 'never') {
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + parseInt(expiration));
                params.set('expires', expirationDate.getTime().toString());
            }
            
            const generatedUrl = `${cleanHref}#?${params.toString()}`;
            setFinalShareUrl(generatedUrl);

        } catch (error) {
            console.error("Failed to construct share URL:", error);
            setFinalShareUrl(t('errors.invalidLink'));
        }
    }
  }, [isOpen, agent.id, expiration, t]);

  useEffect(() => {
    if (!isOpen) return;

    const generatedEmbedCode = `<iframe
  src="${finalShareUrl}"
  title="${agent.name}"
  style="border:none; width:400px; height:600px;"
  allow="microphone"
></iframe>`;
    setEmbedCode(generatedEmbedCode);
  }, [finalShareUrl, agent.name, isOpen]);


  const handleCopy = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans animate-fade-in-fast" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-gray-700/50 text-white animate-fade-in-scale" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{t('modals.shareAgentModal.title')}</h2>
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <p className="text-sm text-gray-400 mb-6">{t('modals.shareAgentModal.description')}</p>

        {/* Expiration Settings */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">{t('modals.shareAgentModal.setExpiration')}</label>
          <div className="flex gap-2 flex-wrap">
            {(['1', '7', '30', 'never'] as ExpirationOption[]).map(opt => (
              <button key={opt} onClick={() => setExpiration(opt)} className={`px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-all ${expiration === opt ? 'bg-purple-600/50 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-300'}`}>
                {t(`modals.shareAgentModal.${opt === 'never' ? 'neverExpires' : `expiresIn${opt}Day${opt !== '1' ? 's' : ''}`}`)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Share Link */}
        <div className="mb-6">
            {isUrlEditable && (
                <div className="text-xs text-amber-400 mb-2 bg-amber-900/30 p-3 rounded-md border border-amber-500/30 space-y-2">
                    <p className="font-bold">{t('modals.shareAgentModal.urlDetectionFailedTitle')}</p>
                    <p dangerouslySetInnerHTML={{ __html: t('modals.shareAgentModal.urlDetectionFailedBody') }} />
                    <p dangerouslySetInnerHTML={{ __html: t('modals.shareAgentModal.urlExample') }} />
                </div>
            )}
            <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={finalShareUrl} 
                  readOnly={!isUrlEditable}
                  onChange={isUrlEditable ? (e) => setFinalShareUrl(e.target.value) : undefined}
                  className={`w-full bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 ${isUrlEditable ? 'text-amber-300' : ''}`}/>
                <button onClick={() => handleCopy(finalShareUrl, setIsLinkCopied)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap text-sm w-32 text-center">
                    {isLinkCopied ? t('modals.shareAgentModal.copiedLink') : t('modals.shareAgentModal.copyLink')}
                </button>
            </div>
        </div>
        
        {/* Embed Code */}
        <div className="border-t border-gray-700/50 pt-5">
            <h3 className="text-lg font-bold text-white">{t('modals.shareAgentModal.embedTitle')}</h3>
            <p className="text-sm text-gray-400 mb-3">{t('modals.shareAgentModal.embedDescription')}</p>
             <div className="relative">
                <textarea readOnly value={embedCode} className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 p-3 font-mono focus:outline-none resize-none"/>
                <button onClick={() => handleCopy(embedCode, setIsEmbedCopied)} className="absolute top-2 right-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-md transition-colors whitespace-nowrap text-xs">
                     {isEmbedCopied ? t('modals.shareAgentModal.copiedCode') : t('modals.shareAgentModal.copyCode')}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ShareAgentModal;
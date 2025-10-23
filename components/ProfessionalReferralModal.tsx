import React from 'react';
import { useTranslation } from '../i18n';

interface ProfessionalReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaId: string | null;
}

const InfoSection: React.FC<{ title: string; items: string[]; icon: React.ReactNode }> = ({ title, items, icon }) => (
  <section>
    <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 text-purple-400 mt-0.5">{icon}</div>
          <span className="text-gray-300 text-sm" dangerouslySetInnerHTML={{ __html: item }} />
        </li>
      ))}
    </ul>
  </section>
);


const ProfessionalReferralModal: React.FC<ProfessionalReferralModalProps> = ({ isOpen, onClose, personaId }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const isLegal = personaId === 'legal-informant';
  const isFinancial = personaId === 'financial-advisor' || personaId === 'finance-guide';

  const getModalContent = () => {
    if (isLegal) {
      return {
        title: t('modals.professionalReferral.title.legal'),
        // FIX: Removed unnecessary type casting as the `t` function now correctly returns arrays.
        warningSigns: t('modals.professionalReferral.warningSigns.legal'),
        whatProDoes: t('modals.professionalReferral.whatAProDoes.legal'),
        howToFind: t('modals.professionalReferral.howToFind.legal'),
      };
    }
    if (isFinancial) {
       return {
        title: t('modals.professionalReferral.title.financial'),
        // FIX: Removed unnecessary type casting as the `t` function now correctly returns arrays.
        warningSigns: t('modals.professionalReferral.warningSigns.financial'),
        whatProDoes: t('modals.professionalReferral.whatAProDoes.financial'),
        howToFind: t('modals.professionalReferral.howToFind.financial'),
      };
    }
    return null;
  };

  const content = getModalContent();
  if (!content) return null;
  
  const icons = {
      warning: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
      tasks: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      search: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  }

  return (
    <div 
      className="fixed inset-0 bg-gray-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="referral-modal-title"
    >
      <div 
        className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700/50 text-white animate-fade-in-scale max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 border-b border-gray-800 flex-shrink-0">
          <h2 id="referral-modal-title" className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
            {content.title}
          </h2>
        </header>
        
        <main className="p-6 space-y-6 overflow-y-auto">
            <InfoSection title={t('modals.professionalReferral.warningSigns.title')} items={content.warningSigns} icon={icons.warning} />
            <InfoSection title={t('modals.professionalReferral.whatAProDoes.title')} items={content.whatProDoes} icon={icons.tasks} />
            <InfoSection title={t('modals.professionalReferral.howToFind.title')} items={content.howToFind} icon={icons.search} />
        </main>
        
        <footer className="p-4 bg-gray-950/50 border-t border-gray-800 text-center flex-shrink-0">
          <p className="text-xs text-gray-500 mb-3">{t('modals.professionalReferral.disclaimer')}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
          >
            {t('modals.professionalReferral.close')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ProfessionalReferralModal;

import React, { useState, useMemo } from 'react';
import { Persona } from '../types';
import { useTranslation } from '../i18n';

interface AgentGalleryViewProps {
  agents: Persona[];
  onSelectAgent: (agent: Persona) => void;
  onCreateCustomAgent: () => void;
}

// SVG Robot Icons Components
const TechBot = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><path d="M50,15 A30,30 0 0,0 20,45 L20,65 A10,10 0 0,0 30,75 L70,75 A10,10 0 0,0 80,65 L80,45 A30,30 0 0,0 50,15 Z" fill="currentColor" /><rect x="25" y="50" width="50" height="20" rx="5" fill="black" fillOpacity="0.2" /><line x1="40" y1="30" x2="60" y2="30" stroke="white" strokeWidth="4" strokeLinecap="round"/><line x1="35" y1="40" x2="35" y2="25" stroke="white" strokeWidth="3" strokeLinecap="round"/><line x1="65" y1="40" x2="65" y2="25" stroke="white" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="32" r="8" fill="white"/><circle cx="50" cy="32" r="4" fill="currentColor" fillOpacity="0.5"/></g></svg>
);
const CreativeBot = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><path d="M50,15 C20,15 20,40 20,50 S20,85 50,85 80,60 80,50 80,15 50,15 Z" fill="currentColor" /><path d="M50,25 C35,25 35,40 35,50 S35,75 50,75 65,60 65,50 65,25 50,25 Z" fill="black" fillOpacity="0.2"/><path d="M50 30 A 20 20 0 0 1 50 70 A 10 10 0 0 1 50 30" fill="white" /><circle cx="50" cy="50" r="5" fill="currentColor" fillOpacity="0.5"/></g></svg>
);
const BusinessBot = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><rect x="20" y="20" width="60" height="60" rx="15" fill="currentColor" /><rect x="30" y="30" width="40" height="40" rx="5" fill="black" fillOpacity="0.2"/><path d="M40 50 L50 40 L60 50 L50 60 Z" fill="white"/><path d="M45,35 v30 h10 v-30 z" fill="white" opacity="0.7" transform="rotate(45 50 50)"/></g></svg>
);
const LifestyleBot = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><circle cx="50" cy="50" r="35" fill="currentColor"/><circle cx="50" cy="50" r="25" fill="black" fillOpacity="0.2"/><path d="M50,30 a20,20 0 1,1 0,40 a20,20 0 1,1 0,-40" stroke="white" strokeWidth="4" fill="none"/><path d="M40,50 a10,10 0 1,1 20,0 a10,10 0 1,1 -20,0" fill="white"/><circle cx="50" cy="50" r="3" fill="currentColor" fillOpacity="0.5"/></g></svg>
);
const AcademicBot = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><path d="M20,75 L20,30 A10,10 0 0,1 30,20 L70,20 A10,10 0 0,1 80,30 L80,75 L50,85 Z" fill="currentColor" /><rect x="30" y="30" width="40" height="40" rx="5" fill="black" fillOpacity="0.2"/><circle cx="40" cy="50" r="8" stroke="white" strokeWidth="3" fill="none"/><circle cx="60" cy="50" r="8" stroke="white" strokeWidth="3" fill="none"/><line x1="48" y1="50" x2="52" y2="50" stroke="white" strokeWidth="3"/></g></svg>
);
const MentorBot = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><path d="M50 15 L80 35 L80 65 L50 85 L20 65 L20 35 Z" fill="currentColor"/><path d="M50 25 L70 40 L70 60 L50 75 L30 60 L30 40 Z" fill="black" fillOpacity="0.2"/><path d="M50 35 L65 45 L50 55 L35 45 Z" fill="white" /><path d="M50 58 L65 68 L50 78 L35 68 Z" fill="white" opacity="0.6"/></g></svg>
);
const MetaBot = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><path d="M50 15 A 35 35 0 1 0 50 85 A 35 35 0 1 0 50 15" fill="currentColor" /><path d="M50 25 A 25 25 0 1 0 50 75 A 25 25 0 1 0 50 25" fill="black" fillOpacity="0.2" /><circle cx="50" cy="50" r="10" fill="white" /><path d="M50 30 L50 70 M30 50 L70 50" stroke="white" stroke-width="3" /><circle cx="50" cy="20" r="5" fill="white" /><circle cx="80" cy="50" r="5" fill="white" /><circle cx="50" cy="80" r="5" fill="white" /><circle cx="20" cy="50" r="5" fill="white" /><path d="M50 30 L50 20 M65 35 L80 50 M65 65 L50 80 M35 65 L20 50" stroke="currentColor" stroke-width="2" /></g></svg>
);
const DefaultBot = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><rect x="25" y="35" width="50" height="40" rx="10" fill="currentColor"/><rect x="35" y="20" width="30" height="30" rx="15" fill="black" fillOpacity="0.2"/><rect x="42" y="45" width="16" height="10" fill="white" rx="2"/><circle cx="35" cy="20" r="5" fill="white" /><circle cx="65" cy="20" r="5" fill="white" /></g></svg>
);
const AdvancedModelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const getAgentVisuals = (agent: Persona): { icon: React.ReactNode, color: string, gradient: string } => {
    if (agent.id === 'master-agent') {
        return { icon: <MetaBot />, color: 'text-amber-400', gradient: 'from-amber-900/50 to-gray-900' };
    }
    if (agent.category === 'mentor') {
        return { icon: <MentorBot />, color: 'text-orange-400', gradient: 'from-orange-900/50 to-gray-900' };
    }
    switch(agent.id) {
        case 'dev-senior':
        case 'philosopher':
        case 'analytical-generalist':
        case 'product-architect':
             return { icon: <TechBot />, color: 'text-purple-400', gradient: 'from-purple-900/50 to-gray-900' };
        case 'hollywood-writer':
        case 'creative':
        case 'interior-designer':
            return { icon: <CreativeBot />, color: 'text-green-400', gradient: 'from-green-900/50 to-gray-900' };
        case 'marketing-guru':
        case 'career-coach':
        case 'financial-advisor':
        case 'travel-agent':
            return { icon: <BusinessBot />, color: 'text-blue-400', gradient: 'from-blue-900/50 to-gray-900' };
        case 'historian':
        case 'legal-informant':
        case 'it-informant':
            return { icon: <AcademicBot />, color: 'text-yellow-600', gradient: 'from-yellow-900/50 to-gray-900' };
        case 'chef':
        case 'translator':
        case 'personal-trainer':
            return { icon: <LifestyleBot />, color: 'text-teal-400', gradient: 'from-teal-900/50 to-gray-900' };
        default:
            return { icon: <DefaultBot />, color: 'text-gray-400', gradient: 'from-gray-800 to-gray-900' };
    }
}

const AgentCard: React.FC<{ agent: Persona; onSelect: () => void; visuals: ReturnType<typeof getAgentVisuals> }> = ({ agent, onSelect, visuals }) => {
  const { t } = useTranslation();
  const isAdvanced = agent.model === 'gemini-2.5-pro';

  return (
    <div 
      onClick={onSelect}
      className={`group relative bg-gray-900 p-4 rounded-xl flex flex-col cursor-pointer border border-gray-800 hover:border-purple-500/80 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/30 h-full overflow-hidden bg-gradient-to-br ${visuals.gradient}`}
    >
      <div className={`absolute -top-4 -right-4 w-32 h-32 opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-300 ${visuals.color}`}>
        {visuals.icon}
      </div>
      <div className="relative z-10 flex-grow flex flex-col h-full">
        <h3 className="font-bold text-white text-md mb-2 flex items-center">
            {agent.name}
            {isAdvanced && <AdvancedModelIcon />}
        </h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow">{agent.description}</p>
        <button
          className="w-full mt-auto px-3 py-2 text-sm font-bold text-white bg-gray-700/50 group-hover:bg-purple-600 rounded-lg transition-colors duration-300"
        >
          {t('common.select')}
        </button>
      </div>
    </div>
  );
}

export const AgentGalleryView: React.FC<AgentGalleryViewProps> = ({ agents, onSelectAgent, onCreateCustomAgent }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const allSpecializedAgents = useMemo(() => {
    // This removes default and creative agents from the main list if they exist
    return agents.filter(a => a.id !== 'default' && a.id !== 'creative');
  }, [agents]);


  const filteredAgents = useMemo(() => {
    if (!searchQuery) {
      return [];
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return allSpecializedAgents.filter(agent =>
      agent.name.toLowerCase().includes(lowercasedQuery) ||
      agent.description?.toLowerCase().includes(lowercasedQuery)
    );
  }, [allSpecializedAgents, searchQuery]);
  
  const masterAgent = useMemo(() => allSpecializedAgents.find(a => a.id === 'master-agent'), [allSpecializedAgents]);
  const otherAgents = useMemo(() => allSpecializedAgents.filter(a => a.id !== 'master-agent' && a.category === 'specialist'), [allSpecializedAgents]);
  const mentorAgents = useMemo(() => allSpecializedAgents.filter(a => a.category === 'mentor'), [allSpecializedAgents]);
  
  const renderContent = () => {
    if (searchQuery) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {filteredAgents.length > 0 ? (
                    filteredAgents.map(agent => (
                        <div key={`search-${agent.id}`}>
                            <AgentCard agent={agent} onSelect={() => onSelectAgent(agent)} visuals={getAgentVisuals(agent)} />
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 col-span-full">
                        <p className="text-gray-400 text-lg">{t('modals.agentGallery.noAgentsFound')}</p>
                        <p className="text-gray-500 text-sm">{t('modals.agentGallery.tryDifferentSearch')}</p>
                    </div>
                )}
            </div>
        )
    }

    return (
        <>
            {masterAgent && (
                 <div className="mb-8 p-4 rounded-xl bg-gradient-to-tr from-amber-500/10 via-gray-900 to-gray-900 border border-amber-500/30">
                    <h3 className="text-xl font-bold text-amber-300 mb-2">{t('modals.agentGallery.orchestratorAgent')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="text-sm text-gray-400">
                           <p dangerouslySetInnerHTML={{ __html: t('modals.agentGallery.masterAgentDesc') }}></p>
                           <p className="mt-2 font-semibold">{t('modals.agentGallery.masterAgentIdealFor')}</p>
                        </div>
                        <AgentCard agent={masterAgent} onSelect={() => onSelectAgent(masterAgent)} visuals={getAgentVisuals(masterAgent)} />
                    </div>
                </div>
            )}
            
            <h3 className="text-xl font-bold text-white mb-4 border-t border-gray-700/50 pt-6">
                {t('modals.agentGallery.specialistsGallery')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherAgents.map(agent => (
                <div key={agent.id}>
                    <AgentCard agent={agent} onSelect={() => onSelectAgent(agent)} visuals={getAgentVisuals(agent)} />
                </div>
              ))}
            </div>
            
            <div>
                <h3 className="text-xl font-bold text-white mt-8 mb-4 border-t border-gray-700/50 pt-6">
                    {t('modals.agentGallery.learningZone')}
                </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mentorAgents.map(agent => (
                      <div key={agent.id}>
                          <AgentCard agent={agent} onSelect={() => onSelectAgent(agent)} visuals={getAgentVisuals(agent)} />
                      </div>
                    ))}
                </div>
            </div>
        </>
    )
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto px-4">
      <header className="py-6 flex-shrink-0">
          <h1 className="text-3xl font-bold text-white">{t('modals.agentGallery.title')}</h1>
          <p className="text-gray-400 mt-1 text-sm">{t('modals.agentGallery.intro')}</p>
           <div className="relative mt-4">
              <input
                  type="text"
                  placeholder={t('modals.agentGallery.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
          </div>
      </header>

      <div className="flex-grow overflow-y-auto pr-2 -mr-2 pb-6">
          {renderContent()}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-700/50 flex-shrink-0 sticky bottom-0 bg-gray-950/80 backdrop-blur-sm -mx-4 px-4 pb-4">
          <button
              onClick={onCreateCustomAgent}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-green-400 to-cyan-500 text-white font-bold rounded-lg shadow-lg hover:shadow-cyan-500/50 transform hover:scale-[1.02] transition-all duration-300"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{t('modals.agentGallery.createCustomAgent')}</span>
          </button>
      </div>
      <style>{`
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
      `}</style>
    </div>
  );
};
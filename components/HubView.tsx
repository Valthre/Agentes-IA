import React from 'react';
import { Persona, Chat } from '../types';
import { useTranslation } from '../i18n';

// Agent Icons - Reused from AgentGalleryModal for consistency
const TechBot = () => (<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><path d="M50,15 A30,30 0 0,0 20,45 L20,65 A10,10 0 0,0 30,75 L70,75 A10,10 0 0,0 80,65 L80,45 A30,30 0 0,0 50,15 Z" fill="currentColor" /><rect x="25" y="50" width="50" height="20" rx="5" fill="black" fillOpacity="0.2" /><line x1="40" y1="30" x2="60" y2="30" stroke="white" strokeWidth="4" strokeLinecap="round"/><line x1="35" y1="40" x2="35" y2="25" stroke="white" strokeWidth="3" strokeLinecap="round"/><line x1="65" y1="40" x2="65" y2="25" stroke="white" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="32" r="8" fill="white"/><circle cx="50" cy="32" r="4" fill="currentColor" fillOpacity="0.5"/></g></svg>);
const CreativeBot = () => (<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><path d="M50,15 C20,15 20,40 20,50 S20,85 50,85 80,60 80,50 80,15 50,15 Z" fill="currentColor" /><path d="M50,25 C35,25 35,40 35,50 S35,75 50,75 65,60 65,50 65,25 50,25 Z" fill="black" fillOpacity="0.2"/><path d="M50 30 A 20 20 0 0 1 50 70 A 10 10 0 0 1 50 30" fill="white" /><circle cx="50" cy="50" r="5" fill="currentColor" fillOpacity="0.5"/></g></svg>);
const BusinessBot = () => (<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><rect x="20" y="20" width="60" height="60" rx="15" fill="currentColor" /><rect x="30" y="30" width="40" height="40" rx="5" fill="black" fillOpacity="0.2"/><path d="M40 50 L50 40 L60 50 L50 60 Z" fill="white"/><path d="M45,35 v30 h10 v-30 z" fill="white" opacity="0.7" transform="rotate(45 50 50)"/></g></svg>);
const LifestyleBot = () => (<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><circle cx="50" cy="50" r="35" fill="currentColor"/><circle cx="50" cy="50" r="25" fill="black" fillOpacity="0.2"/><path d="M50,30 a20,20 0 1,1 0,40 a20,20 0 1,1 0,-40" stroke="white" strokeWidth="4" fill="none"/><path d="M40,50 a10,10 0 1,1 20,0 a10,10 0 1,1 -20,0" fill="white"/><circle cx="50" cy="50" r="3" fill="currentColor" fillOpacity="0.5"/></g></svg>);
const AcademicBot = () => (<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><path d="M20,75 L20,30 A10,10 0 0,1 30,20 L70,20 A10,10 0 0,1 80,30 L80,75 L50,85 Z" fill="currentColor" /><rect x="30" y="30" width="40" height="40" rx="5" fill="black" fillOpacity="0.2"/><circle cx="40" cy="50" r="8" stroke="white" strokeWidth="3" fill="none"/><circle cx="60" cy="50" r="8" stroke="white" strokeWidth="3" fill="none"/><line x1="48" y1="50" x2="52" y2="50" stroke="white" strokeWidth="3"/></g></svg>);
const MentorBot = () => (<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><path d="M50 15 L80 35 L80 65 L50 85 L20 65 L20 35 Z" fill="currentColor"/><path d="M50 25 L70 40 L70 60 L50 75 L30 60 L30 40 Z" fill="black" fillOpacity="0.2"/><path d="M50 35 L65 45 L50 55 L35 45 Z" fill="white" /><path d="M50 58 L65 68 L50 78 L35 68 Z" fill="white" opacity="0.6"/></g></svg>);
const MetaBot = () => (<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><path d="M50 15 A 35 35 0 1 0 50 85 A 35 35 0 1 0 50 15" fill="currentColor" /><path d="M50 25 A 25 25 0 1 0 50 75 A 25 25 0 1 0 50 25" fill="black" fillOpacity="0.2" /><circle cx="50" cy="50" r="10" fill="white" /><path d="M50 30 L50 70 M30 50 L70 50" stroke="white" stroke-width="3" /><circle cx="50" cy="20" r="5" fill="white" /><circle cx="80" cy="50" r="5" fill="white" /><circle cx="50" cy="80" r="5" fill="white" /><circle cx="20" cy="50" r="5" fill="white" /><path d="M50 30 L50 20 M65 35 L80 50 M65 65 L50 80 M35 65 L20 50" stroke="currentColor" stroke-width="2" /></g></svg>);
const DefaultBot = () => (<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(5,5) scale(0.9)"><rect x="25" y="35" width="50" height="40" rx="10" fill="currentColor"/><rect x="35" y="20" width="30" height="30" rx="15" fill="black" fillOpacity="0.2"/><rect x="42" y="45" width="16" height="10" fill="white" rx="2"/><circle cx="35" cy="20" r="5" fill="white" /><circle cx="65" cy="20" r="5" fill="white" /></g></svg>);
const AdvancedModelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 inline-block ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);


const getAgentVisuals = (agent: Persona): { icon: React.ReactNode, color: string, gradient: string } => {
    if (agent.id === 'master-agent') return { icon: <MetaBot />, color: 'text-amber-400', gradient: 'from-amber-900/50 to-gray-950' };
    if (agent.category === 'mentor') return { icon: <MentorBot />, color: 'text-orange-400', gradient: 'from-orange-900/50 to-gray-950' };
    switch(agent.id) {
        case 'dev-senior': case 'philosopher': case 'analytical-generalist': case 'product-architect': return { icon: <TechBot />, color: 'text-purple-400', gradient: 'from-purple-900/50 to-gray-950' };
        case 'hollywood-writer': case 'creative': case 'interior-designer': return { icon: <CreativeBot />, color: 'text-green-400', gradient: 'from-green-900/50 to-gray-950' };
        case 'marketing-guru': case 'career-coach': case 'financial-advisor': case 'travel-agent': return { icon: <BusinessBot />, color: 'text-blue-400', gradient: 'from-blue-900/50 to-gray-950' };
        case 'historian': case 'legal-informant': case 'it-informant': case 'legal-memorandum': return { icon: <AcademicBot />, color: 'text-yellow-600', gradient: 'from-yellow-900/50 to-gray-950' };
        case 'chef': case 'translator': case 'personal-trainer': return { icon: <LifestyleBot />, color: 'text-teal-400', gradient: 'from-teal-900/50 to-gray-950' };
        default: return { icon: <DefaultBot />, color: 'text-gray-400', gradient: 'from-gray-800 to-gray-900' };
    }
}

interface HubViewProps {
  personas: Persona[];
  chats: Chat[];
  onSelectChat: (id: string) => void;
  onSelectAgent: (agent: Persona) => void;
}

const FeaturedAgentCard: React.FC<{ agent: Persona; onSelect: () => void; }> = ({ agent, onSelect }) => {
    const visuals = getAgentVisuals(agent);
    const isAdvanced = agent.model === 'gemini-3.1-pro-preview' || agent.model === 'gemini-2.5-pro';
    return (
        <div 
            onClick={onSelect}
            className={`group relative flex-shrink-0 w-full md:w-[48%] lg:w-[31.5%] h-56 rounded-2xl cursor-pointer overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-900/20 bg-gradient-to-br ${visuals.gradient}`}
        >
            <div className={`absolute -top-8 -right-8 w-48 h-48 opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-300 ${visuals.color}`}>
                {visuals.icon}
            </div>
            <div className="relative z-10 p-6 flex flex-col h-full">
                <h3 className="text-xl font-bold text-white flex items-center">
                    {agent.name}
                    {isAdvanced && <AdvancedModelIcon />}
                </h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2 flex-grow">{agent.description}</p>
                <button className="self-start mt-4 px-4 py-2 text-sm font-bold text-white bg-gray-700/50 group-hover:bg-purple-600 rounded-lg transition-colors duration-300">
                    Iniciar Conversa
                </button>
            </div>
        </div>
    );
};

const RecentChatCard: React.FC<{ chat: Chat; persona?: Persona; onSelect: () => void; }> = ({ chat, persona, onSelect }) => {
    const visuals = persona ? getAgentVisuals(persona) : getAgentVisuals({id: 'default', name: '', prompt:''});
    return (
        <div onClick={onSelect} className="group flex-shrink-0 w-64 h-full bg-gray-900 rounded-xl cursor-pointer border border-gray-800 hover:border-blue-500/50 transition-all duration-200 p-4 flex flex-col justify-between transform hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/30">
            <div>
                 <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 flex-shrink-0 ${visuals.color}`}>{visuals.icon}</div>
                    <p className="text-xs text-gray-400 truncate">{persona?.name || 'Agente Geral'}</p>
                 </div>
                 <h4 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">{chat.title}</h4>
            </div>
            <p className="text-xs text-gray-500 mt-2 truncate">{chat.messages.slice(-1)[0]?.content}</p>
        </div>
    );
};

const SmallAgentCard: React.FC<{ agent: Persona; onSelect: () => void; }> = ({ agent, onSelect }) => {
    const visuals = getAgentVisuals(agent);
    const isAdvanced = agent.model === 'gemini-3.1-pro-preview' || agent.model === 'gemini-2.5-pro';
    return (
        <div onClick={onSelect} className="group flex-shrink-0 w-52 h-full flex flex-col bg-gray-900 rounded-xl cursor-pointer border border-gray-800 hover:border-purple-500/50 transition-all duration-200 transform hover:-translate-y-1 p-4 hover:shadow-xl hover:shadow-purple-900/30">
            <div className={`w-12 h-12 mb-3 ${visuals.color}`}>{visuals.icon}</div>
            <h4 className="font-bold text-white text-md mb-1 flex-grow flex items-start">
                <span>{agent.name}</span>
                {isAdvanced && <AdvancedModelIcon />}
            </h4>
            <p className="text-gray-400 text-sm line-clamp-2">{agent.description}</p>
        </div>
    );
};

const AgentCarousel: React.FC<{ title: string; agents: Persona[]; onSelectAgent: (agent: Persona) => void; }> = ({ title, agents, onSelectAgent }) => {
    if (agents.length === 0) return null;
    return (
        <section>
            <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mb-4 horizontal-scroll-container">
                {agents.map(agent => (
                    <SmallAgentCard key={agent.id} agent={agent} onSelect={() => onSelectAgent(agent)} />
                ))}
            </div>
        </section>
    );
};


export const HubView: React.FC<HubViewProps> = ({ personas, chats, onSelectChat, onSelectAgent }) => {
    const { t } = useTranslation();
    const featuredAgents = personas.filter(p => ['analytical-generalist', 'legal-informant', 'legal-memorandum'].includes(p.id));
    const recentChats = chats.slice(0, 5);
    const specialistAgents = personas.filter(p => p.category === 'specialist' && !featuredAgents.some(fa => fa.id === p.id));
    const mentorAgents = personas.filter(p => p.category === 'mentor' && !featuredAgents.some(fa => fa.id === p.id));
    const customAgents = personas.filter(p => p.id.startsWith('custom-'));

    return (
        <div className="flex-1 flex flex-col transition-all duration-300 overflow-y-auto">
            <header className="p-6">
                 <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    {t('hub.title')}
                 </h1>
                 <p className="text-gray-400 mt-1">{t('hub.greeting')}</p>
            </header>
            <main className="flex-grow p-6 space-y-10">
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">{t('hub.featured')}</h2>
                    <div className="flex flex-wrap gap-4">
                        {featuredAgents.map(agent => (
                            <FeaturedAgentCard key={agent.id} agent={agent} onSelect={() => onSelectAgent(agent)} />
                        ))}
                    </div>
                </section>

                {recentChats.length > 1 && (
                    <section>
                         <h2 className="text-2xl font-bold text-white mb-4">{t('hub.continueConversation')}</h2>
                         <div className="flex gap-4 overflow-x-auto pb-4 -mb-4 h-36 horizontal-scroll-container">
                            {recentChats.map(chat => (
                                <RecentChatCard 
                                    key={chat.id} 
                                    chat={chat} 
                                    persona={personas.find(p => p.id === chat.personaId)}
                                    onSelect={() => onSelectChat(chat.id)} 
                                />
                            ))}
                         </div>
                    </section>
                )}

                <AgentCarousel title={t('hub.toolbox')} agents={specialistAgents} onSelectAgent={onSelectAgent} />
                <AgentCarousel title={t('hub.learningZone')} agents={mentorAgents} onSelectAgent={onSelectAgent} />
                <AgentCarousel title={t('hub.customAgents')} agents={customAgents} onSelectAgent={onSelectAgent} />
            </main>
            <style>{`
                .horizontal-scroll-container::-webkit-scrollbar { height: 6px; }
                .horizontal-scroll-container::-webkit-scrollbar-thumb { background-color: #4a5568; border-radius: 3px; }
                .horizontal-scroll-container::-webkit-scrollbar-track { background-color: transparent; }
                .horizontal-scroll-container { -ms-overflow-style: none; scrollbar-width: thin; scrollbar-color: #4a5568 transparent; }
            `}</style>
        </div>
    )
}

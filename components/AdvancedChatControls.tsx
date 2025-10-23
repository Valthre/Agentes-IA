import React from 'react';
import { Chat, GenerationConfig, OperatingMode } from '../types';
import { useTranslation } from '../i18n';
import Tooltip from './Tooltip';

interface AdvancedChatControlsProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  onChatUpdate: (key: keyof Chat, value: any) => void;
  nextMessageConfig: GenerationConfig;
  onNextMessageConfigChange: (key: keyof GenerationConfig, value: number) => void;
  onResetNextMessageConfig: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; tooltip: string; }> = ({ label, value, min, max, step, onChange, tooltip }) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">{label} <Tooltip text={tooltip} /></label>
            <span className="text-sm font-semibold text-purple-300">{value}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb"
        />
    </div>
);

export const AdvancedChatControls: React.FC<AdvancedChatControlsProps> = ({
  isOpen, onClose, chat, onChatUpdate,
  nextMessageConfig, onNextMessageConfigChange, onResetNextMessageConfig,
  anchorRef,
}) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    const anchorRect = anchorRef.current?.getBoundingClientRect();
    const style = anchorRect ? {
        bottom: `${window.innerHeight - anchorRect.top}px`,
        left: `${anchorRect.left}px`,
    } : {};

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-20" onClick={onClose}></div>
            <div
                style={style}
                className="fixed bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl w-80 text-white z-30 border border-gray-700/50 animate-fade-in-fast"
            >
                <div className="p-4 border-b border-gray-700">
                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{t('chat.advancedControls.title')}</h3>
                </div>

                <div className="p-4 space-y-4">
                    {/* Session Settings */}
                    <fieldset>
                        <legend className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('chat.advancedControls.sessionSettings')}</legend>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">{t('chat.advancedControls.model')} <Tooltip text={t('chat.advancedControls.modelTooltip')} /></label>
                                <select value={chat.model} onChange={(e) => onChatUpdate('model', e.target.value)} className="mt-1 w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                                    {t('chat.advancedControls.operatingMode')}
                                    <Tooltip text={`
                                        <h4 class='font-bold text-white mb-1'>${t('chat.advancedControls.operatingModeTooltipTitle')}</h4>
                                        <ul class='space-y-1 text-left'>
                                            <li>${t('chat.advancedControls.operatingModeTooltipNone')}</li>
                                            <li>${t('chat.advancedControls.operatingModeTooltipStrategist')}</li>
                                            <li>${t('chat.advancedControls.operatingModeTooltipAutonomous')}</li>
                                            <li>${t('chat.advancedControls.operatingModeTooltipDeepResearch')}</li>
                                        </ul>
                                    `} />
                                </label>
                                <select value={chat.operatingMode || 'none'} onChange={(e) => onChatUpdate('operatingMode', e.target.value)} className="mt-1 w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500">
                                    <option value={OperatingMode.None}>{t('chat.advancedControls.none')}</option>
                                    <option value={OperatingMode.Strategist}>{t('chat.advancedControls.strategist')}</option>
                                    <option value={OperatingMode.Autonomous}>{t('chat.advancedControls.autonomous')}</option>
                                    <option value={OperatingMode.DeepResearch}>{t('chat.advancedControls.deepResearch')}</option>
                                </select>
                            </div>
                        </div>
                    </fieldset>
                    
                    {/* Next Message Settings */}
                     <fieldset className="border-t border-gray-700 pt-4">
                        <legend className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('chat.advancedControls.nextMessageSettings')}</legend>
                        <div className="space-y-4">
                           <Slider label={t('chat.advancedControls.temperature')} value={nextMessageConfig.temperature ?? 0.7} min={0} max={1} step={0.05} onChange={v => onNextMessageConfigChange('temperature', v)} tooltip={t('chat.advancedControls.temperatureTooltip')} />
                           <Slider label={t('chat.advancedControls.topK')} value={nextMessageConfig.topK ?? 40} min={1} max={100} step={1} onChange={v => onNextMessageConfigChange('topK', v)} tooltip={t('chat.advancedControls.topKTooltip')} />
                           <Slider label={t('chat.advancedControls.topP')} value={nextMessageConfig.topP ?? 0.95} min={0} max={1} step={0.05} onChange={v => onNextMessageConfigChange('topP', v)} tooltip={t('chat.advancedControls.topPTooltip')} />
                        </div>
                        <button onClick={onResetNextMessageConfig} className="mt-4 w-full text-center text-xs font-semibold text-gray-400 hover:text-white transition-colors py-1.5 rounded-md hover:bg-gray-700/50">{t('chat.advancedControls.resetToDefault')}</button>
                    </fieldset>
                </div>
            </div>
            <style>{`
                .range-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    background: #a855f7; /* purple-500 */
                    border-radius: 50%;
                    cursor: pointer;
                    margin-top: -6px;
                    transition: transform 0.2s;
                }
                .range-thumb:hover::-webkit-slider-thumb {
                    transform: scale(1.2);
                }
            `}</style>
        </>
    );
};
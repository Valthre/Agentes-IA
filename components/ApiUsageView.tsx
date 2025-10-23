import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { ApiTier, UsageState, TrackedModel } from '../types';
import * as usageService from '../services/usageService';

const ProgressBar: React.FC<{ value: number; max: number; label: string }> = ({ value, max, label }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const isHighUsage = percentage > 80;
    const isMediumUsage = percentage > 50 && !isHighUsage;

    const barColor = isHighUsage
        ? 'from-red-500 to-orange-500'
        : isMediumUsage
        ? 'from-yellow-500 to-amber-500'
        : 'from-blue-500 to-purple-500';

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-gray-300">{label}</span>
                <span className={`text-sm font-bold ${isHighUsage ? 'text-red-400' : 'text-gray-400'}`}>
                    {value} / {max > 1_000_000_000 ? 'Unlimited' : max}
                </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                    className={`bg-gradient-to-r ${barColor} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>
        </div>
    );
};

const ModelUsageCard: React.FC<{ model: TrackedModel; usage: UsageState }> = ({ model, usage }) => {
    const { t } = useTranslation();
    const modelData = usage.models[model];
    const quota = usageService.getQuotaForModel(usage.userTier, model);
    const rpm = usageService.calculateRPM(model);
    const rpd = modelData?.dailyRequests || 0;
    
    const modelDisplayName = model === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash';

    return (
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700/50 space-y-4">
            <h4 className="font-bold text-lg text-white">{modelDisplayName}</h4>
            <ProgressBar value={rpm} max={quota.RPM} label={t('modals.settings.apiUsage.rpm')} />
            <ProgressBar value={rpd} max={quota.RPD} label={t('modals.settings.apiUsage.rpd')} />
        </div>
    );
};


export const ApiUsageView: React.FC = () => {
    const { t } = useTranslation();
    const [usageState, setUsageState] = useState<UsageState>(usageService.getUsageState());

    useEffect(() => {
        const interval = setInterval(() => {
            setUsageState(usageService.getUsageState());
        }, 1000); // Refresh every second to keep RPM up-to-date
        return () => clearInterval(interval);
    }, []);

    const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTier = e.target.value as ApiTier;
        usageService.setTier(newTier);
        setUsageState(usageService.getUsageState());
    };
    
    const handleReset = () => {
        if(window.confirm(t('modals.settings.apiUsage.resetConfirmation'))){
            usageService.resetUsage();
            setUsageState(usageService.getUsageState());
        }
    }

    return (
        <div>
            <h3 className="text-xl font-bold text-white">{t('modals.settings.apiUsage.title')}</h3>
            <p className="text-gray-400 mt-2 mb-6 text-sm">
                {t('modals.settings.apiUsage.description')}
            </p>

            <div className="mb-6">
                <label htmlFor="tier-select" className="block text-sm font-medium text-gray-300 mb-2">
                    {t('modals.settings.apiUsage.selectTier')}
                </label>
                <select
                    id="tier-select"
                    value={usageState.userTier}
                    onChange={handleTierChange}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                    <option value="Free">Free</option>
                    <option value="Tier 1">Tier 1</option>
                    <option value="Tier 2">Tier 2</option>
                </select>
            </div>

            <div className="space-y-6">
                <ModelUsageCard model="gemini-2.5-pro" usage={usageState} />
                <ModelUsageCard model="gemini-2.5-flash" usage={usageState} />
            </div>
            
            <div className="mt-8 text-center border-t border-gray-700/50 pt-6">
                <p className="text-xs text-gray-500 mb-4">{t('modals.settings.apiUsage.disclaimer')}</p>
                 <button 
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-medium text-red-400 bg-gray-800 rounded-lg border border-gray-700 hover:bg-red-900/50 hover:text-red-300 transition-colors"
                >
                    {t('modals.settings.apiUsage.resetButton')}
                </button>
            </div>
        </div>
    );
};

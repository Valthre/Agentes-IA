import { ApiTier, ModelQuota, UsageState, TrackedModel } from '../types';

const USAGE_STATE_KEY = 'gemini-api-usage-state';

const QUOTAS: Record<ApiTier, Record<TrackedModel, ModelQuota>> = {
    'Free': {
        'gemini-3.1-pro-preview': { RPM: 5, RPD: 100, TPM: 125_000 },
        'gemini-3-flash-preview': { RPM: 10, RPD: 250, TPM: 250_000 },
        'gemini-2.5-pro': { RPM: 5, RPD: 100, TPM: 125_000 },
        'gemini-2.5-flash': { RPM: 10, RPD: 250, TPM: 250_000 },
    },
    'Tier 1': {
        'gemini-3.1-pro-preview': { RPM: 150, RPD: 10_000, TPM: 2_000_000 },
        'gemini-3-flash-preview': { RPM: 1_000, RPD: 10_000, TPM: 1_000_000 },
        'gemini-2.5-pro': { RPM: 150, RPD: 10_000, TPM: 2_000_000 },
        'gemini-2.5-flash': { RPM: 1_000, RPD: 10_000, TPM: 1_000_000 },
    },
    'Tier 2': {
        'gemini-3.1-pro-preview': { RPM: 1_000, RPD: 50_000, TPM: 5_000_000 },
        'gemini-3-flash-preview': { RPM: 2_000, RPD: 100_000, TPM: 3_000_000 },
        'gemini-2.5-pro': { RPM: 1_000, RPD: 50_000, TPM: 5_000_000 },
        'gemini-2.5-flash': { RPM: 2_000, RPD: 100_000, TPM: 3_000_000 },
    },
};

const getInitialState = (): UsageState => ({
    userTier: 'Free',
    models: {},
});

const getPSTDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

const loadState = (): UsageState => {
    try {
        const saved = localStorage.getItem(USAGE_STATE_KEY);
        if (saved) {
            const state: UsageState = JSON.parse(saved);
            const now = new Date();
            const todayPST = getPSTDate(now);

            // Check if any model's daily data needs resetting
            Object.keys(state.models).forEach(modelKey => {
                const model = modelKey as TrackedModel;
                const modelData = state.models[model];
                if (modelData) {
                    const lastResetDate = new Date(modelData.lastResetTimestampPST);
                    if (getPSTDate(lastResetDate) !== todayPST) {
                        modelData.dailyRequests = 0;
                        modelData.lastResetTimestampPST = now.toISOString();
                    }
                }
            });

            return state;
        }
    } catch (error) {
        console.error("Error loading usage state:", error);
    }
    return getInitialState();
};

const saveState = (state: UsageState) => {
    try {
        localStorage.setItem(USAGE_STATE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Error saving usage state:", error);
    }
};

export const getUsageState = (): UsageState => {
    return loadState();
};

export const getQuotaForModel = (tier: ApiTier, model: TrackedModel): ModelQuota => {
    const state = loadState();
    const liveQuota = state.models[model]?.liveQuota;
    return liveQuota || QUOTAS[tier]?.[model] || { RPM: 0, RPD: 0, TPM: 0 };
};

export const updateLiveQuotaFromHeaders = (model: string, headers: Headers) => {
    const supportedModels: string[] = ['gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'];
    if (!supportedModels.includes(model)) return;
    const trackedModel = model as TrackedModel;

    const state = loadState();
    
    const limitRPM = headers.get('x-ratelimit-limit-requests');
    const limitTPM = headers.get('x-ratelimit-limit-tokens');

    if (limitRPM || limitTPM) {
        if (!state.models[trackedModel]) {
            state.models[trackedModel] = {
                dailyRequests: 0,
                lastResetTimestampPST: new Date().toISOString(),
                requestsLog: [],
            };
        }

        state.models[trackedModel]!.liveQuota = {
            RPM: limitRPM ? parseInt(limitRPM) : (state.models[trackedModel]?.liveQuota?.RPM || QUOTAS[state.userTier][trackedModel].RPM),
            TPM: limitTPM ? parseInt(limitTPM) : (state.models[trackedModel]?.liveQuota?.TPM || QUOTAS[state.userTier][trackedModel].TPM),
            RPD: QUOTAS[state.userTier][trackedModel].RPD
        };

        saveState(state);
    }
};

export const recordRequest = (model: string) => {
    const supportedModels: string[] = ['gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'];
    if (!supportedModels.includes(model)) {
        return; // Only track supported models
    }
    const trackedModel: TrackedModel = model as TrackedModel;

    const state = loadState();
    const now = Date.now();
    
    if (!state.models[trackedModel]) {
        state.models[trackedModel] = {
            dailyRequests: 0,
            lastResetTimestampPST: new Date().toISOString(),
            requestsLog: [],
        };
    }

    const modelData = state.models[trackedModel]!;
    modelData.dailyRequests += 1;
    modelData.requestsLog.push({ timestamp: now });

    // Prune old requests from log
    const oneMinuteAgo = now - 60 * 1000;
    modelData.requestsLog = modelData.requestsLog.filter(req => req.timestamp > oneMinuteAgo);

    saveState(state);
};

export const setTier = (tier: ApiTier) => {
    const state = loadState();
    state.userTier = tier;
    saveState(state);
};

export const resetUsage = () => {
    if (window.confirm("Are you sure you want to reset all local usage data?")) {
        const state = getInitialState();
        const tier = loadState().userTier; // Preserve user's tier setting
        state.userTier = tier;
        saveState(state);
    }
};

export const calculateRPM = (model: TrackedModel): number => {
    const state = loadState();
    const modelData = state.models[model];
    if (!modelData) return 0;

    const oneMinuteAgo = Date.now() - 60 * 1000;
    return modelData.requestsLog.filter(req => req.timestamp > oneMinuteAgo).length;
};

import { ApiTier, ModelQuota, UsageState, TrackedModel } from '../types';

const USAGE_STATE_KEY = 'gemini-api-usage-state';

const QUOTAS: Record<ApiTier, Record<TrackedModel, ModelQuota>> = {
    'Free': {
        'gemini-2.5-pro': { RPM: 5, RPD: 100, TPM: 125_000 },
        'gemini-2.5-flash': { RPM: 10, RPD: 250, TPM: 250_000 },
    },
    'Tier 1': {
        'gemini-2.5-pro': { RPM: 150, RPD: 10_000, TPM: 2_000_000 },
        'gemini-2.5-flash': { RPM: 1_000, RPD: 10_000, TPM: 1_000_000 },
    },
    'Tier 2': {
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
    return QUOTAS[tier]?.[model] || { RPM: 0, RPD: 0, TPM: 0 };
};

export const recordRequest = (model: string) => {
    if (model !== 'gemini-2.5-pro' && model !== 'gemini-2.5-flash') {
        return; // Only track supported models
    }
    const trackedModel: TrackedModel = model;

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

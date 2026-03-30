export interface Source {
  title: string;
  uri: string;
}

export interface Message {
  role: 'user' | 'agent';
  content: string;
  sources?: Source[];
  // For regeneration
  variants?: { content: string; sources?: Source[] }[];
  activeVariantIndex?: number;
}

export enum AgentStatus {
  Idle = 'idle',
  Thinking = 'thinking',
  Error = 'error',
}

export enum OperatingMode {
    None = 'none',
    Strategist = 'strategist',
    Autonomous = 'autonomous',
    DeepResearch = 'deepResearch',
    MasterAgent = 'masterAgent'
}

export type LlmProvider = 'gemini' | 'openai';

export interface GenerationConfig {
    temperature?: number;
    topK?: number;
    topP?: number;
}

export interface Persona extends GenerationConfig {
    id: string;
    name: string;
    prompt: string;
    description?: string;
    greeting?: string;
    category?: string;
    model?: string;
    operatingMode?: OperatingMode;
    provider?: LlmProvider;
}

export interface Chat extends GenerationConfig {
  id: string;
  title: string;
  personaId: string;
  model: string;
  messages: Message[];
  provider: LlmProvider;
  operatingMode?: OperatingMode;
}

// --- API Usage Quota Types ---

export type ApiTier = 'Free' | 'Tier 1' | 'Tier 2';
export type TrackedModel = 'gemini-3.1-pro-preview' | 'gemini-3-flash-preview' | 'gemini-2.5-pro' | 'gemini-2.5-flash';

export interface ModelQuota {
    RPM: number; // Requests Per Minute
    RPD: number; // Requests Per Day
    TPM: number; // Tokens Per Minute (for future use)
}

export interface UsageData {
    dailyRequests: number;
    lastResetTimestampPST: string;
    requestsLog: { timestamp: number }[];
    liveQuota?: ModelQuota;
}

export interface UsageState {
    userTier: ApiTier;
    models: {
        [key in TrackedModel]?: UsageData;
    };
}
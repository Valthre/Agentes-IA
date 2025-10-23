import { LlmProvider, Message, Source, GenerationConfig, Persona } from '../types';
import * as gemini from './llm/gemini';
import * as openai from './llm/openai';

interface LlmService {
    streamAiChatResponse: (
        prompt: string, 
        history: Message[], 
        model: string, 
        apiKey: string, 
        persona: Persona,
        generationConfig?: GenerationConfig
    ) => AsyncGenerator<{ text?: string; sources?: Source[]; error?: string }>;
}

const services: { [key in LlmProvider]: LlmService } = {
    gemini: gemini,
    openai: openai
};

export const getLlmService = (provider: LlmProvider): LlmService => {
    const service = services[provider];
    if (!service) {
        console.warn(`LLM provider "${provider}" not found. Falling back to Gemini.`);
        return services.gemini;
    }
    return service;
};
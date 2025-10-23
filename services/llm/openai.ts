import { Message, Source, Persona, GenerationConfig } from "../../types";

// NOTE: This is a mock service for OpenAI.
// The app architecture now supports multiple LLM providers.
// This mock demonstrates the structure and can be replaced with a real API call
// once the OpenAI SDK is available in the environment.

// FIX: Updated function signature to match the LlmService interface.
export async function* streamAiChatResponse(
    prompt: string, 
    history: Message[], 
    model: string, 
    apiKey: string, 
    persona: Persona,
    generationConfig?: GenerationConfig
): AsyncGenerator<{ text?: string; sources?: Source[]; error?: string }> {
    if (!apiKey) {
        yield { error: "errors.apiKeyMissing" };
        return;
    }

    try {
        // FIX: Use persona.prompt to get the system instruction, aligning with the interface.
        const systemInstruction = persona.prompt;
        // Simulate a streaming response
        const mockResponse = `This is a mock response from the OpenAI service for the model '${model}'. The user prompt was: "${prompt}". The system instruction started with: "${systemInstruction?.substring(0, 50)}...". This demonstrates that the multi-provider architecture is working correctly.`;
        
        const words = mockResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network latency
            yield { text: words[i] + ' ' };
        }
        
    } catch (error: any) {
        console.error("Error in mock OpenAI service:", error);
        yield { error: "errors.generic" };
    }
}
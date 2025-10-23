import { GoogleGenAI, Content, Type } from "@google/genai";
import { Message, Source, GenerationConfig, Persona } from "../../types";

const formatHistoryForGemini = (history: Message[]): Content[] => {
    const filteredHistory = history.filter((msg, index) => !(index === history.length - 1 && msg.role === 'agent' && msg.content === ''));
    
    return filteredHistory.map(msg => ({
        role: msg.role === 'agent' ? 'model' : 'user',
        parts: [{ text: msg.content }],
    }));
};

async function* streamDefaultAgentResponse(
    ai: GoogleGenAI,
    prompt: string,
    history: Message[],
    model: string,
    persona: Persona,
    generationConfig?: GenerationConfig
): AsyncGenerator<{ text?: string; sources?: Source[]; error?: string }> {
    const formattedHistory = formatHistoryForGemini(history);
    const contents = [
        ...formattedHistory,
        { role: 'user' as const, parts: [{ text: prompt }] }
    ];

    const config: any = {
        tools: [{ googleSearch: {} }],
        ...generationConfig
    };

    if (persona.prompt) {
        config.systemInstruction = persona.prompt;
    }

    if (model === 'gemini-2.5-pro') {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const stream = await ai.models.generateContentStream({
        model: model || "gemini-2.5-flash",
        contents: contents,
        config,
    });
    
    for await (const chunk of stream) {
        const text = chunk.text;
        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: Source[] = [];

        if (groundingChunks) {
            for (const groundChunk of groundingChunks) {
                if (groundChunk.web) {
                    sources.push({
                        title: groundChunk.web.title || groundChunk.web.uri,
                        uri: groundChunk.web.uri,
                    });
                }
            }
        }
        yield { text, sources: sources.length > 0 ? sources : undefined };
    }
}

async function* streamProfessionalAgentResponse(
    ai: GoogleGenAI,
    prompt: string,
    history: Message[],
    persona: Persona,
    generationConfig?: GenerationConfig
): AsyncGenerator<{ text?: string; sources?: Source[]; error?: string }> {
    try {
        // Step 1: Generate insightful questions using a lite model
        const questionGenPrompt = `Baseado na seguinte solicitação do usuário, gere de 5 a 10 perguntas perspicazes para entender completamente o tópico antes de respondê-lo. Retorne APENAS um array JSON de strings. Solicitação do usuário: "${prompt}"`;
        
        const questionResponse = await ai.models.generateContent({
          model: 'gemini-flash-lite-latest',
          contents: [{ parts: [{ text: questionGenPrompt }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            temperature: 0.5,
          },
        });
        
        const questions = JSON.parse(questionResponse.text);
        
        // Step 2: Use the questions to build a comprehensive prompt for the pro model
        const analysisSystemInstruction = `Você é o 'Agente Profissional', um polímata analítico de elite. Sua tarefa é fornecer uma resposta abrangente e bem estruturada à solicitação original do usuário. Para estruturar seu pensamento e garantir profundidade, primeiro considere internamente as seguintes questões-chave:\n\n${questions.map((q: string) => `- ${q}`).join('\n')}\n\nAgora, com base na sua análise interna dessas questões, sintetize seu conhecimento e forneça uma resposta final, profissional e detalhada diretamente para a solicitação original do usuário. Não mencione as perguntas na sua resposta final. Apenas entregue a solução completa. Solicitação do usuário: "${prompt}"`;
        
        const formattedHistory = formatHistoryForGemini(history);
        const contents = [
            ...formattedHistory,
            { role: 'user' as const, parts: [{ text: prompt }] }
        ];

        const modelForAnalysis = persona.model || 'gemini-2.5-pro';

        const config: any = {
            systemInstruction: analysisSystemInstruction,
            tools: [{ googleSearch: {} }],
            ...generationConfig
        };

        if (modelForAnalysis === 'gemini-2.5-pro') {
            config.thinkingConfig = { thinkingBudget: 32768 };
        }

        const stream = await ai.models.generateContentStream({
            model: modelForAnalysis,
            contents,
            config,
        });

        for await (const chunk of stream) {
            const text = chunk.text;
            yield { text };
        }

    } catch (error) {
        console.error("Error in Professional Agent logic:", error);
        yield { error: "Ocorreu um erro no processo de análise do Agente Profissional." };
    }
}

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
        const ai = new GoogleGenAI({ apiKey });

        if (persona.id === 'professional-agent') {
            yield* streamProfessionalAgentResponse(ai, prompt, history, persona, generationConfig);
        } else {
            yield* streamDefaultAgentResponse(ai, prompt, history, model, persona, generationConfig);
        }

    } catch (error: any) {
        console.error("Error fetching AI response from Gemini:", error);
        if (error.message.includes('API key not valid')) {
             yield { error: "errors.apiKeyInvalid" };
        } else {
            yield { error: "errors.generic" };
        }
    }
}
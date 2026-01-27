/**
 * OpenRouter API Integration for Chicken Hawk Mode
 * 
 * Provides unified access to 100+ models via OpenRouter.
 */

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Model mapping for Chicken Hawk mode
export const OPENROUTER_MODELS = {
  "chickenhawk": "google/gemini-2.0-flash-exp:free", // Default for Chicken Hawk
  "gemini-2.0-flash": "google/gemini-2.0-flash-exp:free",
  "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
  "gpt-4o": "openai/gpt-4o",
  "gpt-4o-mini": "openai/gpt-4o-mini",
  "deepseek-r1": "deepseek/deepseek-r1",
  "llama-3.1-70b": "meta-llama/llama-3.1-70b-instruct",
  "mistral-large": "mistralai/mistral-large",
} as const;

export type ModelId = keyof typeof OPENROUTER_MODELS;

class OpenRouterClient {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";
  private siteUrl: string;
  private siteName: string;

  constructor(apiKey: string, siteUrl = "https://smelteros.com", siteName = "SmelterOS") {
    this.apiKey = apiKey;
    this.siteUrl = siteUrl;
    this.siteName = siteName;
  }

  async completion(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": this.siteUrl,
        "X-Title": this.siteName,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  async *streamCompletion(request: OpenRouterRequest): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": this.siteUrl,
        "X-Title": this.siteName,
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenRouter API Error: ${error.error?.message || response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  async listModels(): Promise<OpenRouterModel[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }
}

// Singleton instance
let clientInstance: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
  if (!clientInstance) {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || 
                   process.env.OPENROUTER_API_KEY || "";
    
    if (!apiKey) {
      console.warn("OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env.local");
    }
    
    clientInstance = new OpenRouterClient(apiKey);
  }
  return clientInstance;
}

// Helper function for Chicken Hawk mode
export async function chickenHawkCompletion(
  messages: OpenRouterMessage[],
  modelId: ModelId = "chickenhawk",
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const client = getOpenRouterClient();
  const model = OPENROUTER_MODELS[modelId];

  const systemMessage: OpenRouterMessage = {
    role: "system",
    content: `You are Chicken Hawk, an agentic AI assistant powered by SmelterOS. 
You have access to research, code generation, and multi-agent collaboration capabilities.
Be helpful, precise, and proactive. When given a task, break it down and execute step by step.`,
  };

  const response = await client.completion({
    model,
    messages: [systemMessage, ...messages],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
  });

  return response.choices[0]?.message?.content || "";
}

export { OpenRouterClient };

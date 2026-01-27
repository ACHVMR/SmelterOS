/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SmelterOS-ORACLE OpenRouter LLM Client
 * Default: GLM-4.7 | Fallback: Gemini 3 Flash
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { getEnvVar } from '../../config/environment';

// =============================================================================
// TYPES
// =============================================================================

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: OpenRouterMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMConfig {
  model: string;
  fallbackModel: string;
  maxTokens: number;
  temperature: number;
  topP: number;
}

export interface LLMResult {
  success: boolean;
  content: string;
  model: string;
  usedFallback: boolean;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  latencyMs: number;
  error?: string;
}

// =============================================================================
// MODEL REGISTRY
// =============================================================================

export const OPENROUTER_MODELS = {
  // Primary - GLM 4.7
  'glm-4.7': {
    id: 'thudm/glm-4-9b-chat',
    name: 'GLM-4.7',
    provider: 'THUDM',
    contextWindow: 128000,
    costPer1kTokens: 0.0002,
    recommended: true,
  },
  // Fallback - Gemini 3 Flash
  'gemini-3-flash': {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 3 Flash',
    provider: 'Google',
    contextWindow: 1000000,
    costPer1kTokens: 0.0001,
    recommended: true,
  },
  // Alternatives
  'gemini-2.0-flash': {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    contextWindow: 1000000,
    costPer1kTokens: 0.0001,
    recommended: true,
  },
  'claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextWindow: 200000,
    costPer1kTokens: 0.003,
    recommended: true,
  },
  'llama-3.1-70b': {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    contextWindow: 128000,
    costPer1kTokens: 0.0008,
    recommended: false,
  },
} as const;

export type OpenRouterModelKey = keyof typeof OPENROUTER_MODELS;

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

const DEFAULT_CONFIG: LLMConfig = {
  model: 'glm-4.7',
  fallbackModel: 'gemini-3-flash',
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.9,
};

// =============================================================================
// OPENROUTER CLIENT
// =============================================================================

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;
  private config: LLMConfig;
  private useMock: boolean;

  constructor(config: Partial<LLMConfig> = {}) {
    this.apiKey = getEnvVar('OPENROUTER_API_KEY', 'mock-api-key');
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.useMock = this.apiKey === 'mock-api-key' || !this.apiKey;

    if (this.useMock) {
      console.log('[OpenRouter] Running in MOCK mode - set OPENROUTER_API_KEY for production');
    }
  }

  /**
   * Get the OpenRouter model ID for a given key
   */
  private getModelId(modelKey: string): string {
    const model = OPENROUTER_MODELS[modelKey as OpenRouterModelKey];
    return model?.id || OPENROUTER_MODELS['glm-4.7'].id;
  }

  /**
   * Generate a mock response for development
   */
  private generateMockResponse(messages: OpenRouterMessage[], model: string): LLMResult {
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content || '';
    
    // Simulate processing time
    const latencyMs = Math.floor(Math.random() * 200) + 100;
    
    // Generate contextual mock response
    let mockContent = '';
    
    if (userQuery.toLowerCase().includes('code')) {
      mockContent = `[${model}] Here's the code implementation:\n\n\`\`\`typescript\n// SmelterOS generated code\nexport function processRequest(input: string): Result {\n  return { success: true, data: input };\n}\n\`\`\`\n\nThis follows our FDH methodology.`;
    } else if (userQuery.toLowerCase().includes('deploy')) {
      mockContent = `[${model}] Deployment analysis complete:\n\n1. Pre-flight checks: ✅ Passed\n2. Ethics gate: ✅ Virtue score 0.998\n3. Resource allocation: 2 vCPU, 2Gi RAM\n4. Estimated cold start: <50ms\n\nReady for production deployment.`;
    } else if (userQuery.toLowerCase().includes('design') || userQuery.toLowerCase().includes('ui')) {
      mockContent = `[${model}] UI/UX recommendations:\n\n- Primary: #6366F1 (Indigo)\n- Secondary: #8B5CF6 (Violet)\n- Accent: #F59E0B (Amber)\n\nTypography: Inter for headings, system-ui for body.\nSpacing: 8px grid system.`;
    } else if (userQuery.toLowerCase().includes('budget') || userQuery.toLowerCase().includes('cost')) {
      mockContent = `[${model}] Cost analysis:\n\n| Resource | Monthly Cost |\n|----------|-------------|\n| Cloud Run | $45.00 |\n| Firestore | $12.00 |\n| LLM Tokens | $28.00 |\n| **Total** | **$85.00** |\n\nWithin budget allocation.`;
    } else {
      mockContent = `[${model}] Processed query: "${userQuery.substring(0, 50)}..."\n\nAnalysis complete. The SmelterOS-ORACLE framework has evaluated this request through the FDH pipeline (Foster → Develop → Hone) with virtue alignment verification.`;
    }

    return {
      success: true,
      content: mockContent,
      model,
      usedFallback: false,
      tokens: {
        prompt: Math.floor(userQuery.length / 4),
        completion: Math.floor(mockContent.length / 4),
        total: Math.floor((userQuery.length + mockContent.length) / 4),
      },
      latencyMs,
    };
  }

  /**
   * Make a request to OpenRouter API
   */
  private async makeRequest(
    messages: OpenRouterMessage[],
    modelKey: string
  ): Promise<LLMResult> {
    const startTime = Date.now();
    const modelId = this.getModelId(modelKey);

    // Use mock in development
    if (this.useMock) {
      return this.generateMockResponse(messages, modelKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://smelter-workers-132049061623.us-central1.run.app',
          'X-Title': 'SmelterOS-ORACLE',
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          top_p: this.config.topP,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenRouterResponse;
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        content: data.choices[0]?.message?.content || '',
        model: modelKey,
        usedFallback: false,
        tokens: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0,
        },
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        content: '',
        model: modelKey,
        usedFallback: false,
        tokens: { prompt: 0, completion: 0, total: 0 },
        latencyMs,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Complete a chat with automatic fallback
   */
  async chat(
    messages: OpenRouterMessage[],
    options: Partial<LLMConfig> = {}
  ): Promise<LLMResult> {
    const config = { ...this.config, ...options };
    
    // Try primary model (GLM 4.7)
    let result = await this.makeRequest(messages, config.model);
    
    if (result.success) {
      return result;
    }

    // Fallback to Gemini 3 Flash
    console.log(`[OpenRouter] Primary model failed, falling back to ${config.fallbackModel}`);
    result = await this.makeRequest(messages, config.fallbackModel);
    result.usedFallback = true;

    return result;
  }

  /**
   * Simple completion with system prompt
   */
  async complete(
    prompt: string,
    systemPrompt?: string,
    options: Partial<LLMConfig> = {}
  ): Promise<LLMResult> {
    const messages: OpenRouterMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    return this.chat(messages, options);
  }

  /**
   * Get available models
   */
  getModels(): typeof OPENROUTER_MODELS {
    return OPENROUTER_MODELS;
  }

  /**
   * Check if running in mock mode
   */
  isMockMode(): boolean {
    return this.useMock;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let openRouterInstance: OpenRouterClient | null = null;

export function getOpenRouterClient(config?: Partial<LLMConfig>): OpenRouterClient {
  if (!openRouterInstance) {
    openRouterInstance = new OpenRouterClient(config);
  }
  return openRouterInstance;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default OpenRouterClient;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - ACHEEVY SERVICE (PRODUCTION)
 * Circuit Box integration for the ACHEEVY concierge
 * Routes all AI requests through Vertex AI via authenticated GCP calls
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PRODUCTION REQUIREMENTS:
 * - All API calls use GCP authentication (no mock responses)
 * - Voice cache for TTS responses (80%+ hit rate target)
 * - No artificial delays (setTimeout)
 * - Structured logging for observability
 */

import { GCP_PROJECT, GCP_SERVICES } from '../../infrastructure/gcp/config';
import { getAuthHeaders, buildGeminiEndpoint, buildSTTEndpoint, buildTTSEndpoint } from '../../infrastructure/gcp/auth';
import { getCircuitBox } from '../../infrastructure/circuit-box';
import { getCachedVoice, setCachedVoice, hashText } from '../../infrastructure/cache/lru-cache';
import { AcheevyMessage, AcheevySuggestion, AcheevyState } from '../components/Acheevy';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AcheevyContext {
  currentScreen: string;
  selectedTools: string[];
  recentActions: string[];
  userPreferences: Record<string, unknown>;
}

export interface AcheevyRequest {
  message: string;
  context: AcheevyContext;
  voiceInput?: boolean;
}

export interface AcheevyResponse {
  message: string;
  suggestions: AcheevySuggestion[];
  attachments?: Array<{
    type: 'code' | 'file' | 'link' | 'action';
    label: string;
    data: string;
  }>;
  actions?: AcheevyAction[];
}

export interface AcheevyAction {
  type: 'navigate' | 'execute' | 'deploy' | 'configure';
  target: string;
  params?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CIRCUIT BOX ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

const ACHEEVY_ENDPOINTS = {
  // Vertex AI for LLM inference
  inference: `https://${GCP_PROJECT.region}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT.projectId}/locations/${GCP_PROJECT.region}/publishers/google/models/gemini-1.5-pro:generateContent`,
  
  // Speech-to-Text for voice input
  stt: `https://speech.googleapis.com/v1/speech:recognize`,
  
  // Text-to-Speech for voice output
  tts: `https://texttospeech.googleapis.com/v1/text:synthesize`,
  
  // Cloud Run service (when deployed)
  service: `https://acheevy-${GCP_PROJECT.region}.run.app/api/chat`,
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

const ACHEEVY_SYSTEM_PROMPT = `You are ACHEEVY, the on-location AI concierge for SmelterOS.

SmelterOS is a powerful development platform built on GCP infrastructure. You help users:
- Navigate the Forge (build tools), Workbench (testing lab), and CircuitBox (system management)
- Deploy applications to Cloud Run
- Manage integrations with Vertex AI, Firestore, Pub/Sub, and other GCP services
- Configure voice pipelines (STT/TTS)
- Monitor system health and alerts

Key SmelterOS terminology:
- Foundry Home: Main dashboard
- Forge: Build and development tools
- Workbench: Testing lab for APIs and tools
- CircuitBox: System settings and integrations switchboard
- Academy: Learning resources
- Guild: Community features

You are helpful, concise, and technically proficient. When users ask about deployments, 
always recommend Cloud Run over local Docker. Suggest relevant actions when appropriate.

Current context will be provided with each request.`;

// ─────────────────────────────────────────────────────────────────────────────
// ACHEEVY SERVICE CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class AcheevyService {
  private state: AcheevyState = 'idle';
  private conversationHistory: AcheevyMessage[] = [];
  private circuitBox = getCircuitBox();

  constructor() {
    // Initialize Circuit Box connection
    this.wireToCircuitBox();
  }

  /**
   * Wire ACHEEVY to Circuit Box for telemetry and routing
   */
  private wireToCircuitBox(): void {
    console.log('[ACHEEVY] Wiring to Circuit Box...');
    
    // Register as a service in the consciousness panel
    this.circuitBox.registerConnection({
      id: 'acheevy-concierge',
      panelId: 'consciousness',
      sourceId: 'acheevy',
      targetId: 'vertex-ai',
      status: 'active',
      latency: 0
    });
  }

  /**
   * Get current state
   */
  getState(): AcheevyState {
    return this.state;
  }

  /**
   * Get conversation history
   */
  getHistory(): AcheevyMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Process a user message
   */
  async processMessage(request: AcheevyRequest): Promise<AcheevyResponse> {
    this.state = 'thinking';
    
    // Add user message to history
    const userMessage: AcheevyMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: request.message,
      timestamp: new Date()
    };
    this.conversationHistory.push(userMessage);

    try {
      // Build prompt with context
      const prompt = this.buildPrompt(request);
      
      // Call Vertex AI through Circuit Box
      const response = await this.callVertexAI(prompt);
      
      // Parse response and generate suggestions
      const parsedResponse = this.parseResponse(response, request.context);
      
      // Add ACHEEVY response to history
      const acheevyMessage: AcheevyMessage = {
        id: `msg-${Date.now()}`,
        role: 'acheevy',
        content: parsedResponse.message,
        timestamp: new Date(),
        attachments: parsedResponse.attachments
      };
      this.conversationHistory.push(acheevyMessage);
      
      this.state = 'idle';
      return parsedResponse;
      
    } catch (error) {
      this.state = 'idle';
      console.error('[ACHEEVY] Error processing message:', error);
      
      return {
        message: "I apologize, but I encountered an issue processing your request. Please try again or check the CircuitBox for system status.",
        suggestions: [
          { id: 'retry', icon: '🔄', label: 'Try again', action: 'retry' },
          { id: 'status', icon: '📊', label: 'Check status', action: 'navigate:circuitbox' }
        ]
      };
    }
  }

  /**
   * Process voice input with authenticated GCP calls
   */
  async processVoice(audioData: ArrayBuffer): Promise<string> {
    this.state = 'listening';
    
    try {
      // Convert audio to base64
      const audioBase64 = Buffer.from(audioData).toString('base64');
      
      // Get authenticated headers
      const headers = await getAuthHeaders();
      const endpoint = buildSTTEndpoint();
      
      // Call Speech-to-Text API with auth
      const sttResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
            model: 'latest_long',
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: audioBase64
          }
        })
      });

      if (!sttResponse.ok) {
        throw new Error(`STT request failed: ${sttResponse.status}`);
      }

      const result = await sttResponse.json() as {
        results?: Array<{
          alternatives?: Array<{ transcript?: string; confidence?: number }>
        }>
      };
      this.state = 'idle';

      const transcript = result.results?.[0]?.alternatives?.[0]?.transcript || '';
      const confidence = result.results?.[0]?.alternatives?.[0]?.confidence || 0;
      
      console.log('[ACHEEVY] STT result:', { transcript, confidence });
      
      return transcript;
      
    } catch (error) {
      this.state = 'idle';
      console.error('[ACHEEVY] STT error:', error);
      return '';
    }
  }

  /**
   * Generate speech from text with LRU caching
   * Target: 80%+ cache hit rate for repeated phrases
   */
  async speak(text: string): Promise<ArrayBuffer | null> {
    this.state = 'speaking';
    
    try {
      // Check voice cache first (L1: memory, L2: Redis, L3: Firestore)
      const cached = await getCachedVoice(text);
      if (cached) {
        console.log('[ACHEEVY] TTS cache hit');
        this.state = 'idle';
        return cached;
      }

      // Get authenticated headers
      const headers = await getAuthHeaders();
      const endpoint = buildTTSEndpoint();

      const ttsResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Neural2-A',
            ssmlGender: 'FEMALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0
          }
        })
      });

      if (!ttsResponse.ok) {
        throw new Error(`TTS request failed: ${ttsResponse.status}`);
      }

      const result = await ttsResponse.json() as { audioContent?: string };
      this.state = 'idle';
      
      if (result.audioContent) {
        const buffer = Buffer.from(result.audioContent, 'base64');
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
        
        // Cache the audio for future requests (async, don't block response)
        setCachedVoice(text, arrayBuffer).catch((err) => {
          console.warn('[ACHEEVY] Voice cache write failed:', err);
        });
        
        return arrayBuffer;
      }
      return null;
      
    } catch (error) {
      this.state = 'idle';
      console.error('[ACHEEVY] TTS error:', error);
      return null;
    }
  }

  /**
   * Build prompt with context
   */
  private buildPrompt(request: AcheevyRequest): string {
    const contextInfo = `
Current screen: ${request.context.currentScreen}
Selected tools: ${request.context.selectedTools.join(', ') || 'None'}
Recent actions: ${request.context.recentActions.slice(-5).join(', ') || 'None'}
`;

    const history = this.conversationHistory
      .slice(-10)
      .map(m => `${m.role === 'user' ? 'User' : 'ACHEEVY'}: ${m.content}`)
      .join('\n');

    return `${ACHEEVY_SYSTEM_PROMPT}

Context:
${contextInfo}

Conversation:
${history}

User: ${request.message}

ACHEEVY:`;
  }

  /**
   * Call Vertex AI through authenticated GCP endpoint
   * NO SIMULATION - Production API calls only
   */
  private async callVertexAI(prompt: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Get authenticated headers
      const headers = await getAuthHeaders();
      const endpoint = buildGeminiEndpoint('gemini-1.5-pro');
      
      // Build Gemini request
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ACHEEVY] Vertex AI error:', response.status, errorText);
        throw new Error(`Vertex AI request failed: ${response.status}`);
      }

      const data = await response.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
          finishReason?: string;
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
        };
      };

      // Calculate latency and update Circuit Box metrics
      const latencyMs = Date.now() - startTime;
      this.circuitBox.updateConnectionLatency('acheevy-concierge', latencyMs);

      // Log token usage for cost tracking
      if (data.usageMetadata) {
        console.log('[ACHEEVY] Token usage:', {
          promptTokens: data.usageMetadata.promptTokenCount,
          outputTokens: data.usageMetadata.candidatesTokenCount,
          latencyMs,
        });
      }

      // Extract response text
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        console.warn('[ACHEEVY] Empty response from Vertex AI');
        return "I apologize, but I couldn't generate a response. Please try again.";
      }

      return responseText;

    } catch (error) {
      console.error('[ACHEEVY] Vertex AI call failed:', error);
      
      // Update Circuit Box with error status
      this.circuitBox.updateConnectionLatency('acheevy-concierge', -1); // -1 indicates error
      
      throw error;
    }
  }

  /**
   * Parse AI response and generate suggestions
   */
  private parseResponse(response: string, context: AcheevyContext): AcheevyResponse {
    const suggestions: AcheevySuggestion[] = [];
    
    // Generate contextual suggestions based on response content
    if (response.toLowerCase().includes('deploy')) {
      suggestions.push({ id: 'deploy', icon: '🚀', label: 'Start deployment', action: 'deploy:cloudrun' });
    }
    
    if (response.toLowerCase().includes('workbench') || response.toLowerCase().includes('test')) {
      suggestions.push({ id: 'workbench', icon: '🧪', label: 'Go to Workbench', action: 'navigate:workbench' });
    }
    
    if (response.toLowerCase().includes('circuitbox') || response.toLowerCase().includes('status')) {
      suggestions.push({ id: 'circuitbox', icon: '⚡', label: 'Open CircuitBox', action: 'navigate:circuitbox' });
    }
    
    // Always add a help suggestion
    if (suggestions.length === 0) {
      suggestions.push(
        { id: 'help', icon: '❓', label: 'More options', action: 'help:menu' },
        { id: 'forge', icon: '🔨', label: 'Go to Forge', action: 'navigate:forge' }
      );
    }
    
    return {
      message: response,
      suggestions
    };
  }

  /**
   * Execute an action from suggestions
   */
  async executeAction(action: string): Promise<void> {
    const [type, target] = action.split(':');
    
    switch (type) {
      case 'navigate':
        // Emit navigation event
        console.log(`[ACHEEVY] Navigating to: ${target}`);
        break;
        
      case 'deploy':
        console.log(`[ACHEEVY] Starting deployment: ${target}`);
        break;
        
      case 'help':
        console.log(`[ACHEEVY] Showing help: ${target}`);
        break;
        
      default:
        console.log(`[ACHEEVY] Unknown action: ${action}`);
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

let acheevyInstance: AcheevyService | null = null;

export function getAcheevyService(): AcheevyService {
  if (!acheevyInstance) {
    acheevyInstance = new AcheevyService();
  }
  return acheevyInstance;
}

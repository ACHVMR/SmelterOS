/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SmelterOS-ORACLE Voice Pipeline
 * Unified STT (Groq Whisper) + TTS (ElevenLabs) interface
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { GroqWhisperClient, getGroqWhisperClient, WhisperTranscriptionResponse } from './groq-whisper';
import { ElevenLabsClient, getElevenLabsClient, TTSResponse, AGENT_VOICE_MAP } from './elevenlabs-tts';
import { OpenRouterClient, getOpenRouterClient, LLMResult } from '../llm/openrouter-client';

// =============================================================================
// TYPES
// =============================================================================

export interface VoiceConversationRequest {
  audioInput: string | Buffer; // Base64 or Buffer
  agentId?: string;
  context?: Record<string, unknown>;
  respondWithVoice?: boolean;
}

export interface VoiceConversationResponse {
  success: boolean;
  transcription: WhisperTranscriptionResponse;
  llmResponse?: LLMResult;
  audioResponse?: TTSResponse;
  totalLatencyMs: number;
  breakdown: {
    sttMs: number;
    llmMs: number;
    ttsMs: number;
  };
  error?: string;
}

export interface VoicePipelineConfig {
  sttModel?: 'whisper-large-v3' | 'whisper-large-v3-turbo' | 'distil-whisper-large-v3-en';
  ttsModel?: 'eleven_multilingual_v2' | 'eleven_turbo_v2_5';
  llmModel?: string;
  defaultAgentId?: string;
}

// =============================================================================
// VOICE PIPELINE
// =============================================================================

export class VoicePipeline {
  private sttClient: GroqWhisperClient;
  private ttsClient: ElevenLabsClient;
  private llmClient: OpenRouterClient;
  private config: VoicePipelineConfig;

  constructor(config: VoicePipelineConfig = {}) {
    this.config = {
      sttModel: 'whisper-large-v3-turbo',
      ttsModel: 'eleven_turbo_v2_5',
      llmModel: 'glm-4.7',
      defaultAgentId: 'acheevy',
      ...config,
    };

    this.sttClient = getGroqWhisperClient(this.config.sttModel);
    this.ttsClient = getElevenLabsClient(this.config.ttsModel);
    this.llmClient = getOpenRouterClient({ model: this.config.llmModel });
  }

  /**
   * Full voice conversation: Audio → Text → LLM → Audio
   */
  async conversation(
    request: VoiceConversationRequest
  ): Promise<VoiceConversationResponse> {
    const startTime = Date.now();
    const breakdown = { sttMs: 0, llmMs: 0, ttsMs: 0 };

    const agentId = request.agentId || this.config.defaultAgentId || 'acheevy';
    const respondWithVoice = request.respondWithVoice ?? true;

    try {
      // Step 1: Speech-to-Text (Groq Whisper)
      const sttStart = Date.now();
      const transcription = await this.sttClient.transcribe({
        audio: request.audioInput,
      });
      breakdown.sttMs = Date.now() - sttStart;

      if (!transcription.success) {
        return {
          success: false,
          transcription,
          totalLatencyMs: Date.now() - startTime,
          breakdown,
          error: transcription.error || 'STT failed',
        };
      }

      // Step 2: LLM Processing (OpenRouter)
      const llmStart = Date.now();
      const systemPrompt = this.getAgentSystemPrompt(agentId);
      const llmResponse = await this.llmClient.complete(
        transcription.text,
        systemPrompt
      );
      breakdown.llmMs = Date.now() - llmStart;

      if (!llmResponse.success) {
        return {
          success: false,
          transcription,
          llmResponse,
          totalLatencyMs: Date.now() - startTime,
          breakdown,
          error: llmResponse.error || 'LLM failed',
        };
      }

      // Step 3: Text-to-Speech (ElevenLabs) - Optional
      let audioResponse: TTSResponse | undefined;
      if (respondWithVoice) {
        const ttsStart = Date.now();
        audioResponse = await this.ttsClient.synthesizeForAgent(
          agentId,
          llmResponse.content
        );
        breakdown.ttsMs = Date.now() - ttsStart;
      }

      return {
        success: true,
        transcription,
        llmResponse,
        audioResponse,
        totalLatencyMs: Date.now() - startTime,
        breakdown,
      };
    } catch (error) {
      return {
        success: false,
        transcription: {
          success: false,
          text: '',
          latencyMs: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        totalLatencyMs: Date.now() - startTime,
        breakdown,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * STT only: Audio → Text
   */
  async transcribe(audio: string | Buffer): Promise<WhisperTranscriptionResponse> {
    return this.sttClient.transcribe({ audio });
  }

  /**
   * TTS only: Text → Audio
   */
  async synthesize(
    text: string,
    agentId?: string
  ): Promise<TTSResponse> {
    const agent = agentId || this.config.defaultAgentId || 'default';
    return this.ttsClient.synthesizeForAgent(agent, text);
  }

  /**
   * Get system prompt for agent
   */
  private getAgentSystemPrompt(agentId: string): string {
    const prompts: Record<string, string> = {
      'acheevy': `You are Acheevy, the SmelterOS-ORACLE Prime Orchestrator. You coordinate tasks across specialist agents (CTO, CMO, CFO, COO, CPO) following the FDH methodology (Foster → Develop → Hone). Be concise, professional, and action-oriented.`,
      
      'boomer-cto': `You are the Boomer CTO agent. You specialize in code review, deployment, CI/CD pipelines, and technical architecture. Provide technical guidance and code solutions. Be precise and technical.`,
      
      'boomer-cmo': `You are the Boomer CMO agent. You specialize in content creation, branding, UI/UX design, and marketing. Provide creative solutions with attention to user experience. Be creative and user-focused.`,
      
      'boomer-cfo': `You are the Boomer CFO agent. You specialize in budget tracking, cost analysis, financial forecasting, and resource optimization. Provide data-driven financial insights. Be analytical and precise.`,
      
      'boomer-coo': `You are the Boomer COO agent. You specialize in workflow automation, process optimization, and operational logistics. Provide efficient solutions for operations. Be systematic and efficient.`,
      
      'boomer-cpo': `You are the Boomer CPO agent. You specialize in product specifications, user research, and feature prioritization. Provide user-centric product insights. Be empathetic and strategic.`,
      
      'rlm-research': `You are the RLM Research agent. You specialize in deep analysis, recursive reasoning, and handling large context windows. Provide thorough research and analysis. Be comprehensive and insightful.`,
    };

    return prompts[agentId] || prompts['acheevy'];
  }

  /**
   * Get status of all voice services
   */
  getStatus(): {
    stt: { mock: boolean; model: string };
    tts: { mock: boolean; model: string };
    llm: { mock: boolean; model: string };
  } {
    return {
      stt: {
        mock: this.sttClient.isMockMode(),
        model: this.config.sttModel || 'whisper-large-v3-turbo',
      },
      tts: {
        mock: this.ttsClient.isMockMode(),
        model: this.config.ttsModel || 'eleven_turbo_v2_5',
      },
      llm: {
        mock: this.llmClient.isMockMode(),
        model: this.config.llmModel || 'glm-4.7',
      },
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let voicePipelineInstance: VoicePipeline | null = null;

export function getVoicePipeline(config?: VoicePipelineConfig): VoicePipeline {
  if (!voicePipelineInstance) {
    voicePipelineInstance = new VoicePipeline(config);
  }
  return voicePipelineInstance;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  GroqWhisperClient,
  getGroqWhisperClient,
  ElevenLabsClient,
  getElevenLabsClient,
  AGENT_VOICE_MAP,
};

export default VoicePipeline;

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SmelterOS-ORACLE ElevenLabs TTS Client
 * Premium voices only for Text-to-Speech synthesis
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { getEnvVar } from '../../config/environment';

// =============================================================================
// TYPES
// =============================================================================

export interface ElevenLabsVoice {
  id: string;
  name: string;
  category: 'premium' | 'standard';
  accent?: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'young' | 'middle-aged' | 'old';
  useCase: string[];
  recommended: boolean;
}

export interface TTSRequest {
  text: string;
  voiceId?: string;
  modelId?: ElevenLabsModel;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
  outputFormat?: OutputFormat;
}

export interface TTSResponse {
  success: boolean;
  audio?: Buffer | string; // Buffer in Node, base64 string for browser
  contentType: string;
  voiceId: string;
  characterCount: number;
  latencyMs: number;
  error?: string;
}

export interface TTSStreamResponse {
  success: boolean;
  stream?: ReadableStream;
  voiceId: string;
  error?: string;
}

export type ElevenLabsModel = 
  | 'eleven_multilingual_v2'
  | 'eleven_turbo_v2_5'
  | 'eleven_turbo_v2'
  | 'eleven_monolingual_v1';

export type OutputFormat =
  | 'mp3_44100_128'
  | 'mp3_44100_192'
  | 'pcm_16000'
  | 'pcm_22050'
  | 'pcm_24000'
  | 'pcm_44100';

// =============================================================================
// PREMIUM VOICE REGISTRY
// =============================================================================

export const PREMIUM_VOICES: Record<string, ElevenLabsVoice> = {
  // Professional Male Voices
  'adam': {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    category: 'premium',
    accent: 'American',
    gender: 'male',
    age: 'middle-aged',
    useCase: ['narration', 'corporate', 'explainer'],
    recommended: true,
  },
  'antoni': {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    category: 'premium',
    accent: 'American',
    gender: 'male',
    age: 'young',
    useCase: ['conversational', 'friendly', 'assistant'],
    recommended: true,
  },
  'josh': {
    id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    category: 'premium',
    accent: 'American',
    gender: 'male',
    age: 'young',
    useCase: ['casual', 'podcast', 'storytelling'],
    recommended: true,
  },
  'arnold': {
    id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    category: 'premium',
    accent: 'American',
    gender: 'male',
    age: 'middle-aged',
    useCase: ['authoritative', 'documentary', 'serious'],
    recommended: false,
  },

  // Professional Female Voices
  'rachel': {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    category: 'premium',
    accent: 'American',
    gender: 'female',
    age: 'young',
    useCase: ['assistant', 'calm', 'professional'],
    recommended: true,
  },
  'domi': {
    id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    category: 'premium',
    accent: 'American',
    gender: 'female',
    age: 'young',
    useCase: ['energetic', 'marketing', 'upbeat'],
    recommended: true,
  },
  'bella': {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    category: 'premium',
    accent: 'American',
    gender: 'female',
    age: 'young',
    useCase: ['soft', 'storytelling', 'meditation'],
    recommended: true,
  },
  'elli': {
    id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    category: 'premium',
    accent: 'American',
    gender: 'female',
    age: 'young',
    useCase: ['friendly', 'casual', 'conversational'],
    recommended: false,
  },

  // Neutral/Character Voices
  'sam': {
    id: 'yoZ06aMxZJJ28mfd3POQ',
    name: 'Sam',
    category: 'premium',
    accent: 'American',
    gender: 'neutral',
    age: 'young',
    useCase: ['neutral', 'informative', 'educational'],
    recommended: true,
  },

  // British Accents (Premium)
  'harry': {
    id: 'SOYHLrjzK2X1ezoPC6cr',
    name: 'Harry',
    category: 'premium',
    accent: 'British',
    gender: 'male',
    age: 'young',
    useCase: ['british', 'sophisticated', 'storytelling'],
    recommended: true,
  },
  'charlotte': {
    id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte',
    category: 'premium',
    accent: 'British',
    gender: 'female',
    age: 'middle-aged',
    useCase: ['british', 'elegant', 'narration'],
    recommended: true,
  },
};

// Default voices for different agent types
export const AGENT_VOICE_MAP: Record<string, string> = {
  'acheevy': 'adam',        // Orchestrator - professional male
  'boomer-cto': 'josh',     // CTO - casual tech voice
  'boomer-cmo': 'domi',     // CMO - energetic marketing
  'boomer-cfo': 'arnold',   // CFO - authoritative
  'boomer-coo': 'rachel',   // COO - calm professional
  'boomer-cpo': 'bella',    // CPO - soft, user-focused
  'rlm-research': 'sam',    // Research - neutral informative
  'default': 'antoni',      // Default - friendly assistant
};

// =============================================================================
// ELEVENLABS CLIENT
// =============================================================================

export class ElevenLabsClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: ElevenLabsModel;
  private defaultVoice: string;
  private useMock: boolean;

  constructor(
    model: ElevenLabsModel = 'eleven_turbo_v2_5',
    defaultVoice: string = 'antoni'
  ) {
    this.apiKey = getEnvVar('ELEVENLABS_API_KEY', 'mock-api-key');
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.defaultModel = model;
    this.defaultVoice = defaultVoice;
    this.useMock = this.apiKey === 'mock-api-key' || !this.apiKey;

    if (this.useMock) {
      console.log('[ElevenLabs] Running in MOCK mode - set ELEVENLABS_API_KEY for production');
    }
  }

  /**
   * Get voice ID from voice name
   */
  private getVoiceId(voiceNameOrId: string): string {
    const voice = PREMIUM_VOICES[voiceNameOrId.toLowerCase()];
    return voice?.id || voiceNameOrId;
  }

  /**
   * Generate mock audio response
   */
  private generateMockResponse(text: string, voiceId: string): TTSResponse {
    const latencyMs = Math.floor(text.length * 2) + 100; // ~2ms per character

    // Return a mock base64 audio placeholder
    // In production, this would be real audio data
    const mockAudioBase64 = Buffer.from(
      `MOCK_AUDIO_DATA_FOR_TEXT_LENGTH_${text.length}`
    ).toString('base64');

    return {
      success: true,
      audio: mockAudioBase64,
      contentType: 'audio/mpeg',
      voiceId,
      characterCount: text.length,
      latencyMs,
    };
  }

  /**
   * Synthesize speech from text
   */
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    const startTime = Date.now();
    const voiceId = this.getVoiceId(request.voiceId || this.defaultVoice);

    // Validate premium voice only
    const voiceEntry = Object.values(PREMIUM_VOICES).find((v) => v.id === voiceId);
    if (!voiceEntry && !this.useMock) {
      return {
        success: false,
        contentType: '',
        voiceId,
        characterCount: 0,
        latencyMs: 0,
        error: 'Only premium voices are allowed',
      };
    }

    // Use mock in development
    if (this.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return this.generateMockResponse(request.text, voiceId);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: request.text,
            model_id: request.modelId || this.defaultModel,
            voice_settings: {
              stability: request.stability ?? 0.5,
              similarity_boost: request.similarityBoost ?? 0.75,
              style: request.style ?? 0.0,
              use_speaker_boost: request.useSpeakerBoost ?? true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        audio: Buffer.from(audioBuffer),
        contentType: 'audio/mpeg',
        voiceId,
        characterCount: request.text.length,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        contentType: '',
        voiceId,
        characterCount: 0,
        latencyMs,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Synthesize speech for a specific agent
   */
  async synthesizeForAgent(
    agentId: string,
    text: string,
    options: Partial<TTSRequest> = {}
  ): Promise<TTSResponse> {
    const voiceName = AGENT_VOICE_MAP[agentId] || AGENT_VOICE_MAP['default'];
    return this.synthesize({
      text,
      voiceId: voiceName,
      ...options,
    });
  }

  /**
   * Get available premium voices
   */
  getVoices(): Record<string, ElevenLabsVoice> {
    return PREMIUM_VOICES;
  }

  /**
   * Get recommended voices
   */
  getRecommendedVoices(): ElevenLabsVoice[] {
    return Object.values(PREMIUM_VOICES).filter((v) => v.recommended);
  }

  /**
   * Get voice for agent
   */
  getAgentVoice(agentId: string): ElevenLabsVoice | undefined {
    const voiceName = AGENT_VOICE_MAP[agentId] || AGENT_VOICE_MAP['default'];
    return PREMIUM_VOICES[voiceName];
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

let elevenLabsInstance: ElevenLabsClient | null = null;

export function getElevenLabsClient(
  model?: ElevenLabsModel,
  defaultVoice?: string
): ElevenLabsClient {
  if (!elevenLabsInstance) {
    elevenLabsInstance = new ElevenLabsClient(model, defaultVoice);
  }
  return elevenLabsInstance;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ElevenLabsClient;

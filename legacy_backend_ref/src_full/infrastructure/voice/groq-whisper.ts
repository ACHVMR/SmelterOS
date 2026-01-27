/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SmelterOS-ORACLE Groq Whisper STT Client
 * Voice inference and Speech-to-Text via Groq API
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { getEnvVar } from '../../config/environment';

// =============================================================================
// TYPES
// =============================================================================

export interface WhisperTranscriptionRequest {
  audio: Buffer | Blob | string; // Base64 or file buffer
  model?: WhisperModel;
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'verbose_json';
  temperature?: number;
}

export interface WhisperTranscriptionResponse {
  success: boolean;
  text: string;
  language?: string;
  duration?: number;
  segments?: WhisperSegment[];
  latencyMs: number;
  error?: string;
}

export interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export type WhisperModel = 
  | 'whisper-large-v3'
  | 'whisper-large-v3-turbo'
  | 'distil-whisper-large-v3-en';

// =============================================================================
// MODEL REGISTRY
// =============================================================================

export const WHISPER_MODELS = {
  'whisper-large-v3': {
    id: 'whisper-large-v3',
    name: 'Whisper Large V3',
    languages: 'multilingual',
    speed: 'standard',
    accuracy: 'highest',
    recommended: true,
  },
  'whisper-large-v3-turbo': {
    id: 'whisper-large-v3-turbo',
    name: 'Whisper Large V3 Turbo',
    languages: 'multilingual',
    speed: 'fast',
    accuracy: 'high',
    recommended: true,
  },
  'distil-whisper-large-v3-en': {
    id: 'distil-whisper-large-v3-en',
    name: 'Distil Whisper Large V3 EN',
    languages: 'english-only',
    speed: 'fastest',
    accuracy: 'good',
    recommended: false,
  },
} as const;

// =============================================================================
// GROQ WHISPER CLIENT
// =============================================================================

export class GroqWhisperClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: WhisperModel;
  private useMock: boolean;

  constructor(model: WhisperModel = 'whisper-large-v3-turbo') {
    this.apiKey = getEnvVar('GROQ_API_KEY', 'mock-api-key');
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.defaultModel = model;
    this.useMock = this.apiKey === 'mock-api-key' || !this.apiKey;

    if (this.useMock) {
      console.log('[GroqWhisper] Running in MOCK mode - set GROQ_API_KEY for production');
    }
  }

  /**
   * Generate mock transcription for development
   */
  private generateMockTranscription(
    audioDuration?: number
  ): WhisperTranscriptionResponse {
    const duration = audioDuration || Math.random() * 30 + 5;
    const latencyMs = Math.floor(duration * 50); // Simulate ~50ms per second of audio

    const mockTexts = [
      "Hey team, I need a status update on the SmelterOS deployment. Can you check if the ethics gate is passing?",
      "Let's run the CI/CD pipeline and make sure all agents are responding correctly.",
      "The UI palette needs to be updated. Can the CMO agent generate some new color options?",
      "I want to deploy the new feature to production. Please verify the virtue score first.",
      "Can you analyze the budget allocation for this quarter? We need to optimize cloud costs.",
      "Schedule a workflow automation task for the next sprint planning session.",
      "Research the latest updates to the Gemini API and summarize the changes.",
    ];

    const text = mockTexts[Math.floor(Math.random() * mockTexts.length)];

    return {
      success: true,
      text,
      language: 'en',
      duration,
      segments: [
        {
          id: 0,
          seek: 0,
          start: 0,
          end: duration,
          text,
          tokens: [],
          temperature: 0,
          avg_logprob: -0.25,
          compression_ratio: 1.2,
          no_speech_prob: 0.01,
        },
      ],
      latencyMs,
    };
  }

  /**
   * Transcribe audio to text
   */
  async transcribe(
    request: WhisperTranscriptionRequest
  ): Promise<WhisperTranscriptionResponse> {
    const startTime = Date.now();
    const model = request.model || this.defaultModel;

    // Use mock in development
    if (this.useMock) {
      // Simulate async processing
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.generateMockTranscription();
    }

    try {
      // Prepare form data
      const formData = new FormData();
      
      if (typeof request.audio === 'string') {
        // Base64 encoded audio
        const audioBuffer = Buffer.from(request.audio, 'base64');
        const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
        formData.append('file', audioBlob, 'audio.wav');
      } else if (request.audio instanceof Buffer) {
        const audioBlob = new Blob([request.audio], { type: 'audio/wav' });
        formData.append('file', audioBlob, 'audio.wav');
      } else {
        formData.append('file', request.audio, 'audio.wav');
      }

      formData.append('model', model);
      
      if (request.language) {
        formData.append('language', request.language);
      }
      if (request.prompt) {
        formData.append('prompt', request.prompt);
      }
      formData.append('response_format', request.responseFormat || 'verbose_json');
      if (request.temperature !== undefined) {
        formData.append('temperature', request.temperature.toString());
      }

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as {
        text?: string;
        language?: string;
        duration?: number;
        segments?: WhisperSegment[];
      };
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        text: data.text || '',
        language: data.language,
        duration: data.duration,
        segments: data.segments,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        text: '',
        latencyMs,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Transcribe from base64 encoded audio
   */
  async transcribeBase64(
    base64Audio: string,
    options: Partial<Omit<WhisperTranscriptionRequest, 'audio'>> = {}
  ): Promise<WhisperTranscriptionResponse> {
    return this.transcribe({
      audio: base64Audio,
      ...options,
    });
  }

  /**
   * Get available models
   */
  getModels(): typeof WHISPER_MODELS {
    return WHISPER_MODELS;
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

let groqWhisperInstance: GroqWhisperClient | null = null;

export function getGroqWhisperClient(model?: WhisperModel): GroqWhisperClient {
  if (!groqWhisperInstance) {
    groqWhisperInstance = new GroqWhisperClient(model);
  }
  return groqWhisperInstance;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default GroqWhisperClient;

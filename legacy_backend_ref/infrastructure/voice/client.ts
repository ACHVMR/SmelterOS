/**
 * SmelterOS Voice Integration
 * Real ElevenLabs TTS & Deepgram STT Implementation
 * 
 * Production-ready voice synthesis and transcription
 */

import { getConfig } from '../../config/environment';

// =============================================================================
// TYPES
// =============================================================================

export interface VoiceSynthesisRequest {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;          // 0-1, default 0.5
  similarityBoost?: number;    // 0-1, default 0.75
  style?: number;              // 0-1, default 0
  useSpeakerBoost?: boolean;
  outputFormat?: 'mp3_44100_128' | 'mp3_22050_32' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000';
}

export interface VoiceSynthesisResponse {
  audioBuffer: Buffer;
  audioUrl?: string;
  contentType: string;
  durationMs: number;
  charactersUsed: number;
  voiceId: string;
  cached: boolean;
}

export interface TranscriptionRequest {
  audioBuffer?: Buffer;
  audioUrl?: string;
  language?: string;
  model?: 'nova-2' | 'nova-2-meeting' | 'nova-2-phonecall' | 'whisper';
  smartFormat?: boolean;
  punctuate?: boolean;
  diarize?: boolean;
  utterances?: boolean;
  keywords?: string[];
}

export interface TranscriptionResponse {
  transcript: string;
  confidence: number;
  words: TranscriptionWord[];
  utterances?: TranscriptionUtterance[];
  duration: number;
  language: string;
  channels: number;
}

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
}

export interface TranscriptionUtterance {
  speaker: number;
  transcript: string;
  start: number;
  end: number;
  confidence: number;
}

export interface VoiceStreamOptions {
  voiceId?: string;
  modelId?: string;
  onAudioChunk?: (chunk: Buffer) => void;
  onComplete?: (totalDuration: number) => void;
  onError?: (error: Error) => void;
}

// =============================================================================
// ELEVENLABS CLIENT
// =============================================================================

export class ElevenLabsClient {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private defaultVoiceId: string;
  private defaultModelId: string;
  private cache: Map<string, { buffer: Buffer; timestamp: number }> = new Map();
  private cacheTtlMs = 3600000; // 1 hour

  constructor() {
    const config = getConfig();
    this.apiKey = config.voice.elevenlabs.apiKey;
    this.defaultVoiceId = config.voice.elevenlabs.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Sarah
    this.defaultModelId = config.voice.elevenlabs.modelId || 'eleven_multilingual_v2';
  }

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Synthesize text to speech
   */
  async synthesize(request: VoiceSynthesisRequest): Promise<VoiceSynthesisResponse> {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs API key not configured');
    }

    const startTime = Date.now();
    const voiceId = request.voiceId || this.defaultVoiceId;
    const cacheKey = this.getCacheKey(request);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return {
        audioBuffer: cached.buffer,
        contentType: 'audio/mpeg',
        durationMs: Date.now() - startTime,
        charactersUsed: request.text.length,
        voiceId,
        cached: true,
      };
    }

    const response = await fetch(
      `${this.baseUrl}/text-to-speech/${voiceId}?output_format=${request.outputFormat || 'mp3_44100_128'}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          model_id: request.modelId || this.defaultModelId,
          voice_settings: {
            stability: request.stability ?? 0.5,
            similarity_boost: request.similarityBoost ?? 0.75,
            style: request.style ?? 0,
            use_speaker_boost: request.useSpeakerBoost ?? true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    
    // Cache the result
    this.cache.set(cacheKey, { buffer: audioBuffer, timestamp: Date.now() });

    // Cleanup old cache entries
    this.cleanupCache();

    return {
      audioBuffer,
      contentType: 'audio/mpeg',
      durationMs: Date.now() - startTime,
      charactersUsed: request.text.length,
      voiceId,
      cached: false,
    };
  }

  /**
   * Stream text to speech (for real-time output)
   */
  async streamSynthesize(
    text: string,
    options: VoiceStreamOptions
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = options.voiceId || this.defaultVoiceId;

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: options.modelId || this.defaultModelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs streaming error: ${response.status} - ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let totalBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        totalBytes += value.length;
        options.onAudioChunk?.(Buffer.from(value));
      }

      // Estimate duration based on bitrate (128kbps MP3)
      const estimatedDuration = (totalBytes * 8) / (128 * 1000);
      options.onComplete?.(estimatedDuration);

    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get voices: ${response.status}`);
    }

    const data = await response.json() as { voices: ElevenLabsVoice[] };
    return data.voices;
  }

  /**
   * Get usage information
   */
  async getUsage(): Promise<ElevenLabsUsage> {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/user/subscription`, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get usage: ${response.status}`);
    }

    return response.json() as Promise<ElevenLabsUsage>;
  }

  private getCacheKey(request: VoiceSynthesisRequest): string {
    return `${request.text}:${request.voiceId || this.defaultVoiceId}:${request.modelId || this.defaultModelId}`;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTtlMs) {
        this.cache.delete(key);
      }
    }
  }
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url: string;
}

export interface ElevenLabsUsage {
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
  allowed_to_extend_character_limit: boolean;
  next_character_count_reset_unix: number;
}

// =============================================================================
// DEEPGRAM CLIENT
// =============================================================================

export class DeepgramClient {
  private apiKey: string;
  private baseUrl = 'https://api.deepgram.com/v1';
  private defaultModel: string;

  constructor() {
    const config = getConfig();
    this.apiKey = config.voice.deepgram.apiKey;
    this.defaultModel = config.voice.deepgram.model || 'nova-2';
  }

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Transcribe audio buffer
   */
  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    if (!this.isConfigured()) {
      throw new Error('Deepgram API key not configured');
    }

    const startTime = Date.now();
    
    // Build query parameters
    const params = new URLSearchParams({
      model: request.model || this.defaultModel,
      smart_format: String(request.smartFormat ?? true),
      punctuate: String(request.punctuate ?? true),
      diarize: String(request.diarize ?? false),
      utterances: String(request.utterances ?? false),
    });

    if (request.language) {
      params.set('language', request.language);
    }

    if (request.keywords?.length) {
      params.set('keywords', request.keywords.join(','));
    }

    let body: Buffer | string;
    let contentType: string;

    if (request.audioBuffer) {
      body = request.audioBuffer;
      contentType = 'audio/wav'; // Adjust based on actual format
    } else if (request.audioUrl) {
      body = JSON.stringify({ url: request.audioUrl });
      contentType = 'application/json';
    } else {
      throw new Error('Either audioBuffer or audioUrl must be provided');
    }

    const response = await fetch(`${this.baseUrl}/listen?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': contentType,
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Deepgram API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as DeepgramResponse;
    const channel = data.results.channels[0];
    const alternative = channel.alternatives[0];

    const result: TranscriptionResponse = {
      transcript: alternative.transcript,
      confidence: alternative.confidence,
      words: alternative.words.map(w => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
        speaker: w.speaker,
      })),
      duration: data.metadata.duration,
      language: channel.detected_language || request.language || 'en',
      channels: data.metadata.channels,
    };

    if (data.results.utterances) {
      result.utterances = data.results.utterances.map(u => ({
        speaker: u.speaker,
        transcript: u.transcript,
        start: u.start,
        end: u.end,
        confidence: u.confidence,
      }));
    }

    console.log(`[Deepgram] Transcription completed in ${Date.now() - startTime}ms`);
    return result;
  }

  /**
   * Create live transcription WebSocket connection
   */
  createLiveTranscription(options: LiveTranscriptionOptions): LiveTranscription {
    if (!this.isConfigured()) {
      throw new Error('Deepgram API key not configured');
    }

    return new LiveTranscription(this.apiKey, this.defaultModel, options);
  }

  /**
   * Get usage information
   */
  async getUsage(startDate: string, endDate: string): Promise<DeepgramUsage> {
    if (!this.isConfigured()) {
      throw new Error('Deepgram API key not configured');
    }

    const params = new URLSearchParams({
      start: startDate,
      end: endDate,
    });

    const response = await fetch(`${this.baseUrl}/projects/usage?${params}`, {
      headers: {
        'Authorization': `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get usage: ${response.status}`);
    }

    return response.json() as Promise<DeepgramUsage>;
  }
}

interface DeepgramResponse {
  metadata: {
    transaction_key: string;
    request_id: string;
    sha256: string;
    created: string;
    duration: number;
    channels: number;
    models: string[];
  };
  results: {
    channels: Array<{
      detected_language?: string;
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words: Array<{
          word: string;
          start: number;
          end: number;
          confidence: number;
          speaker?: number;
        }>;
      }>;
    }>;
    utterances?: Array<{
      speaker: number;
      transcript: string;
      start: number;
      end: number;
      confidence: number;
    }>;
  };
}

export interface DeepgramUsage {
  start: string;
  end: string;
  resolution: {
    units: string;
    amount: number;
  };
  results: Array<{
    start: string;
    end: string;
    hours: number;
    requests: number;
  }>;
}

// =============================================================================
// LIVE TRANSCRIPTION (WebSocket)
// =============================================================================

export interface LiveTranscriptionOptions {
  language?: string;
  punctuate?: boolean;
  interimResults?: boolean;
  endpointing?: number; // milliseconds
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export class LiveTranscription {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private model: string;
  private options: LiveTranscriptionOptions;
  private isOpen = false;

  constructor(apiKey: string, model: string, options: LiveTranscriptionOptions) {
    this.apiKey = apiKey;
    this.model = model;
    this.options = options;
  }

  /**
   * Start live transcription
   */
  async start(): Promise<void> {
    const params = new URLSearchParams({
      model: this.model,
      punctuate: String(this.options.punctuate ?? true),
      interim_results: String(this.options.interimResults ?? true),
      endpointing: String(this.options.endpointing ?? 300),
    });

    if (this.options.language) {
      params.set('language', this.options.language);
    }

    const url = `wss://api.deepgram.com/v1/listen?${params}`;

    return new Promise((resolve, reject) => {
      // Note: In Node.js, would use 'ws' package
      // This is browser-compatible WebSocket
      this.ws = new WebSocket(url, ['token', this.apiKey]);

      this.ws.onopen = () => {
        this.isOpen = true;
        console.log('[LiveTranscription] Connected to Deepgram');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.channel?.alternatives?.[0]) {
            const transcript = data.channel.alternatives[0].transcript;
            const isFinal = data.is_final;
            this.options.onTranscript?.(transcript, isFinal);
          }
        } catch (error) {
          console.error('[LiveTranscription] Parse error:', error);
        }
      };

      this.ws.onerror = (event) => {
        const error = new Error(`WebSocket error: ${event}`);
        this.options.onError?.(error);
        reject(error);
      };

      this.ws.onclose = () => {
        this.isOpen = false;
        this.options.onClose?.();
      };
    });
  }

  /**
   * Send audio data
   */
  sendAudio(audioData: ArrayBuffer | Buffer): void {
    if (!this.isOpen || !this.ws) {
      throw new Error('WebSocket not connected');
    }
    this.ws.send(audioData);
  }

  /**
   * Stop live transcription
   */
  stop(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isOpen = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.isOpen;
  }
}

// =============================================================================
// UNIFIED VOICE SERVICE
// =============================================================================

export class VoiceService {
  private elevenLabs: ElevenLabsClient;
  private deepgram: DeepgramClient;
  private enabled: boolean;

  constructor() {
    const config = getConfig();
    this.enabled = config.features.voiceEnabled;
    this.elevenLabs = new ElevenLabsClient();
    this.deepgram = new DeepgramClient();
  }

  /**
   * Check if voice features are enabled and configured
   */
  isReady(): { tts: boolean; stt: boolean } {
    return {
      tts: this.enabled && this.elevenLabs.isConfigured(),
      stt: this.enabled && this.deepgram.isConfigured(),
    };
  }

  /**
   * Text to speech
   */
  async speak(text: string, options?: Partial<VoiceSynthesisRequest>): Promise<VoiceSynthesisResponse> {
    if (!this.isReady().tts) {
      throw new Error('TTS not available. Check ElevenLabs configuration.');
    }
    return this.elevenLabs.synthesize({ text, ...options });
  }

  /**
   * Speech to text
   */
  async transcribe(
    input: Buffer | string,
    options?: Partial<TranscriptionRequest>
  ): Promise<TranscriptionResponse> {
    if (!this.isReady().stt) {
      throw new Error('STT not available. Check Deepgram configuration.');
    }

    if (Buffer.isBuffer(input)) {
      return this.deepgram.transcribe({ audioBuffer: input, ...options });
    } else {
      return this.deepgram.transcribe({ audioUrl: input, ...options });
    }
  }

  /**
   * Start live transcription session
   */
  startLiveTranscription(options: LiveTranscriptionOptions): LiveTranscription {
    if (!this.isReady().stt) {
      throw new Error('STT not available. Check Deepgram configuration.');
    }
    return this.deepgram.createLiveTranscription(options);
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<ElevenLabsVoice[]> {
    if (!this.isReady().tts) {
      throw new Error('TTS not available');
    }
    return this.elevenLabs.getVoices();
  }

  /**
   * Get usage stats
   */
  async getUsage(): Promise<{ tts?: ElevenLabsUsage; stt?: DeepgramUsage }> {
    const result: { tts?: ElevenLabsUsage; stt?: DeepgramUsage } = {};

    if (this.isReady().tts) {
      result.tts = await this.elevenLabs.getUsage();
    }

    if (this.isReady().stt) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      result.stt = await this.deepgram.getUsage(
        startOfMonth.toISOString(),
        now.toISOString()
      );
    }

    return result;
  }
}

// =============================================================================
// SINGLETON EXPORTS
// =============================================================================

let voiceServiceInstance: VoiceService | null = null;

export function getVoiceService(): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService();
  }
  return voiceServiceInstance;
}

export function resetVoiceService(): void {
  voiceServiceInstance = null;
}

// Named exports for direct access
export const elevenLabs = new ElevenLabsClient();
export const deepgram = new DeepgramClient();

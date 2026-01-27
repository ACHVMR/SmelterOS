/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SmelterOS-ORACLE Voice Module
 * STT (Groq Whisper) + TTS (ElevenLabs) + Voice Pipeline
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export * from './client';

// Groq Whisper STT
export {
  GroqWhisperClient,
  getGroqWhisperClient,
  WHISPER_MODELS,
  type WhisperTranscriptionRequest,
  type WhisperTranscriptionResponse,
  type WhisperSegment,
  type WhisperModel,
} from './groq-whisper';

// ElevenLabs TTS
export {
  ElevenLabsClient,
  getElevenLabsClient,
  PREMIUM_VOICES,
  AGENT_VOICE_MAP,
  type ElevenLabsVoice,
  type TTSRequest,
  type TTSResponse,
  type ElevenLabsModel,
} from './elevenlabs-tts';

// Voice Pipeline
export {
  VoicePipeline,
  getVoicePipeline,
  type VoiceConversationRequest,
  type VoiceConversationResponse,
  type VoicePipelineConfig,
} from './voice-pipeline';

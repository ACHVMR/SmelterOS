/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Infrastructure Index
 * Exports all infrastructure modules (Production-Grade)
 * ═══════════════════════════════════════════════════════════════════════════
 */

// GCP Configuration
export * from './gcp/config';

// GCP Authentication (Production)
export {
  GCPAuthClient,
  getGCPAuthClient,
  getAccessToken,
  getAuthHeaders,
  buildGeminiEndpoint,
  buildEmbeddingsEndpoint,
  buildSTTEndpoint,
  buildTTSEndpoint,
  buildVisionEndpoint,
  buildDocumentAIEndpoint,
  buildCloudRunEndpoint,
  buildPubSubEndpoint,
  buildFirestoreEndpoint,
  GCP_SCOPES,
} from './gcp/auth';

// Circuit Box
export {
  CircuitStatus,
  CircuitTier,
  CircuitConnection,
  CircuitPanel,
  CircuitBoxState,
  CircuitType,
  CircuitBoxConfig,
  AnthropicConfig,
  ElevenLabsConfig,
  DeepgramConfig,
  VLJEPAConfig as CircuitVLJEPAConfig,
  SupabaseConfig,
  DEFAULT_CIRCUIT_BOX_CONFIG,
  CircuitBox,
  getCircuitBox,
} from './circuit-box/index';

export * from './circuit-box/ui-components';
export * from './circuit-box/wiring';

// AI Services (Legacy)
export {
  SemanticEmbedding,
  VLJEPAConfig,
  EmbeddingResult,
  SelectiveDecoderState,
  VLJEPAClient,
  AgentEmbeddingContext,
  embedAgentResponse,
  getVLJEPAClient,
} from './ai/vl-jepa';

// AI Services (Production)
export {
  ProductionVLJEPAClient,
  getProductionVLJEPAClient,
  embedText,
  embedImage,
  createSemanticEmbedding,
  VL_JEPA_CLOUD_RUN_CONFIG,
} from './ai/vl-jepa-production';

// Async Proof Gates (Production)
export {
  AsyncProofGateClient,
  getProofGateClient,
  triggerProofGateValidation,
  getProofGateStatus,
  proofGateWorkerHandler,
  PROOF_GATE_TOPICS,
  PROOF_GATE_COLLECTIONS,
  ProofGatePhase,
  ProofGateStatus,
  ProofGateRequest,
  ProofGateResult,
} from './proof-gates/async-proof-gate';

// LRU Cache Layer (Production)
export {
  ThreeTierCache,
  getVoiceCache,
  getModelConfigCache,
  getContextCache,
  getEmbeddingsCache,
  getSessionCache,
  getCachedVoice,
  setCachedVoice,
  getAllCacheStats,
  hashText,
  CACHE_CONFIGS,
} from './cache/lru-cache';

// Security
export * from './security/binge-security';

// Database Layer (Production)
export * from './database';

// API Layer (Production)
export * from './api';

// Voice Integration (Production)
export * from './voice';

// Agent Routing Backbone (Production)
export {
  // Types
  type AgentRole,
  type AgentStatus,
  type AgentCapabilities,
  type AgentDefinition,
  type AgentTask,
  type AgentTaskPayload,
  type AgentAttachment,
  type AgentContext,
  type AgentTaskResult,
  type AgentArtifact,
  type NextAction,
  type DelegationRequest,
  type AgentError,
  type AgentMetrics,
  type RoutingDecision,
  type AgentSession,
  type SessionMetrics,
  type CreateTaskOptions,
  type CreateSessionOptions,
  type AgentRequest,
  type AgentResponse,
  type ContextLayer,
  type ContextSource,
  type LoadedContext,
  type ContextLoadResult,
  type ContextLoadError,
  type ContextEmbedding,
  type SimilarityResult,
  type EmbeddingIndex,
  // Classes
  AGENT_REGISTRY,
  getAgentDefinition,
  getAgentsByTopic,
  getAgentsByContext,
  getVibeRequiredAgents,
  getAgentsByPriority,
  AgentRouter,
  agentRouter,
  TaskManager,
  taskManager,
  SessionManager,
  sessionManager,
  AgentGateway,
  agentGateway,
  ContextLoader,
  contextLoader,
  DEFAULT_CONTEXT_SOURCES,
  ContextEmbeddingsManager,
  contextEmbeddings,
} from './agents';

// Pub/Sub Workers (Production)
export {
  PUBSUB_TOPICS,
  type PubSubTopicConfig,
  type ACHEEVYInitPayload,
  type ProofGatePayload,
  type VisionPayload,
  type FilePayload,
  type AlertPayload,
  type AgentOrchestrationPayload,
  PubSubClient,
  publishACHEEVYInit,
  publishProofGate,
  publishVision,
  publishFile,
  publishAlert,
  publishAgentOrchestration,
  type WorkerResult,
  type WorkerMetrics,
  BaseWorker,
  WorkerOrchestrator,
} from './pubsub';

// GCS Storage (Production)
export {
  GCS_BUCKETS,
  type GCSBucketConfig,
  type UploadResult,
  type SignedUrlOptions,
  type ArtifactMetadata,
  GCSClient,
  getGCSClient,
} from './storage/gcs-client';

// Tool Roster & Ingot Assembly (Production)
export {
  // Types
  type CapabilityVertical,
  type ModelType,
  type TaskType,
  type TierLevel,
  type TierConfig,
  type ToolProfile,
  type UserProfile,
  type PaywallResult,
  type WiringMode,
  type ToolIngot,
  type IngotExecutionState,
  type ToolExecutionState,
  type IngotVisualization,
  type ToolVisualization,
  // Constants
  TIER_CONFIGS,
  TOOL_ROSTER,
  // Roster Functions
  getToolById,
  getToolsByVertical,
  getToolsForTier,
  getFreeAlternative,
  canAccessTool,
  queryRosterByCapabilities,
  getVerticalStats,
  // Paywall Service
  PaywallService,
  getPaywallService,
  acheevyPaywallCheck,
  // Ingot Assembler
  IngotAssembler,
  getIngotAssembler,
  gemmaT5AssembleIngot,
  // Visualization
  buildVisualization,
  renderIngotHTML,
} from './tools';

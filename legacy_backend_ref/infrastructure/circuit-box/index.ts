/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Digital Breaker - Central Operations Control
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The Digital Breaker is the MASTER CONTROL SYSTEM for SmelterOS.
 * All operational functionality routes through this centralized hub.
 * 
 * KEY FEATURES:
 * - Master ON/OFF Switch: Universal power control
 * - Panel-level Breakers: Isolate entire subsystems
 * - Circuit-level Control: Granular per-service management
 * - MANDATORY Auto-Reset: 30s cooldown, automatic recovery
 * - Low Latency Mandate: <50ms p95 enforced
 * - White-Label Ready: Full branding customization
 * - Audit Trail: Complete user action logging
 * 
 * PANELS:
 * 1. AI Agents Panel - Voice, Code Gen, Backend, Frontend, Testing, Deploy
 * 2. Repositories Panel - Intelligent repository sync
 * 3. External Integrations Panel - Stripe, GitHub, Cloudflare, PostgreSQL
 * 4. Voice & STT/TTS Panel - ElevenLabs, Scribe STT, real-time streaming
 * 5. Deployment & Infrastructure Panel - Docker, Cloudflare, Backups
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Core Digital Breaker
export {
  DigitalBreaker,
  getDigitalBreaker,
  
  // Types
  type BreakerState,
  type CircuitHealth,
  type LoadLevel,
  type LatencyMetrics,
  type CircuitMetrics,
  type CircuitBreaker,
  type Circuit,
  type CircuitCategory,
  type PanelBreaker,
  type Panel,
  type PanelSettings,
  type MasterSwitch,
  type BrandingConfig,
  type AlertLevel,
  type SystemAlert,
  type AuditLogEntry,
  type DigitalBreakerState,
  
  // Constants
  DEFAULT_BRANDING,
} from './digital-breaker';

// Default Panel Configuration
export {
  initializeDefaultPanels,
  createDigitalBreaker,
  
  // Config Types
  type AIAgentConfig,
  type RepositoryConfig,
  type IntegrationConfig,
  type VoiceServiceConfig,
  type InfrastructureConfig,
  
  // Default Configs
  DEFAULT_AI_AGENTS,
  DEFAULT_REPOSITORIES,
  DEFAULT_INTEGRATIONS,
  DEFAULT_VOICE_SERVICES,
  DEFAULT_INFRASTRUCTURE,
} from './default-panels';

// Legacy support (deprecated - use DigitalBreaker instead)
export {
  CircuitBox,
  getCircuitBox,
  DEFAULT_CIRCUIT_BOX_CONFIG,
  type CircuitBoxConfig,
  type CircuitBoxState,
  type CircuitConnection,
  type CircuitPanel,
  type CircuitType,
  type CircuitStatus,
  type CircuitTier,
  // Legacy config types
  type AnthropicConfig,
  type ElevenLabsConfig,
  type DeepgramConfig,
  type VLJEPAConfig,
  type SupabaseConfig,
} from './legacy-circuit-box';

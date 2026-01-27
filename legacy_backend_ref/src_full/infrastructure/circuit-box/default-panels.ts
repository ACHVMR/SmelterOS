/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Digital Breaker - Default Panel Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Pre-configured panels matching the SmelterOS architecture:
 * - AI Agents Panel
 * - Repositories Panel
 * - External Integrations Panel
 * - Voice & STT/TTS Panel
 * - Deployment & Infrastructure Panel
 * 
 * Clients can extend or replace these for white-label deployments.
 */

import { 
  DigitalBreaker, 
  getDigitalBreaker,
  CircuitCategory,
} from './digital-breaker';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PANEL 1: AI AGENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AIAgentConfig {
  id: string;
  name: string;
  description: string;
  modelProvider: 'anthropic' | 'openai' | 'groq' | 'vertex' | 'custom';
  modelId: string;
  apiKeySecretId: string;
  maxTokens: number;
  temperature: number;
  voiceEnabled: boolean;
}

export const DEFAULT_AI_AGENTS: AIAgentConfig[] = [
  {
    id: 'voice-agent',
    name: 'Voice Agent',
    description: 'ElevenLabs STT/TTS powered voice interaction',
    modelProvider: 'anthropic',
    modelId: 'claude-opus-4-5-20250514',
    apiKeySecretId: 'anthropic-api-key',
    maxTokens: 8192,
    temperature: 0.7,
    voiceEnabled: true,
  },
  {
    id: 'code-generation-agent',
    name: 'Code Generation Agent',
    description: 'Generates code across all supported languages',
    modelProvider: 'anthropic',
    modelId: 'claude-opus-4-5-20250514',
    apiKeySecretId: 'anthropic-api-key',
    maxTokens: 16384,
    temperature: 0.3,
    voiceEnabled: false,
  },
  {
    id: 'backend-agent',
    name: 'Backend Agent',
    description: 'API design, database schema, server logic',
    modelProvider: 'anthropic',
    modelId: 'claude-opus-4-5-20250514',
    apiKeySecretId: 'anthropic-api-key',
    maxTokens: 16384,
    temperature: 0.4,
    voiceEnabled: false,
  },
  {
    id: 'frontend-agent',
    name: 'Frontend Agent',
    description: 'UI components, React, Tailwind, animations',
    modelProvider: 'anthropic',
    modelId: 'claude-opus-4-5-20250514',
    apiKeySecretId: 'anthropic-api-key',
    maxTokens: 16384,
    temperature: 0.5,
    voiceEnabled: false,
  },
  {
    id: 'testing-agent',
    name: 'Testing Agent',
    description: 'Test generation, QA validation, coverage analysis',
    modelProvider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    apiKeySecretId: 'anthropic-api-key',
    maxTokens: 8192,
    temperature: 0.2,
    voiceEnabled: false,
  },
  {
    id: 'deploy-agent',
    name: 'Deploy Agent',
    description: 'CI/CD, containerization, cloud deployment',
    modelProvider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    apiKeySecretId: 'anthropic-api-key',
    maxTokens: 8192,
    temperature: 0.2,
    voiceEnabled: false,
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PANEL 2: REPOSITORIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface RepositoryConfig {
  id: string;
  name: string;
  description: string;
  provider: 'github' | 'gitlab' | 'bitbucket' | 'azure-devops';
  url: string;
  branch: string;
  autoSync: boolean;
  syncIntervalMs: number;
}

export const DEFAULT_REPOSITORIES: RepositoryConfig[] = [
  {
    id: 'repo-core',
    name: 'Core',
    description: 'SmelterOS core platform repository',
    provider: 'github',
    url: 'https://github.com/ACHVMR/SmelterOS',
    branch: 'main',
    autoSync: true,
    syncIntervalMs: 300000, // 5 minutes
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PANEL 3: EXTERNAL INTEGRATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  type: 'payment' | 'auth' | 'database' | 'cdn' | 'realtime' | 'storage' | 'analytics';
  endpoint: string;
  apiKeySecretId?: string;
  healthCheckPath?: string;
}

export const DEFAULT_INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'stripe',
    name: 'Stripe (Payments)',
    description: 'Payment processing and subscriptions',
    type: 'payment',
    endpoint: 'https://api.stripe.com/v1',
    apiKeySecretId: 'stripe-api-key',
    healthCheckPath: '/v1/charges',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Repository hosting and CI/CD',
    type: 'auth',
    endpoint: 'https://api.github.com',
    apiKeySecretId: 'github-token',
    healthCheckPath: '/user',
  },
  {
    id: 'cloudflare-workers',
    name: 'Cloudflare Workers',
    description: 'Serverless edge functions',
    type: 'cdn',
    endpoint: 'https://api.cloudflare.com/client/v4',
    apiKeySecretId: 'cloudflare-api-token',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL Database',
    description: 'Primary data persistence',
    type: 'database',
    endpoint: 'postgresql://localhost:5432/smelter',
    healthCheckPath: '/health',
  },
  {
    id: 'websocket-service',
    name: 'WebSocket Service',
    description: 'Real-time communication layer',
    type: 'realtime',
    endpoint: 'wss://ws.smelter.io',
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PANEL 4: VOICE & STT/TTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface VoiceServiceConfig {
  id: string;
  name: string;
  description: string;
  type: 'stt' | 'tts' | 'realtime' | 'voice-clone';
  provider: 'elevenlabs' | 'deepgram' | 'openai' | 'google' | 'azure';
  endpoint: string;
  apiKeySecretId: string;
  settings: Record<string, unknown>;
}

export const DEFAULT_VOICE_SERVICES: VoiceServiceConfig[] = [
  {
    id: 'elevenlabs-integration',
    name: 'ElevenLabs Integration',
    description: 'Primary voice synthesis provider',
    type: 'tts',
    provider: 'elevenlabs',
    endpoint: 'https://api.elevenlabs.io/v1',
    apiKeySecretId: 'elevenlabs-api-key',
    settings: {
      voiceId: 'EXAVITQu4vr4xnSDxMaL',
      modelId: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.75,
    },
  },
  {
    id: 'scribe-stt',
    name: 'Scribe STT',
    description: 'ElevenLabs speech-to-text service',
    type: 'stt',
    provider: 'elevenlabs',
    endpoint: 'https://api.elevenlabs.io/v1',
    apiKeySecretId: 'elevenlabs-api-key',
    settings: {
      model: 'scribe_v1',
      language: 'en',
    },
  },
  {
    id: 'tts-circuit',
    name: 'TTS Circuit Breaker',
    description: 'Text-to-speech output control',
    type: 'tts',
    provider: 'elevenlabs',
    endpoint: 'https://api.elevenlabs.io/v1',
    apiKeySecretId: 'elevenlabs-api-key',
    settings: {},
  },
  {
    id: 'realtime-streaming',
    name: 'Real-time Streaming',
    description: 'Low-latency voice streaming',
    type: 'realtime',
    provider: 'elevenlabs',
    endpoint: 'wss://api.elevenlabs.io/v1/text-to-speech',
    apiKeySecretId: 'elevenlabs-api-key',
    settings: {
      latencyOptimization: 'ultra-low',
    },
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PANEL 5: DEPLOYMENT & INFRASTRUCTURE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface InfrastructureConfig {
  id: string;
  name: string;
  description: string;
  type: 'container' | 'hosting' | 'ci-cd' | 'storage' | 'monitoring';
  provider: string;
  endpoint?: string;
  settings: Record<string, unknown>;
}

export const DEFAULT_INFRASTRUCTURE: InfrastructureConfig[] = [
  {
    id: 'docker-registry',
    name: 'Docker Container Registry',
    description: 'Container image storage and versioning',
    type: 'container',
    provider: 'cloudflare',
    endpoint: 'https://registry.smelter.io',
    settings: {},
  },
  {
    id: 'cloudflare-pages',
    name: 'Cloudflare Pages',
    description: 'Static site and frontend hosting',
    type: 'hosting',
    provider: 'cloudflare',
    settings: {},
  },
  {
    id: 'worker-deployment',
    name: 'Worker Deployment',
    description: 'Serverless function deployment',
    type: 'ci-cd',
    provider: 'cloudflare',
    settings: {},
  },
  {
    id: 'database-backups',
    name: 'Database Backups',
    description: 'Automated PostgreSQL backup system',
    type: 'storage',
    provider: 'gcp',
    settings: {
      schedule: '0 2 * * *', // 2 AM daily
      retention: 30,
    },
  },
  {
    id: 'health-check-circuit',
    name: 'Health Check Circuit',
    description: 'System-wide health monitoring',
    type: 'monitoring',
    provider: 'internal',
    settings: {
      interval: 30000, // 30 seconds
      timeout: 5000,
    },
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PANEL INITIALIZATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Initialize the Digital Breaker with all default panels
 */
export function initializeDefaultPanels(breaker: DigitalBreaker): void {
  // Panel 1: AI Agents
  const aiAgentsPanel = breaker.addPanel({
    id: 'ai-agents',
    name: 'AI Agents Panel',
    description: 'Voice Agent, Code Gen, Backend, Frontend, Testing, Deploy',
    icon: '🤖',
    position: 1,
  });

  for (const agent of DEFAULT_AI_AGENTS) {
    breaker.addCircuit('ai-agents', {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      category: 'ai-agent',
      apiKeySecretId: agent.apiKeySecretId,
      settings: {
        modelProvider: agent.modelProvider,
        modelId: agent.modelId,
        maxTokens: agent.maxTokens,
        temperature: agent.temperature,
        voiceEnabled: agent.voiceEnabled,
      },
    });
  }

  // Panel 2: Repositories
  breaker.addPanel({
    id: 'repositories',
    name: 'Repositories Panel',
    description: 'Intelligent repository management and sync',
    icon: '📁',
    position: 2,
  });

  for (const repo of DEFAULT_REPOSITORIES) {
    breaker.addCircuit('repositories', {
      id: repo.id,
      name: repo.name,
      description: repo.description,
      category: 'repository',
      endpoint: repo.url,
      settings: {
        provider: repo.provider,
        branch: repo.branch,
        autoSync: repo.autoSync,
        syncIntervalMs: repo.syncIntervalMs,
      },
    });
  }

  // Panel 3: External Integrations
  breaker.addPanel({
    id: 'integrations',
    name: 'External Integrations Panel',
    description: 'Stripe, GitHub, Cloudflare, PostgreSQL, WebSocket',
    icon: '🔌',
    position: 3,
  });

  for (const integration of DEFAULT_INTEGRATIONS) {
    breaker.addCircuit('integrations', {
      id: integration.id,
      name: integration.name,
      description: integration.description,
      category: 'integration',
      endpoint: integration.endpoint,
      apiKeySecretId: integration.apiKeySecretId,
      settings: {
        type: integration.type,
        healthCheckPath: integration.healthCheckPath,
      },
    });
  }

  // Panel 4: Voice & STT/TTS
  breaker.addPanel({
    id: 'voice',
    name: 'Voice & STT/TTS Panel',
    description: 'ElevenLabs integration, Scribe STT, real-time streaming',
    icon: '🎤',
    position: 4,
  });

  for (const service of DEFAULT_VOICE_SERVICES) {
    breaker.addCircuit('voice', {
      id: service.id,
      name: service.name,
      description: service.description,
      category: 'voice',
      endpoint: service.endpoint,
      apiKeySecretId: service.apiKeySecretId,
      settings: {
        type: service.type,
        provider: service.provider,
        ...service.settings,
      },
    });
  }

  // Panel 5: Deployment & Infrastructure
  breaker.addPanel({
    id: 'deployment',
    name: 'Deployment & Infrastructure Panel',
    description: 'Docker, Cloudflare Pages, Workers, Backups, Health',
    icon: '🚀',
    position: 5,
  });

  for (const infra of DEFAULT_INFRASTRUCTURE) {
    breaker.addCircuit('deployment', {
      id: infra.id,
      name: infra.name,
      description: infra.description,
      category: 'deployment',
      endpoint: infra.endpoint,
      settings: {
        type: infra.type,
        provider: infra.provider,
        ...infra.settings,
      },
    });
  }

  console.log('✓ Default panels initialized:');
  console.log('  Panel 1: AI Agents Panel (6 circuits)');
  console.log('  Panel 2: Repositories Panel');
  console.log('  Panel 3: External Integrations Panel (5 circuits)');
  console.log('  Panel 4: Voice & STT/TTS Panel (4 circuits)');
  console.log('  Panel 5: Deployment & Infrastructure Panel (5 circuits)');
}

/**
 * Quick setup - creates a fully configured Digital Breaker
 */
export function createDigitalBreaker(
  customBranding?: Partial<import('./digital-breaker').BrandingConfig>
): DigitalBreaker {
  const breaker = getDigitalBreaker(customBranding);
  initializeDefaultPanels(breaker);
  return breaker;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Circuit Box - Digital Breaker
 * Universal Power Control & Central Configuration Hub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The Circuit Box is the DIGITAL BREAKER of SmelterOS - the master switch
 * controlling all power flow through the system. Every service, integration,
 * and configuration flows through this central hub.
 * 
 * Features:
 * - Universal Master Switch: One switch to rule them all
 * - Panel Breakers: Isolate entire subsystems
 * - Circuit Breakers: Granular control per service
 * - Overload Protection: Automatic trip on threshold breach
 * - Manual Reset: Deliberate recovery from tripped states
 * 
 * Design Principle: Cohesive routing with absolute power control.
 */

import { GCP_PROJECT, GCP_SERVICES, GCPServiceConfig } from '../gcp/config';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CIRCUIT BOX TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type CircuitStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'tripped';
export type CircuitTier = 'light' | 'medium' | 'heavy' | 'superior' | 'defense-grade';
export type BreakerState = 'on' | 'off' | 'tripped';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DIGITAL BREAKER TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CircuitBreaker {
  state: BreakerState;
  tripCount: number;
  lastTripped?: Date;
  lastReset?: Date;
  tripThreshold: number;    // Error count before auto-trip
  errorCount: number;
  autoReset: boolean;       // Auto-reset after cooldown
  cooldownMs: number;       // Cooldown period before auto-reset
}

export interface PanelBreaker {
  state: BreakerState;
  lockedOut: boolean;       // Manual lockout - requires explicit reset
  tripCount: number;
  lastTripped?: Date;
}

export interface MasterBreaker {
  state: BreakerState;
  emergencyShutdown: boolean;
  lastStateChange: Date;
  uptimeMs: number;
  powerCycles: number;
}

export interface CircuitConnection {
  id: string;
  name: string;
  type: CircuitType;
  status: CircuitStatus;
  tier: CircuitTier;
  endpoint?: string;
  lastPing?: Date;
  latencyMs?: number;
  errorMessage?: string;
  breaker: CircuitBreaker;  // Individual circuit breaker
}

export type CircuitType =
  | 'gcp'           // Google Cloud Platform
  | 'anthropic'     // Claude Opus 4.5
  | 'firestore'     // Database
  | 'storage'       // Object Storage
  | 'pubsub'        // Event Messaging
  | 'vertexai'      // ML Platform
  | 'vision'        // VL-JEPA Integration
  | 'secrets'       // Secret Manager
  | 'logging'       // Observability
  | 'workspace'     // Google Workspace APIs
  | 'firebase'      // Firebase Services
  | 'maps'          // Maps Platform
  | 'content'       // Media & Content
  | 'integration'   // Integration Services
  | 'external';     // Third-party services

export interface CircuitPanel {
  id: string;
  name: string;
  description: string;
  icon: string;
  circuits: CircuitConnection[];
  status: CircuitStatus;
  vibeScore: number;
  breaker: PanelBreaker;    // Panel-level breaker
}

export interface CircuitBoxState {
  initialized: boolean;
  projectId: string;
  projectNumber: string;
  environment: 'development' | 'staging' | 'production';
  panels: CircuitPanel[];
  overallStatus: CircuitStatus;
  overallVibeScore: number;
  lastHealthCheck: Date;
  masterBreaker: MasterBreaker;  // Universal ON/OFF switch
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXTERNAL SERVICE CONFIGURATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AnthropicConfig {
  model: 'claude-opus-4-5-20250514' | 'claude-sonnet-4-20250514';
  apiKeySecretId: string;
  maxTokens: number;
  temperature: number;
  contextWindow: number;
}

export interface ElevenLabsConfig {
  voiceId: string;
  modelId: string;
  apiKeySecretId: string;
  stability: number;
  similarityBoost: number;
}

export interface DeepgramConfig {
  model: 'nova-2' | 'nova-2-general';
  apiKeySecretId: string;
  language: string;
  punctuate: boolean;
  diarize: boolean;
}

export interface VLJEPAConfig {
  embeddingDim: number;
  visionEncoder: string;
  textEncoder: string;
  selectiveDecodingThreshold: number;
  windowSize: number;
}

export interface SupabaseConfig {
  projectUrl: string;
  anonKeySecretId: string;
  serviceRoleKeySecretId: string;
  enableRLS: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CIRCUIT BOX CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CircuitBoxConfig {
  gcp: {
    projectId: string;
    projectNumber: string;
    region: string;
    zone: string;
  };
  anthropic: AnthropicConfig;
  elevenLabs: ElevenLabsConfig;
  deepgram: DeepgramConfig;
  vlJepa: VLJEPAConfig;
  supabase?: SupabaseConfig;
  security: {
    tier: CircuitTier;
    enableRLS: boolean;
    enableAuditLog: boolean;
    enableEncryption: boolean;
    policyPackId: string;
  };
  observability: {
    enableTracing: boolean;
    enableMetrics: boolean;
    enableProfiling: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    retentionDays: number;
  };
  consciousness: {
    vibeThreshold: number;
    haltOnVibeFailure: boolean;
    triConsciousnessEnabled: boolean;
    melaniumTrackingEnabled: boolean;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEFAULT CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DEFAULT_CIRCUIT_BOX_CONFIG: CircuitBoxConfig = {
  gcp: {
    projectId: GCP_PROJECT.projectId,
    projectNumber: GCP_PROJECT.projectNumber,
    region: GCP_PROJECT.region,
    zone: GCP_PROJECT.zone,
  },
  anthropic: {
    model: 'claude-opus-4-5-20250514',
    apiKeySecretId: 'anthropic-api-key',
    maxTokens: 8192,
    temperature: 0.7,
    contextWindow: 200000,
  },
  elevenLabs: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // ACHEEVY default voice
    modelId: 'eleven_turbo_v2_5',
    apiKeySecretId: 'elevenlabs-api-key',
    stability: 0.5,
    similarityBoost: 0.75,
  },
  deepgram: {
    model: 'nova-2',
    apiKeySecretId: 'deepgram-api-key',
    language: 'en-US',
    punctuate: true,
    diarize: true,
  },
  vlJepa: {
    embeddingDim: 1536,
    visionEncoder: 'google/vit-base-patch16-224',
    textEncoder: 'sentence-transformers/all-MiniLM-L6-v2',
    selectiveDecodingThreshold: 0.15,
    windowSize: 5,
  },
  security: {
    tier: 'heavy',
    enableRLS: true,
    enableAuditLog: true,
    enableEncryption: true,
    policyPackId: 'smelter-governance-v1',
  },
  observability: {
    enableTracing: true,
    enableMetrics: true,
    enableProfiling: false,
    logLevel: 'info',
    retentionDays: 30,
  },
  consciousness: {
    vibeThreshold: 0.995,
    haltOnVibeFailure: true,
    triConsciousnessEnabled: true,
    melaniumTrackingEnabled: true,
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CIRCUIT BOX CLASS - DIGITAL BREAKER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class CircuitBox {
  private static instance: CircuitBox;
  private config: CircuitBoxConfig;
  private state: CircuitBoxState;
  private startTime: Date;

  private constructor(config: CircuitBoxConfig = DEFAULT_CIRCUIT_BOX_CONFIG) {
    this.config = config;
    this.startTime = new Date();
    this.state = {
      initialized: false,
      projectId: config.gcp.projectId,
      projectNumber: config.gcp.projectNumber,
      environment: 'production',
      panels: [],
      overallStatus: 'disconnected',
      overallVibeScore: 0,
      lastHealthCheck: new Date(),
      masterBreaker: {
        state: 'off',
        emergencyShutdown: false,
        lastStateChange: new Date(),
        uptimeMs: 0,
        powerCycles: 0,
      },
    };
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(config?: CircuitBoxConfig): CircuitBox {
    if (!CircuitBox.instance) {
      CircuitBox.instance = new CircuitBox(config);
    }
    return CircuitBox.instance;
  }

  /**
   * Initialize all circuit panels
   */
  public async initialize(): Promise<void> {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║            SMELTER OS - CIRCUIT BOX INITIALIZING               ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  Project: ${this.config.gcp.projectId.padEnd(40)}║`);
    console.log(`║  Region:  ${this.config.gcp.region.padEnd(40)}║`);
    console.log('╚════════════════════════════════════════════════════════════════╝');

    // Create circuit panels for all 116 APIs across all tiers
    this.state.panels = [
      this.createCoreInfraPanel(),
      this.createPersistencePanel(),
      this.createConsciousnessPanel(),
      this.createSecurityPanel(),
      this.createObservabilityPanel(),
      this.createContentPanel(),
      this.createIntegrationPanel(),
      this.createWorkspacePanel(),
      this.createFirebasePanel(),
      this.createMapsPanel(),
      this.createOptionalPanel(),
      this.createExternalServicesPanel(),
    ];

    // Initialize each panel
    for (const panel of this.state.panels) {
      await this.initializePanel(panel);
    }

    // Calculate overall status
    this.updateOverallStatus();
    this.state.initialized = true;
    this.state.lastHealthCheck = new Date();

    this.printStatus();
  }

  /**
   * Create Core Infrastructure Panel
   */
  private createCoreInfraPanel(): CircuitPanel {
    const coreServices = GCP_SERVICES.filter((s) => s.tier === 'core');
    return {
      id: 'core-infra',
      name: 'Core Infrastructure',
      description: 'Cloud Run, Functions, Build, Compute, Storage, Pub/Sub',
      icon: '⚡',
      circuits: coreServices.map((s) => this.serviceToCircuit(s)),
      status: 'disconnected',
      vibeScore: 0,
      breaker: this.createPanelBreaker(),
    };
  }

  /**
   * Create Persistence & Databases Panel
   */
  private createPersistencePanel(): CircuitPanel {
    const persistenceServices = GCP_SERVICES.filter((s) => s.tier === 'persistence');
    return {
      id: 'persistence',
      name: 'Persistence & Databases',
      description: 'Firestore, Cloud SQL, Redis, AlloyDB',
      icon: '💾',
      circuits: persistenceServices.map((s) => this.serviceToCircuit(s)),
      status: 'disconnected',
      vibeScore: 0,
      breaker: this.createPanelBreaker(),
    };
  }

  /**
   * Create Consciousness Panel
   */
  private createConsciousnessPanel(): CircuitPanel {
    const consciousnessServices = GCP_SERVICES.filter((s) => s.tier === 'consciousness');
    return {
      id: 'consciousness',
      name: 'AI & Consciousness',
      description: 'Vertex AI, Gemini, Dialogflow, Vision, Speech, VL-JEPA',
      icon: '🧠',
      circuits: [
        ...consciousnessServices.map((s) => this.serviceToCircuit(s)),
        {
          id: 'anthropic-claude',
          name: 'Claude Opus 4.5',
          type: 'anthropic',
          status: 'disconnected',
          tier: 'heavy',
          endpoint: 'https://api.anthropic.com/v1',
          breaker: this.createCircuitBreaker(),
        },
        {
          id: 'vl-jepa',
          name: 'VL-JEPA Embeddings',
          type: 'vision',
          status: 'disconnected',
          tier: 'heavy',
          breaker: this.createCircuitBreaker(),
        },
      ],
      status: 'disconnected',
      vibeScore: 0,
      breaker: this.createPanelBreaker(),
    };
  }

  /**
   * Create Security Panel
   */
  private createSecurityPanel(): CircuitPanel {
    const securityServices = GCP_SERVICES.filter((s) => s.tier === 'security');
    return {
      id: 'security',
      name: 'Security & Identity',
      description: 'Secret Manager, IAM, Identity Toolkit, Firebase Rules',
      icon: '🔒',
      circuits: securityServices.map((s) => this.serviceToCircuit(s)),
      status: 'disconnected',
      vibeScore: 0,
      breaker: this.createPanelBreaker(),
    };
  }

  /**
   * Create Observability Panel
   */
  private createObservabilityPanel(): CircuitPanel {
    const analyticsServices = GCP_SERVICES.filter((s) => s.tier === 'analytics');
    return {
      id: 'observability',
      name: 'Analytics & Observability',
      description: 'BigQuery, Logging, Monitoring, Trace, Looker',
      icon: '📊',
      circuits: analyticsServices.map((s) => this.serviceToCircuit(s)),
      status: 'disconnected',
      vibeScore: 0,
      breaker: this.createPanelBreaker(),
    };
  }

  /**
   * Create Content & Media Panel
   */
  private createContentPanel(): CircuitPanel {
    const contentServices = GCP_SERVICES.filter((s) => s.tier === 'content');
    return {
      id: 'content',
      name: 'Content & Media',
      description: 'YouTube, Photos Library',
      icon: '🎬',
      circuits: contentServices.map((s) => this.serviceToCircuit(s)),
      status: 'disconnected',
      vibeScore: 0,
      breaker: this.createPanelBreaker(),
    };
  }

  /**
   * Create Integration Panel
   */
  private createIntegrationPanel(): CircuitPanel {
    const integrationServices = GCP_SERVICES.filter((s) => s.tier === 'integration');
    // Exclude Workspace and Firebase APIs (they have their own panels)
    const workspaceApiIds = [
      'gmail.googleapis.com', 'calendar-json.googleapis.com', 'chat.googleapis.com',
      'meet.googleapis.com', 'docs.googleapis.com', 'sheets.googleapis.com',
      'slides.googleapis.com', 'drive.googleapis.com', 'forms.googleapis.com',
      'admin.googleapis.com', 'groupssettings.googleapis.com', 'script.googleapis.com'
    ];
    const firebaseApiIds = [
      'fcm.googleapis.com', 'fcmregistrations.googleapis.com',
      'firebasedynamiclinks.googleapis.com'
    ];
    const excludeIds = [...workspaceApiIds, ...firebaseApiIds];
    const filteredServices = integrationServices.filter((s) => !excludeIds.includes(s.apiId));
    
    return {
      id: 'integration',
      name: 'Integration & Workflows',
      description: 'Workflows, Dataform, Dataplex, Notebooks, Merchant',
      icon: '🔗',
      circuits: filteredServices.map((s) => this.serviceToCircuit(s)),
      status: 'disconnected',
      vibeScore: 0,
      breaker: this.createPanelBreaker(),
    };
  }

  /**
   * Create Google Workspace Panel
   */
  private createWorkspacePanel(): CircuitPanel {
    const workspaceApiIds = [
      'gmail.googleapis.com', 'calendar-json.googleapis.com', 'chat.googleapis.com',
      'meet.googleapis.com', 'docs.googleapis.com', 'sheets.googleapis.com',
      'slides.googleapis.com', 'drive.googleapis.com', 'forms.googleapis.com',
      'admin.googleapis.com', 'groupssettings.googleapis.com', 'script.googleapis.com'
    ];
    const workspaceServices = GCP_SERVICES.filter((s) => workspaceApiIds.includes(s.apiId));
    
    return {
      id: 'workspace',
      name: 'Google Workspace',
      description: 'Gmail, Calendar, Docs, Sheets, Drive, Meet, Chat',
      icon: '📧',
      circuits: workspaceServices.map((s) => ({
        ...this.serviceToCircuit(s),
        type: 'workspace' as CircuitType,
      })),
      status: 'disconnected',
      vibeScore: 0,
      breaker: this.createPanelBreaker(),
    };
  }

  /**
   * Create Firebase Panel
   */
  private createFirebasePanel(): CircuitPanel {
    const firebaseApiIds = [
      'firebase.googleapis.com', 'firebasehosting.googleapis.com',
      'fcm.googleapis.com', 'fcmregistrations.googleapis.com',
      'firebaseml.googleapis.com', 'firebaseremoteconfig.googleapis.com',
      'firebaseremoteconfigrealtime.googleapis.com', 'firebaseinstallations.googleapis.com',
      'firebasedynamiclinks.googleapis.com', 'firebaseappdistribution.googleapis.com',
      'testing.googleapis.com', 'firebaserules.googleapis.com'
    ];
    const firebaseServices = GCP_SERVICES.filter((s) => firebaseApiIds.includes(s.apiId));
    
    return {
      id: 'firebase',
      name: 'Firebase',
      description: 'Hosting, FCM, Remote Config, Dynamic Links, ML',
      icon: '🔥',
      circuits: firebaseServices.map((s) => ({
        ...this.serviceToCircuit(s),
        type: 'firebase' as CircuitType,
      })),
      status: 'disconnected',
      vibeScore: 0,
      breaker: this.createPanelBreaker(),
    };
  }

  /**
   * Create Maps Platform Panel
   */
  private createMapsPanel(): CircuitPanel {
    const mapsApiIds = [
      'addressvalidation.googleapis.com', 'aerialview.googleapis.com',
      'solar.googleapis.com', 'maps-backend.googleapis.com',
      'maps-embed-backend.googleapis.com', 'mapsplatformdatasets.googleapis.com',
      'places-backend.googleapis.com', 'places.googleapis.com',
      'geocoding-backend.googleapis.com', 'directions-backend.googleapis.com',
      'distance-matrix-backend.googleapis.com', 'routes.googleapis.com',
      'street-view-image-backend.googleapis.com'
    ];
    const mapsServices = GCP_SERVICES.filter((s) => mapsApiIds.includes(s.apiId));
    
    return {
      id: 'maps',
      name: 'Maps Platform',
      description: 'Places, Geocoding, Directions, Solar, Aerial View',
      icon: '🗺️',
      circuits: mapsServices.map((s) => ({
        ...this.serviceToCircuit(s),
        type: 'maps' as CircuitType,
      })),
      status: 'disconnected',
      vibeScore: 0,
      breaker: this.createPanelBreaker(),
    };
  }

  /**
   * Create Optional/Specialized Panel
   */
  private createOptionalPanel(): CircuitPanel {
    const optionalServices = GCP_SERVICES.filter((s) => s.tier === 'optional');
    // Exclude Maps APIs (they have their own panel)
    const mapsApiIds = [
      'addressvalidation.googleapis.com', 'aerialview.googleapis.com',
      'solar.googleapis.com', 'maps-backend.googleapis.com',
      'maps-embed-backend.googleapis.com', 'mapsplatformdatasets.googleapis.com',
      'places-backend.googleapis.com', 'places.googleapis.com',
      'geocoding-backend.googleapis.com', 'directions-backend.googleapis.com',
      'distance-matrix-backend.googleapis.com', 'routes.googleapis.com',
      'street-view-image-backend.googleapis.com'
    ];
    const filteredServices = optionalServices.filter((s) => !mapsApiIds.includes(s.apiId));
    
    return {
      id: 'optional',
      name: 'Specialized Verticals',
      description: 'Healthcare, Fitness',
      icon: '🏥',
      circuits: filteredServices.map((s) => this.serviceToCircuit(s)),
      status: 'disconnected',
      vibeScore: 0,
      breaker: this.createPanelBreaker(),
    };
  }

  /**
   * Create External Services Panel
   */
  private createExternalServicesPanel(): CircuitPanel {
    return {
      id: 'external',
      name: 'External Services',
      description: 'ElevenLabs, Deepgram, Supabase',
      icon: '🔌',
      circuits: [
        {
          id: 'elevenlabs',
          name: 'ElevenLabs TTS',
          type: 'external',
          status: 'disconnected',
          tier: 'medium',
          endpoint: 'https://api.elevenlabs.io/v1',
          breaker: this.createCircuitBreaker(),
        },
        {
          id: 'deepgram',
          name: 'Deepgram STT',
          type: 'external',
          status: 'disconnected',
          tier: 'medium',
          endpoint: 'https://api.deepgram.com/v1',
          breaker: this.createCircuitBreaker(),
        },
        {
          id: 'supabase',
          name: 'Supabase Auth',
          type: 'external',
          status: 'disconnected',
          tier: 'medium',
          breaker: this.createCircuitBreaker(),
        },
      ],
      status: 'disconnected',
      vibeScore: 0,
      breaker: this.createPanelBreaker(),
    };
  }

  /**
   * Create a new circuit breaker with defaults
   */
  private createCircuitBreaker(): CircuitBreaker {
    return {
      state: 'off',
      tripCount: 0,
      tripThreshold: 5,
      errorCount: 0,
      autoReset: true,
      cooldownMs: 30000,
    };
  }

  /**
   * Create a new panel breaker with defaults
   */
  private createPanelBreaker(): PanelBreaker {
    return {
      state: 'off',
      lockedOut: false,
      tripCount: 0,
    };
  }

  /**
   * Convert GCP service config to circuit connection
   */
  private serviceToCircuit(service: GCPServiceConfig): CircuitConnection {
    return {
      id: service.name,
      name: service.displayName,
      type: 'gcp',
      status: 'disconnected',
      tier: this.serviceTierToCircuitTier(service),
      endpoint: `https://${service.apiId}`,
      breaker: this.createCircuitBreaker(),
    };
  }

  /**
   * Map service tier to circuit tier
   */
  private serviceTierToCircuitTier(service: GCPServiceConfig): CircuitTier {
    if (service.tier === 'security') return 'defense-grade';
    if (service.tier === 'consciousness') return 'heavy';
    if (service.tier === 'core') return 'heavy';
    if (service.tier === 'analytics') return 'medium';
    if (service.tier === 'persistence') return 'medium';
    if (service.tier === 'integration') return 'medium';
    if (service.tier === 'content') return 'light';
    if (service.tier === 'optional') return 'light';
    return 'light';
  }

  /**
   * Initialize a single panel
   */
  private async initializePanel(panel: CircuitPanel): Promise<void> {
    console.log(`\n  ┌─ ${panel.icon} ${panel.name}`);
    
    let connectedCount = 0;
    for (const circuit of panel.circuits) {
      const success = await this.connectCircuit(circuit);
      if (success) connectedCount++;
      
      const statusIcon = circuit.status === 'connected' ? '✓' : '✗';
      const statusColor = circuit.status === 'connected' ? '\x1b[32m' : '\x1b[31m';
      console.log(`  │  ${statusColor}${statusIcon}\x1b[0m ${circuit.name}`);
    }

    // Update panel status
    panel.vibeScore = connectedCount / panel.circuits.length;
    panel.status = panel.vibeScore >= 0.8 ? 'connected' : panel.vibeScore > 0 ? 'connecting' : 'disconnected';
    
    console.log(`  └─ Status: ${(panel.vibeScore * 100).toFixed(1)}% connected`);
  }

  /**
   * Connect a single circuit
   */
  private async connectCircuit(circuit: CircuitConnection): Promise<boolean> {
    try {
      circuit.status = 'connecting';
      
      // Simulate connection check (in production, this would ping the actual service)
      await this.delay(50);
      
      circuit.status = 'connected';
      circuit.lastPing = new Date();
      circuit.latencyMs = Math.floor(Math.random() * 50) + 10;
      
      return true;
    } catch (error) {
      circuit.status = 'error';
      circuit.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  /**
   * Update overall status
   */
  private updateOverallStatus(): void {
    const totalCircuits = this.state.panels.reduce((sum, p) => sum + p.circuits.length, 0);
    const connectedCircuits = this.state.panels.reduce(
      (sum, p) => sum + p.circuits.filter((c) => c.status === 'connected').length,
      0
    );

    this.state.overallVibeScore = connectedCircuits / totalCircuits;
    
    if (this.state.overallVibeScore >= 0.995) {
      this.state.overallStatus = 'connected';
    } else if (this.state.overallVibeScore >= 0.5) {
      this.state.overallStatus = 'connecting';
    } else {
      this.state.overallStatus = 'disconnected';
    }
  }

  /**
   * Print status report
   */
  private printStatus(): void {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║            CIRCUIT BOX STATUS REPORT                           ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    
    for (const panel of this.state.panels) {
      const statusIcon = panel.status === 'connected' ? '●' : panel.status === 'connecting' ? '◐' : '○';
      console.log(`║  ${statusIcon} ${panel.name.padEnd(20)} ${(panel.vibeScore * 100).toFixed(1).padStart(6)}% ║`);
    }
    
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  Overall V.I.B.E. Score: ${(this.state.overallVibeScore * 100).toFixed(1)}%`.padEnd(65) + '║');
    console.log(`║  Status: ${this.state.overallStatus.toUpperCase()}`.padEnd(65) + '║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
  }

  /**
   * Get current configuration
   */
  public getConfig(): CircuitBoxConfig {
    return { ...this.config };
  }

  /**
   * Get current state
   */
  public getState(): CircuitBoxState {
    return { ...this.state };
  }

  /**
   * Get a specific panel by ID
   */
  public getPanel(panelId: string): CircuitPanel | undefined {
    return this.state.panels.find((p) => p.id === panelId);
  }

  /**
   * Get a specific circuit by ID
   */
  public getCircuit(circuitId: string): CircuitConnection | undefined {
    for (const panel of this.state.panels) {
      const circuit = panel.circuits.find((c) => c.id === circuitId);
      if (circuit) return circuit;
    }
    return undefined;
  }

  /**
   * Health check all circuits
   */
  public async healthCheck(): Promise<CircuitBoxState> {
    console.log('\n🔍 Running Circuit Box health check...');
    
    for (const panel of this.state.panels) {
      for (const circuit of panel.circuits) {
        await this.connectCircuit(circuit);
      }
      panel.vibeScore = panel.circuits.filter((c) => c.status === 'connected').length / panel.circuits.length;
    }

    this.updateOverallStatus();
    this.state.lastHealthCheck = new Date();
    
    return this.getState();
  }

  /**
   * Register a new connection dynamically (e.g., from ACHEEVY)
   */
  public registerConnection(connection: {
    id: string;
    panelId: string;
    sourceId: string;
    targetId: string;
    status: 'active' | 'inactive';
    latency: number;
  }): void {
    const panel = this.getPanel(connection.panelId);
    if (!panel) {
      console.warn(`[CircuitBox] Panel not found: ${connection.panelId}`);
      return;
    }

    // Check if connection already exists
    const existing = panel.circuits.find((c) => c.id === connection.id);
    if (existing) {
      existing.status = connection.status === 'active' ? 'connected' : 'disconnected';
      existing.latencyMs = connection.latency;
      existing.lastPing = new Date();
    } else {
      // Add new circuit connection
      panel.circuits.push({
        id: connection.id,
        name: `${connection.sourceId} → ${connection.targetId}`,
        type: 'external',
        status: connection.status === 'active' ? 'connected' : 'disconnected',
        tier: 'medium',
        latencyMs: connection.latency,
        lastPing: new Date(),
        breaker: this.createCircuitBreaker(),
      });
    }

    console.log(`[CircuitBox] Registered connection: ${connection.id}`);
  }

  /**
   * Update latency for an existing connection
   */
  public updateConnectionLatency(connectionId: string, latencyMs: number): void {
    const circuit = this.getCircuit(connectionId);
    if (circuit) {
      circuit.latencyMs = latencyMs;
      circuit.lastPing = new Date();
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DIGITAL BREAKER CONTROLS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * MASTER SWITCH - Turn the entire system ON
   * Powers up all panels and circuits
   */
  public async powerOn(): Promise<void> {
    if (this.state.masterBreaker.state === 'on') {
      console.log('⚡ Circuit Box already powered ON');
      return;
    }

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║              ⚡ MASTER SWITCH: POWERING ON ⚡                   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    this.state.masterBreaker.state = 'on';
    this.state.masterBreaker.lastStateChange = new Date();
    this.state.masterBreaker.powerCycles++;
    this.state.masterBreaker.emergencyShutdown = false;

    // Power on all panels
    for (const panel of this.state.panels) {
      await this.setPanelBreaker(panel.id, 'on');
    }

    this.updateOverallStatus();
    console.log('✓ Master Switch: SYSTEM ONLINE');
  }

  /**
   * MASTER SWITCH - Turn the entire system OFF
   * Gracefully shuts down all panels and circuits
   */
  public async powerOff(): Promise<void> {
    if (this.state.masterBreaker.state === 'off') {
      console.log('○ Circuit Box already powered OFF');
      return;
    }

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║              ○ MASTER SWITCH: POWERING OFF ○                   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Power off all panels
    for (const panel of this.state.panels) {
      await this.setPanelBreaker(panel.id, 'off');
    }

    this.state.masterBreaker.state = 'off';
    this.state.masterBreaker.lastStateChange = new Date();
    this.state.masterBreaker.uptimeMs = Date.now() - this.startTime.getTime();

    this.updateOverallStatus();
    console.log('○ Master Switch: SYSTEM OFFLINE');
  }

  /**
   * EMERGENCY SHUTDOWN - Immediately cut all power
   * Use in case of critical failures
   */
  public emergencyShutdown(): void {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║           🚨 EMERGENCY SHUTDOWN ACTIVATED 🚨                   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    this.state.masterBreaker.state = 'tripped';
    this.state.masterBreaker.emergencyShutdown = true;
    this.state.masterBreaker.lastStateChange = new Date();

    // Trip all panels immediately
    for (const panel of this.state.panels) {
      panel.breaker.state = 'tripped';
      panel.breaker.tripCount++;
      panel.breaker.lastTripped = new Date();
      panel.status = 'tripped';

      // Trip all circuits in this panel
      for (const circuit of panel.circuits) {
        circuit.breaker.state = 'tripped';
        circuit.breaker.tripCount++;
        circuit.breaker.lastTripped = new Date();
        circuit.status = 'tripped';
      }
    }

    this.state.overallStatus = 'tripped';
    console.log('🚨 EMERGENCY SHUTDOWN COMPLETE - Manual reset required');
  }

  /**
   * Set a panel breaker state
   */
  public async setPanelBreaker(panelId: string, state: 'on' | 'off'): Promise<boolean> {
    const panel = this.getPanel(panelId);
    if (!panel) {
      console.warn(`[CircuitBox] Panel not found: ${panelId}`);
      return false;
    }

    if (panel.breaker.lockedOut) {
      console.warn(`[CircuitBox] Panel ${panelId} is locked out - manual reset required`);
      return false;
    }

    if (this.state.masterBreaker.state !== 'on' && state === 'on') {
      console.warn(`[CircuitBox] Cannot power on panel - Master Switch is OFF`);
      return false;
    }

    console.log(`  ${state === 'on' ? '●' : '○'} ${panel.icon} ${panel.name}: ${state.toUpperCase()}`);

    panel.breaker.state = state;

    // Set all circuits in this panel
    for (const circuit of panel.circuits) {
      circuit.breaker.state = state;
      circuit.status = state === 'on' ? 'connecting' : 'disconnected';
      
      if (state === 'on') {
        await this.connectCircuit(circuit);
      }
    }

    // Update panel status
    const connectedCount = panel.circuits.filter(c => c.status === 'connected').length;
    panel.vibeScore = connectedCount / panel.circuits.length;
    panel.status = state === 'on' 
      ? (panel.vibeScore >= 0.8 ? 'connected' : panel.vibeScore > 0 ? 'connecting' : 'disconnected')
      : 'disconnected';

    return true;
  }

  /**
   * Set an individual circuit breaker state
   */
  public setCircuitBreaker(circuitId: string, state: 'on' | 'off'): boolean {
    const circuit = this.getCircuit(circuitId);
    if (!circuit) {
      console.warn(`[CircuitBox] Circuit not found: ${circuitId}`);
      return false;
    }

    if (this.state.masterBreaker.state !== 'on' && state === 'on') {
      console.warn(`[CircuitBox] Cannot power on circuit - Master Switch is OFF`);
      return false;
    }

    circuit.breaker.state = state;
    circuit.status = state === 'on' ? 'connecting' : 'disconnected';
    
    console.log(`  ${state === 'on' ? '●' : '○'} Circuit ${circuit.name}: ${state.toUpperCase()}`);
    return true;
  }

  /**
   * Trip a circuit (called on error threshold)
   */
  public tripCircuit(circuitId: string, reason?: string): void {
    const circuit = this.getCircuit(circuitId);
    if (!circuit) return;

    circuit.breaker.state = 'tripped';
    circuit.breaker.tripCount++;
    circuit.breaker.lastTripped = new Date();
    circuit.status = 'tripped';
    circuit.errorMessage = reason || 'Circuit tripped due to error threshold';

    console.warn(`⚠️ Circuit TRIPPED: ${circuit.name} - ${circuit.errorMessage}`);

    // Auto-reset scheduling if enabled
    if (circuit.breaker.autoReset) {
      setTimeout(() => {
        this.resetCircuit(circuitId);
      }, circuit.breaker.cooldownMs);
    }
  }

  /**
   * Reset a tripped circuit
   */
  public resetCircuit(circuitId: string): boolean {
    const circuit = this.getCircuit(circuitId);
    if (!circuit) return false;

    if (circuit.breaker.state !== 'tripped') {
      return true; // Already not tripped
    }

    circuit.breaker.state = 'off';
    circuit.breaker.errorCount = 0;
    circuit.breaker.lastReset = new Date();
    circuit.status = 'disconnected';
    circuit.errorMessage = undefined;

    console.log(`✓ Circuit RESET: ${circuit.name}`);
    return true;
  }

  /**
   * Reset a tripped panel (resets all circuits in the panel)
   */
  public resetPanel(panelId: string): boolean {
    const panel = this.getPanel(panelId);
    if (!panel) return false;

    panel.breaker.state = 'off';
    panel.breaker.lockedOut = false;

    for (const circuit of panel.circuits) {
      this.resetCircuit(circuit.id);
    }

    panel.status = 'disconnected';
    console.log(`✓ Panel RESET: ${panel.name}`);
    return true;
  }

  /**
   * Reset the master breaker (after emergency shutdown)
   */
  public resetMaster(): boolean {
    if (!this.state.masterBreaker.emergencyShutdown && this.state.masterBreaker.state !== 'tripped') {
      return true; // Not in tripped state
    }

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║              🔄 MASTER BREAKER RESET 🔄                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Reset all panels first
    for (const panel of this.state.panels) {
      this.resetPanel(panel.id);
    }

    this.state.masterBreaker.state = 'off';
    this.state.masterBreaker.emergencyShutdown = false;
    this.state.masterBreaker.lastStateChange = new Date();
    this.state.overallStatus = 'disconnected';

    console.log('✓ Master Breaker RESET - System ready for power on');
    return true;
  }

  /**
   * Report an error on a circuit (may trigger trip)
   */
  public reportCircuitError(circuitId: string, error: Error): void {
    const circuit = this.getCircuit(circuitId);
    if (!circuit) return;

    circuit.breaker.errorCount++;
    circuit.errorMessage = error.message;

    if (circuit.breaker.errorCount >= circuit.breaker.tripThreshold) {
      this.tripCircuit(circuitId, `Error threshold exceeded: ${error.message}`);
    }
  }

  /**
   * Get the master breaker state
   */
  public getMasterBreakerState(): MasterBreaker {
    return { ...this.state.masterBreaker };
  }

  /**
   * Check if the system is powered on
   */
  public isPoweredOn(): boolean {
    return this.state.masterBreaker.state === 'on';
  }

  /**
   * Get system uptime in milliseconds
   */
  public getUptime(): number {
    if (this.state.masterBreaker.state === 'on') {
      return Date.now() - this.startTime.getTime();
    }
    return this.state.masterBreaker.uptimeMs;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton getter
export const getCircuitBox = (config?: CircuitBoxConfig): CircuitBox => {
  return CircuitBox.getInstance(config);
};

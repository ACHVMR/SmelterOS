/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Service Wiring
 * Connects all services through the Circuit Box
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { CircuitBoxConfig, CircuitTier } from './index';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SERVICE WIRE TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ServiceWire {
  id: string;
  name: string;
  sourceId: string;
  targetId: string;
  protocol: 'https' | 'grpc' | 'pubsub' | 'internal';
  dataFlow: 'unidirectional' | 'bidirectional';
  encrypted: boolean;
  tier: CircuitTier;
}

export interface ServiceEndpoint {
  id: string;
  name: string;
  type: 'producer' | 'consumer' | 'both';
  url: string;
  healthCheckPath?: string;
  secretRefs?: string[];
}

export interface WiringDiagram {
  nodes: ServiceEndpoint[];
  wires: ServiceWire[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SERVICE ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SERVICE_ENDPOINTS: ServiceEndpoint[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // CONSCIOUSNESS LAYER
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'avva-noon-core',
    name: 'AVVA NOON Core',
    type: 'both',
    url: 'internal://consciousness/avva-noon',
    healthCheckPath: '/health',
  },
  {
    id: 'vibe-engine',
    name: 'V.I.B.E. Engine',
    type: 'both',
    url: 'internal://consciousness/vibe-engine',
    healthCheckPath: '/health',
  },
  {
    id: 'master-smeltwarden',
    name: 'Master Smeltwarden',
    type: 'both',
    url: 'internal://orchestration/smeltwarden',
    healthCheckPath: '/health',
  },
  {
    id: 'fdh-runtime',
    name: 'FDH Runtime',
    type: 'both',
    url: 'internal://orchestration/fdh',
    healthCheckPath: '/health',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // GCP SERVICES
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'cloud-run',
    name: 'Cloud Run',
    type: 'consumer',
    url: 'https://run.googleapis.com',
    healthCheckPath: '/v1/projects/{project}/locations/{region}/services',
    secretRefs: ['gcp-service-account'],
  },
  {
    id: 'firestore',
    name: 'Cloud Firestore',
    type: 'both',
    url: 'https://firestore.googleapis.com',
    healthCheckPath: '/v1/projects/{project}/databases',
    secretRefs: ['gcp-service-account'],
  },
  {
    id: 'cloud-storage',
    name: 'Cloud Storage',
    type: 'both',
    url: 'https://storage.googleapis.com',
    healthCheckPath: '/storage/v1/b',
    secretRefs: ['gcp-service-account'],
  },
  {
    id: 'pubsub',
    name: 'Cloud Pub/Sub',
    type: 'both',
    url: 'https://pubsub.googleapis.com',
    healthCheckPath: '/v1/projects/{project}/topics',
    secretRefs: ['gcp-service-account'],
  },
  {
    id: 'secret-manager',
    name: 'Secret Manager',
    type: 'producer',
    url: 'https://secretmanager.googleapis.com',
    healthCheckPath: '/v1/projects/{project}/secrets',
    secretRefs: ['gcp-service-account'],
  },
  {
    id: 'vertex-ai',
    name: 'Vertex AI',
    type: 'both',
    url: 'https://aiplatform.googleapis.com',
    healthCheckPath: '/v1/projects/{project}/locations/{region}/endpoints',
    secretRefs: ['gcp-service-account'],
  },
  {
    id: 'cloud-logging',
    name: 'Cloud Logging',
    type: 'consumer',
    url: 'https://logging.googleapis.com',
    healthCheckPath: '/v2/entries:list',
    secretRefs: ['gcp-service-account'],
  },
  {
    id: 'cloud-monitoring',
    name: 'Cloud Monitoring',
    type: 'both',
    url: 'https://monitoring.googleapis.com',
    healthCheckPath: '/v3/projects/{project}/timeSeries',
    secretRefs: ['gcp-service-account'],
  },
  {
    id: 'bigquery',
    name: 'BigQuery',
    type: 'both',
    url: 'https://bigquery.googleapis.com',
    healthCheckPath: '/bigquery/v2/projects/{project}/datasets',
    secretRefs: ['gcp-service-account'],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // AI SERVICES
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'anthropic-claude',
    name: 'Claude Opus 4.5',
    type: 'both',
    url: 'https://api.anthropic.com/v1',
    healthCheckPath: '/messages',
    secretRefs: ['anthropic-api-key'],
  },
  {
    id: 'gemini',
    name: 'Gemini Pro',
    type: 'both',
    url: 'https://generativelanguage.googleapis.com',
    healthCheckPath: '/v1beta/models',
    secretRefs: ['gcp-service-account'],
  },
  {
    id: 'vl-jepa',
    name: 'VL-JEPA Embeddings',
    type: 'both',
    url: 'https://{region}-run.googleapis.com/vl-jepa',
    healthCheckPath: '/health',
    secretRefs: ['gcp-service-account'],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // VOICE SERVICES
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'elevenlabs',
    name: 'ElevenLabs TTS',
    type: 'consumer',
    url: 'https://api.elevenlabs.io/v1',
    healthCheckPath: '/user',
    secretRefs: ['elevenlabs-api-key'],
  },
  {
    id: 'deepgram',
    name: 'Deepgram STT',
    type: 'consumer',
    url: 'https://api.deepgram.com/v1',
    healthCheckPath: '/projects',
    secretRefs: ['deepgram-api-key'],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // DATA SERVICES
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'supabase',
    name: 'Supabase',
    type: 'both',
    url: 'https://{project}.supabase.co',
    healthCheckPath: '/rest/v1/',
    secretRefs: ['supabase-anon-key', 'supabase-service-role-key'],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SERVICE WIRING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SERVICE_WIRES: ServiceWire[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // CONSCIOUSNESS → GCP
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'avva-to-claude',
    name: 'AVVA → Claude',
    sourceId: 'avva-noon-core',
    targetId: 'anthropic-claude',
    protocol: 'https',
    dataFlow: 'bidirectional',
    encrypted: true,
    tier: 'heavy',
  },
  {
    id: 'avva-to-gemini',
    name: 'AVVA → Gemini',
    sourceId: 'avva-noon-core',
    targetId: 'gemini',
    protocol: 'https',
    dataFlow: 'bidirectional',
    encrypted: true,
    tier: 'heavy',
  },
  {
    id: 'avva-to-vl-jepa',
    name: 'AVVA → VL-JEPA',
    sourceId: 'avva-noon-core',
    targetId: 'vl-jepa',
    protocol: 'https',
    dataFlow: 'bidirectional',
    encrypted: true,
    tier: 'heavy',
  },
  {
    id: 'vibe-to-firestore',
    name: 'V.I.B.E. → Firestore',
    sourceId: 'vibe-engine',
    targetId: 'firestore',
    protocol: 'https',
    dataFlow: 'bidirectional',
    encrypted: true,
    tier: 'heavy',
  },
  {
    id: 'vibe-to-bigquery',
    name: 'V.I.B.E. → BigQuery',
    sourceId: 'vibe-engine',
    targetId: 'bigquery',
    protocol: 'https',
    dataFlow: 'unidirectional',
    encrypted: true,
    tier: 'medium',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ORCHESTRATION → SERVICES
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'smeltwarden-to-cloudrun',
    name: 'Smeltwarden → Cloud Run',
    sourceId: 'master-smeltwarden',
    targetId: 'cloud-run',
    protocol: 'https',
    dataFlow: 'bidirectional',
    encrypted: true,
    tier: 'heavy',
  },
  {
    id: 'smeltwarden-to-pubsub',
    name: 'Smeltwarden → Pub/Sub',
    sourceId: 'master-smeltwarden',
    targetId: 'pubsub',
    protocol: 'pubsub',
    dataFlow: 'bidirectional',
    encrypted: true,
    tier: 'heavy',
  },
  {
    id: 'fdh-to-logging',
    name: 'FDH → Logging',
    sourceId: 'fdh-runtime',
    targetId: 'cloud-logging',
    protocol: 'https',
    dataFlow: 'unidirectional',
    encrypted: true,
    tier: 'medium',
  },
  {
    id: 'fdh-to-monitoring',
    name: 'FDH → Monitoring',
    sourceId: 'fdh-runtime',
    targetId: 'cloud-monitoring',
    protocol: 'https',
    dataFlow: 'unidirectional',
    encrypted: true,
    tier: 'medium',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // VOICE PIPELINE
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'avva-to-elevenlabs',
    name: 'AVVA → ElevenLabs',
    sourceId: 'avva-noon-core',
    targetId: 'elevenlabs',
    protocol: 'https',
    dataFlow: 'unidirectional',
    encrypted: true,
    tier: 'medium',
  },
  {
    id: 'avva-to-deepgram',
    name: 'AVVA → Deepgram',
    sourceId: 'avva-noon-core',
    targetId: 'deepgram',
    protocol: 'https',
    dataFlow: 'unidirectional',
    encrypted: true,
    tier: 'medium',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // STORAGE PIPELINE
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'avva-to-storage',
    name: 'AVVA → Cloud Storage',
    sourceId: 'avva-noon-core',
    targetId: 'cloud-storage',
    protocol: 'https',
    dataFlow: 'bidirectional',
    encrypted: true,
    tier: 'heavy',
  },
  {
    id: 'fdh-to-storage',
    name: 'FDH → Cloud Storage',
    sourceId: 'fdh-runtime',
    targetId: 'cloud-storage',
    protocol: 'https',
    dataFlow: 'bidirectional',
    encrypted: true,
    tier: 'heavy',
  },

  // ───────────────────────────────────────────────────────────────────────────
  // SECRET ACCESS
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: 'all-to-secrets',
    name: '* → Secret Manager',
    sourceId: 'avva-noon-core',
    targetId: 'secret-manager',
    protocol: 'https',
    dataFlow: 'unidirectional',
    encrypted: true,
    tier: 'defense-grade',
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WIRING DIAGRAM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const WIRING_DIAGRAM: WiringDiagram = {
  nodes: SERVICE_ENDPOINTS,
  wires: SERVICE_WIRES,
};

/**
 * Get all wires connected to a service
 */
export function getWiresForService(serviceId: string): ServiceWire[] {
  return SERVICE_WIRES.filter(
    (wire) => wire.sourceId === serviceId || wire.targetId === serviceId
  );
}

/**
 * Get endpoint by ID
 */
export function getEndpoint(id: string): ServiceEndpoint | undefined {
  return SERVICE_ENDPOINTS.find((e) => e.id === id);
}

/**
 * Get wire by ID
 */
export function getWire(id: string): ServiceWire | undefined {
  return SERVICE_WIRES.find((w) => w.id === id);
}

/**
 * Generate ASCII wiring diagram
 */
export function renderWiringDiagramASCII(): string {
  return `
╔════════════════════════════════════════════════════════════════════════════════╗
║                         SMELTER OS - WIRING DIAGRAM                            ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  ┌─────────────────┐                              ┌─────────────────┐          ║
║  │  AVVA NOON      │──────────────────────────────│  Claude Opus    │          ║
║  │  Core           │          HTTPS/TLS           │  4.5            │          ║
║  └────────┬────────┘                              └─────────────────┘          ║
║           │                                                                    ║
║           │ ┌─────────────────┐                   ┌─────────────────┐          ║
║           ├─│  V.I.B.E.       │───────────────────│  Firestore      │          ║
║           │ │  Engine         │      HTTPS        │  (State)        │          ║
║           │ └─────────────────┘                   └─────────────────┘          ║
║           │                                                                    ║
║           │ ┌─────────────────┐                   ┌─────────────────┐          ║
║           ├─│  Master         │───────────────────│  Cloud Run      │          ║
║           │ │  Smeltwarden    │      HTTPS        │  (Agents)       │          ║
║           │ └────────┬────────┘                   └─────────────────┘          ║
║           │          │                                                         ║
║           │          │ ┌─────────────────┐        ┌─────────────────┐          ║
║           │          └─│  Pub/Sub        │────────│  BoomerAngs     │          ║
║           │            │  (Events)       │        │  (Specialists)  │          ║
║           │            └─────────────────┘        └─────────────────┘          ║
║           │                                                                    ║
║           │ ┌─────────────────┐                   ┌─────────────────┐          ║
║           ├─│  FDH Runtime    │───────────────────│  Cloud Storage  │          ║
║           │ │                 │      HTTPS        │  (Artifacts)    │          ║
║           │ └─────────────────┘                   └─────────────────┘          ║
║           │                                                                    ║
║           │ ┌─────────────────┐                   ┌─────────────────┐          ║
║           ├─│  VL-JEPA        │───────────────────│  Vertex AI      │          ║
║           │ │  (Embeddings)   │      HTTPS        │  (ML Platform)  │          ║
║           │ └─────────────────┘                   └─────────────────┘          ║
║           │                                                                    ║
║           │                                       ┌─────────────────┐          ║
║           ├───────────────────────────────────────│  ElevenLabs     │          ║
║           │           HTTPS (TTS)                 │  (Voice Out)    │          ║
║           │                                       └─────────────────┘          ║
║           │                                                                    ║
║           │                                       ┌─────────────────┐          ║
║           └───────────────────────────────────────│  Deepgram       │          ║
║                       HTTPS (STT)                 │  (Voice In)     │          ║
║                                                   └─────────────────┘          ║
║                                                                                ║
║  ┌─────────────────────────────────────────────────────────────────────────┐   ║
║  │                         SECRET MANAGER                                   │   ║
║  │  ╔═══════════╗  ╔═══════════╗  ╔═══════════╗  ╔═══════════╗            │   ║
║  │  ║ anthropic ║  ║ elevenlabs║  ║ deepgram  ║  ║ gcp-sa    ║            │   ║
║  │  ║ -api-key  ║  ║ -api-key  ║  ║ -api-key  ║  ║ -key      ║            │   ║
║  │  ╚═══════════╝  ╚═══════════╝  ╚═══════════╝  ╚═══════════╝            │   ║
║  └─────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                ║
║  ┌─────────────────────────────────────────────────────────────────────────┐   ║
║  │                         OBSERVABILITY LAYER                              │   ║
║  │  ╔═══════════╗  ╔═══════════╗  ╔═══════════╗  ╔═══════════╗            │   ║
║  │  ║ Cloud     ║  ║ Cloud     ║  ║ Cloud     ║  ║ BigQuery  ║            │   ║
║  │  ║ Logging   ║  ║ Monitoring║  ║ Trace     ║  ║ Analytics ║            │   ║
║  │  ╚═══════════╝  ╚═══════════╝  ╚═══════════╝  ╚═══════════╝            │   ║
║  └─────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
`;
}

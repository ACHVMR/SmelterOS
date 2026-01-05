/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS-ORACLE Configuration
 * Adapts ORACLE Framework for SmelterOS v2.0 Production
 * Version 1.0 | January 2026
 * ═══════════════════════════════════════════════════════════════════════════
 */

// =============================================================================
// TYPES
// =============================================================================

export interface OracleAgent {
  id: string;
  role: 'orchestrator' | 'specialist' | 'research' | 'audit';
  layer: 'nlp' | 'logic' | 'orchestration' | 'execution';
  capabilities: string[];
  virtueWeight: number;
  fdhPhase: 'foster' | 'develop' | 'hone' | 'all';
  sandboxId: string;
}

export interface OracleLayer {
  name: string;
  description: string;
  agents: string[];
  sloLatencyMs: number;
}

export interface Oracle3LayerContext {
  standards: StandardsLayer;
  product: ProductLayer;
  specs: SpecsLayer;
}

export interface StandardsLayer {
  path: string;
  tools: string[];
  globalPolicies: string[];
}

export interface ProductLayer {
  name: string;
  version: string;
  components: string[];
}

export interface SpecsLayer {
  activeTasks: string[];
  permissions: Record<string, string[]>;
}

// =============================================================================
// ORACLE AGENT REGISTRY
// =============================================================================

export const ORACLE_AGENTS: Record<string, OracleAgent> = {
  // Layer 1: NLP Interface - Intent Classification
  acheevy: {
    id: 'acheevy',
    role: 'orchestrator',
    layer: 'nlp',
    capabilities: ['intent-routing', 'delegation', 'velocity-driver', 'budget-ledger'],
    virtueWeight: 0.30, // α: Intent alignment
    fdhPhase: 'all',
    sandboxId: 'acheevy-engine-default',
  },

  // Layer 2: Logic - Recursive Reasoning
  'rlm-research': {
    id: 'rlm-research',
    role: 'research',
    layer: 'logic',
    capabilities: ['chunking', 'aggregation', 'deep-analysis', 'recursive-reasoning', '10M-context'],
    virtueWeight: 0.15,
    fdhPhase: 'foster',
    sandboxId: 'rlm-research-engine-default',
  },

  // Layer 3: Orchestration - 3-Layer Governance
  'boomer-coo': {
    id: 'boomer-coo',
    role: 'specialist',
    layer: 'orchestration',
    capabilities: ['workflow-automation', 'process-optimization', 'logistics', 'reflective-validation'],
    virtueWeight: 0.15, // γ: Morality score (reflective component)
    fdhPhase: 'all',
    sandboxId: 'boomer-coo-engine-default',
  },

  // Layer 4: Execution - FDH Phases
  'boomer-cto': {
    id: 'boomer-cto',
    role: 'specialist',
    layer: 'execution',
    capabilities: ['code-review', 'deployment', 'ci-cd', 'architecture', 'git', 'docker', 'linters'],
    virtueWeight: 0.20, // β: Execution quality
    fdhPhase: 'develop',
    sandboxId: 'boomer-cto-engine-default',
  },

  'boomer-cmo': {
    id: 'boomer-cmo',
    role: 'specialist',
    layer: 'execution',
    capabilities: ['content-creation', 'branding', 'campaigns', 'social', 'ui-design', 'palette'],
    virtueWeight: 0.10, // δ: Cultural value
    fdhPhase: 'develop',
    sandboxId: 'boomer-cmo-engine-default',
  },

  'boomer-cfo': {
    id: 'boomer-cfo',
    role: 'audit',
    layer: 'execution',
    capabilities: ['budget-tracking', 'forecasting', 'billing', 'audit', 'pandas', 'stripe'],
    virtueWeight: 0.05,
    fdhPhase: 'hone',
    sandboxId: 'boomer-cfo-engine-default',
  },

  'boomer-cpo': {
    id: 'boomer-cpo',
    role: 'specialist',
    layer: 'execution',
    capabilities: ['product-specs', 'user-research', 'feature-prioritization', 'markdown', 'cot-viz'],
    virtueWeight: 0.05, // Strategic component
    fdhPhase: 'develop',
    sandboxId: 'boomer-cpo-engine-default',
  },
};

// =============================================================================
// 4-LAYER LL-OS ARCHITECTURE
// =============================================================================

export const ORACLE_LAYERS: Record<string, OracleLayer> = {
  nlp: {
    name: 'NLP Interface (Acheevy Intent Routing)',
    description: 'Classify queries; route to specialists via OpenRouter',
    agents: ['acheevy'],
    sloLatencyMs: 50,
  },
  logic: {
    name: 'Recursive Logic (RLM-Research Deep Dive)',
    description: 'Partition >128k contexts; distill for boomer delegation; II integration',
    agents: ['rlm-research'],
    sloLatencyMs: 5000,
  },
  orchestration: {
    name: '3-Layer Governance (STRATA-Aligned)',
    description: 'Standards/Product/Specs; boomer-coo enforces; Firestore hierarchy',
    agents: ['boomer-coo'],
    sloLatencyMs: 100,
  },
  execution: {
    name: 'FDH Execution (Boomer Sandboxes)',
    description: 'Foster/Develop/Hone phases; 14d TTL; Cloud Run isolation',
    agents: ['boomer-cto', 'boomer-cmo', 'boomer-cfo', 'boomer-cpo'],
    sloLatencyMs: 30000,
  },
};

// =============================================================================
// 3-LAYER CONTEXT MODEL
// =============================================================================

export const DEFAULT_3LAYER_CONTEXT: Oracle3LayerContext = {
  standards: {
    path: '/standards',
    tools: ['ii-thought', 'cot-lab', 'escape-detect', 'verification-tool'],
    globalPolicies: [
      'GCP Cloud Run isolation',
      'Firestore persistence',
      'RBAC audit logging',
      'Virtue alignment ≥0.995',
      'Escape detection mandatory',
    ],
  },
  product: {
    name: 'SmelterOS',
    version: '2.1.0',
    components: [
      'Voice (Groq STT / Google TTS)',
      'RAG (Vertex AI embeddings)',
      'Sandboxes (Cloud Run)',
      'Agents (C-Suite + RLM)',
      'II Integration (Researcher/Thought/Commons/CoT)',
    ],
  },
  specs: {
    activeTasks: [],
    permissions: {
      acheevy: ['orchestrate', 'delegate', 'escalate'],
      'boomer-cto': ['code', 'deploy', 'review'],
      'boomer-cmo': ['design', 'brand', 'content'],
      'boomer-cfo': ['audit', 'budget', 'approve'],
      'boomer-coo': ['process', 'validate', 'enforce'],
      'boomer-cpo': ['spec', 'prioritize', 'document'],
      'rlm-research': ['analyze', 'chunk', 'synthesize'],
    },
  },
};

// =============================================================================
// FDH PHASE CONFIGURATION
// =============================================================================

export const FDH_PHASES = {
  foster: {
    name: 'FOSTER',
    effortPercent: 20,
    description: 'Research: Study specifications, existing codebase, dependencies',
    leadAgent: 'rlm-research',
    activities: ['research', 'architecture', 'planning'],
  },
  develop: {
    name: 'DEVELOP',
    effortPercent: 60,
    description: 'Implementation: Code generation with verification loop',
    leadAgent: 'boomer-cto',
    activities: ['code', 'iteration', 'tool-infusion'],
    maxIterations: 10,
  },
  hone: {
    name: 'HONE',
    effortPercent: 20,
    description: 'Optimization: Testing, security, performance, audit',
    leadAgent: 'boomer-cfo',
    activities: ['testing', 'optimization', 'validation'],
  },
};

// =============================================================================
// ENVIRONMENT CONFIG
// =============================================================================

export function getOracleConfig() {
  return {
    agents: process.env.ORACLE_AGENTS?.split(',') || Object.keys(ORACLE_AGENTS),
    standardsPath: process.env.STANDARDS_PATH || '/standards',
    virtueThreshold: parseFloat(process.env.VIRTUE_THRESHOLD || '0.995'),
    maxContextTokens: parseInt(process.env.MAX_CONTEXT_TOKENS || '128000'),
    rmlThreshold: parseInt(process.env.RLM_THRESHOLD || '128000'),
    fdhTimeout: parseInt(process.env.FDH_TIMEOUT || '1800000'), // 30 min
    enabled: process.env.ORACLE_ENABLED !== 'false',
  };
}

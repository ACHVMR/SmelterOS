/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Tool Roster
 * Dynamic Tool Registry with Vertex AI Model Garden Taxonomy
 * 10 Verticals: Vision, Audio, Code, Data, Social, Finance, Research,
 *               Security, System, Creative
 * ═══════════════════════════════════════════════════════════════════════════
 */

// =============================================================================
// CAPABILITY VERTICALS (Vertex AI Model Garden Taxonomy)
// =============================================================================

export type CapabilityVertical =
  | 'vision'    // Image/video analysis
  | 'audio'     // Speech/transcription
  | 'code'      // Generation/debug
  | 'data'      // RAG/embeddings
  | 'social'    // Posting/APIs
  | 'finance'   // Ledger/quotes
  | 'research'  // Search/timelines
  | 'security'  // Auth/scan
  | 'system'    // Deploy/monitor
  | 'creative'; // Gen AI/PPT

export type ModelType = 'foundation' | 'tunable' | 'task-specific';
export type TaskType = 'chat' | 'code' | 'vision' | 'embedding' | 'multimodal';

// =============================================================================
// TIER SYSTEM
// =============================================================================

export type TierLevel = 'free' | 'data_entry' | 'enterprise';

export interface TierConfig {
  level: TierLevel;
  displayName: string;
  pricePerMonth: number;
  capabilities: CapabilityVertical[];
  maxToolsPerIngot: number;
  maxRequestsPerDay: number;
  supportLevel: 'community' | 'email' | 'priority';
}

export const TIER_CONFIGS: Record<TierLevel, TierConfig> = {
  free: {
    level: 'free',
    displayName: 'Free Tier',
    pricePerMonth: 0,
    capabilities: ['research', 'code', 'data'],
    maxToolsPerIngot: 3,
    maxRequestsPerDay: 100,
    supportLevel: 'community',
  },
  data_entry: {
    level: 'data_entry',
    displayName: 'Data Entry',
    pricePerMonth: 10,
    capabilities: ['research', 'code', 'data', 'social', 'system', 'creative'],
    maxToolsPerIngot: 7,
    maxRequestsPerDay: 1000,
    supportLevel: 'email',
  },
  enterprise: {
    level: 'enterprise',
    displayName: 'Enterprise',
    pricePerMonth: 99,
    capabilities: ['vision', 'audio', 'code', 'data', 'social', 'finance', 'research', 'security', 'system', 'creative'],
    maxToolsPerIngot: 20,
    maxRequestsPerDay: 10000,
    supportLevel: 'priority',
  },
};

// =============================================================================
// TOOL PROFILE
// =============================================================================

export interface ToolProfile {
  id: string;
  toolId: string;
  name: string;
  visualName: string;
  description: string;
  vertical: CapabilityVertical;
  modelType: ModelType;
  taskTypes: TaskType[];
  tierRequired: TierLevel;
  
  // Deployment
  deploymentPattern: 'cloud-run-http' | 'interactions-tool' | 'rag-backbone' | 'cli-wrapper' | 'ui-service';
  endpoint?: string;
  containerImage?: string;
  
  // I/O Schema
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  
  // Visual
  iconUrl?: string;
  githubRepo?: string;
  
  // Alternatives (for paywall handling)
  freeAlternative?: string;
  
  // Metadata
  version: string;
  status: 'active' | 'deprecated' | 'beta';
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// INTELLIGENT-INTERNET TOOL ROSTER
// =============================================================================

export const TOOL_ROSTER: ToolProfile[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // AGENT ORCHESTRATION
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'ii-agent',
    toolId: 'com.smelter.ii-agent',
    name: 'II-Agent',
    visualName: 'Agent Orchestrator',
    description: 'Core agent orchestration for multi-step task execution',
    vertical: 'system',
    modelType: 'foundation',
    taskTypes: ['chat', 'multimodal'],
    tierRequired: 'data_entry',
    deploymentPattern: 'cloud-run-http',
    inputSchema: { type: 'object', properties: { plan: { type: 'string' } } },
    outputSchema: { type: 'object', properties: { execution: { type: 'object' } } },
    iconUrl: 'https://github.com/Intelligent-Internet/ii-agent/raw/main/icon.svg',
    githubRepo: 'Intelligent-Internet/ii-agent',
    freeAlternative: 'com.smelter.basic-agent',
    version: '1.0.0',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },
  {
    id: 'ii-researcher',
    toolId: 'com.smelter.ii-researcher',
    name: 'II-Researcher',
    visualName: 'Research Agent',
    description: 'Deep research and search capabilities with timeline extraction',
    vertical: 'research',
    modelType: 'task-specific',
    taskTypes: ['chat'],
    tierRequired: 'free',
    deploymentPattern: 'interactions-tool',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
    outputSchema: { type: 'object', properties: { report: { type: 'string' }, sources: { type: 'array' } } },
    iconUrl: 'https://github.com/Intelligent-Internet/ii-researcher/raw/main/icon.svg',
    githubRepo: 'Intelligent-Internet/ii-researcher',
    version: '1.0.0',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CODE GENERATION
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'codex',
    toolId: 'com.smelter.codex',
    name: 'Codex',
    visualName: 'Code Generator',
    description: 'Advanced code generation and debugging',
    vertical: 'code',
    modelType: 'foundation',
    taskTypes: ['code'],
    tierRequired: 'free',
    deploymentPattern: 'cli-wrapper',
    inputSchema: { type: 'object', properties: { prompt: { type: 'string' }, language: { type: 'string' } } },
    outputSchema: { type: 'object', properties: { code: { type: 'string' }, explanation: { type: 'string' } } },
    githubRepo: 'openai/codex',
    version: '1.0.0',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // RAG & EMBEDDINGS
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'ii-commons',
    toolId: 'com.smelter.commons',
    name: 'II-Commons',
    visualName: 'Embeddings Engine',
    description: 'Vector embeddings and RAG backbone via Google File Manager',
    vertical: 'data',
    modelType: 'foundation',
    taskTypes: ['embedding'],
    tierRequired: 'free',
    deploymentPattern: 'rag-backbone',
    inputSchema: { type: 'object', properties: { files: { type: 'array' } } },
    outputSchema: { type: 'object', properties: { vectors: { type: 'array' } } },
    githubRepo: 'Intelligent-Internet/II-Commons',
    version: '1.0.0',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },
  {
    id: 'common-chronicle',
    toolId: 'com.smelter.chronicle',
    name: 'Common Chronicle',
    visualName: 'Timeline Extractor',
    description: 'Context-aware timeline extraction for research',
    vertical: 'research',
    modelType: 'task-specific',
    taskTypes: ['chat'],
    tierRequired: 'data_entry',
    deploymentPattern: 'rag-backbone',
    inputSchema: { type: 'object', properties: { context: { type: 'string' } } },
    outputSchema: { type: 'object', properties: { timeline: { type: 'array' } } },
    githubRepo: 'Intelligent-Internet/Common_Chronicle',
    freeAlternative: 'com.smelter.ii-researcher',
    version: '1.0.0',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VISUALIZATION
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'cot-lab-demo',
    toolId: 'com.smelter.cot-lab',
    name: 'CoT-Lab-Demo',
    visualName: 'Chain of Thought Visualizer',
    description: 'Visualize reasoning chains for transparency',
    vertical: 'creative',
    modelType: 'task-specific',
    taskTypes: ['chat'],
    tierRequired: 'free',
    deploymentPattern: 'ui-service',
    inputSchema: { type: 'object', properties: { thoughtChain: { type: 'array' } } },
    outputSchema: { type: 'object', properties: { visualization: { type: 'string' } } },
    githubRepo: 'Intelligent-Internet/CoT-Lab-Demo',
    version: '1.0.0',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },
  {
    id: 'pptist',
    toolId: 'com.smelter.pptist',
    name: 'PPTist',
    visualName: 'Presentation Generator',
    description: 'AI-powered presentation generation',
    vertical: 'creative',
    modelType: 'task-specific',
    taskTypes: ['multimodal'],
    tierRequired: 'enterprise',
    deploymentPattern: 'interactions-tool',
    inputSchema: { type: 'object', properties: { content: { type: 'string' }, slides: { type: 'number' } } },
    outputSchema: { type: 'object', properties: { ppt: { type: 'string' } } },
    githubRepo: 'nicepkg/PPTist',
    freeAlternative: 'com.smelter.basic-slides',
    version: '1.0.0',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SOCIAL & SCRAPING
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'firecrawl',
    toolId: 'com.smelter.firecrawl',
    name: 'Firecrawl',
    visualName: 'Web Scraper Pro',
    description: 'Advanced web scraping and crawling',
    vertical: 'social',
    modelType: 'task-specific',
    taskTypes: ['chat'],
    tierRequired: 'enterprise',
    deploymentPattern: 'cloud-run-http',
    inputSchema: { type: 'object', properties: { url: { type: 'string' }, depth: { type: 'number' } } },
    outputSchema: { type: 'object', properties: { content: { type: 'string' }, links: { type: 'array' } } },
    githubRepo: 'mendableai/firecrawl',
    freeAlternative: 'com.smelter.basic-scraper',
    version: '1.0.0',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },
  {
    id: 'basic-scraper',
    toolId: 'com.smelter.basic-scraper',
    name: 'Basic Scraper',
    visualName: 'Simple Web Scraper',
    description: 'OSS alternative for basic web scraping',
    vertical: 'social',
    modelType: 'task-specific',
    taskTypes: ['chat'],
    tierRequired: 'free',
    deploymentPattern: 'cloud-run-http',
    inputSchema: { type: 'object', properties: { url: { type: 'string' } } },
    outputSchema: { type: 'object', properties: { content: { type: 'string' } } },
    version: '1.0.0',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FINANCE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'finance-ledger',
    toolId: 'com.smelter.finance-ledger',
    name: 'Finance Ledger',
    visualName: 'Financial Tracker',
    description: 'Transaction ledger and quote fetching',
    vertical: 'finance',
    modelType: 'task-specific',
    taskTypes: ['chat'],
    tierRequired: 'enterprise',
    deploymentPattern: 'cloud-run-http',
    inputSchema: { type: 'object', properties: { action: { type: 'string' }, symbol: { type: 'string' } } },
    outputSchema: { type: 'object', properties: { data: { type: 'object' } } },
    freeAlternative: 'com.smelter.basic-quotes',
    version: '1.0.0',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VISION
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'vision-analyzer',
    toolId: 'com.smelter.vision-analyzer',
    name: 'Vision Analyzer',
    visualName: 'Image/Video Analyzer',
    description: 'Advanced image and video analysis via Cloud Vision AI',
    vertical: 'vision',
    modelType: 'foundation',
    taskTypes: ['vision', 'multimodal'],
    tierRequired: 'enterprise',
    deploymentPattern: 'interactions-tool',
    inputSchema: { type: 'object', properties: { imageUri: { type: 'string' } } },
    outputSchema: { type: 'object', properties: { labels: { type: 'array' }, objects: { type: 'array' } } },
    freeAlternative: 'com.smelter.basic-vision',
    version: '1.0.0',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SECURITY
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'security-scanner',
    toolId: 'com.smelter.security-scanner',
    name: 'Security Scanner',
    visualName: 'Vulnerability Scanner',
    description: 'Code and infrastructure security scanning',
    vertical: 'security',
    modelType: 'task-specific',
    taskTypes: ['code'],
    tierRequired: 'enterprise',
    deploymentPattern: 'cloud-run-http',
    inputSchema: { type: 'object', properties: { target: { type: 'string' }, scanType: { type: 'string' } } },
    outputSchema: { type: 'object', properties: { vulnerabilities: { type: 'array' }, score: { type: 'number' } } },
    version: '1.0.0',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-04T00:00:00Z',
  },
];

// =============================================================================
// ROSTER FUNCTIONS
// =============================================================================

/**
 * Get tool by ID
 */
export function getToolById(toolId: string): ToolProfile | undefined {
  return TOOL_ROSTER.find(t => t.toolId === toolId || t.id === toolId);
}

/**
 * Get tools by vertical
 */
export function getToolsByVertical(vertical: CapabilityVertical): ToolProfile[] {
  return TOOL_ROSTER.filter(t => t.vertical === vertical);
}

/**
 * Get tools available for a tier
 */
export function getToolsForTier(tier: TierLevel): ToolProfile[] {
  const tierOrder: TierLevel[] = ['free', 'data_entry', 'enterprise'];
  const tierIndex = tierOrder.indexOf(tier);
  
  return TOOL_ROSTER.filter(t => {
    const toolTierIndex = tierOrder.indexOf(t.tierRequired);
    return toolTierIndex <= tierIndex;
  });
}

/**
 * Get free alternative for a tool
 */
export function getFreeAlternative(toolId: string): ToolProfile | undefined {
  const tool = getToolById(toolId);
  if (!tool?.freeAlternative) return undefined;
  return getToolById(tool.freeAlternative);
}

/**
 * Check if user can access tool
 */
export function canAccessTool(userTier: TierLevel, toolId: string): { allowed: boolean; alternative?: ToolProfile; upgradeMessage?: string } {
  const tool = getToolById(toolId);
  if (!tool) return { allowed: false };
  
  const tierOrder: TierLevel[] = ['free', 'data_entry', 'enterprise'];
  const userTierIndex = tierOrder.indexOf(userTier);
  const toolTierIndex = tierOrder.indexOf(tool.tierRequired);
  
  if (userTierIndex >= toolTierIndex) {
    return { allowed: true };
  }
  
  const alternative = getFreeAlternative(toolId);
  const targetTier = TIER_CONFIGS[tool.tierRequired];
  
  return {
    allowed: false,
    alternative,
    upgradeMessage: `Unlock ${targetTier.displayName} ($${targetTier.pricePerMonth}/mo) for ${tool.visualName}`,
  };
}

/**
 * Query roster by capabilities (for Function Gemma T5)
 */
export function queryRosterByCapabilities(
  needs: CapabilityVertical[],
  userTier: TierLevel = 'free'
): ToolProfile[] {
  const availableTools = getToolsForTier(userTier);
  return availableTools.filter(t => needs.includes(t.vertical));
}

/**
 * Get all verticals with tool counts
 */
export function getVerticalStats(): Record<CapabilityVertical, number> {
  const stats: Record<CapabilityVertical, number> = {
    vision: 0, audio: 0, code: 0, data: 0, social: 0,
    finance: 0, research: 0, security: 0, system: 0, creative: 0,
  };
  
  for (const tool of TOOL_ROSTER) {
    stats[tool.vertical]++;
  }
  
  return stats;
}

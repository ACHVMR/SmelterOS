/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STRATA Tools Registry
 * Standards/Product/Specs Tool Management for SmelterOS-ORACLE
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getFirestoreClient } from '../database/firestore-client.js';

// =============================================================================
// TYPES
// =============================================================================

export interface StrataTool {
  id: string;
  name: string;
  category: 'verification' | 'perception' | 'security' | 'ethics' | 'research' | 'execution';
  description: string;
  endpoint?: string;
  enabled: boolean;
  registeredAt: string;
  usageCount: number;
  lastUsedAt?: string;
}

export interface StrataToolRegistration {
  tools: string[];
  force?: boolean;
}

export interface StrataRegistryStatus {
  totalTools: number;
  enabledTools: number;
  categories: Record<string, number>;
  tools: StrataTool[];
}

// =============================================================================
// BUILT-IN STRATA TOOLS
// =============================================================================

const BUILTIN_TOOLS: Record<string, Omit<StrataTool, 'id' | 'registeredAt' | 'usageCount' | 'enabled'>> = {
  'ii-thought': {
    name: 'II-Thought RL Optimizer',
    category: 'research',
    description: 'Reinforcement learning optimization with adaptive policy tuning',
    endpoint: '/ii-thought/optimize',
  },
  'ii-researcher': {
    name: 'II-Researcher Deep Analysis',
    category: 'research',
    description: 'Multi-pass research with cross-validation and synthesis',
    endpoint: '/ii-researcher/research',
  },
  'ii-commons': {
    name: 'II-Commons Hybrid Embeddings',
    category: 'perception',
    description: 'Vertex AI + semantic fusion embeddings (768 dims)',
    endpoint: '/ii-commons/embed',
  },
  'cot-lab': {
    name: 'CoT-Lab Visualization',
    category: 'perception',
    description: 'Chain-of-Thought trace visualization (HTML/Mermaid/text)',
    endpoint: '/cot/visualize',
  },
  'escape-detect': {
    name: 'Escape Detection',
    category: 'security',
    description: 'Code sandbox escape pattern detection and blocking',
    endpoint: '/sandbox/detect-escape',
  },
  'verification-tool': {
    name: 'Dual-Loop Verification',
    category: 'verification',
    description: 'Inner/outer loop code verification with Judge LLM',
    endpoint: '/sandbox/secure-execute',
  },
  'ethics-gate': {
    name: 'Virtue Alignment Gate',
    category: 'ethics',
    description: 'Mathematical virtue formula (f≥0.995) enforcement',
    endpoint: '/strata/ethics-gate',
  },
  'budget-ledger': {
    name: 'Budget Ledger',
    category: 'execution',
    description: 'Token/cost tracking with escalation triggers',
    endpoint: '/sandbox/budget-status',
  },
  'rbac-audit': {
    name: 'RBAC Audit Logger',
    category: 'security',
    description: 'Role-based access control audit trail',
    endpoint: '/metrics/rbac-audit',
  },
  'rl-scores': {
    name: 'RL Score Tracker',
    category: 'research',
    description: 'Reinforcement learning score persistence and retrieval',
    endpoint: '/metrics/rl-scores',
  },
};

// =============================================================================
// STRATA REGISTRY CLASS
// =============================================================================

export class StrataRegistry {
  private tools: Map<string, StrataTool>;
  private initialized: boolean;

  constructor() {
    this.tools = new Map();
    this.initialized = false;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('📦 Initializing STRATA Registry...');

    // Load from Firestore
    await this.loadFromFirestore();

    // Register built-in tools if not present
    for (const [id, toolDef] of Object.entries(BUILTIN_TOOLS)) {
      if (!this.tools.has(id)) {
        this.tools.set(id, {
          ...toolDef,
          id,
          enabled: false,
          registeredAt: new Date().toISOString(),
          usageCount: 0,
        });
      }
    }

    this.initialized = true;
    console.log(`   ✓ STRATA Registry: ${this.tools.size} tools available`);
  }

  private async loadFromFirestore(): Promise<void> {
    try {
      const firestore = getFirestoreClient();
      const result = await firestore.query<StrataTool>('strata_tools', { limit: 100 });
      
      for (const tool of result.data) {
        this.tools.set(tool.id, tool);
      }
    } catch (error) {
      console.warn('   ⚠ Could not load STRATA tools from Firestore:', error);
    }
  }

  /**
   * Register (enable) tools
   */
  async registerTools(request: StrataToolRegistration): Promise<{ registered: string[]; failed: string[]; already: string[] }> {
    await this.initialize();

    const registered: string[] = [];
    const failed: string[] = [];
    const already: string[] = [];

    for (const toolId of request.tools) {
      const tool = this.tools.get(toolId);
      
      if (!tool) {
        // Check if it's a built-in tool
        if (BUILTIN_TOOLS[toolId]) {
          const newTool: StrataTool = {
            ...BUILTIN_TOOLS[toolId],
            id: toolId,
            enabled: true,
            registeredAt: new Date().toISOString(),
            usageCount: 0,
          };
          this.tools.set(toolId, newTool);
          await this.persistTool(newTool);
          registered.push(toolId);
        } else {
          failed.push(toolId);
        }
      } else if (tool.enabled && !request.force) {
        already.push(toolId);
      } else {
        tool.enabled = true;
        await this.persistTool(tool);
        registered.push(toolId);
      }
    }

    return { registered, failed, already };
  }

  /**
   * Deregister (disable) tools
   */
  async deregisterTools(toolIds: string[]): Promise<{ deregistered: string[]; notFound: string[] }> {
    await this.initialize();

    const deregistered: string[] = [];
    const notFound: string[] = [];

    for (const toolId of toolIds) {
      const tool = this.tools.get(toolId);
      
      if (!tool) {
        notFound.push(toolId);
      } else {
        tool.enabled = false;
        await this.persistTool(tool);
        deregistered.push(toolId);
      }
    }

    return { deregistered, notFound };
  }

  /**
   * Record tool usage
   */
  async recordUsage(toolId: string): Promise<void> {
    const tool = this.tools.get(toolId);
    if (tool) {
      tool.usageCount++;
      tool.lastUsedAt = new Date().toISOString();
      await this.persistTool(tool);
    }
  }

  /**
   * Get registry status
   */
  async getStatus(): Promise<StrataRegistryStatus> {
    await this.initialize();

    const toolList = Array.from(this.tools.values());
    const categories: Record<string, number> = {};

    for (const tool of toolList) {
      if (tool.enabled) {
        categories[tool.category] = (categories[tool.category] || 0) + 1;
      }
    }

    return {
      totalTools: toolList.length,
      enabledTools: toolList.filter(t => t.enabled).length,
      categories,
      tools: toolList,
    };
  }

  /**
   * Get enabled tools by category
   */
  async getEnabledByCategory(category: StrataTool['category']): Promise<StrataTool[]> {
    await this.initialize();
    return Array.from(this.tools.values()).filter(t => t.enabled && t.category === category);
  }

  /**
   * Check if tool is enabled
   */
  isEnabled(toolId: string): boolean {
    const tool = this.tools.get(toolId);
    return tool?.enabled || false;
  }

  /**
   * Get tool by ID
   */
  getTool(toolId: string): StrataTool | undefined {
    return this.tools.get(toolId);
  }

  private async persistTool(tool: StrataTool): Promise<void> {
    try {
      const firestore = getFirestoreClient();
      await firestore.setDocument('strata_tools', tool.id, tool);
    } catch (error) {
      console.error(`Failed to persist STRATA tool ${tool.id}:`, error);
    }
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let registryInstance: StrataRegistry | null = null;

export function getStrataRegistry(): StrataRegistry {
  if (!registryInstance) {
    registryInstance = new StrataRegistry();
  }
  return registryInstance;
}

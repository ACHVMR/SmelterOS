/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Ingot Assembler
 * Dynamic Tool Assembly via Function Gemma T5 + Firestore Roster
 * Uses HTTP REST API for Firestore (no SDK dependency)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getAuthHeaders, buildFirestoreEndpoint } from '../gcp/auth';
import { GCP_PROJECT } from '../gcp/config';
import {
  ToolProfile,
  CapabilityVertical,
  TierLevel,
  queryRosterByCapabilities,
  TOOL_ROSTER,
} from './roster';
import { getPaywallService, PaywallResult } from './paywall';

// =============================================================================
// INGOT TYPES
// =============================================================================

export type WiringMode = 'parallel' | 'sequential' | 'conditional' | 'hybrid';

export interface ToolIngot {
  ingotId: string;
  tools: ToolProfile[];
  wiring: WiringMode;
  
  // Execution plan
  executionOrder: string[][];  // Array of parallel batches
  dependencies: Map<string, string[]>;
  
  // Budget
  estimatedTokens: number;
  estimatedTimeMs: number;
  
  // Metadata
  createdAt: string;
  createdBy: string;
  capabilities: CapabilityVertical[];
}

export interface IngotExecutionState {
  ingotId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'partial';
  toolStates: Map<string, ToolExecutionState>;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface ToolExecutionState {
  toolId: string;
  status: 'pending' | 'loading' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  output?: unknown;
  error?: string;
  retryCount: number;
}

// =============================================================================
// FIRESTORE REST HELPERS
// =============================================================================

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  mapValue?: { fields: Record<string, FirestoreValue> };
  arrayValue?: { values: FirestoreValue[] };
  nullValue?: null;
}

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(v => toFirestoreValue(v)) } };
  }
  if (typeof value === 'object') {
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue!, 10);
  if ('booleanValue' in value) return value.booleanValue;
  if ('arrayValue' in value && value.arrayValue?.values) {
    return value.arrayValue.values.map(v => fromFirestoreValue(v));
  }
  if ('mapValue' in value && value.mapValue?.fields) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value.mapValue.fields)) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

// =============================================================================
// INGOT ASSEMBLER SERVICE
// =============================================================================

export class IngotAssembler {
  private readonly ROSTER_COLLECTION = 'tool-roster';
  private readonly INGOT_COLLECTION = 'ingot-executions';

  // ───────────────────────────────────────────────────────────────────────────
  // INGOT ASSEMBLY
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Cast an Ingot from a user request
   * Queries Roster via capabilities, applies paywall, assembles for execution
   */
  async castIngot(
    request: string,
    userId: string,
    email: string,
    tenantId: string = 'default'
  ): Promise<{ ingot: ToolIngot; paywallResults: Map<string, PaywallResult>; alternatives: ToolProfile[] }> {
    // Step 1: Analyze request to determine needed capabilities
    const needs = await this.analyzeCapabilityNeeds(request);

    // Step 2: Query Roster from Firestore for matching tools
    const candidates = await this.queryRosterFirestore(needs);

    // Step 3: Apply paywall checks
    const paywall = getPaywallService();
    const paywallResults = new Map<string, PaywallResult>();
    const alternatives: ToolProfile[] = [];
    const approvedTools: ToolProfile[] = [];

    for (const tool of candidates) {
      const result = await paywall.checkToolAccess(userId, email, tool.toolId);
      paywallResults.set(tool.toolId, result);

      if (result.allowed) {
        approvedTools.push(tool);
      } else if (result.suggestedAlternative) {
        alternatives.push(result.suggestedAlternative);
        approvedTools.push(result.suggestedAlternative);
      }
    }

    // Step 4: Determine wiring mode based on tool dependencies
    const wiring = this.determineWiringMode(approvedTools);

    // Step 5: Build execution order
    const { executionOrder, dependencies } = this.buildExecutionPlan(approvedTools, wiring);

    // Step 6: Estimate costs
    const { tokens, timeMs } = this.estimateCosts(approvedTools);

    // Step 7: Create Ingot
    const ingot: ToolIngot = {
      ingotId: `ingot-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tools: approvedTools,
      wiring,
      executionOrder,
      dependencies,
      estimatedTokens: tokens,
      estimatedTimeMs: timeMs,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      capabilities: needs,
    };

    // Step 8: Store Ingot for visualization/replay
    await this.storeIngot(ingot, tenantId);

    return { ingot, paywallResults, alternatives };
  }

  /**
   * Analyze request to determine capability needs
   * (In production, this would call Function Gemma T5)
   */
  private async analyzeCapabilityNeeds(request: string): Promise<CapabilityVertical[]> {
    const requestLower = request.toLowerCase();
    const needs: CapabilityVertical[] = [];

    // Keyword-based capability detection (simplified; use LLM in production)
    const capabilityKeywords: Record<CapabilityVertical, string[]> = {
      vision: ['image', 'photo', 'video', 'picture', 'visual', 'screenshot'],
      audio: ['audio', 'speech', 'voice', 'transcribe', 'sound', 'music'],
      code: ['code', 'program', 'debug', 'function', 'script', 'compile', 'deploy'],
      data: ['data', 'embed', 'vector', 'rag', 'search', 'index', 'retrieve'],
      social: ['scrape', 'crawl', 'website', 'social', 'twitter', 'linkedin', 'post'],
      finance: ['finance', 'stock', 'price', 'ledger', 'transaction', 'invoice', 'payment'],
      research: ['research', 'find', 'lookup', 'timeline', 'history', 'analyze'],
      security: ['security', 'auth', 'scan', 'vulnerability', 'encrypt', 'password'],
      system: ['deploy', 'monitor', 'server', 'container', 'orchestrate', 'system'],
      creative: ['presentation', 'slide', 'ppt', 'generate', 'create', 'design', 'visualize'],
    };

    for (const [capability, keywords] of Object.entries(capabilityKeywords)) {
      if (keywords.some(kw => requestLower.includes(kw))) {
        needs.push(capability as CapabilityVertical);
      }
    }

    // Default to research + data if nothing detected
    if (needs.length === 0) {
      needs.push('research', 'data');
    }

    return needs;
  }

  /**
   * Query Roster from Firestore (falls back to in-memory)
   */
  private async queryRosterFirestore(needs: CapabilityVertical[]): Promise<ToolProfile[]> {
    // For production, query Firestore
    // For now, use in-memory roster
    return queryRosterByCapabilities(needs, 'enterprise');
  }

  /**
   * Determine wiring mode based on tool types
   */
  private determineWiringMode(tools: ToolProfile[]): WiringMode {
    if (tools.length === 1) return 'sequential';

    // Check for dependencies that require sequential execution
    const hasRagDependency = tools.some(t => t.vertical === 'data');
    const hasCodeGen = tools.some(t => t.vertical === 'code');

    if (hasRagDependency && hasCodeGen) {
      return 'hybrid'; // RAG first, then code gen
    }

    // Independent tools can run in parallel
    return 'parallel';
  }

  /**
   * Build execution plan with dependency ordering
   */
  private buildExecutionPlan(
    tools: ToolProfile[],
    wiring: WiringMode
  ): { executionOrder: string[][]; dependencies: Map<string, string[]> } {
    const dependencies = new Map<string, string[]>();
    const executionOrder: string[][] = [];

    if (wiring === 'sequential') {
      // Each tool runs after the previous
      for (let i = 0; i < tools.length; i++) {
        executionOrder.push([tools[i].toolId]);
        if (i > 0) {
          dependencies.set(tools[i].toolId, [tools[i - 1].toolId]);
        }
      }
    } else if (wiring === 'parallel') {
      // All tools run together
      executionOrder.push(tools.map(t => t.toolId));
    } else if (wiring === 'hybrid') {
      // Group by vertical priority
      const ragTools = tools.filter(t => t.vertical === 'data');
      const codeTools = tools.filter(t => t.vertical === 'code');
      const otherTools = tools.filter(t => !['data', 'code'].includes(t.vertical));

      if (ragTools.length > 0) {
        executionOrder.push(ragTools.map(t => t.toolId));
      }

      const parallelBatch: string[] = [];
      otherTools.forEach(t => parallelBatch.push(t.toolId));
      if (parallelBatch.length > 0) {
        executionOrder.push(parallelBatch);
        // These depend on RAG
        ragTools.forEach(rag => {
          parallelBatch.forEach(toolId => {
            const existing = dependencies.get(toolId) || [];
            dependencies.set(toolId, [...existing, rag.toolId]);
          });
        });
      }

      if (codeTools.length > 0) {
        executionOrder.push(codeTools.map(t => t.toolId));
        // Code depends on all previous
        const allPrevious = executionOrder.slice(0, -1).flat();
        codeTools.forEach(t => dependencies.set(t.toolId, allPrevious));
      }
    }

    return { executionOrder, dependencies };
  }

  /**
   * Estimate token and time costs
   */
  private estimateCosts(tools: ToolProfile[]): { tokens: number; timeMs: number } {
    // Base costs per tool type
    const baseCosts: Record<string, { tokens: number; timeMs: number }> = {
      'cloud-run-http': { tokens: 1000, timeMs: 2000 },
      'interactions-tool': { tokens: 500, timeMs: 1000 },
      'rag-backbone': { tokens: 2000, timeMs: 3000 },
      'cli-wrapper': { tokens: 800, timeMs: 1500 },
      'ui-service': { tokens: 300, timeMs: 500 },
    };

    let totalTokens = 0;
    let maxTimeMs = 0;

    for (const tool of tools) {
      const cost = baseCosts[tool.deploymentPattern] || { tokens: 500, timeMs: 1000 };
      totalTokens += cost.tokens;
      maxTimeMs = Math.max(maxTimeMs, cost.timeMs);
    }

    return { tokens: totalTokens, timeMs: maxTimeMs };
  }

  /**
   * Store Ingot in Firestore for visualization/replay
   */
  private async storeIngot(ingot: ToolIngot, tenantId: string): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      const endpoint = `${buildFirestoreEndpoint(this.INGOT_COLLECTION)}?documentId=${ingot.ingotId}`;

      const fields: Record<string, FirestoreValue> = {
        ingotId: toFirestoreValue(ingot.ingotId),
        tenantId: toFirestoreValue(tenantId),
        wiring: toFirestoreValue(ingot.wiring),
        estimatedTokens: toFirestoreValue(ingot.estimatedTokens),
        estimatedTimeMs: toFirestoreValue(ingot.estimatedTimeMs),
        createdAt: toFirestoreValue(ingot.createdAt),
        createdBy: toFirestoreValue(ingot.createdBy),
        capabilities: toFirestoreValue(ingot.capabilities),
        executionOrder: toFirestoreValue(ingot.executionOrder),
        dependencies: toFirestoreValue(Object.fromEntries(ingot.dependencies)),
        toolIds: toFirestoreValue(ingot.tools.map(t => t.toolId)),
      };

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });
    } catch (error) {
      console.error('[IngotAssembler] Error storing ingot:', error);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INGOT RETRIEVAL
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Get Ingot by ID (for visualization endpoint)
   */
  async getIngot(ingotId: string): Promise<ToolIngot | null> {
    try {
      const headers = await getAuthHeaders();
      const endpoint = buildFirestoreEndpoint(this.INGOT_COLLECTION, ingotId);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) return null;

      const doc = await response.json() as { fields?: Record<string, FirestoreValue> };
      if (!doc.fields) return null;

      const fields = doc.fields;
      const toolIds = fromFirestoreValue(fields.toolIds) as string[] || [];
      const tools = toolIds.map(id => TOOL_ROSTER.find(t => t.toolId === id)).filter(Boolean) as ToolProfile[];

      const depsObj = fromFirestoreValue(fields.dependencies) as Record<string, string[]> || {};
      const dependencies = new Map(Object.entries(depsObj));

      return {
        ingotId: fromFirestoreValue(fields.ingotId) as string,
        tools,
        wiring: fromFirestoreValue(fields.wiring) as WiringMode,
        executionOrder: fromFirestoreValue(fields.executionOrder) as string[][],
        dependencies,
        estimatedTokens: fromFirestoreValue(fields.estimatedTokens) as number,
        estimatedTimeMs: fromFirestoreValue(fields.estimatedTimeMs) as number,
        createdAt: fromFirestoreValue(fields.createdAt) as string,
        createdBy: fromFirestoreValue(fields.createdBy) as string,
        capabilities: fromFirestoreValue(fields.capabilities) as CapabilityVertical[],
      };
    } catch (error) {
      console.error('[IngotAssembler] Error getting ingot:', error);
      return null;
    }
  }

  /**
   * Get execution state for visualization
   */
  async getExecutionState(ingotId: string): Promise<IngotExecutionState | null> {
    try {
      const headers = await getAuthHeaders();
      const endpoint = buildFirestoreEndpoint(`${this.INGOT_COLLECTION}/${ingotId}/execution`, 'state');

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) return null;

      const doc = await response.json() as { fields?: Record<string, FirestoreValue> };
      if (!doc.fields) return null;

      const fields = doc.fields;
      const toolStatesObj = fromFirestoreValue(fields.toolStates) as Record<string, ToolExecutionState> || {};

      return {
        ingotId: fromFirestoreValue(fields.ingotId) as string,
        status: fromFirestoreValue(fields.status) as IngotExecutionState['status'],
        toolStates: new Map(Object.entries(toolStatesObj)),
        startedAt: fromFirestoreValue(fields.startedAt) as string | undefined,
        completedAt: fromFirestoreValue(fields.completedAt) as string | undefined,
        error: fromFirestoreValue(fields.error) as string | undefined,
      };
    } catch (error) {
      console.error('[IngotAssembler] Error getting execution state:', error);
      return null;
    }
  }

  /**
   * Update tool execution state (for real-time visualization)
   */
  async updateToolState(ingotId: string, toolId: string, state: Partial<ToolExecutionState>): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      const endpoint = buildFirestoreEndpoint(`${this.INGOT_COLLECTION}/${ingotId}/execution`, 'state');

      const fields: Record<string, FirestoreValue> = {
        [`toolStates.${toolId}`]: toFirestoreValue(state),
        updatedAt: toFirestoreValue(new Date().toISOString()),
      };

      await fetch(`${endpoint}?updateMask.fieldPaths=toolStates.${toolId}&updateMask.fieldPaths=updatedAt`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });
    } catch (error) {
      console.error('[IngotAssembler] Error updating tool state:', error);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ROSTER SYNC
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Sync in-memory roster to Firestore
   * Run on startup or when roster updates
   */
  async syncRosterToFirestore(): Promise<void> {
    try {
      const headers = await getAuthHeaders();

      for (const tool of TOOL_ROSTER) {
        const endpoint = `${buildFirestoreEndpoint(this.ROSTER_COLLECTION)}?documentId=${tool.id}`;
        
        const fields: Record<string, FirestoreValue> = {};
        for (const [key, value] of Object.entries(tool)) {
          fields[key] = toFirestoreValue(value);
        }

        await fetch(endpoint, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fields }),
        });
      }

      console.log(`[IngotAssembler] Synced ${TOOL_ROSTER.length} tools to Firestore`);
    } catch (error) {
      console.error('[IngotAssembler] Error syncing roster:', error);
    }
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let ingotAssemblerInstance: IngotAssembler | null = null;

export function getIngotAssembler(): IngotAssembler {
  if (!ingotAssemblerInstance) {
    ingotAssemblerInstance = new IngotAssembler();
  }
  return ingotAssemblerInstance;
}

// =============================================================================
// FUNCTION GEMMA T5 INTEGRATION
// =============================================================================

/**
 * Cast Ingot via Function Gemma T5 file_manager.assemble call
 * This is the primary entry point for ACHEEVY
 */
export async function gemmaT5AssembleIngot(
  request: string,
  userId: string,
  email: string,
  tenantId: string = 'default'
): Promise<ToolIngot> {
  const assembler = getIngotAssembler();
  const { ingot } = await assembler.castIngot(request, userId, email, tenantId);
  return ingot;
}

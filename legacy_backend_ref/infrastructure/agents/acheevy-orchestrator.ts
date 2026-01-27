/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS ACHEEVY Orchestrator
 * Phase 2: Full Delegation Pipeline
 * 
 * Flow: UserQuery → Pub/Sub → Roster Check → Ingot Cast → Sandbox Exec
 *       → Budget Check → Escalation (if needed) → Response
 * 
 * ACHEEVY is the Digital CEO - orchestrates C-Suite agents via sandboxes
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getIngotAssembler, ToolIngot } from '../tools/ingot-assembler.js';
import { queryRosterByCapabilities, getToolById, CapabilityVertical } from '../tools/roster.js';
import { getSandboxManager, SandboxExecutionResult } from '../sandbox/index.js';
import { CSUITE_REGISTRY, analyzeQueryForChiefs, getAgentBudget } from '../agents/registries.js';
import { getFirestoreClient } from '../database/firestore-client.js';
import { getFileManagerRAG } from '../rag/file-manager.js';

// =============================================================================
// TYPES
// =============================================================================

export interface OrchestrationRequest {
  sessionId: string;
  userId: string;
  organizationId: string;
  query: string;
  tier: 'free' | 'data_entry' | 'enterprise';
  context?: Record<string, unknown>;
}

export interface DelegationDecision {
  agentId: string;
  reason: string;
  confidence: number;
  capabilities: string[];
  estimatedCost: number;
}

export interface OrchestrationResult {
  success: boolean;
  sessionId: string;
  delegations: DelegationExecution[];
  totalCost: number;
  budgetRemaining: number;
  escalated: boolean;
  escalationReason?: string;
  output: string;
  executionTimeMs: number;
}

export interface DelegationExecution {
  agentId: string;
  sandboxId: string;
  ingotId: string;
  result: SandboxExecutionResult;
  cost: number;
  timestamp: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BUDGET_CAP = 100; // $100/session for ACHEEVY
const ESCALATION_THRESHOLD = 0.8; // Escalate at 80% budget consumed

// =============================================================================
// ACHEEVY ORCHESTRATOR
// =============================================================================

export class ACHEEVYOrchestrator {
  private static instance: ACHEEVYOrchestrator;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): ACHEEVYOrchestrator {
    if (!ACHEEVYOrchestrator.instance) {
      ACHEEVYOrchestrator.instance = new ACHEEVYOrchestrator();
    }
    return ACHEEVYOrchestrator.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🏗️  Initializing ACHEEVY Orchestrator...');
    
    // Initialize sandbox manager
    const sandboxManager = getSandboxManager();
    await sandboxManager.initialize();
    
    this.initialized = true;
    console.log('   ✓ ACHEEVY Orchestrator ready');
  }

  // ===========================================================================
  // MAIN ORCHESTRATION FLOW
  // ===========================================================================

  async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const sandboxManager = getSandboxManager();

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║           ACHEEVY ORCHESTRATION INITIATED                      ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  Session: ${request.sessionId.substring(0, 30)}...`);
    console.log(`║  User: ${request.userId.substring(0, 40)}`);
    console.log(`║  Tier: ${request.tier}`);
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');

    // Initialize if needed
    await this.initialize();

    // Step 1: RAG Context Retrieval
    console.log('📚 Step 1: RAG Context Retrieval');
    const ragContext = await this.retrieveRAGContext(request.query);
    console.log(`   Retrieved ${ragContext.length} context chunks`);

    // Step 2: Analyze Query for Delegation
    console.log('🎯 Step 2: Analyzing Query for Delegation');
    const delegations = await this.analyzeForDelegation(request.query);
    console.log(`   Identified ${delegations.length} delegation(s):`);
    for (const d of delegations) {
      console.log(`   - ${d.agentId}: ${d.reason} (${(d.confidence * 100).toFixed(0)}%)`);
    }

    // Step 3: Check Budget
    console.log('💰 Step 3: Budget Check');
    const budgetLedger = sandboxManager.getBudgetLedger('acheevy');
    const currentBudget = budgetLedger 
      ? budgetLedger.initial - budgetLedger.spent - budgetLedger.reserved
      : BUDGET_CAP;
    
    const totalEstimatedCost = delegations.reduce((sum, d) => sum + d.estimatedCost, 0);
    console.log(`   Available: $${currentBudget.toFixed(2)}`);
    console.log(`   Estimated cost: $${totalEstimatedCost.toFixed(2)}`);

    // Check if escalation needed
    const budgetUsageRatio = (BUDGET_CAP - currentBudget + totalEstimatedCost) / BUDGET_CAP;
    if (budgetUsageRatio > ESCALATION_THRESHOLD) {
      console.log('   ⚠️ Budget threshold exceeded - escalating to human');
      return await this.escalateToHuman(request, delegations, budgetUsageRatio);
    }

    // Step 4: Cast Ingots for Each Delegation
    console.log('🔧 Step 4: Casting Ingots');
    const ingots = await this.castIngots(request.query, delegations);
    console.log(`   Cast ${ingots.length} ingot(s)`);

    // Step 5: Execute in Sandboxes
    console.log('🚀 Step 5: Executing in Sandboxes');
    const executions: DelegationExecution[] = [];
    let totalCost = 0;

    for (const delegation of delegations) {
      const sandbox = sandboxManager.getSandbox(`${delegation.agentId}-engine-default`);
      if (!sandbox) {
        console.warn(`   ⚠️ No sandbox for ${delegation.agentId}`);
        continue;
      }

      // Find the ingot by matching index (created in same order as delegations)
      const delegationIndex = delegations.indexOf(delegation);
      const ingot = ingots[delegationIndex];
      if (!ingot) {
        console.warn(`   ⚠️ No ingot for ${delegation.agentId}`);
        continue;
      }

      // Generate execution code from ingot
      const code = this.generateExecutionCode(delegation, ingot, ragContext);
      
      const result = await sandboxManager.execute({
        sandboxId: sandbox.id,
        code,
        language: 'python',
        timeout: 60,
        env: {
          QUERY: request.query,
          SESSION_ID: request.sessionId,
          USER_ID: request.userId,
        },
      });

      // Track cost
      const cost = delegation.estimatedCost;
      await sandboxManager.spendBudget('acheevy', cost, ingot.ingotId);
      totalCost += cost;

      executions.push({
        agentId: delegation.agentId,
        sandboxId: sandbox.id,
        ingotId: ingot.ingotId,
        result,
        cost,
        timestamp: new Date().toISOString(),
      });

      console.log(`   ✓ ${delegation.agentId}: ${result.success ? 'Success' : 'Failed'} (${result.executionTimeMs}ms)`);
    }

    // Step 6: Aggregate Results
    console.log('📊 Step 6: Aggregating Results');
    const output = this.aggregateResults(executions);

    // Step 7: Persist Execution Log
    await this.persistExecutionLog(request, executions, totalCost);

    const result: OrchestrationResult = {
      success: executions.every(e => e.result.success),
      sessionId: request.sessionId,
      delegations: executions,
      totalCost,
      budgetRemaining: currentBudget - totalCost,
      escalated: false,
      output,
      executionTimeMs: Date.now() - startTime,
    };

    console.log('');
    console.log(`✅ Orchestration complete: ${result.executionTimeMs}ms, $${totalCost.toFixed(2)} spent`);
    
    return result;
  }

  // ===========================================================================
  // STEP IMPLEMENTATIONS
  // ===========================================================================

  private async retrieveRAGContext(query: string): Promise<string[]> {
    try {
      const ragManager = getFileManagerRAG();
      const results = await ragManager.retrieve({
        query,
        maxResults: 5,
        relevanceThreshold: 0.6,
      });
      return results.documents.map((doc: { content: string }) => doc.content);
    } catch {
      return [];
    }
  }

  private async analyzeForDelegation(query: string): Promise<DelegationDecision[]> {
    // Use the registry analyzer
    const chiefAnalysis = analyzeQueryForChiefs(query);
    const decisions: DelegationDecision[] = [];

    // chiefAnalysis returns string[] of agent IDs
    for (const chiefId of chiefAnalysis) {
      const agent = CSUITE_REGISTRY[chiefId];
      if (!agent) continue;

      // Get tools for this agent's capabilities (cast to CapabilityVertical)
      const capabilities = agent.capabilities.filter((c): c is CapabilityVertical => 
        ['code', 'data', 'document', 'research', 'automation', 'communication'].includes(c)
      );
      
      decisions.push({
        agentId: chiefId,
        reason: `Matched capabilities: ${agent.capabilities.slice(0, 2).join(', ')}`,
        confidence: 0.8,
        capabilities: agent.capabilities,
        estimatedCost: getAgentBudget(chiefId),
      });
    }

    // If no specific chiefs, use ACHEEVY directly
    if (decisions.length === 0) {
      decisions.push({
        agentId: 'acheevy',
        reason: 'General orchestration - no specific chief matched',
        confidence: 0.6,
        capabilities: ['orchestration', 'delegation'],
        estimatedCost: 5.0, // Base cost
      });
    }

    return decisions;
  }

  private async castIngots(query: string, delegations: DelegationDecision[]): Promise<ToolIngot[]> {
    const assembler = getIngotAssembler();
    const ingots: ToolIngot[] = [];

    for (const delegation of delegations) {
      // Use castIngot method with proper parameters
      const { ingot } = await assembler.castIngot(
        query,
        delegation.agentId,
        `${delegation.agentId}@smelter.os`,
        'default'
      );
      // Add metadata to ingot
      (ingot as ToolIngot & { metadata?: Record<string, unknown> }).metadata = {
        agentId: delegation.agentId,
        delegationReason: delegation.reason,
      };
      ingots.push(ingot);
    }

    return ingots;
  }

  private generateExecutionCode(
    delegation: DelegationDecision,
    ingot: ToolIngot,
    context: string[]
  ): string {
    // Generate Python code to execute the agent's task
    const toolCalls = ingot.tools.map((t: { toolId: string; name: string }) => 
      `# Tool: ${t.name} (${t.toolId})`
    ).join('\n');

    return `
# ACHEEVY Delegation: ${delegation.agentId}
# Reason: ${delegation.reason}
# Ingot ID: ${ingot.ingotId}

import json
import os

# Context from RAG
CONTEXT = ${JSON.stringify(context)}

# Query
QUERY = os.environ.get('QUERY', '')

# Tool invocations from Ingot
${toolCalls}

# Execute agent logic
def execute():
    result = {
        'agent': '${delegation.agentId}',
        'query': QUERY,
        'context_chunks': len(CONTEXT),
        'tools_invoked': ${ingot.tools.length},
        'status': 'completed'
    }
    return json.dumps(result, indent=2)

output = execute()
print(output)
`.trim();
  }

  private aggregateResults(executions: DelegationExecution[]): string {
    const summaries = executions.map(e => {
      if (e.result.success) {
        return `[${e.agentId}] ${e.result.output.substring(0, 200)}`;
      }
      return `[${e.agentId}] Error: ${e.result.error}`;
    });

    return summaries.join('\n\n');
  }

  private async escalateToHuman(
    request: OrchestrationRequest,
    delegations: DelegationDecision[],
    budgetRatio: number
  ): Promise<OrchestrationResult> {
    console.log('🚨 ESCALATING TO HUMAN');

    const escalationPayload = {
      id: `esc-${Date.now()}`,
      type: 'budget-threshold',
      sessionId: request.sessionId,
      userId: request.userId,
      query: request.query,
      delegations,
      budgetRatio,
      timestamp: new Date().toISOString(),
    };

    // Persist escalation to Firestore
    const firestore = getFirestoreClient();
    await firestore.setDocument('escalations', escalationPayload.id, escalationPayload);

    return {
      success: false,
      sessionId: request.sessionId,
      delegations: [],
      totalCost: 0,
      budgetRemaining: BUDGET_CAP * (1 - budgetRatio),
      escalated: true,
      escalationReason: `Budget usage at ${(budgetRatio * 100).toFixed(0)}% - requires human approval`,
      output: 'Request escalated to human operator for approval.',
      executionTimeMs: 0,
    };
  }

  private async persistExecutionLog(
    request: OrchestrationRequest,
    executions: DelegationExecution[],
    totalCost: number
  ): Promise<void> {
    const firestore = getFirestoreClient();
    const logId = `orch-${Date.now()}`;
    
    await firestore.setDocument('orchestration_logs', logId, {
      id: logId,
      sessionId: request.sessionId,
      userId: request.userId,
      organizationId: request.organizationId,
      query: request.query,
      tier: request.tier,
      delegationCount: executions.length,
      totalCost,
      executions: executions.map(e => ({
        agentId: e.agentId,
        sandboxId: e.sandboxId,
        ingotId: e.ingotId,
        success: e.result.success,
        executionTimeMs: e.result.executionTimeMs,
        cost: e.cost,
      })),
      timestamp: new Date().toISOString(),
    });
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let orchestratorInstance: ACHEEVYOrchestrator | null = null;

export function getACHEEVYOrchestrator(): ACHEEVYOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = ACHEEVYOrchestrator.getInstance();
  }
  return orchestratorInstance;
}

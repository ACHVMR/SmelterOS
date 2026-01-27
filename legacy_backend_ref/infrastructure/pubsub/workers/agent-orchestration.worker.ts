/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Agent Orchestration Worker
 * Routes tasks to ACHEEVY and C-Suite agents via Persistent Sandboxes
 * Pattern B: One persistent sandbox per agent (14-day TTL)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { BaseWorker, WorkerResult } from '../base-worker.js';
import { PUBSUB_TOPICS, AgentOrchestrationPayload, PubSubMessage } from '../config.js';
import { getFirestoreClient } from '../../database/firestore-client.js';
import { getPubSubClient } from '../client.js';
import {
  CSUITE_REGISTRY,
  analyzeQueryForChiefs,
  getAgentBudget,
  createBudgetLedger,
  createDelegationState,
  canAffordTask,
  reserveBudget,
  BudgetLedger,
  DelegationState,
} from '../../agents/registries.js';

// =============================================================================
// TYPES
// =============================================================================

export interface OrchestrationResult {
  id: string;
  taskId: string;
  operation: 'fan-out' | 'coordinate' | 'aggregate' | 'route';
  agentRole: string;
  status: 'completed' | 'delegated' | 'escalated' | 'failed';
  delegations: DelegationRecord[];
  aggregatedResult?: unknown;
  executionTimeMs: number;
  timestamp: string;
}

export interface DelegationRecord {
  targetAgent: string;
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: unknown;
  delegatedAt: string;
  completedAt?: string;
}

// =============================================================================
// WORKER
// =============================================================================

export class AgentOrchestrationWorker extends BaseWorker<AgentOrchestrationPayload> {
  private budgetLedger: BudgetLedger = createBudgetLedger(100.0);
  private delegationState: DelegationState = createDelegationState();

  constructor() {
    super('agent-orchestration', PUBSUB_TOPICS.AGENT_ORCHESTRATION, {
      maxConcurrency: 10,
      pollIntervalMs: 500,
      circuitId: 'agent-orchestration',
    });
  }

  protected async process(
    payload: AgentOrchestrationPayload,
    message: PubSubMessage<AgentOrchestrationPayload>
  ): Promise<WorkerResult<OrchestrationResult>> {
    const startTime = Date.now();

    console.log(`🎯 Agent Orchestration: ${payload.operation}`);
    console.log(`   Task ID: ${payload.taskId}`);
    console.log(`   Agent Role: ${payload.agentRole}`);
    console.log(`   Parent Task: ${payload.parentTaskId || 'none'}`);

    try {
      let result: OrchestrationResult;

      switch (payload.operation) {
        case 'fan-out':
          result = await this.handleFanOut(payload);
          break;
        case 'coordinate':
          result = await this.handleCoordinate(payload);
          break;
        case 'aggregate':
          result = await this.handleAggregate(payload);
          break;
        case 'route':
          result = await this.handleRoute(payload);
          break;
        default:
          throw new Error(`Unknown operation: ${payload.operation}`);
      }

      result.executionTimeMs = Date.now() - startTime;

      // Persist result to Firestore
      const firestore = getFirestoreClient();
      await firestore.setDocument('orchestration-results', payload.taskId, result);

      console.log(`   ✓ Orchestration complete: ${result.status}`);
      console.log(`   ✓ Delegations: ${result.delegations.length}`);

      return {
        success: true,
        jobId: payload.jobId,
        data: result,
        duration: Date.now() - startTime,
        retryable: false,
      };
    } catch (error) {
      console.error(`   ✗ Orchestration failed:`, error);

      // Send to dead-letter for forensics
      await this.sendToDeadLetter(payload, error);

      return {
        success: false,
        jobId: payload.jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        retryable: true,
      };
    }
  }

  // ===========================================================================
  // OPERATION HANDLERS
  // ===========================================================================

  /**
   * Fan-out: Distribute a task to multiple C-Suite agents in parallel
   */
  private async handleFanOut(payload: AgentOrchestrationPayload): Promise<OrchestrationResult> {
    console.log(`   📤 Fan-out to C-Suite agents...`);

    // Analyze input to determine which chiefs are needed
    const inputStr = typeof payload.input === 'string' 
      ? payload.input 
      : JSON.stringify(payload.input);
    
    const chiefsNeeded = analyzeQueryForChiefs(inputStr);
    console.log(`   └─ Chiefs needed: ${chiefsNeeded.join(', ') || 'none identified'}`);

    const delegations: DelegationRecord[] = [];

    // Delegate to each identified chief
    for (const chief of chiefsNeeded) {
      const delegation = await this.delegateToChief(chief, payload);
      delegations.push(delegation);
      
      // Update delegation state
      const stateKey = `${chief.replace('boomer-', '')}_status` as keyof DelegationState;
      if (stateKey in this.delegationState) {
        this.delegationState[stateKey] = 'processing';
      }
    }

    // Persist delegation state
    const firestore = getFirestoreClient();
    await firestore.setDocument('delegation-states', payload.taskId, {
      id: payload.taskId,
      state: this.delegationState,
      budget: this.budgetLedger,
      updatedAt: new Date().toISOString(),
    });

    return {
      id: `orch-${Date.now()}`,
      taskId: payload.taskId,
      operation: 'fan-out',
      agentRole: payload.agentRole,
      status: 'delegated',
      delegations,
      executionTimeMs: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Coordinate: Manage dependencies between agent tasks
   */
  private async handleCoordinate(payload: AgentOrchestrationPayload): Promise<OrchestrationResult> {
    console.log(`   🔗 Coordinating agent tasks...`);

    const firestore = getFirestoreClient();

    // Load current delegation state
    const stateDoc = await firestore.getDocument<{ id: string; state: DelegationState }>(
      'delegation-states',
      payload.parentTaskId || payload.taskId
    );

    if (stateDoc) {
      this.delegationState = stateDoc.state;
    }

    // Check which tasks are complete
    const completedTasks = Object.entries(this.delegationState)
      .filter(([, status]) => status === 'completed')
      .map(([key]) => key);

    const pendingTasks = Object.entries(this.delegationState)
      .filter(([, status]) => status !== 'completed')
      .map(([key]) => key);

    console.log(`   └─ Completed: ${completedTasks.length}, Pending: ${pendingTasks.length}`);

    return {
      id: `orch-${Date.now()}`,
      taskId: payload.taskId,
      operation: 'coordinate',
      agentRole: payload.agentRole,
      status: pendingTasks.length === 0 ? 'completed' : 'delegated',
      delegations: [],
      aggregatedResult: {
        completed: completedTasks,
        pending: pendingTasks,
      },
      executionTimeMs: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Aggregate: Combine results from multiple agents
   */
  private async handleAggregate(payload: AgentOrchestrationPayload): Promise<OrchestrationResult> {
    console.log(`   📊 Aggregating agent results...`);

    const firestore = getFirestoreClient();

    // Load all delegation results for this parent task
    const resultsQuery = await firestore.query<DelegationRecord & { id: string; parentTaskId: string }>(
      'delegation-results',
      {
        filters: [
          { field: 'parentTaskId', op: 'EQUAL', value: payload.parentTaskId || payload.taskId },
        ],
        limit: 50,
      }
    );

    const results = resultsQuery.data;
    console.log(`   └─ Aggregating ${results.length} results`);

    // Combine results
    const aggregated = {
      totalDelegations: results.length,
      successCount: results.filter(r => r.status === 'completed').length,
      failureCount: results.filter(r => r.status === 'failed').length,
      results: results.map(r => ({
        agent: r.targetAgent,
        status: r.status,
        result: r.result,
      })),
      synthesizedAt: new Date().toISOString(),
    };

    // Check for escalation (budget exceeded - >150% triggers cancellation)
    if (this.budgetLedger.spent > this.budgetLedger.initial * 1.5) {
      console.log(`   🚨 Budget exceeded 150% - escalating to human`);
      await this.escalateToHuman(payload.taskId, 'Budget exceeded 150%', aggregated);
      return {
        id: `orch-${Date.now()}`,
        taskId: payload.taskId,
        operation: 'aggregate',
        agentRole: payload.agentRole,
        status: 'escalated',
        delegations: [],
        aggregatedResult: aggregated,
        executionTimeMs: 0,
        timestamp: new Date().toISOString(),
      };
    } else if (this.budgetLedger.spent > this.budgetLedger.initial) {
      console.log(`   ⚠️ Budget exceeded - alerting (but continuing)`);
      await this.escalateToHuman(payload.taskId, 'Budget exceeded (alert)', aggregated);
    }

    return {
      id: `orch-${Date.now()}`,
      taskId: payload.taskId,
      operation: 'aggregate',
      agentRole: payload.agentRole,
      status: 'completed',
      delegations: [],
      aggregatedResult: aggregated,
      executionTimeMs: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Route: Direct a task to a specific agent based on role
   */
  private async handleRoute(payload: AgentOrchestrationPayload): Promise<OrchestrationResult> {
    console.log(`   🔀 Routing to agent: ${payload.agentRole}`);

    const delegation = await this.delegateToChief(payload.agentRole, payload);

    return {
      id: `orch-${Date.now()}`,
      taskId: payload.taskId,
      operation: 'route',
      agentRole: payload.agentRole,
      status: 'delegated',
      delegations: [delegation],
      executionTimeMs: 0,
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Delegate a task to a specific C-Suite chief
   */
  private async delegateToChief(
    chiefId: string,
    payload: AgentOrchestrationPayload
  ): Promise<DelegationRecord> {
    const delegationId = `del-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    console.log(`   └─ Delegating to ${chiefId}: ${delegationId}`);

    // Reserve budget
    const budgetAmount = getAgentBudget(chiefId);

    if (!canAffordTask(this.budgetLedger, budgetAmount)) {
      console.log(`   ⚠️ Insufficient budget for ${chiefId}`);
      return {
        targetAgent: chiefId,
        taskId: delegationId,
        status: 'failed',
        result: { error: 'Insufficient budget' },
        delegatedAt: new Date().toISOString(),
      };
    }

    this.budgetLedger = reserveBudget(this.budgetLedger, chiefId, budgetAmount);

    const delegation: DelegationRecord = {
      targetAgent: chiefId,
      taskId: delegationId,
      status: 'pending',
      delegatedAt: new Date().toISOString(),
    };

    // Persist delegation
    const firestore = getFirestoreClient();
    await firestore.setDocument('delegation-results', delegationId, {
      id: delegationId,
      parentTaskId: payload.taskId,
      ...delegation,
      input: payload.input,
      budgetReserved: budgetAmount,
    });

    // Mark as processing (actual sandbox execution in future phases)
    delegation.status = 'processing';

    return delegation;
  }

  /**
   * Escalate a task to human review
   */
  private async escalateToHuman(taskId: string, reason: string, context: unknown): Promise<void> {
    const firestore = getFirestoreClient();

    await firestore.setDocument('escalations', `esc-${taskId}`, {
      id: `esc-${taskId}`,
      taskId,
      reason,
      context,
      status: 'pending_human_review',
      createdAt: new Date().toISOString(),
    });

    console.log(`🚨 ESCALATION: ${reason}`);
  }

  /**
   * Send failed message to dead-letter topic
   */
  private async sendToDeadLetter(payload: AgentOrchestrationPayload, error: unknown): Promise<void> {
    try {
      const pubsub = getPubSubClient();

      const deadLetterPayload = {
        type: 'dead-letter' as const,
        jobId: `dl-${Date.now()}`,
        correlationId: payload.jobId,
        timestamp: new Date().toISOString(),
        source: 'agent-orchestration-worker',
        priority: 'high' as const,
        metadata: {
          originalPayload: payload,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        originalTopic: PUBSUB_TOPICS.AGENT_ORCHESTRATION.id,
        originalPayload: payload,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        failureCount: 1,
        firstFailedAt: new Date().toISOString(),
      };

      await pubsub.publish(PUBSUB_TOPICS.DEAD_LETTER.name, deadLetterPayload);
      console.log(`   └─ Sent to dead-letter queue`);
    } catch (dlError) {
      console.error('Failed to send to dead-letter:', dlError);
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let workerInstance: AgentOrchestrationWorker | null = null;

export function getAgentOrchestrationWorker(): AgentOrchestrationWorker {
  if (!workerInstance) {
    workerInstance = new AgentOrchestrationWorker();
  }
  return workerInstance;
}

export { AgentOrchestrationWorker as default };

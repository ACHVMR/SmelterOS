/**
 * Agent Gateway
 * Single API entry point for all agent interactions
 * Routes requests through Pub/Sub + Firestore for fan-out
 */

import type {
  AgentRole,
  AgentTask,
  AgentTaskPayload,
  AgentSession,
  AgentContext,
  RoutingDecision,
} from './types.js';
import { agentRouter } from './router.js';
import { taskManager } from './task-manager.js';
import { sessionManager } from './session-manager.js';
import { getAgentDefinition } from './registry.js';

/** Gateway request for executing an agent task */
export interface AgentRequest {
  sessionId?: string;
  userId: string;
  conversationId: string;
  intent: string;
  content: string;
  attachments?: any[];
  forceAgent?: AgentRole;
  waitForResult?: boolean;
  metadata?: Record<string, unknown>;
}

/** Gateway response */
export interface AgentResponse {
  success: boolean;
  sessionId: string;
  taskId: string;
  agentRole: AgentRole;
  routingDecision: RoutingDecision;
  result?: any;
  error?: string;
}

/**
 * AgentGateway - Single API entry point for all agent operations
 */
export class AgentGateway {
  private projectId: string;
  private accessToken: string | null = null;

  constructor(projectId: string = 'smelteros') {
    this.projectId = projectId;
  }

  /**
   * Set access token for all operations
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    taskManager.setAccessToken(token);
    sessionManager.setAccessToken(token);
  }

  /**
   * Execute an agent request
   * Main entry point for all agent operations
   */
  async execute(request: AgentRequest): Promise<AgentResponse> {
    // Ensure we have a session
    let session: AgentSession | null = null;
    
    if (request.sessionId) {
      session = await sessionManager.getSession(request.sessionId);
    }
    
    if (!session) {
      session = await sessionManager.createSession({
        userId: request.userId,
      });
    }

    // Initialize session if needed
    if (!session.initialized) {
      await this.initializeSessionContext(session.sessionId);
      session = await sessionManager.getSession(session.sessionId);
    }

    // Build task payload
    const payload: AgentTaskPayload = {
      intent: request.intent,
      content: request.content,
      attachments: request.attachments,
      context: session?.context,
      parameters: request.metadata,
    };

    // Route the request
    let routingDecision: RoutingDecision;
    
    if (request.forceAgent) {
      routingDecision = agentRouter.forceRoute(request.forceAgent);
    } else {
      routingDecision = await agentRouter.route(payload, session?.context);
    }

    // Check if proof gate is required
    if (routingDecision.requiresProofGate) {
      const proofPassed = await this.checkProofGate(session!.sessionId, request.conversationId);
      if (!proofPassed) {
        return {
          success: false,
          sessionId: session!.sessionId,
          taskId: '',
          agentRole: routingDecision.selectedAgent,
          routingDecision,
          error: 'V.I.B.E. proof gate validation required before proceeding',
        };
      }
    }

    // Create the task
    const task = await taskManager.createTask({
      sessionId: session!.sessionId,
      conversationId: request.conversationId,
      payload,
      agentRole: routingDecision.selectedAgent,
      metadata: request.metadata,
    });

    // Add task to session queue
    await sessionManager.enqueueTask(session!.sessionId, task.taskId);
    
    // Activate the agent in session
    await sessionManager.activateAgent(session!.sessionId, routingDecision.selectedAgent);

    // Publish to Pub/Sub for async processing
    await this.publishToOrchestration(task);

    // If waiting for result, poll for completion
    let result: any;
    if (request.waitForResult) {
      result = await this.waitForTaskCompletion(task.taskId, 120000);
    }

    return {
      success: true,
      sessionId: session!.sessionId,
      taskId: task.taskId,
      agentRole: routingDecision.selectedAgent,
      routingDecision,
      result,
    };
  }

  /**
   * Get routing suggestions for a request without executing
   */
  async preview(request: AgentRequest): Promise<RoutingDecision[]> {
    const payload: AgentTaskPayload = {
      intent: request.intent,
      content: request.content,
      attachments: request.attachments,
    };

    return agentRouter.suggest(payload);
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<AgentTask | null> {
    return taskManager.getTask(taskId);
  }

  /**
   * Get session info
   */
  async getSessionInfo(sessionId: string): Promise<AgentSession | null> {
    return sessionManager.getSession(sessionId);
  }

  /**
   * Get all tasks for a session
   */
  async getSessionTasks(sessionId: string): Promise<AgentTask[]> {
    return taskManager.getSessionTasks(sessionId);
  }

  /**
   * Cancel a pending task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = await taskManager.cancelTask(taskId);
    return task !== null;
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<void> {
    await sessionManager.endSession(sessionId);
  }

  /**
   * Initialize session context with three-layer loading
   */
  private async initializeSessionContext(sessionId: string): Promise<void> {
    // Publish to ACHEEVY init worker for full context loading
    await this.publishACHEEVYInit(sessionId);
  }

  /**
   * Check V.I.B.E. proof gate status
   */
  private async checkProofGate(sessionId: string, conversationId: string): Promise<boolean> {
    if (!this.accessToken) {
      return false;
    }

    const baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
    const url = `${baseUrl}:runQuery`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'proof-gates' }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: [
                {
                  fieldFilter: {
                    field: { fieldPath: 'conversationId' },
                    op: 'EQUAL',
                    value: { stringValue: conversationId },
                  },
                },
                {
                  fieldFilter: {
                    field: { fieldPath: 'passed' },
                    op: 'EQUAL',
                    value: { booleanValue: true },
                  },
                },
              ],
            },
          },
          orderBy: [{ field: { fieldPath: 'timestamp' }, direction: 'DESCENDING' }],
          limit: 1,
        },
      }),
    });

    if (!response.ok) {
      return false;
    }

    const results = await response.json() as Array<{ document?: unknown }>;
    return results.some((r) => r.document);
  }

  /**
   * Publish task to agent orchestration topic
   */
  private async publishToOrchestration(task: AgentTask): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const topic = `projects/${this.projectId}/topics/agent-orchestration`;
    const url = `https://pubsub.googleapis.com/v1/${topic}:publish`;

    const message = {
      taskId: task.taskId,
      sessionId: task.sessionId,
      conversationId: task.conversationId,
      agentRole: task.agentRole,
      payload: task.payload,
      priority: task.priority,
      timestamp: new Date().toISOString(),
    };

    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            data: Buffer.from(JSON.stringify(message)).toString('base64'),
            attributes: {
              taskId: task.taskId,
              agentRole: task.agentRole,
              priority: String(task.priority),
            },
          },
        ],
      }),
    });
  }

  /**
   * Publish to ACHEEVY initialization topic
   */
  private async publishACHEEVYInit(sessionId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const topic = `projects/${this.projectId}/topics/acheevy-initialization`;
    const url = `https://pubsub.googleapis.com/v1/${topic}:publish`;

    const message = {
      sessionId,
      timestamp: new Date().toISOString(),
      layers: ['standards', 'product', 'specs'],
    };

    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            data: Buffer.from(JSON.stringify(message)).toString('base64'),
            attributes: {
              sessionId,
              type: 'session-init',
            },
          },
        ],
      }),
    });
  }

  /**
   * Wait for task completion with polling
   */
  private async waitForTaskCompletion(
    taskId: string,
    timeoutMs: number
  ): Promise<any> {
    const startTime = Date.now();
    const pollIntervalMs = 1000;

    while (Date.now() - startTime < timeoutMs) {
      const task = await taskManager.getTask(taskId);
      
      if (task?.status === 'completed' || task?.status === 'failed') {
        return task.result;
      }

      if (task?.status === 'cancelled') {
        return null;
      }

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Task ${taskId} timed out after ${timeoutMs}ms`);
  }
}

// Singleton instance
export const agentGateway = new AgentGateway();

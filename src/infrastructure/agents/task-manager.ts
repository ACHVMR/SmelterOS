/**
 * Task Manager
 * Manages agent task lifecycle, persistence, and delegation
 */

import type {
  AgentTask,
  AgentTaskPayload,
  AgentTaskResult,
  AgentRole,
  DelegationRequest,
  AgentSession,
  AgentContext,
} from './types.js';
import { getAgentDefinition } from './registry.js';
import { agentRouter } from './router.js';

/** Task creation options */
export interface CreateTaskOptions {
  sessionId: string;
  conversationId: string;
  payload: AgentTaskPayload;
  agentRole?: AgentRole;           // If not provided, will be routed
  parentTaskId?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}

/**
 * TaskManager - Handles task lifecycle and Firestore persistence
 */
export class TaskManager {
  private projectId: string;
  private accessToken: string | null = null;
  private baseUrl: string;

  constructor(projectId: string = 'smelteros') {
    this.projectId = projectId;
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  }

  /**
   * Set access token for Firestore operations
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Create a new task
   */
  async createTask(options: CreateTaskOptions): Promise<AgentTask> {
    const taskId = this.generateTaskId();
    
    // Route if no agent specified
    let agentRole = options.agentRole;
    let priority = options.priority ?? 5;

    if (!agentRole) {
      const routingDecision = await agentRouter.route(options.payload);
      agentRole = routingDecision.selectedAgent;
      priority = getAgentDefinition(agentRole).priority;
    }

    const task: AgentTask = {
      taskId,
      sessionId: options.sessionId,
      conversationId: options.conversationId,
      agentRole,
      payload: options.payload,
      priority,
      createdAt: new Date().toISOString(),
      status: 'pending',
      parentTaskId: options.parentTaskId,
      metadata: options.metadata ?? {},
    };

    await this.persistTask(task);
    
    return task;
  }

  /**
   * Update task status to in-progress
   */
  async startTask(taskId: string): Promise<AgentTask | null> {
    const task = await this.getTask(taskId);
    if (!task) return null;

    task.status = 'in-progress';
    task.startedAt = new Date().toISOString();
    
    await this.persistTask(task);
    return task;
  }

  /**
   * Complete a task with result
   */
  async completeTask(taskId: string, result: AgentTaskResult): Promise<AgentTask | null> {
    const task = await this.getTask(taskId);
    if (!task) return null;

    task.status = result.success ? 'completed' : 'failed';
    task.completedAt = new Date().toISOString();
    task.result = result;

    await this.persistTask(task);

    // Handle delegations if any
    if (result.delegateTo && result.delegateTo.length > 0) {
      await this.processDelegations(task, result.delegateTo);
    }

    return task;
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<AgentTask | null> {
    const task = await this.getTask(taskId);
    if (!task) return null;

    task.status = 'cancelled';
    task.completedAt = new Date().toISOString();
    
    await this.persistTask(task);
    return task;
  }

  /**
   * Get a task by ID
   */
  async getTask(taskId: string): Promise<AgentTask | null> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const url = `${this.baseUrl}/agent-tasks/${taskId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get task: ${response.status}`);
    }

    const doc = await response.json() as { fields: Record<string, unknown> };
    return this.documentToTask(doc);
  }

  /**
   * Get tasks for a session
   */
  async getSessionTasks(sessionId: string, status?: AgentTask['status']): Promise<AgentTask[]> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const url = `${this.baseUrl}:runQuery`;
    
    const filters: any[] = [
      {
        fieldFilter: {
          field: { fieldPath: 'sessionId' },
          op: 'EQUAL',
          value: { stringValue: sessionId },
        },
      },
    ];

    if (status) {
      filters.push({
        fieldFilter: {
          field: { fieldPath: 'status' },
          op: 'EQUAL',
          value: { stringValue: status },
        },
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'agent-tasks' }],
          where: filters.length === 1 
            ? filters[0]
            : { compositeFilter: { op: 'AND', filters } },
          orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
          limit: 100,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to query tasks: ${response.status}`);
    }

    const results = await response.json() as Array<{ document?: { fields: Record<string, any> } }>;
    return results
      .filter((r) => r.document)
      .map((r) => this.documentToTask(r.document!));
  }

  /**
   * Get pending tasks for an agent role
   */
  async getPendingTasksForAgent(agentRole: AgentRole, limit: number = 10): Promise<AgentTask[]> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const url = `${this.baseUrl}:runQuery`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'agent-tasks' }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: [
                {
                  fieldFilter: {
                    field: { fieldPath: 'agentRole' },
                    op: 'EQUAL',
                    value: { stringValue: agentRole },
                  },
                },
                {
                  fieldFilter: {
                    field: { fieldPath: 'status' },
                    op: 'EQUAL',
                    value: { stringValue: 'pending' },
                  },
                },
              ],
            },
          },
          orderBy: [
            { field: { fieldPath: 'priority' }, direction: 'DESCENDING' },
            { field: { fieldPath: 'createdAt' }, direction: 'ASCENDING' },
          ],
          limit,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to query tasks: ${response.status}`);
    }

    const results = await response.json() as Array<{ document?: { fields: Record<string, any> } }>;
    return results
      .filter((r) => r.document)
      .map((r) => this.documentToTask(r.document!));
  }

  /**
   * Process delegation requests from a completed task
   */
  private async processDelegations(
    parentTask: AgentTask,
    delegations: DelegationRequest[]
  ): Promise<AgentTask[]> {
    const createdTasks: AgentTask[] = [];

    for (const delegation of delegations) {
      const subtask = await this.createTask({
        sessionId: parentTask.sessionId,
        conversationId: parentTask.conversationId,
        agentRole: delegation.targetRole,
        payload: {
          intent: delegation.intent,
          content: delegation.payload.content ?? '',
          attachments: delegation.payload.attachments,
          context: delegation.payload.context,
          parameters: delegation.payload.parameters,
        },
        parentTaskId: parentTask.taskId,
        priority: delegation.priority,
        metadata: {
          delegatedFrom: parentTask.agentRole,
          waitForResult: delegation.waitForResult,
        },
      });

      createdTasks.push(subtask);

      // Publish to Pub/Sub for async processing
      await this.publishTaskToPubSub(subtask);
    }

    return createdTasks;
  }

  /**
   * Publish task to Pub/Sub for processing
   */
  private async publishTaskToPubSub(task: AgentTask): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const topic = `projects/${this.projectId}/topics/agent-orchestration`;
    const url = `https://pubsub.googleapis.com/v1/${topic}:publish`;

    const message = {
      taskId: task.taskId,
      sessionId: task.sessionId,
      agentRole: task.agentRole,
      payload: task.payload,
      priority: task.priority,
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
   * Persist task to Firestore
   */
  private async persistTask(task: AgentTask): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const url = `${this.baseUrl}/agent-tasks/${task.taskId}`;
    
    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: this.taskToDocument(task),
      }),
    });
  }

  /**
   * Convert task to Firestore document format
   */
  private taskToDocument(task: AgentTask): Record<string, any> {
    return {
      taskId: { stringValue: task.taskId },
      sessionId: { stringValue: task.sessionId },
      conversationId: { stringValue: task.conversationId },
      agentRole: { stringValue: task.agentRole },
      payload: { mapValue: { fields: this.objectToFirestore(task.payload) } },
      priority: { integerValue: String(task.priority) },
      createdAt: { stringValue: task.createdAt },
      startedAt: task.startedAt ? { stringValue: task.startedAt } : { nullValue: null },
      completedAt: task.completedAt ? { stringValue: task.completedAt } : { nullValue: null },
      status: { stringValue: task.status },
      result: task.result 
        ? { mapValue: { fields: this.objectToFirestore(task.result) } }
        : { nullValue: null },
      parentTaskId: task.parentTaskId 
        ? { stringValue: task.parentTaskId }
        : { nullValue: null },
      metadata: { mapValue: { fields: this.objectToFirestore(task.metadata) } },
    };
  }

  /**
   * Convert Firestore document to task
   */
  private documentToTask(doc: { fields: Record<string, any> }): AgentTask {
    const fields = doc.fields;
    const payloadData = this.firestoreToObject(fields.payload?.mapValue?.fields ?? {});
    const resultData = fields.result?.mapValue?.fields 
      ? this.firestoreToObject(fields.result.mapValue.fields)
      : undefined;
    
    return {
      taskId: fields.taskId?.stringValue ?? '',
      sessionId: fields.sessionId?.stringValue ?? '',
      conversationId: fields.conversationId?.stringValue ?? '',
      agentRole: fields.agentRole?.stringValue as AgentRole,
      payload: {
        intent: payloadData.intent as string ?? '',
        content: payloadData.content as string ?? '',
        attachments: payloadData.attachments as any[],
        context: payloadData.context as any,
        parameters: payloadData.parameters as Record<string, unknown>,
      },
      priority: parseInt(fields.priority?.integerValue ?? '5'),
      createdAt: fields.createdAt?.stringValue ?? '',
      startedAt: fields.startedAt?.stringValue,
      completedAt: fields.completedAt?.stringValue,
      status: fields.status?.stringValue as AgentTask['status'],
      result: resultData ? {
        success: resultData.success as boolean ?? false,
        output: resultData.output as string,
        structuredData: resultData.structuredData as Record<string, unknown>,
        artifacts: resultData.artifacts as any[],
        nextActions: resultData.nextActions as any[],
        delegateTo: resultData.delegateTo as any[],
        error: resultData.error as any,
        metrics: resultData.metrics as any ?? { executionTimeMs: 0, apiCalls: 0, firestoreReads: 0, firestoreWrites: 0, gcsOperations: 0 },
      } : undefined,
      parentTaskId: fields.parentTaskId?.stringValue,
      metadata: this.firestoreToObject(fields.metadata?.mapValue?.fields ?? {}),
    };
  }

  /**
   * Convert object to Firestore format
   */
  private objectToFirestore(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        result[key] = { nullValue: null };
      } else if (typeof value === 'string') {
        result[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        result[key] = Number.isInteger(value) 
          ? { integerValue: String(value) }
          : { doubleValue: value };
      } else if (typeof value === 'boolean') {
        result[key] = { booleanValue: value };
      } else if (Array.isArray(value)) {
        result[key] = {
          arrayValue: {
            values: value.map(v => this.valueToFirestore(v)),
          },
        };
      } else if (typeof value === 'object') {
        result[key] = {
          mapValue: { fields: this.objectToFirestore(value) },
        };
      }
    }
    return result;
  }

  /**
   * Convert value to Firestore format
   */
  private valueToFirestore(value: any): any {
    if (value === null || value === undefined) {
      return { nullValue: null };
    } else if (typeof value === 'string') {
      return { stringValue: value };
    } else if (typeof value === 'number') {
      return Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    } else if (typeof value === 'boolean') {
      return { booleanValue: value };
    } else if (Array.isArray(value)) {
      return { arrayValue: { values: value.map(v => this.valueToFirestore(v)) } };
    } else if (typeof value === 'object') {
      return { mapValue: { fields: this.objectToFirestore(value) } };
    }
    return { stringValue: String(value) };
  }

  /**
   * Convert Firestore format to object
   */
  private firestoreToObject(fields: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(fields)) {
      result[key] = this.firestoreToValue(value);
    }
    return result;
  }

  /**
   * Convert Firestore value to JS value
   */
  private firestoreToValue(value: any): any {
    if (value.nullValue !== undefined) return null;
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.integerValue !== undefined) return parseInt(value.integerValue);
    if (value.doubleValue !== undefined) return value.doubleValue;
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.arrayValue) {
      return (value.arrayValue.values ?? []).map((v: any) => this.firestoreToValue(v));
    }
    if (value.mapValue) {
      return this.firestoreToObject(value.mapValue.fields ?? {});
    }
    return null;
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `task-${timestamp}-${random}`;
  }
}

// Singleton instance
export const taskManager = new TaskManager();

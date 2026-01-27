/**
 * Session Manager
 * Manages agent sessions with context loading and lifecycle
 */

import type {
  AgentSession,
  AgentContext,
  AgentRole,
  SessionMetrics,
} from './types.js';

/** Session creation options */
export interface CreateSessionOptions {
  userId: string;
  initialContext?: Partial<AgentContext>;
  expirationHours?: number;
}

/**
 * SessionManager - Handles session lifecycle and context management
 */
export class SessionManager {
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
   * Create a new agent session
   */
  async createSession(options: CreateSessionOptions): Promise<AgentSession> {
    const sessionId = this.generateSessionId();
    const expirationHours = options.expirationHours ?? 24;

    const session: AgentSession = {
      sessionId,
      userId: options.userId,
      initialized: false,
      context: options.initialContext ?? {},
      activeAgents: [],
      taskQueue: [],
      completedTasks: [],
      metrics: this.createInitialMetrics(),
      expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString(),
    };

    await this.persistSession(session);
    
    return session;
  }

  /**
   * Initialize session with full context
   */
  async initializeSession(
    sessionId: string,
    context: AgentContext
  ): Promise<AgentSession | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    session.initialized = true;
    session.initializedAt = new Date().toISOString();
    session.context = {
      ...session.context,
      ...context,
    };

    await this.persistSession(session);
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<AgentSession | null> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const url = `${this.baseUrl}/sessions/${sessionId}`;
    
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
      throw new Error(`Failed to get session: ${response.status}`);
    }

    const doc = await response.json();
    return this.documentToSession(doc);
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string): Promise<AgentSession[]> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const url = `${this.baseUrl}:runQuery`;
    const now = new Date().toISOString();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'sessions' }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: [
                {
                  fieldFilter: {
                    field: { fieldPath: 'userId' },
                    op: 'EQUAL',
                    value: { stringValue: userId },
                  },
                },
                {
                  fieldFilter: {
                    field: { fieldPath: 'expiresAt' },
                    op: 'GREATER_THAN',
                    value: { stringValue: now },
                  },
                },
              ],
            },
          },
          orderBy: [{ field: { fieldPath: 'initializedAt' }, direction: 'DESCENDING' }],
          limit: 10,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to query sessions: ${response.status}`);
    }

    const results = await response.json() as Array<{ document?: { fields: Record<string, any> } }>;
    return results
      .filter((r) => r.document)
      .map((r) => this.documentToSession(r.document!));
  }

  /**
   * Add an agent to the active list
   */
  async activateAgent(sessionId: string, agentRole: AgentRole): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    if (!session.activeAgents.includes(agentRole)) {
      session.activeAgents.push(agentRole);
      await this.persistSession(session);
    }
  }

  /**
   * Remove an agent from the active list
   */
  async deactivateAgent(sessionId: string, agentRole: AgentRole): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    session.activeAgents = session.activeAgents.filter(r => r !== agentRole);
    await this.persistSession(session);
  }

  /**
   * Add task to queue
   */
  async enqueueTask(sessionId: string, taskId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    session.taskQueue.push(taskId);
    session.metrics.totalTasks++;
    await this.persistSession(session);
  }

  /**
   * Mark task as completed
   */
  async completeTask(
    sessionId: string,
    taskId: string,
    success: boolean,
    agentRole: AgentRole,
    executionTimeMs: number,
    tokensUsed: number = 0
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    // Move from queue to completed
    session.taskQueue = session.taskQueue.filter(id => id !== taskId);
    session.completedTasks.push(taskId);

    // Update metrics
    if (success) {
      session.metrics.completedTasks++;
    } else {
      session.metrics.failedTasks++;
    }
    session.metrics.totalExecutionTimeMs += executionTimeMs;
    session.metrics.totalTokensUsed += tokensUsed;
    session.metrics.agentUsage[agentRole] = 
      (session.metrics.agentUsage[agentRole] ?? 0) + 1;

    await this.persistSession(session);
  }

  /**
   * Update session context
   */
  async updateContext(
    sessionId: string,
    contextUpdate: Partial<AgentContext>
  ): Promise<AgentSession | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    session.context = {
      ...session.context,
      ...contextUpdate,
    };

    await this.persistSession(session);
    return session;
  }

  /**
   * Extend session expiration
   */
  async extendSession(sessionId: string, additionalHours: number = 24): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    const currentExpiration = new Date(session.expiresAt);
    session.expiresAt = new Date(
      currentExpiration.getTime() + additionalHours * 60 * 60 * 1000
    ).toISOString();

    await this.persistSession(session);
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    session.expiresAt = new Date().toISOString();
    session.activeAgents = [];
    
    await this.persistSession(session);
  }

  /**
   * Create initial metrics object
   */
  private createInitialMetrics(): SessionMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalExecutionTimeMs: 0,
      totalTokensUsed: 0,
      agentUsage: {} as Record<AgentRole, number>,
    };
  }

  /**
   * Persist session to Firestore
   */
  private async persistSession(session: AgentSession): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const url = `${this.baseUrl}/sessions/${session.sessionId}`;
    
    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: this.sessionToDocument(session),
      }),
    });
  }

  /**
   * Convert session to Firestore document format
   */
  private sessionToDocument(session: AgentSession): Record<string, any> {
    return {
      sessionId: { stringValue: session.sessionId },
      userId: { stringValue: session.userId },
      initialized: { booleanValue: session.initialized },
      initializedAt: session.initializedAt 
        ? { stringValue: session.initializedAt }
        : { nullValue: null },
      context: { mapValue: { fields: this.objectToFirestore(session.context) } },
      activeAgents: {
        arrayValue: {
          values: session.activeAgents.map(r => ({ stringValue: r })),
        },
      },
      taskQueue: {
        arrayValue: {
          values: session.taskQueue.map(id => ({ stringValue: id })),
        },
      },
      completedTasks: {
        arrayValue: {
          values: session.completedTasks.map(id => ({ stringValue: id })),
        },
      },
      metrics: { mapValue: { fields: this.metricsToFirestore(session.metrics) } },
      expiresAt: { stringValue: session.expiresAt },
    };
  }

  /**
   * Convert metrics to Firestore format
   */
  private metricsToFirestore(metrics: SessionMetrics): Record<string, any> {
    return {
      totalTasks: { integerValue: String(metrics.totalTasks) },
      completedTasks: { integerValue: String(metrics.completedTasks) },
      failedTasks: { integerValue: String(metrics.failedTasks) },
      totalExecutionTimeMs: { integerValue: String(metrics.totalExecutionTimeMs) },
      totalTokensUsed: { integerValue: String(metrics.totalTokensUsed) },
      agentUsage: {
        mapValue: {
          fields: Object.fromEntries(
            Object.entries(metrics.agentUsage).map(([k, v]) => [
              k,
              { integerValue: String(v) },
            ])
          ),
        },
      },
    };
  }

  /**
   * Convert Firestore document to session
   */
  private documentToSession(doc: any): AgentSession {
    const fields = doc.fields;
    return {
      sessionId: fields.sessionId?.stringValue ?? '',
      userId: fields.userId?.stringValue ?? '',
      initialized: fields.initialized?.booleanValue ?? false,
      initializedAt: fields.initializedAt?.stringValue,
      context: this.firestoreToObject(fields.context?.mapValue?.fields ?? {}),
      activeAgents: (fields.activeAgents?.arrayValue?.values ?? [])
        .map((v: any) => v.stringValue) as AgentRole[],
      taskQueue: (fields.taskQueue?.arrayValue?.values ?? [])
        .map((v: any) => v.stringValue),
      completedTasks: (fields.completedTasks?.arrayValue?.values ?? [])
        .map((v: any) => v.stringValue),
      metrics: this.firestoreToMetrics(fields.metrics?.mapValue?.fields ?? {}),
      expiresAt: fields.expiresAt?.stringValue ?? '',
    };
  }

  /**
   * Convert Firestore to metrics
   */
  private firestoreToMetrics(fields: Record<string, any>): SessionMetrics {
    return {
      totalTasks: parseInt(fields.totalTasks?.integerValue ?? '0'),
      completedTasks: parseInt(fields.completedTasks?.integerValue ?? '0'),
      failedTasks: parseInt(fields.failedTasks?.integerValue ?? '0'),
      totalExecutionTimeMs: parseInt(fields.totalExecutionTimeMs?.integerValue ?? '0'),
      totalTokensUsed: parseInt(fields.totalTokensUsed?.integerValue ?? '0'),
      agentUsage: Object.fromEntries(
        Object.entries(fields.agentUsage?.mapValue?.fields ?? {}).map(
          ([k, v]: [string, any]) => [k, parseInt(v.integerValue ?? '0')]
        )
      ) as Record<AgentRole, number>,
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
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `session-${timestamp}-${random}`;
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

/**
 * SmelterOS Repository Layer
 * Generic CRUD operations with <50ms latency optimization
 */

import {
  UserDocument,
  OrganizationDocument,
  ProjectDocument,
  TaskDocument,
  CircuitStateDocument,
  AuditLogDocument,
  FirestoreTimestamp,
} from './schema';
import { 
  getFirestoreClient, 
  QueryFilter,
  QueryOrder 
} from './firestore-client';

// =============================================================================
// BASE REPOSITORY
// =============================================================================

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

export abstract class BaseRepository<T extends { id: string }> {
  protected collectionName: string;
  protected cache: Map<string, { data: T; expires: number }> = new Map();
  protected cacheTtlMs: number = 30000; // 30s default

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Get by ID with caching for <50ms latency
   */
  async getById(id: string): Promise<T | null> {
    // Check cache first
    const cached = this.cache.get(id);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Fetch from database (would use Firestore SDK in production)
    const data = await this.fetchFromDatabase(id);
    
    if (data) {
      this.cache.set(id, { data, expires: Date.now() + this.cacheTtlMs });
    }
    
    return data;
  }

  /**
   * Create new document
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = this.generateId();
    const document = {
      ...data,
      id,
      createdAt: this.timestamp(),
      updatedAt: this.timestamp(),
    } as unknown as T;

    await this.writeToDatabase(document);
    this.cache.set(id, { data: document, expires: Date.now() + this.cacheTtlMs });
    
    return document;
  }

  /**
   * Update existing document
   */
  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: this.timestamp(),
    } as T;

    await this.writeToDatabase(updated);
    this.cache.set(id, { data: updated, expires: Date.now() + this.cacheTtlMs });
    
    return updated;
  }

  /**
   * Delete document
   */
  async delete(id: string): Promise<boolean> {
    const success = await this.deleteFromDatabase(id);
    if (success) {
      this.cache.delete(id);
    }
    return success;
  }

  /**
   * Query with filters
   */
  async query(
    filters: Partial<T>,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    // Would implement Firestore query in production
    return this.queryDatabase(filters, options);
  }

  /**
   * Clear cache (useful after bulk operations)
   */
  clearCache(): void {
    this.cache.clear();
  }

  // Abstract methods to be implemented by specific repositories
  protected abstract fetchFromDatabase(id: string): Promise<T | null>;
  protected abstract writeToDatabase(data: T): Promise<void>;
  protected abstract deleteFromDatabase(id: string): Promise<boolean>;
  protected abstract queryDatabase(
    filters: Partial<T>,
    options: QueryOptions
  ): Promise<QueryResult<T>>;

  // Helpers
  protected generateId(): string {
    return `${this.collectionName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected timestamp(): FirestoreTimestamp {
    const now = Date.now();
    return {
      seconds: Math.floor(now / 1000),
      nanoseconds: (now % 1000) * 1000000,
    };
  }
}

// =============================================================================
// USER REPOSITORY
// =============================================================================

export class UserRepository extends BaseRepository<UserDocument> {
  constructor() {
    super('users');
    this.cacheTtlMs = 60000; // 1 minute for users
  }

  async getByEmail(email: string): Promise<UserDocument | null> {
    const result = await this.query({ email } as Partial<UserDocument>, { limit: 1 });
    return result.data[0] || null;
  }

  async getByOrganization(
    organizationId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<UserDocument>> {
    return this.query({ organizationId } as Partial<UserDocument>, options);
  }

  async updateLastActive(userId: string): Promise<void> {
    await this.update(userId, { lastActiveAt: this.timestamp() } as Partial<UserDocument>);
  }

  // Database implementations - PRODUCTION Firestore REST API
  protected async fetchFromDatabase(id: string): Promise<UserDocument | null> {
    return getFirestoreClient().getDocument<UserDocument>(this.collectionName, id);
  }

  protected async writeToDatabase(data: UserDocument): Promise<void> {
    await getFirestoreClient().setDocument(this.collectionName, data.id, data);
  }

  protected async deleteFromDatabase(id: string): Promise<boolean> {
    return getFirestoreClient().deleteDocument(this.collectionName, id);
  }

  protected async queryDatabase(
    filters: Partial<UserDocument>,
    options: QueryOptions
  ): Promise<QueryResult<UserDocument>> {
    const queryFilters: QueryFilter[] = Object.entries(filters)
      .filter(([_, v]) => v !== undefined)
      .map(([field, value]) => ({
        field,
        op: 'EQUAL' as const,
        value,
      }));
    
    const orderBy: QueryOrder[] = options.orderBy 
      ? [{ field: options.orderBy, direction: options.orderDirection === 'desc' ? 'DESCENDING' as const : 'ASCENDING' as const }]
      : [];

    return getFirestoreClient().query<UserDocument>(this.collectionName, {
      filters: queryFilters,
      orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }
}

// =============================================================================
// ORGANIZATION REPOSITORY
// =============================================================================

export class OrganizationRepository extends BaseRepository<OrganizationDocument> {
  constructor() {
    super('organizations');
    this.cacheTtlMs = 300000; // 5 minutes for orgs
  }

  async getBySlug(slug: string): Promise<OrganizationDocument | null> {
    const result = await this.query({ slug } as Partial<OrganizationDocument>, { limit: 1 });
    return result.data[0] || null;
  }

  async getByStripeCustomerId(customerId: string): Promise<OrganizationDocument | null> {
    const result = await this.query(
      { stripeCustomerId: customerId } as Partial<OrganizationDocument>,
      { limit: 1 }
    );
    return result.data[0] || null;
  }

  protected async fetchFromDatabase(id: string): Promise<OrganizationDocument | null> {
    return getFirestoreClient().getDocument<OrganizationDocument>(this.collectionName, id);
  }

  protected async writeToDatabase(data: OrganizationDocument): Promise<void> {
    await getFirestoreClient().setDocument(this.collectionName, data.id, data);
  }

  protected async deleteFromDatabase(id: string): Promise<boolean> {
    return getFirestoreClient().deleteDocument(this.collectionName, id);
  }

  protected async queryDatabase(
    filters: Partial<OrganizationDocument>,
    options: QueryOptions
  ): Promise<QueryResult<OrganizationDocument>> {
    const queryFilters: QueryFilter[] = Object.entries(filters)
      .filter(([_, v]) => v !== undefined)
      .map(([field, value]) => ({
        field,
        op: 'EQUAL' as const,
        value,
      }));
    
    const orderBy: QueryOrder[] = options.orderBy 
      ? [{ field: options.orderBy, direction: options.orderDirection === 'desc' ? 'DESCENDING' as const : 'ASCENDING' as const }]
      : [];

    return getFirestoreClient().query<OrganizationDocument>(this.collectionName, {
      filters: queryFilters,
      orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }
}

// =============================================================================
// PROJECT REPOSITORY
// =============================================================================

export class ProjectRepository extends BaseRepository<ProjectDocument> {
  constructor() {
    super('projects');
    this.cacheTtlMs = 60000; // 1 minute
  }

  async getByOrganization(
    organizationId: string,
    status?: 'active' | 'paused' | 'archived'
  ): Promise<QueryResult<ProjectDocument>> {
    const filters: Partial<ProjectDocument> = { organizationId };
    if (status) filters.status = status;
    return this.query(filters, { orderBy: 'updatedAt', orderDirection: 'desc' });
  }

  protected async fetchFromDatabase(id: string): Promise<ProjectDocument | null> {
    return getFirestoreClient().getDocument<ProjectDocument>(this.collectionName, id);
  }

  protected async writeToDatabase(data: ProjectDocument): Promise<void> {
    await getFirestoreClient().setDocument(this.collectionName, data.id, data);
  }

  protected async deleteFromDatabase(id: string): Promise<boolean> {
    return getFirestoreClient().deleteDocument(this.collectionName, id);
  }

  protected async queryDatabase(
    filters: Partial<ProjectDocument>,
    options: QueryOptions
  ): Promise<QueryResult<ProjectDocument>> {
    const queryFilters: QueryFilter[] = Object.entries(filters)
      .filter(([_, v]) => v !== undefined)
      .map(([field, value]) => ({
        field,
        op: 'EQUAL' as const,
        value,
      }));
    
    const orderBy: QueryOrder[] = options.orderBy 
      ? [{ field: options.orderBy, direction: options.orderDirection === 'desc' ? 'DESCENDING' as const : 'ASCENDING' as const }]
      : [];

    return getFirestoreClient().query<ProjectDocument>(this.collectionName, {
      filters: queryFilters,
      orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }
}

// =============================================================================
// TASK REPOSITORY
// =============================================================================

export class TaskRepository extends BaseRepository<TaskDocument> {
  constructor() {
    super('tasks');
    this.cacheTtlMs = 15000; // 15 seconds for tasks (more dynamic)
  }

  async getPending(projectId: string): Promise<TaskDocument[]> {
    const result = await this.query(
      { projectId, status: 'pending' } as Partial<TaskDocument>,
      { orderBy: 'priority', orderDirection: 'desc', limit: 50 }
    );
    return result.data;
  }

  async getByStatus(
    projectId: string,
    status: TaskDocument['status']
  ): Promise<TaskDocument[]> {
    const result = await this.query(
      { projectId, status } as Partial<TaskDocument>,
      { orderBy: 'createdAt', orderDirection: 'desc', limit: 100 }
    );
    return result.data;
  }

  async markStarted(taskId: string, specialistId: string): Promise<TaskDocument | null> {
    return this.update(taskId, {
      status: 'in_progress',
      assignedSpecialist: specialistId,
      startedAt: this.timestamp(),
    } as Partial<TaskDocument>);
  }

  async markCompleted(
    taskId: string,
    result: TaskDocument['result'],
    metrics: TaskDocument['metrics']
  ): Promise<TaskDocument | null> {
    return this.update(taskId, {
      status: result?.success ? 'completed' : 'failed',
      result,
      metrics,
      completedAt: this.timestamp(),
    } as Partial<TaskDocument>);
  }

  protected async fetchFromDatabase(id: string): Promise<TaskDocument | null> {
    return getFirestoreClient().getDocument<TaskDocument>(this.collectionName, id);
  }

  protected async writeToDatabase(data: TaskDocument): Promise<void> {
    await getFirestoreClient().setDocument(this.collectionName, data.id, data);
  }

  protected async deleteFromDatabase(id: string): Promise<boolean> {
    return getFirestoreClient().deleteDocument(this.collectionName, id);
  }

  protected async queryDatabase(
    filters: Partial<TaskDocument>,
    options: QueryOptions
  ): Promise<QueryResult<TaskDocument>> {
    const queryFilters: QueryFilter[] = Object.entries(filters)
      .filter(([_, v]) => v !== undefined)
      .map(([field, value]) => ({
        field,
        op: 'EQUAL' as const,
        value,
      }));
    
    const orderBy: QueryOrder[] = options.orderBy 
      ? [{ field: options.orderBy, direction: options.orderDirection === 'desc' ? 'DESCENDING' as const : 'ASCENDING' as const }]
      : [];

    return getFirestoreClient().query<TaskDocument>(this.collectionName, {
      filters: queryFilters,
      orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }
}

// =============================================================================
// CIRCUIT STATE REPOSITORY
// =============================================================================

export class CircuitStateRepository extends BaseRepository<CircuitStateDocument> {
  constructor() {
    super('circuitStates');
    this.cacheTtlMs = 5000; // 5 seconds - needs to be fresh for breaker logic
  }

  async getForPanel(panelId: string): Promise<CircuitStateDocument[]> {
    const result = await this.query(
      { panelId } as Partial<CircuitStateDocument>,
      { limit: 100 }
    );
    return result.data;
  }

  async recordError(panelId: string, circuitId: string): Promise<CircuitStateDocument | null> {
    const id = `${panelId}:${circuitId}`;
    const state = await this.getById(id);
    
    if (state) {
      const newErrorCount = state.errorCount + 1;
      const shouldTrip = newErrorCount >= 5;
      
      return this.update(id, {
        errorCount: newErrorCount,
        lastErrorAt: this.timestamp(),
        state: shouldTrip ? 'tripped' : state.state,
        lastTripAt: shouldTrip ? this.timestamp() : state.lastTripAt,
        tripCount: shouldTrip ? state.tripCount + 1 : state.tripCount,
      } as Partial<CircuitStateDocument>);
    }
    
    return null;
  }

  async resetCircuit(panelId: string, circuitId: string): Promise<CircuitStateDocument | null> {
    const id = `${panelId}:${circuitId}`;
    return this.update(id, {
      state: 'on',
      errorCount: 0,
      lastResetAt: this.timestamp(),
    } as Partial<CircuitStateDocument>);
  }

  async recordLatency(
    panelId: string,
    circuitId: string,
    latencyMs: number,
    success: boolean
  ): Promise<void> {
    const id = `${panelId}:${circuitId}`;
    const state = await this.getById(id);
    
    if (state) {
      // Simple moving average for latency tracking
      await this.update(id, {
        latencyP50Ms: Math.round((state.latencyP50Ms + latencyMs) / 2),
        successCount: success ? state.successCount + 1 : state.successCount,
      } as Partial<CircuitStateDocument>);
    }
  }

  protected async fetchFromDatabase(id: string): Promise<CircuitStateDocument | null> {
    return getFirestoreClient().getDocument<CircuitStateDocument>(this.collectionName, id);
  }

  protected async writeToDatabase(data: CircuitStateDocument): Promise<void> {
    await getFirestoreClient().setDocument(this.collectionName, data.id, data);
  }

  protected async deleteFromDatabase(id: string): Promise<boolean> {
    return getFirestoreClient().deleteDocument(this.collectionName, id);
  }

  protected async queryDatabase(
    filters: Partial<CircuitStateDocument>,
    options: QueryOptions
  ): Promise<QueryResult<CircuitStateDocument>> {
    const queryFilters: QueryFilter[] = Object.entries(filters)
      .filter(([_, v]) => v !== undefined)
      .map(([field, value]) => ({
        field,
        op: 'EQUAL' as const,
        value,
      }));
    
    const orderBy: QueryOrder[] = options.orderBy 
      ? [{ field: options.orderBy, direction: options.orderDirection === 'desc' ? 'DESCENDING' as const : 'ASCENDING' as const }]
      : [];

    return getFirestoreClient().query<CircuitStateDocument>(this.collectionName, {
      filters: queryFilters,
      orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }
}

// =============================================================================
// AUDIT LOG REPOSITORY
// =============================================================================

export class AuditLogRepository extends BaseRepository<AuditLogDocument> {
  constructor() {
    super('auditLogs');
    this.cacheTtlMs = 0; // No caching for audit logs
  }

  async log(
    organizationId: string,
    userId: string,
    action: AuditLogDocument['action'],
    target: AuditLogDocument['target'],
    details: Record<string, unknown>,
    ipAddress: string,
    userAgent: string,
    severity: AuditLogDocument['severity'] = 'info'
  ): Promise<AuditLogDocument> {
    return this.create({
      organizationId,
      userId,
      action,
      target,
      details,
      ipAddress,
      userAgent,
      timestamp: this.timestamp(),
      severity,
    } as Omit<AuditLogDocument, 'id'>);
  }

  async getRecentForOrg(
    organizationId: string,
    limit: number = 100
  ): Promise<AuditLogDocument[]> {
    const result = await this.query(
      { organizationId } as Partial<AuditLogDocument>,
      { orderBy: 'timestamp', orderDirection: 'desc', limit }
    );
    return result.data;
  }

  async getCritical(organizationId: string): Promise<AuditLogDocument[]> {
    const result = await this.query(
      { organizationId, severity: 'critical' } as Partial<AuditLogDocument>,
      { orderBy: 'timestamp', orderDirection: 'desc', limit: 50 }
    );
    return result.data;
  }

  protected async fetchFromDatabase(id: string): Promise<AuditLogDocument | null> {
    return getFirestoreClient().getDocument<AuditLogDocument>(this.collectionName, id);
  }

  protected async writeToDatabase(data: AuditLogDocument): Promise<void> {
    await getFirestoreClient().setDocument(this.collectionName, data.id, data);
  }

  protected async deleteFromDatabase(_id: string): Promise<boolean> {
    // Audit logs should never be deleted - security requirement
    console.warn('[AuditLogRepository] Attempted to delete audit log - denied');
    return false;
  }

  protected async queryDatabase(
    filters: Partial<AuditLogDocument>,
    options: QueryOptions
  ): Promise<QueryResult<AuditLogDocument>> {
    const queryFilters: QueryFilter[] = Object.entries(filters)
      .filter(([_, v]) => v !== undefined)
      .map(([field, value]) => ({
        field,
        op: 'EQUAL' as const,
        value,
      }));
    
    const orderBy: QueryOrder[] = options.orderBy 
      ? [{ field: options.orderBy, direction: options.orderDirection === 'desc' ? 'DESCENDING' as const : 'ASCENDING' as const }]
      : [];

    return getFirestoreClient().query<AuditLogDocument>(this.collectionName, {
      filters: queryFilters,
      orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }
}

// =============================================================================
// REPOSITORY FACTORY
// =============================================================================

export class RepositoryFactory {
  private static instance: RepositoryFactory;
  
  private users: UserRepository | null = null;
  private organizations: OrganizationRepository | null = null;
  private projects: ProjectRepository | null = null;
  private tasks: TaskRepository | null = null;
  private circuitStates: CircuitStateRepository | null = null;
  private auditLogs: AuditLogRepository | null = null;

  static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  getUsers(): UserRepository {
    if (!this.users) {
      this.users = new UserRepository();
    }
    return this.users;
  }

  getOrganizations(): OrganizationRepository {
    if (!this.organizations) {
      this.organizations = new OrganizationRepository();
    }
    return this.organizations;
  }

  getProjects(): ProjectRepository {
    if (!this.projects) {
      this.projects = new ProjectRepository();
    }
    return this.projects;
  }

  getTasks(): TaskRepository {
    if (!this.tasks) {
      this.tasks = new TaskRepository();
    }
    return this.tasks;
  }

  getCircuitStates(): CircuitStateRepository {
    if (!this.circuitStates) {
      this.circuitStates = new CircuitStateRepository();
    }
    return this.circuitStates;
  }

  getAuditLogs(): AuditLogRepository {
    if (!this.auditLogs) {
      this.auditLogs = new AuditLogRepository();
    }
    return this.auditLogs;
  }

  /**
   * Clear all repository caches
   */
  clearAllCaches(): void {
    this.users?.clearCache();
    this.organizations?.clearCache();
    this.projects?.clearCache();
    this.tasks?.clearCache();
    this.circuitStates?.clearCache();
    // Audit logs have no cache
  }
}

// Export singleton
export const repositories = RepositoryFactory.getInstance();

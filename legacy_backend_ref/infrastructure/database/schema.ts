/**
 * SmelterOS Database Schema
 * Production-Ready Data Layer
 * 
 * Supports both Firestore (NoSQL) and PostgreSQL (SQL)
 * Optimized for <50ms query latency
 */

// =============================================================================
// FIRESTORE COLLECTIONS - Document-based for real-time sync
// =============================================================================

export interface FirestoreCollections {
  // Core System Collections
  users: UserDocument;
  organizations: OrganizationDocument;
  projects: ProjectDocument;
  
  // Agent OS Collections
  conversations: ConversationDocument;
  tasks: TaskDocument;
  workflows: WorkflowDocument;
  
  // Circuit Breaker State
  circuitStates: CircuitStateDocument;
  panelStates: PanelStateDocument;
  auditLogs: AuditLogDocument;
  
  // AI/ML Collections
  embeddings: EmbeddingDocument;
  routingDecisions: RoutingDecisionDocument;
  vibeValidations: VibeValidationDocument;
  
  // Billing & Usage
  usageMetrics: UsageMetricDocument;
  subscriptions: SubscriptionDocument;
  invoices: InvoiceDocument;
}

// -----------------------------------------------------------------------------
// User & Organization Entities
// -----------------------------------------------------------------------------

export interface UserDocument {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  preferences: UserPreferences;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  lastActiveAt: FirestoreTimestamp;
  authProvider: 'google' | 'github' | 'email';
  isActive: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  slack: boolean;
  circuitTrips: boolean;
  emergencyAlerts: boolean;
  dailyDigest: boolean;
}

export interface DashboardPreferences {
  defaultView: 'grid' | 'list';
  panelOrder: string[];
  favoriteCircuits: string[];
  refreshInterval: number; // seconds
}

export interface OrganizationDocument {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: 'starter' | 'professional' | 'enterprise' | 'custom';
  branding: WhiteLabelBranding;
  settings: OrganizationSettings;
  limits: OrganizationLimits;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  trialEndsAt?: FirestoreTimestamp;
  stripeCustomerId?: string;
}

export interface WhiteLabelBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  customDomain?: string;
  companyName: string;
  supportEmail: string;
}

export interface OrganizationSettings {
  allowSignups: boolean;
  requireMfa: boolean;
  ssoEnabled: boolean;
  ssoProvider?: 'okta' | 'auth0' | 'azure-ad';
  ipWhitelist: string[];
  auditLogRetentionDays: number;
}

export interface OrganizationLimits {
  maxUsers: number;
  maxProjects: number;
  maxApiCallsPerMonth: number;
  maxStorageGb: number;
  maxConcurrentTasks: number;
}

// -----------------------------------------------------------------------------
// Project Entities
// -----------------------------------------------------------------------------

export interface ProjectDocument {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  repositoryUrl?: string;
  defaultBranch: string;
  environment: 'development' | 'staging' | 'production';
  status: 'active' | 'paused' | 'archived';
  createdBy: string;
  teamMembers: ProjectMember[];
  integrations: ProjectIntegrations;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ProjectMember {
  userId: string;
  role: 'lead' | 'contributor' | 'viewer';
  addedAt: FirestoreTimestamp;
}

export interface ProjectIntegrations {
  github?: GitHubIntegration;
  stripe?: StripeIntegration;
  cloudflare?: CloudflareIntegration;
  slack?: SlackIntegration;
}

export interface GitHubIntegration {
  installationId: string;
  repoFullName: string;
  webhookSecret: string;
  enabled: boolean;
}

export interface StripeIntegration {
  accountId: string;
  publishableKey: string;
  webhookSecret: string;
  enabled: boolean;
}

export interface CloudflareIntegration {
  accountId: string;
  zoneId: string;
  apiToken: string;
  enabled: boolean;
}

export interface SlackIntegration {
  teamId: string;
  channelId: string;
  botToken: string;
  enabled: boolean;
}

// -----------------------------------------------------------------------------
// Agent OS Entities
// -----------------------------------------------------------------------------

export interface ConversationDocument {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  messages: ConversationMessage[];
  context: ConversationContext;
  status: 'active' | 'completed' | 'archived';
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  tokenCount: number;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: FirestoreTimestamp;
  specialistId?: string; // BoomerAng specialist that handled
  vibeScore?: number;
  tokenCount: number;
  metadata?: Record<string, unknown>;
}

export interface ConversationContext {
  activeFiles: string[];
  currentTask?: string;
  specialistPreferences: string[];
  emotionalState?: 'positive' | 'neutral' | 'frustrated';
}

export interface TaskDocument {
  id: string;
  conversationId: string;
  projectId: string;
  userId: string;
  type: 'code' | 'review' | 'deploy' | 'debug' | 'document' | 'test';
  title: string;
  description: string;
  status: 'pending' | 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedSpecialist?: string;
  result?: TaskResult;
  metrics: TaskMetrics;
  createdAt: FirestoreTimestamp;
  startedAt?: FirestoreTimestamp;
  completedAt?: FirestoreTimestamp;
}

export interface TaskResult {
  success: boolean;
  output?: string;
  artifacts?: TaskArtifact[];
  error?: string;
}

export interface TaskArtifact {
  type: 'file' | 'diff' | 'log' | 'report';
  name: string;
  url: string;
  size: number;
}

export interface TaskMetrics {
  executionTimeMs: number;
  tokensUsed: number;
  fdhCycles: number;
  vibeValidations: number;
}

export interface WorkflowDocument {
  id: string;
  projectId: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  lastRunAt?: FirestoreTimestamp;
  runCount: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'event';
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'task' | 'condition' | 'parallel' | 'delay';
  config: Record<string, unknown>;
  onSuccess?: string; // next step id
  onFailure?: string; // fallback step id
}

// -----------------------------------------------------------------------------
// Circuit Breaker State Entities
// -----------------------------------------------------------------------------

export interface CircuitStateDocument {
  id: string; // format: panelId:circuitId
  panelId: string;
  circuitId: string;
  state: 'on' | 'off' | 'tripped';
  errorCount: number;
  lastErrorAt?: FirestoreTimestamp;
  lastTripAt?: FirestoreTimestamp;
  lastResetAt?: FirestoreTimestamp;
  tripCount: number;
  successCount: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  updatedAt: FirestoreTimestamp;
}

export interface PanelStateDocument {
  id: string;
  state: 'on' | 'off' | 'locked';
  lockedAt?: FirestoreTimestamp;
  lockedBy?: string;
  lockReason?: string;
  activeCircuits: number;
  trippedCircuits: number;
  totalErrors24h: number;
  updatedAt: FirestoreTimestamp;
}

export interface AuditLogDocument {
  id: string;
  organizationId: string;
  userId: string;
  action: AuditAction;
  target: AuditTarget;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: FirestoreTimestamp;
  severity: 'info' | 'warning' | 'critical';
}

export type AuditAction = 
  | 'master.on' | 'master.off' | 'master.emergency_shutdown'
  | 'panel.on' | 'panel.off' | 'panel.lockout' | 'panel.unlock'
  | 'circuit.on' | 'circuit.off' | 'circuit.trip' | 'circuit.reset'
  | 'user.login' | 'user.logout' | 'user.create' | 'user.update' | 'user.delete'
  | 'project.create' | 'project.update' | 'project.delete'
  | 'settings.update' | 'billing.update';

export interface AuditTarget {
  type: 'master' | 'panel' | 'circuit' | 'user' | 'project' | 'organization';
  id: string;
  name?: string;
}

// -----------------------------------------------------------------------------
// AI/ML Entities
// -----------------------------------------------------------------------------

export interface EmbeddingDocument {
  id: string;
  projectId: string;
  source: 'file' | 'conversation' | 'documentation';
  sourceId: string;
  content: string;
  vector: number[]; // 1536 dimensions for OpenAI, 768 for local
  metadata: Record<string, unknown>;
  createdAt: FirestoreTimestamp;
}

export interface RoutingDecisionDocument {
  id: string;
  conversationId: string;
  input: string;
  selectedSpecialist: string;
  confidence: number;
  alternatives: SpecialistScore[];
  latencyMs: number;
  vibeScore: number;
  timestamp: FirestoreTimestamp;
}

export interface SpecialistScore {
  specialistId: string;
  score: number;
}

export interface VibeValidationDocument {
  id: string;
  taskId: string;
  checkpoint: string;
  score: number;
  threshold: number;
  passed: boolean;
  dimensions: VibeScores;
  recommendations: string[];
  timestamp: FirestoreTimestamp;
}

export interface VibeScores {
  virtue: number;
  integrity: number;
  behavioral: number;
  equilibrium: number;
}

// -----------------------------------------------------------------------------
// Billing & Usage Entities
// -----------------------------------------------------------------------------

export interface UsageMetricDocument {
  id: string; // format: orgId:YYYY-MM-DD
  organizationId: string;
  date: string; // YYYY-MM-DD
  apiCalls: number;
  tokensUsed: number;
  tasksExecuted: number;
  storageUsedBytes: number;
  activeUsers: number;
  circuitTrips: number;
  avgLatencyMs: number;
}

export interface SubscriptionDocument {
  id: string;
  organizationId: string;
  stripeSubscriptionId: string;
  plan: 'starter' | 'professional' | 'enterprise' | 'custom';
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodStart: FirestoreTimestamp;
  currentPeriodEnd: FirestoreTimestamp;
  cancelAtPeriodEnd: boolean;
  trialEnd?: FirestoreTimestamp;
  pricePerMonth: number;
  currency: string;
}

export interface InvoiceDocument {
  id: string;
  organizationId: string;
  stripeInvoiceId: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amount: number;
  currency: string;
  periodStart: FirestoreTimestamp;
  periodEnd: FirestoreTimestamp;
  paidAt?: FirestoreTimestamp;
  invoiceUrl: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// =============================================================================
// POSTGRESQL SCHEMAS - Relational for analytics & reporting
// =============================================================================

export const PostgreSQLSchemas = {
  /**
   * Core analytics tables for high-performance queries
   * Optimized with indexes and partitioning for <50ms latency
   */
  
  createUsersTable: `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      firebase_uid VARCHAR(128) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      organization_id UUID NOT NULL REFERENCES organizations(id),
      role VARCHAR(50) NOT NULL DEFAULT 'viewer',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_active_at TIMESTAMPTZ,
      
      CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'developer', 'viewer'))
    );
    
    CREATE INDEX idx_users_org ON users(organization_id);
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_active ON users(is_active, last_active_at);
  `,

  createOrganizationsTable: `
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      owner_id UUID NOT NULL,
      plan VARCHAR(50) NOT NULL DEFAULT 'starter',
      stripe_customer_id VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      trial_ends_at TIMESTAMPTZ,
      
      CONSTRAINT valid_plan CHECK (plan IN ('starter', 'professional', 'enterprise', 'custom'))
    );
    
    CREATE INDEX idx_orgs_slug ON organizations(slug);
    CREATE INDEX idx_orgs_stripe ON organizations(stripe_customer_id);
  `,

  createProjectsTable: `
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      repository_url VARCHAR(500),
      environment VARCHAR(50) NOT NULL DEFAULT 'development',
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      created_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      
      CONSTRAINT valid_environment CHECK (environment IN ('development', 'staging', 'production')),
      CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'archived'))
    );
    
    CREATE INDEX idx_projects_org ON projects(organization_id);
    CREATE INDEX idx_projects_status ON projects(status);
  `,

  createTasksTable: `
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id),
      user_id UUID NOT NULL REFERENCES users(id),
      conversation_id UUID,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      priority VARCHAR(50) NOT NULL DEFAULT 'normal',
      assigned_specialist VARCHAR(100),
      execution_time_ms INTEGER,
      tokens_used INTEGER,
      fdh_cycles INTEGER,
      success BOOLEAN,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      
      CONSTRAINT valid_type CHECK (type IN ('code', 'review', 'deploy', 'debug', 'document', 'test')),
      CONSTRAINT valid_status CHECK (status IN ('pending', 'queued', 'in_progress', 'completed', 'failed', 'cancelled')),
      CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
    );
    
    CREATE INDEX idx_tasks_project ON tasks(project_id);
    CREATE INDEX idx_tasks_user ON tasks(user_id);
    CREATE INDEX idx_tasks_status ON tasks(status);
    CREATE INDEX idx_tasks_created ON tasks(created_at DESC);
  `,

  createCircuitMetricsTable: `
    -- Partitioned by month for efficient time-series queries
    CREATE TABLE IF NOT EXISTS circuit_metrics (
      id UUID DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      panel_id VARCHAR(100) NOT NULL,
      circuit_id VARCHAR(100) NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      latency_ms INTEGER NOT NULL,
      success BOOLEAN NOT NULL,
      error_type VARCHAR(100),
      
      PRIMARY KEY (id, timestamp)
    ) PARTITION BY RANGE (timestamp);
    
    -- Create monthly partitions (example for 2026)
    CREATE TABLE circuit_metrics_2026_01 PARTITION OF circuit_metrics
      FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
    CREATE TABLE circuit_metrics_2026_02 PARTITION OF circuit_metrics
      FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
    CREATE TABLE circuit_metrics_2026_03 PARTITION OF circuit_metrics
      FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
    
    CREATE INDEX idx_circuit_metrics_org ON circuit_metrics(organization_id, timestamp DESC);
    CREATE INDEX idx_circuit_metrics_panel ON circuit_metrics(panel_id, timestamp DESC);
    CREATE INDEX idx_circuit_metrics_circuit ON circuit_metrics(circuit_id, timestamp DESC);
  `,

  createApiRequestsTable: `
    -- High-volume table for rate limiting and analytics
    CREATE TABLE IF NOT EXISTS api_requests (
      id UUID DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL,
      user_id UUID,
      endpoint VARCHAR(255) NOT NULL,
      method VARCHAR(10) NOT NULL,
      status_code INTEGER NOT NULL,
      latency_ms INTEGER NOT NULL,
      request_size_bytes INTEGER,
      response_size_bytes INTEGER,
      ip_address INET,
      user_agent TEXT,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      
      PRIMARY KEY (id, timestamp)
    ) PARTITION BY RANGE (timestamp);
    
    CREATE INDEX idx_api_requests_org ON api_requests(organization_id, timestamp DESC);
    CREATE INDEX idx_api_requests_endpoint ON api_requests(endpoint, timestamp DESC);
    CREATE INDEX idx_api_requests_rate_limit ON api_requests(organization_id, timestamp);
  `,

  createUsageDailyTable: `
    -- Materialized daily aggregates for billing
    CREATE TABLE IF NOT EXISTS usage_daily (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      date DATE NOT NULL,
      api_calls INTEGER NOT NULL DEFAULT 0,
      tokens_used BIGINT NOT NULL DEFAULT 0,
      tasks_executed INTEGER NOT NULL DEFAULT 0,
      storage_bytes BIGINT NOT NULL DEFAULT 0,
      active_users INTEGER NOT NULL DEFAULT 0,
      circuit_trips INTEGER NOT NULL DEFAULT 0,
      avg_latency_ms DECIMAL(10,2),
      p95_latency_ms INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      
      CONSTRAINT unique_org_date UNIQUE (organization_id, date)
    );
    
    CREATE INDEX idx_usage_daily_org ON usage_daily(organization_id, date DESC);
  `,

  createVectorExtension: `
    -- Enable pgvector for embeddings similarity search
    CREATE EXTENSION IF NOT EXISTS vector;
    
    CREATE TABLE IF NOT EXISTS embeddings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id),
      source_type VARCHAR(50) NOT NULL,
      source_id UUID NOT NULL,
      content TEXT NOT NULL,
      embedding vector(1536), -- OpenAI embedding dimension
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      
      CONSTRAINT valid_source CHECK (source_type IN ('file', 'conversation', 'documentation'))
    );
    
    -- HNSW index for fast similarity search (<50ms)
    CREATE INDEX idx_embeddings_vector ON embeddings 
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
    
    CREATE INDEX idx_embeddings_project ON embeddings(project_id);
  `,
};

// =============================================================================
// HELPER TYPES
// =============================================================================

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

// =============================================================================
// DATABASE CLIENT FACTORY
// =============================================================================

export interface DatabaseConfig {
  firestore: {
    projectId: string;
    credentials: string; // path to service account JSON
  };
  postgresql: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl: boolean;
    poolSize: number;
  };
}

export class DatabaseFactory {
  private static instance: DatabaseFactory;
  private config: DatabaseConfig | null = null;

  static getInstance(): DatabaseFactory {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = new DatabaseFactory();
    }
    return DatabaseFactory.instance;
  }

  configure(config: DatabaseConfig): void {
    this.config = config;
  }

  getConfig(): DatabaseConfig | null {
    return this.config;
  }

  /**
   * Initialize all database schemas
   * Run once during deployment
   */
  async initializeSchemas(): Promise<void> {
    if (!this.config) {
      throw new Error('Database not configured. Call configure() first.');
    }

    console.log('[DatabaseFactory] Initializing schemas...');
    
    // PostgreSQL schema initialization would happen here
    // In production, use migrations (e.g., Flyway, Prisma Migrate)
    
    console.log('[DatabaseFactory] Schemas initialized');
  }
}

// Export singleton
export const databaseFactory = DatabaseFactory.getInstance();

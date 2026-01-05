/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Interactions API
 * The Main Conduit for ALL Model and Infrastructure Communication
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This is the PRIMARY interface through which all Smelting operations flow.
 * Every request to models, every infrastructure dispatch, every resource
 * allocation goes through this API.
 */

import { getAccessToken } from '../infrastructure/gcp/auth.js';
import { GCP_PROJECT } from '../infrastructure/gcp/config.js';
import { getFirestoreClient } from '../infrastructure/database/firestore-client.js';
import { getPubSubClient, PUBSUB_TOPICS } from '../infrastructure/pubsub/index.js';
import { getFileManagerRAG } from '../infrastructure/rag/file-manager.js';

// =============================================================================
// TYPES
// =============================================================================

export type SmeltingPhase = 'blueprint' | 'smelt' | 'gild' | 'deploy';
export type IngotName = 'Locale' | 'Todd' | 'AchieveMor' | string;
export type ResourceName = 'ii-agent' | 'ii-researcher' | 'ii-thought' | 'II-Commons' | 'CoT-Lab-Demo';

export interface InteractionSession {
  id: string;
  ingot: IngotName;
  phase: SmeltingPhase;
  resources: ResourceName[];
  context: SmeltingContext;
  createdAt: string;
  status: 'active' | 'completed' | 'failed';
  artifacts: Artifact[];
}

export interface SmeltingContext {
  standards: ContextDocument[];
  productSpecs: ContextDocument[];
  technicalDocs: ContextDocument[];
  ragEmbeddings?: number[][];
}

export interface ContextDocument {
  id: string;
  type: 'standard' | 'product' | 'technical';
  source: string;
  content: string;
  embeddings?: number[];
}

export interface Artifact {
  id: string;
  type: 'code' | 'config' | 'schema' | 'ui' | 'infrastructure';
  path: string;
  content: string;
  createdAt: string;
}

export interface DispatchRequest {
  intent: 'smelt' | 'gild' | 'deploy' | 'research' | 'analyze';
  ingot: IngotName;
  phase: SmeltingPhase;
  resources?: ResourceName[];
  parameters?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface DispatchResult {
  success: boolean;
  sessionId: string;
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

export interface ResourceDispatch {
  resource: ResourceName;
  task: string;
  ingot: IngotName;
  parameters?: Record<string, unknown>;
  callback?: string;
}

export interface Blueprint {
  ingot: IngotName;
  version: string;
  description: string;
  requiredResources: ResourceName[];
  requiredTools: string[];
  smeltingTasks: SmeltingTask[];
  gildingSpec: GildingSpec;
  infrastructure: InfrastructureSpec;
  brand: BrandSpec;
}

export interface SmeltingTask {
  id: string;
  name: string;
  type: 'generate' | 'compile' | 'configure' | 'deploy';
  dependencies: string[];
  tool: string;
  parameters: Record<string, unknown>;
}

export interface GildingSpec {
  ui: UISpec;
  components: string[];
  pages: string[];
}

export interface UISpec {
  framework: 'react' | 'vue' | 'angular';
  designSystem: string;
  responsive: boolean;
  accessibility: boolean;
}

export interface InfrastructureSpec {
  firebase: FirebaseConfig;
  vertexAI: VertexConfig;
  cloudRun: CloudRunConfig;
}

export interface FirebaseConfig {
  hosting: boolean;
  firestore: boolean;
  auth: boolean;
  storage: boolean;
  functions: boolean;
}

export interface VertexConfig {
  models: string[];
  endpoints: string[];
  embeddings: boolean;
}

export interface CloudRunConfig {
  services: string[];
  regions: string[];
  minInstances: number;
}

export interface BrandSpec {
  colors: Record<string, string>;
  fonts: string[];
  assets: string[];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// =============================================================================
// INTERACTIONS API CLASS
// =============================================================================

/**
 * The Interactions API - Main conduit for all Foundry operations
 */
export class InteractionsAPI {
  private static instance: InteractionsAPI | null = null;
  private accessToken: string | null = null;
  private sessions: Map<string, InteractionSession> = new Map();
  private blueprints: Map<IngotName, Blueprint> = new Map();

  private constructor() {}

  static getInstance(): InteractionsAPI {
    if (!InteractionsAPI.instance) {
      InteractionsAPI.instance = new InteractionsAPI();
    }
    return InteractionsAPI.instance;
  }

  /**
   * Initialize the Interactions API
   */
  async initialize(): Promise<void> {
    this.accessToken = await getAccessToken();
    console.log('🔌 Interactions API initialized');
    console.log(`   Project: ${GCP_PROJECT.projectId}`);
    console.log(`   Region: ${GCP_PROJECT.region}`);
  }

  // ===========================================================================
  // SESSION MANAGEMENT
  // ===========================================================================

  /**
   * Create a new Smelting session
   */
  async createSession(config: {
    ingot: IngotName;
    phase: SmeltingPhase;
    resources?: ResourceName[];
    context?: SmeltingContext;
  }): Promise<InteractionSession> {
    const session: InteractionSession = {
      id: generateSessionId(),
      ingot: config.ingot,
      phase: config.phase,
      resources: config.resources || [],
      context: config.context || { standards: [], productSpecs: [], technicalDocs: [] },
      createdAt: new Date().toISOString(),
      status: 'active',
      artifacts: [],
    };

    // Persist to Firestore
    const firestore = getFirestoreClient();
    await firestore.setDocument('smelting-sessions', session.id, session);

    this.sessions.set(session.id, session);

    console.log(`🔥 Smelting session created: ${session.id}`);
    console.log(`   Ingot: ${session.ingot}`);
    console.log(`   Phase: ${session.phase}`);
    console.log(`   Resources: ${session.resources.join(', ') || 'none'}`);

    return session;
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<InteractionSession | null> {
    // Check cache first
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    // Load from Firestore
    const firestore = getFirestoreClient();
    const doc = await firestore.getDocument<InteractionSession & { id: string }>(
      'smelting-sessions',
      sessionId
    );

    if (doc) {
      this.sessions.set(sessionId, doc);
      return doc;
    }

    return null;
  }

  /**
   * Complete a session
   */
  async completeSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'completed';

    const firestore = getFirestoreClient();
    await firestore.updateDocument('smelting-sessions', sessionId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    console.log(`✅ Session completed: ${sessionId}`);
  }

  // ===========================================================================
  // DISPATCH OPERATIONS
  // ===========================================================================

  /**
   * Dispatch a task to the Foundry
   */
  async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const taskId = generateTaskId();

    console.log(`📤 Dispatching task: ${taskId}`);
    console.log(`   Intent: ${request.intent}`);
    console.log(`   Ingot: ${request.ingot}`);
    console.log(`   Phase: ${request.phase}`);

    try {
      // Create session for this dispatch
      const session = await this.createSession({
        ingot: request.ingot,
        phase: request.phase,
        resources: request.resources,
      });

      // Route to appropriate handler based on intent
      const pubsub = getPubSubClient();
      const basePayload = {
        jobId: taskId,
        correlationId: session.id,
        timestamp: new Date().toISOString(),
        source: 'interactions-api',
        priority: 'normal' as const,
        metadata: { ingot: request.ingot, phase: request.phase },
      };
      
      switch (request.intent) {
        case 'smelt':
          await pubsub.publish(PUBSUB_TOPICS.ACHEEVY_INIT.name, {
            ...basePayload,
            type: 'acheevy-init' as const,
            userId: 'system',
            organizationId: 'smelteros',
            sessionId: session.id,
            contextLayers: {
              standards: [],
              product: [request.ingot],
              specs: [],
            },
          });
          break;

        case 'gild':
          await pubsub.publish(PUBSUB_TOPICS.VISION_PROCESSING.name, {
            ...basePayload,
            type: 'vision' as const,
            operation: 'analyze' as const,
            artifactUri: `gs://smelteros-artifacts/${request.ingot}/build`,
            outputBucket: 'smelteros-artifacts',
          });
          break;

        case 'deploy':
          await pubsub.publish(PUBSUB_TOPICS.ALERTS.name, {
            ...basePayload,
            type: 'alert' as const,
            severity: 'info' as const,
            category: 'system' as const,
            title: `Deploying ${request.ingot}`,
            message: `Starting deployment for ${request.ingot}`,
            channels: ['slack' as const],
            context: { ingot: request.ingot },
          });
          break;

        case 'research':
        case 'analyze':
          // Route to research resource
          await this.dispatchResource({
            resource: 'ii-researcher',
            task: request.intent,
            ingot: request.ingot,
            parameters: request.parameters,
          });
          break;
      }

      return {
        success: true,
        sessionId: session.id,
        taskId,
        status: 'queued',
      };
    } catch (error) {
      console.error(`❌ Dispatch failed:`, error);
      return {
        success: false,
        sessionId: '',
        taskId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Dispatch to an Intelligent Internet resource
   */
  async dispatchResource(dispatch: ResourceDispatch): Promise<DispatchResult> {
    const taskId = generateTaskId();

    console.log(`🌐 Dispatching to resource: ${dispatch.resource}`);
    console.log(`   Task: ${dispatch.task}`);
    console.log(`   Ingot: ${dispatch.ingot}`);

    try {
      const pubsub = getPubSubClient();

      // Route to the appropriate resource topic
      // Resources are mapped to specific Pub/Sub topics
      const resourceTopics: Record<ResourceName, string> = {
        'ii-agent': PUBSUB_TOPICS.ACHEEVY_INIT.name,
        'ii-researcher': PUBSUB_TOPICS.FILE_PROCESSING.name,
        'ii-thought': PUBSUB_TOPICS.PROOF_GATE_VALIDATION.name,
        'II-Commons': PUBSUB_TOPICS.ACHEEVY_INIT.name,
        'CoT-Lab-Demo': PUBSUB_TOPICS.PROOF_GATE_VALIDATION.name,
      };

      const topic = resourceTopics[dispatch.resource];
      const basePayload = {
        jobId: taskId,
        correlationId: taskId,
        timestamp: new Date().toISOString(),
        source: dispatch.resource,
        priority: 'normal' as const,
        metadata: { task: dispatch.task, ingot: dispatch.ingot },
      };

      // Use file processing payload for research resources
      await pubsub.publish(topic, {
        ...basePayload,
        type: 'file' as const,
        operation: 'extract' as const,
        inputUri: `gs://smelteros-resources/${dispatch.resource}`,
        outputUri: `gs://smelteros-artifacts/${dispatch.ingot}/output`,
      });

      return {
        success: true,
        sessionId: '',
        taskId,
        status: 'queued',
      };
    } catch (error) {
      console.error(`❌ Resource dispatch failed:`, error);
      return {
        success: false,
        sessionId: '',
        taskId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ===========================================================================
  // BLUEPRINT MANAGEMENT
  // ===========================================================================

  /**
   * Load an Ingot blueprint
   */
  async loadBlueprint(ingot: IngotName): Promise<Blueprint> {
    // Check cache
    if (this.blueprints.has(ingot)) {
      return this.blueprints.get(ingot)!;
    }

    // Load from Firestore
    const firestore = getFirestoreClient();
    const doc = await firestore.getDocument<Blueprint & { id: string }>(
      'ingot-blueprints',
      ingot
    );

    if (!doc) {
      throw new Error(`Blueprint not found for ingot: ${ingot}`);
    }

    this.blueprints.set(ingot, doc);
    return doc;
  }

  /**
   * Save an Ingot blueprint
   */
  async saveBlueprint(blueprint: Blueprint): Promise<void> {
    const firestore = getFirestoreClient();
    await firestore.setDocument('ingot-blueprints', blueprint.ingot, {
      id: blueprint.ingot,
      ...blueprint,
    });

    this.blueprints.set(blueprint.ingot, blueprint);
    console.log(`📋 Blueprint saved: ${blueprint.ingot}`);
  }

  // ===========================================================================
  // VAULT ACCESS (RAG)
  // ===========================================================================

  /**
   * Retrieve context from the Vault (Google File Manager RAG)
   */
  async retrieveFromVault(config: {
    ingot: IngotName;
    contextTypes: ('standards' | 'product' | 'technical')[];
    relevanceThreshold?: number;
    maxResults?: number;
  }): Promise<SmeltingContext> {
    console.log(`📚 Retrieving from Vault for: ${config.ingot}`);

    try {
      // Get the FileManagerRAG instance and retrieve relevant documents
      const rag = getFileManagerRAG();
      
      // Map context types to RAG types
      const ragContextTypes = config.contextTypes.map(type => {
        if (type === 'standards') return 'standard';
        if (type === 'product') return 'product';
        if (type === 'technical') return 'technical';
        return type as 'standard' | 'product' | 'technical';
      });

      const ragResults = await rag.retrieve({
        query: config.ingot,
        ingot: config.ingot,
        contextTypes: ragContextTypes,
        relevanceThreshold: config.relevanceThreshold || 0.8,
        maxResults: config.maxResults || 10,
      });

      // Map RAG results to SmeltingContext structure
      const context: SmeltingContext = {
        standards: ragResults.documents
          .filter(doc => doc.type === 'standard')
          .map(doc => ({
            id: doc.id,
            type: 'standard' as const,
            source: doc.source,
            content: doc.content,
            embeddings: doc.embeddings,
          })),
        productSpecs: ragResults.documents
          .filter(doc => doc.type === 'product')
          .map(doc => ({
            id: doc.id,
            type: 'product' as const,
            source: doc.source,
            content: doc.content,
            embeddings: doc.embeddings,
          })),
        technicalDocs: ragResults.documents
          .filter(doc => doc.type === 'technical')
          .map(doc => ({
            id: doc.id,
            type: 'technical' as const,
            source: doc.source,
            content: doc.content,
            embeddings: doc.embeddings,
          })),
        ragEmbeddings: ragResults.queryEmbedding ? [ragResults.queryEmbedding] : undefined,
      };

      console.log(`   ✓ Retrieved ${ragResults.totalMatches} documents from Vault`);
      return context;
    } catch (error) {
      console.error(`   ✗ Vault retrieval failed:`, error);
      
      // Return empty context on failure (graceful degradation)
      return {
        standards: [],
        productSpecs: [],
        technicalDocs: [],
      };
    }
  }

  // ===========================================================================
  // ARTIFACT MANAGEMENT
  // ===========================================================================

  /**
   * Record an artifact produced during Smelting
   */
  async recordArtifact(sessionId: string, artifact: Omit<Artifact, 'id' | 'createdAt'>): Promise<Artifact> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const fullArtifact: Artifact = {
      id: `artifact-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      ...artifact,
    };

    session.artifacts.push(fullArtifact);

    // Persist to Firestore
    const firestore = getFirestoreClient();
    await firestore.setDocument(
      'smelting-artifacts',
      fullArtifact.id,
      {
        ...fullArtifact,
        sessionId,
      }
    );

    console.log(`📦 Artifact recorded: ${fullArtifact.id}`);
    return fullArtifact;
  }

  // ===========================================================================
  // STATUS & METRICS
  // ===========================================================================

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<{ status: string; result?: unknown }> {
    const firestore = getFirestoreClient();
    const doc = await firestore.getDocument<{ id: string; status: string; result?: unknown }>(
      'smelting-tasks',
      taskId
    );

    if (!doc) {
      return { status: 'not_found' };
    }

    return { status: doc.status, result: doc.result };
  }

  /**
   * Get session metrics
   */
  async getSessionMetrics(sessionId: string): Promise<{
    duration: number;
    artifactsCount: number;
    resourcesUsed: ResourceName[];
  }> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const createdAt = new Date(session.createdAt);
    const now = new Date();

    return {
      duration: now.getTime() - createdAt.getTime(),
      artifactsCount: session.artifacts.length,
      resourcesUsed: session.resources,
    };
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let apiInstance: InteractionsAPI | null = null;

export function getInteractionsAPI(): InteractionsAPI {
  if (!apiInstance) {
    apiInstance = InteractionsAPI.getInstance();
  }
  return apiInstance;
}

export default InteractionsAPI;

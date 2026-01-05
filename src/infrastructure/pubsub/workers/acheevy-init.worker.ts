/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS ACHEEVY Initialization Worker
 * Async Session Setup and Context Loading for ACHEEVY Concierge
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { BaseWorker, WorkerResult } from '../base-worker.js';
import { PUBSUB_TOPICS, ACHEEVYInitPayload, PubSubMessage } from '../config.js';
import { getFirestoreClient } from '../../database/firestore-client.js';

// Simple UUID generator
function generateUUID(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

// =============================================================================
// TYPES
// =============================================================================

interface SessionContext {
  id: string;  // Required for Firestore
  sessionId: string;
  userId: string;
  organizationId: string;
  standards: StandardsLayer;
  product: ProductLayer;
  specs: SpecsLayer;
  initialized: boolean;
  initializedAt: string;
}

interface StandardsLayer {
  id: string;  // Required for Firestore
  version: string;
  rules: string[];
  constraints: string[];
  principles: string[];
}

interface ProductLayer {
  id: string;  // Required for Firestore
  version: string;
  features: string[];
  capabilities: string[];
  limitations: string[];
}

interface SpecsLayer {
  id: string;  // Required for Firestore
  version: string;
  endpoints: string[];
  schemas: string[];
  workflows: string[];
}

// =============================================================================
// WORKER
// =============================================================================

export class ACHEEVYInitWorker extends BaseWorker<ACHEEVYInitPayload> {
  constructor() {
    super('acheevy-init', PUBSUB_TOPICS.ACHEEVY_INITIALIZATION, {
      maxConcurrency: 5,
      pollIntervalMs: 500,
      circuitId: 'acheevy-init',
    });
  }

  protected async process(
    payload: ACHEEVYInitPayload,
    message: PubSubMessage<ACHEEVYInitPayload>
  ): Promise<WorkerResult<SessionContext>> {
    const startTime = Date.now();

    try {
      console.log(`🎯 Initializing ACHEEVY session: ${payload.sessionId}`);
      console.log(`   User: ${payload.userId}`);
      console.log(`   Org: ${payload.organizationId}`);

      // Load three-layer context
      const [standards, product, specs] = await Promise.all([
        this.loadStandardsLayer(payload.contextLayers.standards),
        this.loadProductLayer(payload.contextLayers.product),
        this.loadSpecsLayer(payload.contextLayers.specs),
      ]);

      // Create session context
      const sessionContext: SessionContext = {
        id: payload.sessionId,
        sessionId: payload.sessionId,
        userId: payload.userId,
        organizationId: payload.organizationId,
        standards,
        product,
        specs,
        initialized: true,
        initializedAt: new Date().toISOString(),
      };

      // Persist to Firestore
      const firestore = getFirestoreClient();
      await firestore.setDocument(
        'sessions',
        payload.sessionId,
        sessionContext
      );

      // Update user's active session
      await firestore.updateDocument(
        'users',
        payload.userId,
        {
          activeSessionId: payload.sessionId,
          lastSessionAt: new Date().toISOString(),
        }
      );

      console.log(`   ✓ Session initialized with ${standards.rules.length} rules, ${product.features.length} features, ${specs.endpoints.length} endpoints`);

      return {
        success: true,
        jobId: payload.jobId,
        data: sessionContext,
        duration: Date.now() - startTime,
        retryable: false,
      };
    } catch (error) {
      console.error(`   ✗ ACHEEVY init failed:`, error);
      return {
        success: false,
        jobId: payload.jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        retryable: true,
      };
    }
  }

  private async loadStandardsLayer(standards: string[]): Promise<StandardsLayer> {
    // Load from Firestore or use defaults
    const firestore = getFirestoreClient();
    
    try {
      const doc = await firestore.getDocument<StandardsLayer>('config', 'standards');
      if (doc) {
        return doc;
      }
    } catch {
      // Use defaults
    }

    return {
      id: 'standards',
      version: '1.0.0',
      rules: [
        'All outputs must be factually verifiable',
        'Cite sources for claims',
        'Maintain professional tone',
        'Respect user privacy',
        'Follow ethical AI guidelines',
        ...standards,
      ],
      constraints: [
        'Max response length: 4000 tokens',
        'Max context window: 100k tokens',
        'Rate limit: 60 requests/minute',
      ],
      principles: [
        'User intent first',
        'Transparency in reasoning',
        'Graceful degradation',
        'Continuous learning',
      ],
    };
  }

  private async loadProductLayer(product: string[]): Promise<ProductLayer> {
    const firestore = getFirestoreClient();
    
    try {
      const doc = await firestore.getDocument<ProductLayer>('config', 'product');
      if (doc) {
        return doc;
      }
    } catch {
      // Use defaults
    }

    return {
      id: 'product',
      version: '2.1.0',
      features: [
        'Multi-modal input (text, voice, vision)',
        'Real-time streaming responses',
        'Context persistence across sessions',
        'Multi-agent orchestration',
        'Proof gate validation',
        ...product,
      ],
      capabilities: [
        'Code generation and review',
        'Document analysis',
        'Data visualization',
        'Workflow automation',
        'Research synthesis',
      ],
      limitations: [
        'Cannot execute arbitrary code',
        'Cannot access external URLs without permission',
        'Cannot modify system files',
      ],
    };
  }

  private async loadSpecsLayer(specs: string[]): Promise<SpecsLayer> {
    const firestore = getFirestoreClient();
    
    try {
      const doc = await firestore.getDocument<SpecsLayer>('config', 'specs');
      if (doc) {
        return doc;
      }
    } catch {
      // Use defaults
    }

    return {
      id: 'specs',
      version: '1.0.0',
      endpoints: [
        '/api/v1/chat',
        '/api/v1/agents/invoke',
        '/api/v1/tasks/create',
        '/api/v1/artifacts/upload',
        ...specs,
      ],
      schemas: [
        'ChatMessage',
        'AgentInvocation',
        'Task',
        'Artifact',
        'Session',
      ],
      workflows: [
        'research-synthesis',
        'code-review',
        'document-extraction',
        'data-analysis',
      ],
    };
  }
}

// =============================================================================
// FACTORY
// =============================================================================

let worker: ACHEEVYInitWorker | null = null;

export function getACHEEVYInitWorker(): ACHEEVYInitWorker {
  if (!worker) {
    worker = new ACHEEVYInitWorker();
  }
  return worker;
}

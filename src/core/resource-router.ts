/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Resource Router
 * Routes Tasks to Intelligent Internet Repositories
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The Resource Router dispatches tasks to the specialized Intelligent Internet
 * repositories. These are NOT loosely integrated - they are wired directly
 * into the SmelterOS core for instant dispatch.
 */

import { getPubSubClient, PUBSUB_TOPICS, PubSubTopicConfig } from '../infrastructure/pubsub/index.js';
import { getFirestoreClient } from '../infrastructure/database/firestore-client.js';

// =============================================================================
// TYPES
// =============================================================================

export type ResourceName = 
  | 'ii-agent'
  | 'ii-researcher'
  | 'ii-thought'
  | 'II-Commons'
  | 'CoT-Lab-Demo';

export interface ResourceCapability {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export interface ResourceConfig {
  name: ResourceName;
  displayName: string;
  description: string;
  endpoint: string;
  pubsubTopic: PubSubTopicConfig;
  capabilities: ResourceCapability[];
  status: 'active' | 'inactive' | 'maintenance';
  maxConcurrentTasks: number;
  averageLatencyMs: number;
}

export interface ResourceDispatchRequest {
  resource: ResourceName;
  capability: string;
  ingot: string;
  input: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  callback?: string;
  timeout?: number;
}

export interface ResourceDispatchResult {
  success: boolean;
  dispatchId: string;
  resource: ResourceName;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

export interface ResourceStatus {
  resource: ResourceName;
  status: 'active' | 'inactive' | 'maintenance';
  activeTasks: number;
  queueDepth: number;
  lastActivity: string;
}

// =============================================================================
// RESOURCE REGISTRY
// =============================================================================

export const RESOURCE_REGISTRY: Record<ResourceName, ResourceConfig> = {
  'ii-agent': {
    name: 'ii-agent',
    displayName: 'Intelligent Internet Agent',
    description: 'Autonomous task execution for multi-step workflows',
    endpoint: 'https://ii-agent.smelteros.com/api',
    pubsubTopic: PUBSUB_TOPICS.ACHEEVY_INIT,
    capabilities: [
      {
        name: 'execute-workflow',
        description: 'Execute a multi-step automated workflow',
        inputSchema: {
          type: 'object',
          properties: {
            workflow: { type: 'string' },
            steps: { type: 'array' },
            context: { type: 'object' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            results: { type: 'array' },
          },
        },
      },
      {
        name: 'automate-task',
        description: 'Automate a single repeatable task',
        inputSchema: {
          type: 'object',
          properties: {
            task: { type: 'string' },
            parameters: { type: 'object' },
            schedule: { type: 'string' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            automationId: { type: 'string' },
            status: { type: 'string' },
          },
        },
      },
      {
        name: 'integrate-api',
        description: 'Integrate with external APIs',
        inputSchema: {
          type: 'object',
          properties: {
            apiSpec: { type: 'object' },
            mapping: { type: 'object' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            integrationId: { type: 'string' },
            endpoints: { type: 'array' },
          },
        },
      },
    ],
    status: 'active',
    maxConcurrentTasks: 10,
    averageLatencyMs: 2000,
  },

  'ii-researcher': {
    name: 'ii-researcher',
    displayName: 'Intelligent Internet Researcher',
    description: 'Deep research and analysis capabilities',
    endpoint: 'https://ii-researcher.smelteros.com/api',
    pubsubTopic: PUBSUB_TOPICS.FILE_PROCESSING,
    capabilities: [
      {
        name: 'market-research',
        description: 'Conduct comprehensive market research',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            depth: { type: 'string', enum: ['shallow', 'medium', 'deep'] },
            sources: { type: 'array' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            findings: { type: 'array' },
            summary: { type: 'string' },
            sources: { type: 'array' },
          },
        },
      },
      {
        name: 'competitor-analysis',
        description: 'Analyze competitors in a market',
        inputSchema: {
          type: 'object',
          properties: {
            industry: { type: 'string' },
            competitors: { type: 'array' },
            aspects: { type: 'array' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            analysis: { type: 'object' },
            recommendations: { type: 'array' },
          },
        },
      },
      {
        name: 'technical-research',
        description: 'Research technical topics and best practices',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            context: { type: 'string' },
            focus: { type: 'array' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            findings: { type: 'array' },
            codeExamples: { type: 'array' },
            references: { type: 'array' },
          },
        },
      },
    ],
    status: 'active',
    maxConcurrentTasks: 5,
    averageLatencyMs: 5000,
  },

  'ii-thought': {
    name: 'ii-thought',
    displayName: 'Intelligent Internet Thought',
    description: 'Complex reasoning and strategic planning',
    endpoint: 'https://ii-thought.smelteros.com/api',
    pubsubTopic: PUBSUB_TOPICS.PROOF_GATE_VALIDATION,
    capabilities: [
      {
        name: 'strategic-planning',
        description: 'Create strategic plans for complex goals',
        inputSchema: {
          type: 'object',
          properties: {
            goal: { type: 'string' },
            constraints: { type: 'array' },
            resources: { type: 'array' },
            timeline: { type: 'string' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            plan: { type: 'object' },
            milestones: { type: 'array' },
            risks: { type: 'array' },
          },
        },
      },
      {
        name: 'problem-decomposition',
        description: 'Break down complex problems into manageable parts',
        inputSchema: {
          type: 'object',
          properties: {
            problem: { type: 'string' },
            context: { type: 'object' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            subproblems: { type: 'array' },
            dependencies: { type: 'object' },
            approach: { type: 'string' },
          },
        },
      },
      {
        name: 'decision-analysis',
        description: 'Analyze decision options with reasoning',
        inputSchema: {
          type: 'object',
          properties: {
            decision: { type: 'string' },
            options: { type: 'array' },
            criteria: { type: 'array' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            analysis: { type: 'object' },
            recommendation: { type: 'string' },
            reasoning: { type: 'string' },
          },
        },
      },
    ],
    status: 'active',
    maxConcurrentTasks: 3,
    averageLatencyMs: 8000,
  },

  'II-Commons': {
    name: 'II-Commons',
    displayName: 'Intelligent Internet Commons',
    description: 'Shared utilities and common patterns',
    endpoint: 'https://ii-commons.smelteros.com/api',
    pubsubTopic: PUBSUB_TOPICS.ACHEEVY_INIT,
    capabilities: [
      {
        name: 'generate-boilerplate',
        description: 'Generate project boilerplate code',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            framework: { type: 'string' },
            options: { type: 'object' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            files: { type: 'array' },
            instructions: { type: 'string' },
          },
        },
      },
      {
        name: 'apply-pattern',
        description: 'Apply a design pattern to code',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            code: { type: 'string' },
            context: { type: 'object' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            transformedCode: { type: 'string' },
            explanation: { type: 'string' },
          },
        },
      },
      {
        name: 'validate-structure',
        description: 'Validate project structure against best practices',
        inputSchema: {
          type: 'object',
          properties: {
            structure: { type: 'object' },
            type: { type: 'string' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            issues: { type: 'array' },
            suggestions: { type: 'array' },
          },
        },
      },
    ],
    status: 'active',
    maxConcurrentTasks: 20,
    averageLatencyMs: 500,
  },

  'CoT-Lab-Demo': {
    name: 'CoT-Lab-Demo',
    displayName: 'Chain-of-Thought Lab',
    description: 'Chain-of-thought demonstrations and reasoning chains',
    endpoint: 'https://cot-lab.smelteros.com/api',
    pubsubTopic: PUBSUB_TOPICS.PROOF_GATE_VALIDATION,
    capabilities: [
      {
        name: 'generate-reasoning-chain',
        description: 'Generate step-by-step reasoning for a problem',
        inputSchema: {
          type: 'object',
          properties: {
            problem: { type: 'string' },
            style: { type: 'string', enum: ['detailed', 'concise', 'educational'] },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            steps: { type: 'array' },
            conclusion: { type: 'string' },
            confidence: { type: 'number' },
          },
        },
      },
      {
        name: 'explain-decision',
        description: 'Explain the reasoning behind a decision',
        inputSchema: {
          type: 'object',
          properties: {
            decision: { type: 'string' },
            context: { type: 'object' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            explanation: { type: 'string' },
            factors: { type: 'array' },
            alternatives: { type: 'array' },
          },
        },
      },
      {
        name: 'verify-reasoning',
        description: 'Verify the validity of a reasoning chain',
        inputSchema: {
          type: 'object',
          properties: {
            reasoning: { type: 'array' },
            conclusion: { type: 'string' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            issues: { type: 'array' },
            corrections: { type: 'array' },
          },
        },
      },
    ],
    status: 'active',
    maxConcurrentTasks: 5,
    averageLatencyMs: 3000,
  },
};

// =============================================================================
// RESOURCE ROUTER CLASS
// =============================================================================

/**
 * ResourceRouter - Dispatches tasks to Intelligent Internet repositories
 */
export class ResourceRouter {
  private static instance: ResourceRouter | null = null;
  private dispatches: Map<string, ResourceDispatchResult> = new Map();

  private constructor() {}

  static getInstance(): ResourceRouter {
    if (!ResourceRouter.instance) {
      ResourceRouter.instance = new ResourceRouter();
    }
    return ResourceRouter.instance;
  }

  /**
   * Dispatch a task to a resource
   */
  async dispatch(request: ResourceDispatchRequest): Promise<ResourceDispatchResult> {
    const dispatchId = `dispatch-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    console.log(`🌐 Resource dispatch: ${request.resource}`);
    console.log(`   Capability: ${request.capability}`);
    console.log(`   Ingot: ${request.ingot}`);
    console.log(`   Dispatch ID: ${dispatchId}`);

    try {
      // Validate resource exists
      const config = RESOURCE_REGISTRY[request.resource];
      if (!config) {
        throw new Error(`Unknown resource: ${request.resource}`);
      }

      // Validate capability
      const capability = config.capabilities.find(c => c.name === request.capability);
      if (!capability) {
        throw new Error(`Unknown capability: ${request.capability} for resource: ${request.resource}`);
      }

      // Check resource status
      if (config.status !== 'active') {
        throw new Error(`Resource is not active: ${request.resource} (status: ${config.status})`);
      }

      // Dispatch via Pub/Sub
      const pubsub = getPubSubClient();
      const basePayload = {
        jobId: dispatchId,
        correlationId: dispatchId,
        timestamp: new Date().toISOString(),
        source: request.resource,
        priority: (request.priority || 'normal') as 'low' | 'normal' | 'high' | 'critical',
        metadata: { capability: request.capability, ingot: request.ingot },
      };

      // Use file processing payload type for resource dispatches
      await pubsub.publish(config.pubsubTopic.name, {
        ...basePayload,
        type: 'file' as const,
        operation: 'extract' as const,
        inputUri: `gs://smelteros-resources/${request.resource}`,
        outputUri: `gs://smelteros-artifacts/${request.ingot}/output`,
      });

      // Record dispatch
      const result: ResourceDispatchResult = {
        success: true,
        dispatchId,
        resource: request.resource,
        status: 'queued',
      };

      this.dispatches.set(dispatchId, result);

      // Persist to Firestore
      const firestore = getFirestoreClient();
      await firestore.setDocument('resource-dispatches', dispatchId, {
        id: dispatchId,
        ...request,
        status: 'queued',
        createdAt: new Date().toISOString(),
      });

      console.log(`   ✓ Dispatched successfully`);
      return result;
    } catch (error) {
      console.error(`   ✗ Dispatch failed:`, error);
      return {
        success: false,
        dispatchId,
        resource: request.resource,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get dispatch status
   */
  async getDispatchStatus(dispatchId: string): Promise<ResourceDispatchResult | null> {
    // Check cache
    if (this.dispatches.has(dispatchId)) {
      return this.dispatches.get(dispatchId)!;
    }

    // Load from Firestore
    const firestore = getFirestoreClient();
    const doc = await firestore.getDocument<ResourceDispatchResult & { id: string }>(
      'resource-dispatches',
      dispatchId
    );

    if (doc) {
      this.dispatches.set(dispatchId, doc);
      return doc;
    }

    return null;
  }

  /**
   * Get resource status
   */
  async getResourceStatus(resource: ResourceName): Promise<ResourceStatus> {
    const config = RESOURCE_REGISTRY[resource];
    if (!config) {
      throw new Error(`Unknown resource: ${resource}`);
    }

    // Get active dispatches for this resource
    const firestore = getFirestoreClient();
    const activeDispatches = await firestore.query<{ id: string }>(
      'resource-dispatches',
      {
        filters: [
          { field: 'resource', op: 'EQUAL', value: resource },
          { field: 'status', op: 'IN', value: ['queued', 'processing'] },
        ],
        limit: 100,
      }
    );

    return {
      resource,
      status: config.status,
      activeTasks: activeDispatches.data.length,
      queueDepth: activeDispatches.data.filter(d => d.id).length,
      lastActivity: new Date().toISOString(),
    };
  }

  /**
   * Get all resource statuses
   */
  async getAllResourceStatuses(): Promise<ResourceStatus[]> {
    const statuses: ResourceStatus[] = [];
    for (const resource of Object.keys(RESOURCE_REGISTRY) as ResourceName[]) {
      statuses.push(await this.getResourceStatus(resource));
    }
    return statuses;
  }

  /**
   * Validate a resource exists
   */
  validate(resource: ResourceName): boolean {
    return resource in RESOURCE_REGISTRY;
  }

  /**
   * Get resource configuration
   */
  getConfig(resource: ResourceName): ResourceConfig | undefined {
    return RESOURCE_REGISTRY[resource];
  }

  /**
   * Get all resources
   */
  getAllResources(): ResourceConfig[] {
    return Object.values(RESOURCE_REGISTRY);
  }

  /**
   * Get resources by capability
   */
  getResourcesByCapability(capability: string): ResourceConfig[] {
    return Object.values(RESOURCE_REGISTRY).filter(r =>
      r.capabilities.some(c => c.name === capability)
    );
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let routerInstance: ResourceRouter | null = null;

export function getResourceRouter(): ResourceRouter {
  if (!routerInstance) {
    routerInstance = ResourceRouter.getInstance();
  }
  return routerInstance;
}

export default ResourceRouter;

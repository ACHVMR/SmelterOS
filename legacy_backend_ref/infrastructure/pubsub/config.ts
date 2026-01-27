/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Pub/Sub Configuration
 * Event-Driven Async Processing for Production Workers
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { GCP_PROJECT } from '../gcp/config';

// =============================================================================
// TOPIC DEFINITIONS
// =============================================================================

export interface PubSubTopicConfig {
  id: string;
  name: string;
  description: string;
  subscriptionName: string;
  ackDeadlineSeconds: number;
  retryPolicy: {
    minimumBackoff: string;
    maximumBackoff: string;
  };
  deadLetterPolicy?: {
    deadLetterTopic: string;
    maxDeliveryAttempts: number;
  };
  messageRetentionDuration: string;
  labels: Record<string, string>;
}

/**
 * All Pub/Sub topics for SmelterOS async workers
 */
export const PUBSUB_TOPICS: Record<string, PubSubTopicConfig> = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ACHEEVY Initialization
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ACHEEVY_INITIALIZATION: {
    id: 'acheevy-initialization',
    name: `projects/${GCP_PROJECT.projectId}/topics/acheevy-initialization`,
    description: 'ACHEEVY concierge initialization and session setup',
    subscriptionName: `projects/${GCP_PROJECT.projectId}/subscriptions/acheevy-init-worker`,
    ackDeadlineSeconds: 60,
    retryPolicy: {
      minimumBackoff: '10s',
      maximumBackoff: '600s',
    },
    deadLetterPolicy: {
      deadLetterTopic: `projects/${GCP_PROJECT.projectId}/topics/dead-letter`,
      maxDeliveryAttempts: 5,
    },
    messageRetentionDuration: '604800s', // 7 days
    labels: {
      worker: 'acheevy-init',
      tier: 'critical',
      environment: GCP_PROJECT.environment,
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // V.I.B.E. Proof Gate Validation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PROOF_GATE_VALIDATION: {
    id: 'proof-gate-validation',
    name: `projects/${GCP_PROJECT.projectId}/topics/proof-gate-validation`,
    description: 'V.I.B.E. proof gate asynchronous validation',
    subscriptionName: `projects/${GCP_PROJECT.projectId}/subscriptions/proof-gate-worker`,
    ackDeadlineSeconds: 120,
    retryPolicy: {
      minimumBackoff: '5s',
      maximumBackoff: '300s',
    },
    deadLetterPolicy: {
      deadLetterTopic: `projects/${GCP_PROJECT.projectId}/topics/dead-letter`,
      maxDeliveryAttempts: 3,
    },
    messageRetentionDuration: '86400s', // 1 day
    labels: {
      worker: 'proof-gate',
      tier: 'critical',
      environment: GCP_PROJECT.environment,
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Vision Processing
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VISION_PROCESSING: {
    id: 'vision-processing',
    name: `projects/${GCP_PROJECT.projectId}/topics/vision-processing`,
    description: 'Image and video analysis via Vision AI and VL-JEPA',
    subscriptionName: `projects/${GCP_PROJECT.projectId}/subscriptions/vision-worker`,
    ackDeadlineSeconds: 300,
    retryPolicy: {
      minimumBackoff: '10s',
      maximumBackoff: '600s',
    },
    deadLetterPolicy: {
      deadLetterTopic: `projects/${GCP_PROJECT.projectId}/topics/dead-letter`,
      maxDeliveryAttempts: 3,
    },
    messageRetentionDuration: '172800s', // 2 days
    labels: {
      worker: 'vision',
      tier: 'standard',
      environment: GCP_PROJECT.environment,
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // File Processing
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FILE_PROCESSING: {
    id: 'file-processing',
    name: `projects/${GCP_PROJECT.projectId}/topics/file-processing`,
    description: 'Document extraction, OCR, and file transformation',
    subscriptionName: `projects/${GCP_PROJECT.projectId}/subscriptions/file-worker`,
    ackDeadlineSeconds: 180,
    retryPolicy: {
      minimumBackoff: '5s',
      maximumBackoff: '300s',
    },
    deadLetterPolicy: {
      deadLetterTopic: `projects/${GCP_PROJECT.projectId}/topics/dead-letter`,
      maxDeliveryAttempts: 3,
    },
    messageRetentionDuration: '172800s', // 2 days
    labels: {
      worker: 'file',
      tier: 'standard',
      environment: GCP_PROJECT.environment,
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Alerts & Notifications
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ALERTS: {
    id: 'alerts',
    name: `projects/${GCP_PROJECT.projectId}/topics/alerts`,
    description: 'System alerts, notifications, and incident triggers',
    subscriptionName: `projects/${GCP_PROJECT.projectId}/subscriptions/alerts-worker`,
    ackDeadlineSeconds: 30,
    retryPolicy: {
      minimumBackoff: '1s',
      maximumBackoff: '60s',
    },
    deadLetterPolicy: {
      deadLetterTopic: `projects/${GCP_PROJECT.projectId}/topics/dead-letter`,
      maxDeliveryAttempts: 10,
    },
    messageRetentionDuration: '604800s', // 7 days
    labels: {
      worker: 'alerts',
      tier: 'critical',
      environment: GCP_PROJECT.environment,
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Agent Orchestration
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AGENT_ORCHESTRATION: {
    id: 'agent-orchestration',
    name: `projects/${GCP_PROJECT.projectId}/topics/agent-orchestration`,
    description: 'Agent fan-out, task distribution, and coordination',
    subscriptionName: `projects/${GCP_PROJECT.projectId}/subscriptions/agent-orchestrator`,
    ackDeadlineSeconds: 60,
    retryPolicy: {
      minimumBackoff: '5s',
      maximumBackoff: '300s',
    },
    messageRetentionDuration: '259200s', // 3 days
    labels: {
      worker: 'orchestration',
      tier: 'critical',
      environment: GCP_PROJECT.environment,
    },
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Dead Letter Queue
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DEAD_LETTER: {
    id: 'dead-letter',
    name: `projects/${GCP_PROJECT.projectId}/topics/dead-letter`,
    description: 'Failed messages for analysis and reprocessing',
    subscriptionName: `projects/${GCP_PROJECT.projectId}/subscriptions/dead-letter-handler`,
    ackDeadlineSeconds: 600,
    retryPolicy: {
      minimumBackoff: '60s',
      maximumBackoff: '3600s',
    },
    messageRetentionDuration: '1209600s', // 14 days
    labels: {
      worker: 'dead-letter',
      tier: 'critical',
      environment: GCP_PROJECT.environment,
    },
  },
};

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export interface PubSubMessage<T = unknown> {
  messageId: string;
  data: T;
  attributes: Record<string, string>;
  publishTime: string;
  orderingKey?: string;
}

export interface WorkerJobPayload {
  jobId: string;
  correlationId: string;
  timestamp: string;
  source: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  metadata: Record<string, unknown>;
}

// ACHEEVY Initialization
export interface ACHEEVYInitPayload extends WorkerJobPayload {
  type: 'acheevy-init';
  userId: string;
  organizationId: string;
  sessionId: string;
  contextLayers: {
    standards: string[];
    product: string[];
    specs: string[];
  };
}

// Proof Gate Validation
export interface ProofGatePayload extends WorkerJobPayload {
  type: 'proof-gate';
  gateId: string;
  conversationId: string;
  response: string;
  requirements: string[];
  contextHash: string;
}

// Vision Processing
export interface VisionPayload extends WorkerJobPayload {
  type: 'vision';
  operation: 'analyze' | 'ocr' | 'video-analysis' | 'face-detection' | 'object-detection';
  artifactUri: string;
  outputBucket: string;
  options?: Record<string, unknown>;
}

// File Processing
export interface FilePayload extends WorkerJobPayload {
  type: 'file';
  operation: 'extract' | 'transform' | 'compress' | 'merge' | 'split';
  inputUri: string;
  outputUri: string;
  format?: string;
  options?: Record<string, unknown>;
}

// Alerts
export interface AlertPayload extends WorkerJobPayload {
  type: 'alert';
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'system' | 'security' | 'performance' | 'business' | 'agent';
  title: string;
  message: string;
  context: Record<string, unknown>;
  channels: ('email' | 'slack' | 'pagerduty' | 'webhook')[];
}

// Agent Orchestration
export interface AgentOrchestrationPayload extends WorkerJobPayload {
  type: 'agent-orchestration';
  operation: 'fan-out' | 'coordinate' | 'aggregate' | 'route';
  agentRole: string;
  taskId: string;
  parentTaskId?: string;
  input: unknown;
  expectedOutput?: string;
}

// Dead Letter
export interface DeadLetterPayload extends WorkerJobPayload {
  type: 'dead-letter';
  originalTopic: string;
  originalPayload: unknown;
  errorMessage: string;
  errorStack?: string;
  failureCount: number;
  firstFailedAt: string;
}

export type AnyWorkerPayload =
  | ACHEEVYInitPayload
  | ProofGatePayload
  | VisionPayload
  | FilePayload
  | AlertPayload
  | AgentOrchestrationPayload
  | DeadLetterPayload;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getTopicConfig(topicId: string): PubSubTopicConfig | undefined {
  return Object.values(PUBSUB_TOPICS).find(t => t.id === topicId);
}

export function getAllTopics(): PubSubTopicConfig[] {
  return Object.values(PUBSUB_TOPICS);
}

export function getCriticalTopics(): PubSubTopicConfig[] {
  return Object.values(PUBSUB_TOPICS).filter(t => t.labels.tier === 'critical');
}

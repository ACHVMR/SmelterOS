/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Pub/Sub Client
 * Production Pub/Sub Publishing and Subscription Management
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { GCP_PROJECT } from '../gcp/config';
import { PUBSUB_TOPICS, PubSubMessage, AnyWorkerPayload, PubSubTopicConfig } from './config';
import { getAccessToken } from '../gcp/auth';

// =============================================================================
// TYPES
// =============================================================================

interface PublishResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface PullResult {
  success: boolean;
  messages: ReceivedMessage[];
  error?: string;
}

interface ReceivedMessage {
  ackId: string;
  message: PubSubMessage;
}

// =============================================================================
// PUB/SUB CLIENT
// =============================================================================

export class PubSubClient {
  private baseUrl = 'https://pubsub.googleapis.com/v1';
  private projectId: string;

  constructor(projectId: string = GCP_PROJECT.projectId) {
    this.projectId = projectId;
  }

  /**
   * Publish a message to a topic
   */
  async publish<T extends AnyWorkerPayload>(
    topicId: string,
    payload: T,
    attributes: Record<string, string> = {},
    orderingKey?: string
  ): Promise<PublishResult> {
    const topic = Object.values(PUBSUB_TOPICS).find(t => t.id === topicId);
    if (!topic) {
      return { success: false, error: `Unknown topic: ${topicId}` };
    }

    try {
      const accessToken = await getAccessToken();
      
      // Base64 encode the payload
      const data = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      const body = {
        messages: [{
          data,
          attributes: {
            ...attributes,
            jobId: payload.jobId,
            correlationId: payload.correlationId,
            priority: payload.priority,
            source: payload.source,
          },
          ...(orderingKey && { orderingKey }),
        }],
      };

      const response = await fetch(`${this.baseUrl}/${topic.name}:publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Publish failed: ${response.status} ${error}` };
      }

      const result = await response.json() as { messageIds?: string[] };
      return {
        success: true,
        messageId: result.messageIds?.[0],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Pull messages from a subscription (for worker processing)
   */
  async pull(
    subscriptionName: string,
    maxMessages: number = 10
  ): Promise<PullResult> {
    try {
      const accessToken = await getAccessToken();

      const response = await fetch(`${this.baseUrl}/${subscriptionName}:pull`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxMessages,
          returnImmediately: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, messages: [], error: `Pull failed: ${response.status} ${error}` };
      }

      const result = await response.json() as { receivedMessages?: Array<{ ackId: string; message: { messageId: string; data: string; attributes?: Record<string, string>; publishTime?: string; orderingKey?: string } }> };
      
      const messages: ReceivedMessage[] = (result.receivedMessages || []).map((rm) => ({
        ackId: rm.ackId,
        message: {
          messageId: rm.message.messageId,
          data: JSON.parse(Buffer.from(rm.message.data, 'base64').toString('utf-8')),
          attributes: rm.message.attributes || {},
          publishTime: rm.message.publishTime || '',
          orderingKey: rm.message.orderingKey || '',
        },
      }));

      return { success: true, messages };
    } catch (error) {
      return {
        success: false,
        messages: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Acknowledge processed messages
   */
  async acknowledge(subscriptionName: string, ackIds: string[]): Promise<{ success: boolean; error?: string }> {
    if (ackIds.length === 0) {
      return { success: true };
    }

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(`${this.baseUrl}/${subscriptionName}:acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ackIds }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Acknowledge failed: ${response.status} ${error}` };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Modify ack deadline (extend processing time)
   */
  async modifyAckDeadline(
    subscriptionName: string,
    ackIds: string[],
    ackDeadlineSeconds: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await getAccessToken();

      const response = await fetch(`${this.baseUrl}/${subscriptionName}:modifyAckDeadline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ackIds,
          ackDeadlineSeconds,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `ModifyAckDeadline failed: ${response.status} ${error}` };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a topic (for setup)
   */
  async createTopic(topicConfig: PubSubTopicConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await getAccessToken();

      const response = await fetch(`${this.baseUrl}/${topicConfig.name}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labels: topicConfig.labels,
          messageRetentionDuration: topicConfig.messageRetentionDuration,
        }),
      });

      if (!response.ok && response.status !== 409) { // 409 = already exists
        const error = await response.text();
        return { success: false, error: `CreateTopic failed: ${response.status} ${error}` };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a subscription (for setup)
   */
  async createSubscription(topicConfig: PubSubTopicConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await getAccessToken();

      const body: any = {
        topic: topicConfig.name,
        ackDeadlineSeconds: topicConfig.ackDeadlineSeconds,
        messageRetentionDuration: topicConfig.messageRetentionDuration,
        labels: topicConfig.labels,
        retryPolicy: topicConfig.retryPolicy,
      };

      if (topicConfig.deadLetterPolicy) {
        body.deadLetterPolicy = topicConfig.deadLetterPolicy;
      }

      const response = await fetch(`${this.baseUrl}/${topicConfig.subscriptionName}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok && response.status !== 409) { // 409 = already exists
        const error = await response.text();
        return { success: false, error: `CreateSubscription failed: ${response.status} ${error}` };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let pubsubClient: PubSubClient | null = null;

export function getPubSubClient(): PubSubClient {
  if (!pubsubClient) {
    pubsubClient = new PubSubClient();
  }
  return pubsubClient;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Publish to ACHEEVY initialization topic
 */
export async function publishACHEEVYInit(payload: Omit<import('./config').ACHEEVYInitPayload, 'type'>): Promise<PublishResult> {
  const client = getPubSubClient();
  return client.publish('acheevy-initialization', {
    ...payload,
    type: 'acheevy-init',
  });
}

/**
 * Publish to proof gate validation topic
 */
export async function publishProofGate(payload: Omit<import('./config').ProofGatePayload, 'type'>): Promise<PublishResult> {
  const client = getPubSubClient();
  return client.publish('proof-gate-validation', {
    ...payload,
    type: 'proof-gate',
  });
}

/**
 * Publish to vision processing topic
 */
export async function publishVision(payload: Omit<import('./config').VisionPayload, 'type'>): Promise<PublishResult> {
  const client = getPubSubClient();
  return client.publish('vision-processing', {
    ...payload,
    type: 'vision',
  });
}

/**
 * Publish to file processing topic
 */
export async function publishFile(payload: Omit<import('./config').FilePayload, 'type'>): Promise<PublishResult> {
  const client = getPubSubClient();
  return client.publish('file-processing', {
    ...payload,
    type: 'file',
  });
}

/**
 * Publish to alerts topic
 */
export async function publishAlert(payload: Omit<import('./config').AlertPayload, 'type'>): Promise<PublishResult> {
  const client = getPubSubClient();
  return client.publish('alerts', {
    ...payload,
    type: 'alert',
  });
}

/**
 * Publish to agent orchestration topic
 */
export async function publishAgentOrchestration(payload: Omit<import('./config').AgentOrchestrationPayload, 'type'>): Promise<PublishResult> {
  const client = getPubSubClient();
  return client.publish('agent-orchestration', {
    ...payload,
    type: 'agent-orchestration',
  });
}

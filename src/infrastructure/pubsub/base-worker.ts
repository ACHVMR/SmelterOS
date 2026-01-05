/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Base Worker
 * Abstract Base Class for All Async Workers
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { PubSubClient, getPubSubClient } from './client.js';
import { PubSubTopicConfig, PubSubMessage, WorkerJobPayload, AnyWorkerPayload } from './config.js';
import { DigitalBreaker } from '../circuit-box/digital-breaker.js';
import { publishAlert } from './client.js';

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

export interface WorkerResult<T = unknown> {
  success: boolean;
  jobId: string;
  data?: T;
  error?: string;
  duration: number;
  retryable: boolean;
}

export interface WorkerMetrics {
  processed: number;
  succeeded: number;
  failed: number;
  retriedTotal: number;
  avgDuration: number;
  lastProcessedAt?: Date;
}

export interface WorkerConfig {
  maxConcurrency: number;
  pollIntervalMs: number;
  maxRetries: number;
  ackExtensionIntervalMs: number;
  circuitId: string;
}

// =============================================================================
// BASE WORKER
// =============================================================================

export abstract class BaseWorker<T extends AnyWorkerPayload> {
  protected readonly name: string;
  protected readonly topicConfig: PubSubTopicConfig;
  protected readonly pubsub: PubSubClient;
  protected readonly breaker: DigitalBreaker;
  protected readonly config: WorkerConfig;
  
  protected isRunning = false;
  protected metrics: WorkerMetrics = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    retriedTotal: 0,
    avgDuration: 0,
  };

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private processingJobs: Set<string> = new Set();

  constructor(
    name: string,
    topicConfig: PubSubTopicConfig,
    config: Partial<WorkerConfig> = {}
  ) {
    this.name = name;
    this.topicConfig = topicConfig;
    this.pubsub = getPubSubClient();
    this.breaker = DigitalBreaker.getInstance();
    this.config = {
      maxConcurrency: config.maxConcurrency ?? 10,
      pollIntervalMs: config.pollIntervalMs ?? 1000,
      maxRetries: config.maxRetries ?? 3,
      ackExtensionIntervalMs: config.ackExtensionIntervalMs ?? 30000,
      circuitId: config.circuitId ?? topicConfig.id,
    };
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`⚠️ Worker ${this.name} is already running`);
      return;
    }

    // Check circuit breaker
    const circuit = this.breaker.getCircuit(this.config.circuitId);
    if (circuit?.breaker.state === 'off' || circuit?.breaker.state === 'tripped') {
      console.log(`⚠️ Worker ${this.name} circuit is ${circuit.breaker.state}, not starting`);
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting worker: ${this.name}`);
    console.log(`   Topic: ${this.topicConfig.id}`);
    console.log(`   Subscription: ${this.topicConfig.subscriptionName}`);
    console.log(`   Max Concurrency: ${this.config.maxConcurrency}`);

    // Start polling
    this.pollTimer = setInterval(() => this.poll(), this.config.pollIntervalMs);
    
    // Initial poll
    await this.poll();
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log(`🛑 Stopping worker: ${this.name}`);
    this.isRunning = false;

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    // Wait for in-flight jobs to complete
    const maxWait = 30000;
    const startWait = Date.now();
    while (this.processingJobs.size > 0 && Date.now() - startWait < maxWait) {
      console.log(`   Waiting for ${this.processingJobs.size} jobs to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`   ✓ Worker ${this.name} stopped`);
  }

  /**
   * Poll for messages
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    // Check capacity
    const available = this.config.maxConcurrency - this.processingJobs.size;
    if (available <= 0) return;

    // Check circuit breaker
    const circuit = this.breaker.getCircuit(this.config.circuitId);
    if (circuit?.breaker.state === 'off' || circuit?.breaker.state === 'tripped') {
      return;
    }

    try {
      const result = await this.pubsub.pull(this.topicConfig.subscriptionName, available);
      
      if (!result.success) {
        console.error(`❌ ${this.name} poll error:`, result.error);
        this.breaker.reportError(this.config.circuitId, new Error(result.error));
        return;
      }

      // Process messages concurrently
      for (const msg of result.messages) {
        this.processMessage(msg.ackId, msg.message as PubSubMessage<T>);
      }
    } catch (error) {
      console.error(`❌ ${this.name} poll exception:`, error);
      this.breaker.reportError(this.config.circuitId, error as Error);
    }
  }

  /**
   * Process a single message
   */
  private async processMessage(ackId: string, message: PubSubMessage<T>): Promise<void> {
    const jobId = message.data.jobId || message.messageId;
    this.processingJobs.add(jobId);

    const startTime = Date.now();
    let ackExtender: ReturnType<typeof setInterval> | null = null;

    try {
      // Start ack deadline extension
      ackExtender = setInterval(async () => {
        await this.pubsub.modifyAckDeadline(
          this.topicConfig.subscriptionName,
          [ackId],
          this.topicConfig.ackDeadlineSeconds
        );
      }, this.config.ackExtensionIntervalMs);

      // Process the job
      console.log(`📥 ${this.name} processing job ${jobId}`);
      const result = await this.process(message.data, message);
      const duration = Date.now() - startTime;

      // Update metrics
      this.metrics.processed++;
      this.metrics.avgDuration = 
        (this.metrics.avgDuration * (this.metrics.processed - 1) + duration) / this.metrics.processed;
      this.metrics.lastProcessedAt = new Date();

      if (result.success) {
        this.metrics.succeeded++;
        console.log(`✅ ${this.name} job ${jobId} completed in ${duration}ms`);
        
        // Acknowledge the message
        await this.pubsub.acknowledge(this.topicConfig.subscriptionName, [ackId]);
      } else {
        this.metrics.failed++;
        console.error(`❌ ${this.name} job ${jobId} failed: ${result.error}`);
        
        // Report error to circuit breaker
        this.breaker.reportError(this.config.circuitId, new Error(result.error));

        // If retryable, don't ack - let it retry via dead letter policy
        if (!result.retryable) {
          await this.pubsub.acknowledge(this.topicConfig.subscriptionName, [ackId]);
        }

        // Publish alert for critical failures
        if (!result.retryable || message.data.priority === 'critical') {
          await publishAlert({
            jobId: generateUUID(),
            correlationId: message.data.correlationId,
            timestamp: new Date().toISOString(),
            source: this.name,
            priority: 'high',
            metadata: { originalJobId: jobId },
            severity: 'error',
            category: 'system',
            title: `Worker ${this.name} Job Failed`,
            message: result.error || 'Unknown error',
            context: { jobId, duration, payload: message.data },
            channels: ['slack'],
          });
        }
      }
    } catch (error) {
      console.error(`❌ ${this.name} job ${jobId} exception:`, error);
      this.metrics.failed++;
      this.breaker.reportError(this.config.circuitId, error as Error);
    } finally {
      if (ackExtender) {
        clearInterval(ackExtender);
      }
      this.processingJobs.delete(jobId);
    }
  }

  /**
   * Abstract method - implement in subclass
   */
  protected abstract process(payload: T, message: PubSubMessage<T>): Promise<WorkerResult>;

  /**
   * Get worker metrics
   */
  getMetrics(): WorkerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get worker status
   */
  getStatus(): { isRunning: boolean; processingCount: number; metrics: WorkerMetrics } {
    return {
      isRunning: this.isRunning,
      processingCount: this.processingJobs.size,
      metrics: this.getMetrics(),
    };
  }
}

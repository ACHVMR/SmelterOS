/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Dead Letter Worker
 * Captures, logs, and enables forensics for failed messages
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { BaseWorker, WorkerResult } from '../base-worker.js';
import { PUBSUB_TOPICS, PubSubMessage, WorkerJobPayload } from '../config.js';
import { getFirestoreClient } from '../../database/firestore-client.js';

// =============================================================================
// TYPES
// =============================================================================

export interface DeadLetterPayload extends WorkerJobPayload {
  type: 'dead-letter';
  originalTopic: string;
  originalPayload: unknown;
  errorMessage: string;
  errorStack?: string;
  failureCount: number;
  firstFailedAt: string;
}

export interface DeadLetterRecord {
  id: string;
  originalTopic: string;
  originalPayload: unknown;
  errorMessage: string;
  errorStack?: string;
  failureCount: number;
  firstFailedAt: string;
  lastFailedAt: string;
  source: string;
  priority: string;
  status: 'pending' | 'analyzed' | 'reprocessed' | 'discarded';
  analysisNotes?: string;
  reprocessedAt?: string;
}

export interface DeadLetterResult {
  id: string;
  recorded: boolean;
  alertTriggered: boolean;
  hourlyFailureCount: number;
  timestamp: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ALERT_THRESHOLD = 5; // Trigger alert if >5 failures per hour
const AUDIT_COLLECTION = 'audit-logs';
const DEAD_LETTER_COLLECTION = 'dead-letter-records';

// =============================================================================
// WORKER
// =============================================================================

export class DeadLetterWorker extends BaseWorker<DeadLetterPayload> {
  private hourlyFailures: Map<string, number> = new Map();
  private lastHourReset: number = Date.now();

  constructor() {
    super('dead-letter', PUBSUB_TOPICS.DEAD_LETTER, {
      maxConcurrency: 5,
      pollIntervalMs: 1000,
      circuitId: 'dead-letter',
    });
  }

  protected async process(
    payload: DeadLetterPayload,
    message: PubSubMessage<DeadLetterPayload>
  ): Promise<WorkerResult<DeadLetterResult>> {
    const startTime = Date.now();

    console.log(`💀 Dead Letter received`);
    console.log(`   Original Topic: ${payload.originalTopic}`);
    console.log(`   Error: ${payload.errorMessage}`);
    console.log(`   Failure Count: ${payload.failureCount}`);
    console.log(`   Source: ${payload.source}`);

    try {
      // Reset hourly counter if needed
      this.resetHourlyCounterIfNeeded();

      // Record to Firestore for forensics
      const recordId = await this.recordDeadLetter(payload);

      // Log to audit trail
      await this.logToAudit(payload, recordId);

      // Track hourly failures
      const hourlyCount = this.trackHourlyFailure(payload.originalTopic);

      // Check alert threshold
      let alertTriggered = false;
      if (hourlyCount > ALERT_THRESHOLD) {
        alertTriggered = true;
        await this.triggerAlert(payload, hourlyCount);
      }

      console.log(`   ✓ Recorded: ${recordId}`);
      console.log(`   ✓ Hourly failures for ${payload.originalTopic}: ${hourlyCount}`);
      if (alertTriggered) {
        console.log(`   🚨 Alert triggered (>${ALERT_THRESHOLD} failures/hour)`);
      }

      return {
        success: true,
        jobId: payload.jobId,
        data: {
          id: recordId,
          recorded: true,
          alertTriggered,
          hourlyFailureCount: hourlyCount,
          timestamp: new Date().toISOString(),
        },
        duration: Date.now() - startTime,
        retryable: false,
      };
    } catch (error) {
      console.error(`   ✗ Failed to process dead letter:`, error);

      // Even the dead letter handler failed - log to console as last resort
      console.error('CRITICAL: Dead letter handler failed:', {
        payload,
        error: error instanceof Error ? error.message : error,
      });

      return {
        success: false,
        jobId: payload.jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        retryable: false, // Don't retry dead letter processing
      };
    }
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Record dead letter to Firestore for forensics
   */
  private async recordDeadLetter(payload: DeadLetterPayload): Promise<string> {
    const firestore = getFirestoreClient();
    const recordId = `dl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const record: DeadLetterRecord = {
      id: recordId,
      originalTopic: payload.originalTopic,
      originalPayload: payload.originalPayload,
      errorMessage: payload.errorMessage,
      errorStack: payload.errorStack,
      failureCount: payload.failureCount,
      firstFailedAt: payload.firstFailedAt,
      lastFailedAt: new Date().toISOString(),
      source: payload.source,
      priority: payload.priority,
      status: 'pending',
    };

    await firestore.setDocument(DEAD_LETTER_COLLECTION, recordId, record);

    return recordId;
  }

  /**
   * Log to audit trail
   */
  private async logToAudit(payload: DeadLetterPayload, recordId: string): Promise<void> {
    const firestore = getFirestoreClient();
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await firestore.setDocument(AUDIT_COLLECTION, auditId, {
      id: auditId,
      type: 'dead-letter',
      severity: 'error',
      category: 'worker-failure',
      recordId,
      originalTopic: payload.originalTopic,
      errorMessage: payload.errorMessage,
      source: payload.source,
      timestamp: new Date().toISOString(),
      metadata: {
        failureCount: payload.failureCount,
        firstFailedAt: payload.firstFailedAt,
        jobId: payload.jobId,
        correlationId: payload.correlationId,
      },
    });
  }

  /**
   * Track hourly failure count
   */
  private trackHourlyFailure(topic: string): number {
    const current = this.hourlyFailures.get(topic) || 0;
    const updated = current + 1;
    this.hourlyFailures.set(topic, updated);
    return updated;
  }

  /**
   * Reset hourly counter if an hour has passed
   */
  private resetHourlyCounterIfNeeded(): void {
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;

    if (now - this.lastHourReset > hourInMs) {
      this.hourlyFailures.clear();
      this.lastHourReset = now;
      console.log(`   ⏰ Hourly failure counters reset`);
    }
  }

  /**
   * Trigger alert for high failure rate
   */
  private async triggerAlert(payload: DeadLetterPayload, hourlyCount: number): Promise<void> {
    const firestore = getFirestoreClient();
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await firestore.setDocument('alerts', alertId, {
      id: alertId,
      type: 'high-failure-rate',
      severity: 'critical',
      title: `High Failure Rate: ${payload.originalTopic}`,
      message: `${hourlyCount} failures in the past hour for topic ${payload.originalTopic}`,
      topic: payload.originalTopic,
      hourlyFailureCount: hourlyCount,
      threshold: ALERT_THRESHOLD,
      lastError: payload.errorMessage,
      status: 'active',
      createdAt: new Date().toISOString(),
      channels: ['slack', 'pagerduty'],
    });

    // Log critical alert
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    🚨 CRITICAL ALERT 🚨                       ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║ Topic: ${payload.originalTopic.padEnd(53)}║`);
    console.log(`║ Failures/Hour: ${hourlyCount.toString().padEnd(46)}║`);
    console.log(`║ Last Error: ${payload.errorMessage.substring(0, 47).padEnd(49)}║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
  }

  // ===========================================================================
  // PUBLIC API FOR MANUAL REPROCESSING
  // ===========================================================================

  /**
   * Get all pending dead letters for manual review
   */
  async getPendingDeadLetters(): Promise<DeadLetterRecord[]> {
    const firestore = getFirestoreClient();
    
    const result = await firestore.query<DeadLetterRecord>(
      DEAD_LETTER_COLLECTION,
      {
        filters: [{ field: 'status', op: 'EQUAL', value: 'pending' }],
        limit: 100,
      }
    );

    return result.data;
  }

  /**
   * Mark a dead letter as analyzed with notes
   */
  async markAsAnalyzed(recordId: string, notes: string): Promise<void> {
    const firestore = getFirestoreClient();

    await firestore.updateDocument(DEAD_LETTER_COLLECTION, recordId, {
      status: 'analyzed',
      analysisNotes: notes,
    });
  }

  /**
   * Mark a dead letter as reprocessed
   */
  async markAsReprocessed(recordId: string): Promise<void> {
    const firestore = getFirestoreClient();

    await firestore.updateDocument(DEAD_LETTER_COLLECTION, recordId, {
      status: 'reprocessed',
      reprocessedAt: new Date().toISOString(),
    });
  }

  /**
   * Discard a dead letter (won't be reprocessed)
   */
  async markAsDiscarded(recordId: string, reason: string): Promise<void> {
    const firestore = getFirestoreClient();

    await firestore.updateDocument(DEAD_LETTER_COLLECTION, recordId, {
      status: 'discarded',
      analysisNotes: `Discarded: ${reason}`,
    });
  }

  /**
   * Get failure statistics
   */
  getFailureStats(): { topic: string; count: number }[] {
    const stats: { topic: string; count: number }[] = [];
    
    for (const [topic, count] of this.hourlyFailures) {
      stats.push({ topic, count });
    }

    return stats.sort((a, b) => b.count - a.count);
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let workerInstance: DeadLetterWorker | null = null;

export function getDeadLetterWorker(): DeadLetterWorker {
  if (!workerInstance) {
    workerInstance = new DeadLetterWorker();
  }
  return workerInstance;
}

export { DeadLetterWorker as default };

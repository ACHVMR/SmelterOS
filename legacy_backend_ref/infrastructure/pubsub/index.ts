/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Pub/Sub Workers Index
 * Export all workers and orchestration utilities
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Config
export * from './config';

// Client
export * from './client';

// Base Worker
export * from './base-worker';

// Workers
export { getACHEEVYInitWorker, ACHEEVYInitWorker } from './workers/acheevy-init.worker';
export { getProofGateWorker, ProofGateWorker } from './workers/proof-gate.worker';
export { getVisionWorker, VisionWorker } from './workers/vision.worker';
export { getFileWorker, FileWorker } from './workers/file.worker';
export { getAlertsWorker, AlertsWorker } from './workers/alerts.worker';
export { getAgentOrchestrationWorker, AgentOrchestrationWorker } from './workers/agent-orchestration.worker';
export { getDeadLetterWorker, DeadLetterWorker } from './workers/dead-letter.worker';

// =============================================================================
// WORKER ORCHESTRATOR
// =============================================================================

import { getACHEEVYInitWorker } from './workers/acheevy-init.worker';
import { getProofGateWorker } from './workers/proof-gate.worker';
import { getVisionWorker } from './workers/vision.worker';
import { getFileWorker } from './workers/file.worker';
import { getAlertsWorker } from './workers/alerts.worker';
import { getAgentOrchestrationWorker } from './workers/agent-orchestration.worker';
import { getDeadLetterWorker } from './workers/dead-letter.worker';
import { BaseWorker } from './base-worker';
import { AnyWorkerPayload } from './config';

export class WorkerOrchestrator {
  private workers: BaseWorker<AnyWorkerPayload>[] = [];
  private isRunning = false;

  /**
   * Start all workers
   */
  async startAll(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Workers already running');
      return;
    }

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║               SMELTER OS WORKER ORCHESTRATOR                   ║');
    console.log('║                   Starting All Workers                         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');

    this.workers = [
      getACHEEVYInitWorker() as BaseWorker<AnyWorkerPayload>,
      getProofGateWorker() as BaseWorker<AnyWorkerPayload>,
      getVisionWorker() as BaseWorker<AnyWorkerPayload>,
      getFileWorker() as BaseWorker<AnyWorkerPayload>,
      getAlertsWorker() as BaseWorker<AnyWorkerPayload>,
      getAgentOrchestrationWorker() as BaseWorker<AnyWorkerPayload>,
      getDeadLetterWorker() as BaseWorker<AnyWorkerPayload>,
    ];

    await Promise.all(this.workers.map(w => w.start()));

    this.isRunning = true;
    console.log('');
    console.log('✅ All workers started');
    console.log('');
  }

  /**
   * Stop all workers
   */
  async stopAll(): Promise<void> {
    if (!this.isRunning) return;

    console.log('');
    console.log('🛑 Stopping all workers...');

    await Promise.all(this.workers.map(w => w.stop()));

    this.isRunning = false;
    console.log('✅ All workers stopped');
    console.log('');
  }

  /**
   * Get status of all workers
   */
  getStatus(): Record<string, ReturnType<BaseWorker<AnyWorkerPayload>['getStatus']>> {
    const status: Record<string, ReturnType<BaseWorker<AnyWorkerPayload>['getStatus']>> = {};
    
    for (const worker of this.workers) {
      status[(worker as any).name] = worker.getStatus();
    }

    return status;
  }

  /**
   * Get aggregated metrics
   */
  getMetrics(): {
    totalProcessed: number;
    totalSucceeded: number;
    totalFailed: number;
    avgDuration: number;
    workerCount: number;
    activeJobs: number;
  } {
    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    let totalDuration = 0;
    let activeJobs = 0;

    for (const worker of this.workers) {
      const status = worker.getStatus();
      totalProcessed += status.metrics.processed;
      totalSucceeded += status.metrics.succeeded;
      totalFailed += status.metrics.failed;
      totalDuration += status.metrics.avgDuration * status.metrics.processed;
      activeJobs += status.processingCount;
    }

    return {
      totalProcessed,
      totalSucceeded,
      totalFailed,
      avgDuration: totalProcessed > 0 ? totalDuration / totalProcessed : 0,
      workerCount: this.workers.length,
      activeJobs,
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let orchestrator: WorkerOrchestrator | null = null;

export function getWorkerOrchestrator(): WorkerOrchestrator {
  if (!orchestrator) {
    orchestrator = new WorkerOrchestrator();
  }
  return orchestrator;
}

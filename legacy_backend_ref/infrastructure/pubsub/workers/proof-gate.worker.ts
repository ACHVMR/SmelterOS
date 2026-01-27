/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Proof Gate Validation Worker
 * V.I.B.E. Async Proof Gate Processing
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { BaseWorker, WorkerResult } from '../base-worker.js';
import { PUBSUB_TOPICS, ProofGatePayload, PubSubMessage } from '../config.js';
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

interface ProofGateResult {
  id: string;
  gateId: string;
  passed: boolean;
  score: number;
  validationDetails: ValidationDetail[];
  timestamp: string;
}

interface ValidationDetail {
  requirement: string;
  passed: boolean;
  score: number;
  reason: string;
}

// =============================================================================
// WORKER
// =============================================================================

export class ProofGateWorker extends BaseWorker<ProofGatePayload> {
  constructor() {
    super('proof-gate', PUBSUB_TOPICS.PROOF_GATE_VALIDATION, {
      maxConcurrency: 20,
      pollIntervalMs: 200,
      circuitId: 'proof-gate',
    });
  }

  protected async process(
    payload: ProofGatePayload,
    message: PubSubMessage<ProofGatePayload>
  ): Promise<WorkerResult<ProofGateResult>> {
    const startTime = Date.now();

    try {
      console.log(`🔐 Validating proof gate: ${payload.gateId}`);
      console.log(`   Conversation: ${payload.conversationId}`);
      console.log(`   Requirements: ${payload.requirements.length}`);

      // Validate each requirement
      const validationDetails: ValidationDetail[] = await Promise.all(
        payload.requirements.map(req => this.validateRequirement(req, payload.response))
      );

      // Calculate overall score
      const passedCount = validationDetails.filter(v => v.passed).length;
      const overallScore = passedCount / validationDetails.length;
      const passed = overallScore >= 0.8; // 80% threshold

      const result: ProofGateResult = {
        id: payload.gateId,
        gateId: payload.gateId,
        passed,
        score: overallScore,
        validationDetails,
        timestamp: new Date().toISOString(),
      };

      // Persist result to Firestore
      const firestore = getFirestoreClient();
      await firestore.setDocument(
        'proof-gates',
        payload.gateId,
        {
          ...result,
          conversationId: payload.conversationId,
          contextHash: payload.contextHash,
          jobId: payload.jobId,
        }
      );

      // Update conversation with gate result
      await firestore.updateDocument(
        'conversations',
        payload.conversationId,
        {
          [`proofGates.${payload.gateId}`]: {
            passed,
            score: overallScore,
            validatedAt: new Date().toISOString(),
          },
        }
      );

      console.log(`   ${passed ? '✓' : '✗'} Gate ${passed ? 'PASSED' : 'FAILED'} (${(overallScore * 100).toFixed(1)}%)`);

      return {
        success: true,
        jobId: payload.jobId,
        data: result,
        duration: Date.now() - startTime,
        retryable: false,
      };
    } catch (error) {
      console.error(`   ✗ Proof gate validation failed:`, error);
      return {
        success: false,
        jobId: payload.jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        retryable: true,
      };
    }
  }

  private async validateRequirement(requirement: string, response: string): Promise<ValidationDetail> {
    // V.I.B.E. validation logic
    // Vision - Is the response aligned with the vision/goal?
    // Intent - Does it address the user's intent?
    // Behavior - Are the suggested behaviors appropriate?
    // Ethics - Does it follow ethical guidelines?

    const requirementLower = requirement.toLowerCase();
    const responseLower = response.toLowerCase();

    // Simple keyword matching for now - replace with LLM-based validation
    let score = 0;
    let reason = '';

    // Check for requirement keywords in response
    const keywords = requirementLower.split(' ').filter(w => w.length > 3);
    const matchedKeywords = keywords.filter(kw => responseLower.includes(kw));
    const keywordScore = matchedKeywords.length / Math.max(keywords.length, 1);

    // Length check - response should be substantive
    const lengthScore = Math.min(response.length / 500, 1);

    // Combine scores
    score = keywordScore * 0.6 + lengthScore * 0.4;

    if (score >= 0.7) {
      reason = 'Requirement adequately addressed';
    } else if (score >= 0.4) {
      reason = 'Requirement partially addressed';
    } else {
      reason = 'Requirement not sufficiently addressed';
    }

    return {
      requirement,
      passed: score >= 0.6,
      score,
      reason,
    };
  }
}

// =============================================================================
// FACTORY
// =============================================================================

let worker: ProofGateWorker | null = null;

export function getProofGateWorker(): ProofGateWorker {
  if (!worker) {
    worker = new ProofGateWorker();
  }
  return worker;
}

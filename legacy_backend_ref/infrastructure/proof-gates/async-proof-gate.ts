/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Async Proof Gate System
 * Pub/Sub-Based Background Validation for Zero-Latency Request Paths
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PRODUCTION ARCHITECTURE:
 * 1. Request path writes immediately, returns to user in <50ms
 * 2. Pub/Sub message triggers background validation
 * 3. Cloud Function validates and updates Firestore status
 * 4. UI polls Firestore status (or uses real-time listeners)
 * 
 * NO SYNCHRONOUS BLOCKING ALLOWED ON REQUEST PATH
 */

import { getAuthHeaders, buildPubSubEndpoint, buildFirestoreEndpoint } from '../gcp/auth';
import { GCP_PROJECT } from '../gcp/config';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ProofGatePhase = 
  | 'brainstorm'
  | 'plan'
  | 'design'
  | 'build'
  | 'test'
  | 'deploy'
  | 'verify';

export type ProofGateStatus = 
  | 'pending'        // Validation not started
  | 'validating'     // Background worker processing
  | 'passed'         // Validation successful
  | 'failed'         // Validation failed
  | 'skipped'        // Validation not required for this phase
  | 'retry';         // Retry requested

export interface ProofGateRequest {
  circuitId: string;
  phase: ProofGatePhase;
  tenantId: string;
  checkpoint: string;
  metadata?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

export interface ProofGateResult {
  gateId: string;
  circuitId: string;
  phase: ProofGatePhase;
  status: ProofGateStatus;
  checkpoint: string;
  validatedAt?: Date;
  validationDurationMs?: number;
  errors?: string[];
  warnings?: string[];
  artifacts?: string[];
}

export interface ProofGateFirestoreDoc {
  gateId: string;
  circuitId: string;
  tenantId: string;
  phase: ProofGatePhase;
  checkpoint: string;
  status: ProofGateStatus;
  createdAt: string;
  updatedAt: string;
  validatedAt?: string;
  validationDurationMs?: number;
  errors?: string[];
  warnings?: string[];
  artifacts?: string[];
  retryCount: number;
  priority: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUB/SUB TOPICS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PROOF_GATE_TOPICS = {
  // Main validation topic (triggers Cloud Function)
  VALIDATION_REQUEST: 'smelter-proof-gate-validation',
  
  // Dead letter topic for failed validations
  VALIDATION_DLQ: 'smelter-proof-gate-dlq',
  
  // Notification topic for status updates
  STATUS_UPDATE: 'smelter-proof-gate-status',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIRESTORE COLLECTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PROOF_GATE_COLLECTIONS = {
  // Main gate status collection
  GATES: 'proof_gates',
  
  // Validation history (for audit)
  HISTORY: 'proof_gate_history',
  
  // Evidence artifacts
  ARTIFACTS: 'proof_artifacts',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ASYNC PROOF GATE CLIENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class AsyncProofGateClient {
  private projectId: string;

  constructor() {
    this.projectId = GCP_PROJECT.projectId;
  }

  /**
   * Trigger async validation (returns immediately, <5ms)
   * This is the ONLY method that should be called from request paths
   */
  async triggerValidation(request: ProofGateRequest): Promise<ProofGateResult> {
    const gateId = `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Step 1: Write pending status to Firestore (fast path)
    const firestoreDoc: ProofGateFirestoreDoc = {
      gateId,
      circuitId: request.circuitId,
      tenantId: request.tenantId,
      phase: request.phase,
      checkpoint: request.checkpoint,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      priority: request.priority || 'normal',
    };

    await this.writeToFirestore(firestoreDoc);

    // Step 2: Publish to Pub/Sub (triggers background worker)
    // This does NOT block the request - returns immediately
    this.publishValidationRequest({
      gateId,
      ...request,
    }).catch((error) => {
      // Log error but don't fail the request
      console.error('[ProofGate] Pub/Sub publish failed:', error);
    });

    // Step 3: Return immediately with pending status
    return {
      gateId,
      circuitId: request.circuitId,
      phase: request.phase,
      status: 'pending',
      checkpoint: request.checkpoint,
    };
  }

  /**
   * Get current gate status (for UI polling)
   */
  async getGateStatus(gateId: string): Promise<ProofGateResult | null> {
    try {
      const headers = await getAuthHeaders();
      const endpoint = buildFirestoreEndpoint(PROOF_GATE_COLLECTIONS.GATES, gateId);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Firestore read failed: ${response.status}`);
      }

      const doc = await response.json() as { fields: Record<string, { stringValue?: string; integerValue?: string; arrayValue?: { values?: Array<{ stringValue: string }> } }> };
      
      return this.parseFirestoreDoc(doc.fields);
    } catch (error) {
      console.error('[ProofGate] Status fetch failed:', error);
      return null;
    }
  }

  /**
   * Get all gates for a circuit (for dashboard)
   */
  async getCircuitGates(circuitId: string, tenantId: string): Promise<ProofGateResult[]> {
    try {
      const headers = await getAuthHeaders();
      const endpoint = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents:runQuery`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: PROOF_GATE_COLLECTIONS.GATES }],
            where: {
              compositeFilter: {
                op: 'AND',
                filters: [
                  {
                    fieldFilter: {
                      field: { fieldPath: 'circuitId' },
                      op: 'EQUAL',
                      value: { stringValue: circuitId },
                    },
                  },
                  {
                    fieldFilter: {
                      field: { fieldPath: 'tenantId' },
                      op: 'EQUAL',
                      value: { stringValue: tenantId },
                    },
                  },
                ],
              },
            },
            orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
            limit: 100,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Firestore query failed: ${response.status}`);
      }

      const results = await response.json() as Array<{ document?: { fields: Record<string, unknown> } }>;
      
      return results
        .filter((r) => r.document)
        .map((r) => this.parseFirestoreDoc(r.document!.fields as Record<string, { stringValue?: string; integerValue?: string; arrayValue?: { values?: Array<{ stringValue: string }> } }>));
    } catch (error) {
      console.error('[ProofGate] Circuit gates fetch failed:', error);
      return [];
    }
  }

  /**
   * Retry a failed validation
   */
  async retryValidation(gateId: string): Promise<ProofGateResult | null> {
    const existing = await this.getGateStatus(gateId);
    if (!existing || existing.status !== 'failed') {
      return null;
    }

    // Update status to retry and republish
    await this.updateGateStatus(gateId, 'retry');

    // Republish validation request
    await this.publishValidationRequest({
      gateId,
      circuitId: existing.circuitId,
      phase: existing.phase,
      checkpoint: existing.checkpoint,
      tenantId: '', // Will be read from Firestore by worker
    });

    return {
      ...existing,
      status: 'retry',
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRIVATE METHODS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Write gate document to Firestore
   */
  private async writeToFirestore(doc: ProofGateFirestoreDoc): Promise<void> {
    const headers = await getAuthHeaders();
    const endpoint = `${buildFirestoreEndpoint(PROOF_GATE_COLLECTIONS.GATES)}?documentId=${doc.gateId}`;

    const firestoreFields: Record<string, unknown> = {
      gateId: { stringValue: doc.gateId },
      circuitId: { stringValue: doc.circuitId },
      tenantId: { stringValue: doc.tenantId },
      phase: { stringValue: doc.phase },
      checkpoint: { stringValue: doc.checkpoint },
      status: { stringValue: doc.status },
      createdAt: { stringValue: doc.createdAt },
      updatedAt: { stringValue: doc.updatedAt },
      retryCount: { integerValue: doc.retryCount.toString() },
      priority: { stringValue: doc.priority },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields: firestoreFields }),
    });

    if (!response.ok) {
      throw new Error(`Firestore write failed: ${response.status}`);
    }
  }

  /**
   * Update gate status in Firestore
   */
  private async updateGateStatus(gateId: string, status: ProofGateStatus): Promise<void> {
    const headers = await getAuthHeaders();
    const endpoint = `${buildFirestoreEndpoint(PROOF_GATE_COLLECTIONS.GATES, gateId)}?updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt`;

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        fields: {
          status: { stringValue: status },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Firestore update failed: ${response.status}`);
    }
  }

  /**
   * Publish validation request to Pub/Sub
   * NOTE: This is fire-and-forget from the request path perspective
   */
  private async publishValidationRequest(request: ProofGateRequest & { gateId: string }): Promise<void> {
    const headers = await getAuthHeaders();
    const endpoint = buildPubSubEndpoint(PROOF_GATE_TOPICS.VALIDATION_REQUEST);

    const message = Buffer.from(JSON.stringify(request)).toString('base64');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [
          {
            data: message,
            attributes: {
              gateId: request.gateId,
              phase: request.phase,
              priority: request.priority || 'normal',
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Pub/Sub publish failed: ${response.status}`);
    }
  }

  /**
   * Parse Firestore document to ProofGateResult
   */
  private parseFirestoreDoc(fields: Record<string, { stringValue?: string; integerValue?: string; arrayValue?: { values?: Array<{ stringValue: string }> } }>): ProofGateResult {
    return {
      gateId: fields.gateId?.stringValue || '',
      circuitId: fields.circuitId?.stringValue || '',
      phase: (fields.phase?.stringValue || 'brainstorm') as ProofGatePhase,
      status: (fields.status?.stringValue || 'pending') as ProofGateStatus,
      checkpoint: fields.checkpoint?.stringValue || '',
      validatedAt: fields.validatedAt?.stringValue ? new Date(fields.validatedAt.stringValue) : undefined,
      validationDurationMs: fields.validationDurationMs?.integerValue 
        ? parseInt(fields.validationDurationMs.integerValue) 
        : undefined,
      errors: fields.errors?.arrayValue?.values?.map((v) => v.stringValue) || [],
      warnings: fields.warnings?.arrayValue?.values?.map((v) => v.stringValue) || [],
      artifacts: fields.artifacts?.arrayValue?.values?.map((v) => v.stringValue) || [],
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLOUD FUNCTION: PROOF GATE WORKER
// This would be deployed as a separate Cloud Function triggered by Pub/Sub
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ProofGateWorkerMessage {
  gateId: string;
  circuitId: string;
  phase: ProofGatePhase;
  checkpoint: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cloud Function handler for proof gate validation
 * Deploy this as: gcloud functions deploy proof-gate-worker --trigger-topic=smelter-proof-gate-validation
 */
export async function proofGateWorkerHandler(message: {
  data: string;
  attributes: Record<string, string>;
}): Promise<void> {
  const startTime = Date.now();
  
  // Decode message
  const data = JSON.parse(
    Buffer.from(message.data, 'base64').toString()
  ) as ProofGateWorkerMessage;

  console.log(`[ProofGateWorker] Processing gate: ${data.gateId}, phase: ${data.phase}`);

  try {
    // Update status to validating
    await updateGateInFirestore(data.gateId, {
      status: 'validating',
      updatedAt: new Date().toISOString(),
    });

    // Run actual validation logic
    const validationResult = await runValidationChecks(data);

    // Calculate duration
    const durationMs = Date.now() - startTime;

    // Update final status
    await updateGateInFirestore(data.gateId, {
      status: validationResult.passed ? 'passed' : 'failed',
      validatedAt: new Date().toISOString(),
      validationDurationMs: durationMs,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      artifacts: validationResult.artifacts,
      updatedAt: new Date().toISOString(),
    });

    console.log(`[ProofGateWorker] Gate ${data.gateId} ${validationResult.passed ? 'PASSED' : 'FAILED'} in ${durationMs}ms`);

    // Publish status update notification (for real-time UI updates)
    await publishStatusUpdate(data.gateId, validationResult.passed ? 'passed' : 'failed');

  } catch (error) {
    console.error(`[ProofGateWorker] Validation failed for gate ${data.gateId}:`, error);

    await updateGateInFirestore(data.gateId, {
      status: 'failed',
      errors: [(error as Error).message],
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Run validation checks for a phase
 * This is where actual business logic goes
 */
async function runValidationChecks(data: ProofGateWorkerMessage): Promise<{
  passed: boolean;
  errors: string[];
  warnings: string[];
  artifacts: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const artifacts: string[] = [];

  // Phase-specific validation rules
  switch (data.phase) {
    case 'brainstorm':
      // Validate brainstorm has required fields
      if (!data.metadata?.['title']) {
        errors.push('Brainstorm must have a title');
      }
      if (!data.metadata?.['description']) {
        warnings.push('Description is recommended for brainstorm');
      }
      break;

    case 'plan':
      // Validate plan has tasks
      const taskCount = (data.metadata?.['tasks'] as unknown[] | undefined)?.length || 0;
      if (taskCount === 0) {
        errors.push('Plan must have at least one task');
      }
      break;

    case 'design':
      // Validate design has component specs
      if (!data.metadata?.['designTokens']) {
        warnings.push('Design tokens not specified, using defaults');
      }
      break;

    case 'build':
      // Validate build has code artifacts
      if (!data.metadata?.['buildArtifacts']) {
        errors.push('Build must produce artifacts');
      }
      break;

    case 'test':
      // Validate tests passed
      const testsPassed = data.metadata?.['testsPassed'] as boolean | undefined;
      if (testsPassed === false) {
        errors.push('Tests must pass before proceeding');
      }
      break;

    case 'deploy':
      // Validate deployment target
      if (!data.metadata?.['deployTarget']) {
        errors.push('Deployment target must be specified');
      }
      break;

    case 'verify':
      // Final verification
      if (!data.metadata?.['signoff']) {
        warnings.push('Signoff recommended for verification phase');
      }
      break;
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    artifacts,
  };
}

/**
 * Helper: Update gate in Firestore (used by worker)
 */
async function updateGateInFirestore(
  gateId: string,
  updates: Partial<ProofGateFirestoreDoc>
): Promise<void> {
  const headers = await getAuthHeaders();
  
  const fieldPaths = Object.keys(updates).map((k) => `updateMask.fieldPaths=${k}`).join('&');
  const endpoint = `${buildFirestoreEndpoint(PROOF_GATE_COLLECTIONS.GATES, gateId)}?${fieldPaths}`;

  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = { integerValue: value.toString() };
    } else if (Array.isArray(value)) {
      fields[key] = { arrayValue: { values: value.map((v) => ({ stringValue: v })) } };
    }
  }

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    throw new Error(`Firestore update failed: ${response.status}`);
  }
}

/**
 * Helper: Publish status update notification
 */
async function publishStatusUpdate(gateId: string, status: ProofGateStatus): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    const endpoint = buildPubSubEndpoint(PROOF_GATE_TOPICS.STATUS_UPDATE);

    const message = Buffer.from(JSON.stringify({ gateId, status, timestamp: Date.now() })).toString('base64');

    await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [{ data: message, attributes: { gateId, status } }],
      }),
    });
  } catch (error) {
    // Non-critical, log and continue
    console.warn('[ProofGateWorker] Status update publish failed:', error);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SINGLETON INSTANCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let proofGateClientInstance: AsyncProofGateClient | null = null;

export function getProofGateClient(): AsyncProofGateClient {
  if (!proofGateClientInstance) {
    proofGateClientInstance = new AsyncProofGateClient();
  }
  return proofGateClientInstance;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONVENIENCE EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Trigger async validation (convenience function)
 */
export async function triggerProofGateValidation(request: ProofGateRequest): Promise<ProofGateResult> {
  return getProofGateClient().triggerValidation(request);
}

/**
 * Get gate status (convenience function)
 */
export async function getProofGateStatus(gateId: string): Promise<ProofGateResult | null> {
  return getProofGateClient().getGateStatus(gateId);
}

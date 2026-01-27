/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Vision Processing Worker
 * Async Image/Video Analysis via Vision AI and VL-JEPA
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { BaseWorker, WorkerResult } from '../base-worker.js';
import { PUBSUB_TOPICS, VisionPayload, PubSubMessage } from '../config.js';
import { getFirestoreClient } from '../../database/firestore-client.js';
import { GCP_PROJECT } from '../../gcp/config.js';
import { getAccessToken } from '../../gcp/auth.js';

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// =============================================================================
// TYPES
// =============================================================================

interface VisionResult {
  id: string;
  operation: string;
  artifactUri: string;
  outputUri?: string;
  labels?: LabelAnnotation[];
  text?: string;
  objects?: ObjectAnnotation[];
  faces?: FaceAnnotation[];
  safeSearch?: SafeSearchAnnotation;
  processingTime: number;
}

interface LabelAnnotation {
  description: string;
  score: number;
  topicality: number;
}

interface ObjectAnnotation {
  name: string;
  score: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

interface FaceAnnotation {
  boundingBox: { x: number; y: number; width: number; height: number };
  landmarks: { type: string; position: { x: number; y: number } }[];
  emotions: { type: string; likelihood: string }[];
}

interface SafeSearchAnnotation {
  adult: string;
  violence: string;
  medical: string;
  spoof: string;
  racy: string;
}

// =============================================================================
// WORKER
// =============================================================================

export class VisionWorker extends BaseWorker<VisionPayload> {
  private visionApiUrl = 'https://vision.googleapis.com/v1';

  constructor() {
    super('vision', PUBSUB_TOPICS.VISION_PROCESSING, {
      maxConcurrency: 10,
      pollIntervalMs: 500,
      circuitId: 'vision-api',
    });
  }

  protected async process(
    payload: VisionPayload,
    message: PubSubMessage<VisionPayload>
  ): Promise<WorkerResult<VisionResult>> {
    const startTime = Date.now();

    try {
      console.log(`👁️ Processing vision job: ${payload.operation}`);
      console.log(`   Artifact: ${payload.artifactUri}`);

      let result: VisionResult;

      switch (payload.operation) {
        case 'analyze':
          result = await this.analyzeImage(payload);
          break;
        case 'ocr':
          result = await this.performOCR(payload);
          break;
        case 'object-detection':
          result = await this.detectObjects(payload);
          break;
        case 'face-detection':
          result = await this.detectFaces(payload);
          break;
        case 'video-analysis':
          result = await this.analyzeVideo(payload);
          break;
        default:
          throw new Error(`Unknown operation: ${payload.operation}`);
      }

      // Persist result to Firestore
      const firestore = getFirestoreClient();
      await firestore.setDocument(
        'vision-results',
        payload.jobId,
        {
          ...result,
          jobId: payload.jobId,
          correlationId: payload.correlationId,
          completedAt: new Date().toISOString(),
        }
      );

      console.log(`   ✓ Vision job completed in ${result.processingTime}ms`);

      return {
        success: true,
        jobId: payload.jobId,
        data: result,
        duration: Date.now() - startTime,
        retryable: false,
      };
    } catch (error) {
      console.error(`   ✗ Vision processing failed:`, error);
      return {
        success: false,
        jobId: payload.jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        retryable: true,
      };
    }
  }

  private async analyzeImage(payload: VisionPayload): Promise<VisionResult> {
    const startTime = Date.now();
    const accessToken = await getAccessToken();

    const response = await fetch(`${this.visionApiUrl}/images:annotate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: payload.artifactUri } },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 20 },
            { type: 'SAFE_SEARCH_DETECTION' },
            { type: 'IMAGE_PROPERTIES' },
          ],
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json() as { responses?: Array<{ labelAnnotations?: Array<{ description: string; score: number; topicality: number }>; safeSearchAnnotation?: SafeSearchAnnotation }> };
    const annotations = data.responses?.[0] || {};

    return {
      id: payload.jobId,
      operation: 'analyze',
      artifactUri: payload.artifactUri,
      labels: (annotations.labelAnnotations || []).map((l) => ({
        description: l.description,
        score: l.score,
        topicality: l.topicality,
      })),
      safeSearch: annotations.safeSearchAnnotation,
      processingTime: Date.now() - startTime,
    };
  }

  private async performOCR(payload: VisionPayload): Promise<VisionResult> {
    const startTime = Date.now();
    const accessToken = await getAccessToken();

    const response = await fetch(`${this.visionApiUrl}/images:annotate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: payload.artifactUri } },
          features: [
            { type: 'DOCUMENT_TEXT_DETECTION' },
          ],
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json() as { responses?: Array<{ fullTextAnnotation?: { text?: string } }> };
    const annotations = data.responses?.[0] || {};

    return {
      id: payload.jobId,
      operation: 'ocr',
      artifactUri: payload.artifactUri,
      text: annotations.fullTextAnnotation?.text || '',
      processingTime: Date.now() - startTime,
    };
  }

  private async detectObjects(payload: VisionPayload): Promise<VisionResult> {
    const startTime = Date.now();
    const accessToken = await getAccessToken();

    const response = await fetch(`${this.visionApiUrl}/images:annotate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: payload.artifactUri } },
          features: [
            { type: 'OBJECT_LOCALIZATION', maxResults: 50 },
          ],
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json() as { responses?: Array<{ localizedObjectAnnotations?: Array<{ name: string; score: number; boundingPoly?: { normalizedVertices?: Array<{ x?: number; y?: number }> } }> }> };
    const annotations = data.responses?.[0] || {};

    return {
      id: payload.jobId,
      operation: 'object-detection',
      artifactUri: payload.artifactUri,
      objects: (annotations.localizedObjectAnnotations || []).map((o) => ({
        name: o.name,
        score: o.score,
        boundingBox: {
          x: o.boundingPoly?.normalizedVertices?.[0]?.x || 0,
          y: o.boundingPoly?.normalizedVertices?.[0]?.y || 0,
          width: (o.boundingPoly?.normalizedVertices?.[2]?.x || 0) - (o.boundingPoly?.normalizedVertices?.[0]?.x || 0),
          height: (o.boundingPoly?.normalizedVertices?.[2]?.y || 0) - (o.boundingPoly?.normalizedVertices?.[0]?.y || 0),
        },
      })),
      processingTime: Date.now() - startTime,
    };
  }

  private async detectFaces(payload: VisionPayload): Promise<VisionResult> {
    const startTime = Date.now();
    const accessToken = await getAccessToken();

    const response = await fetch(`${this.visionApiUrl}/images:annotate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: payload.artifactUri } },
          features: [
            { type: 'FACE_DETECTION', maxResults: 20 },
          ],
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status} ${await response.text()}`);
    }

    interface FaceAnnotation {
      boundingPoly?: { vertices?: Array<{ x?: number; y?: number }> };
      landmarks?: Array<{ type: string; position: { x: number; y: number } }>;
      joyLikelihood?: string;
      sorrowLikelihood?: string;
      angerLikelihood?: string;
      surpriseLikelihood?: string;
    }
    const data = await response.json() as { responses?: Array<{ faceAnnotations?: FaceAnnotation[] }> };
    const annotations = data.responses?.[0] || {};

    return {
      id: payload.jobId,
      operation: 'face-detection',
      artifactUri: payload.artifactUri,
      faces: (annotations.faceAnnotations || []).map((f) => ({
        boundingBox: {
          x: f.boundingPoly?.vertices?.[0]?.x || 0,
          y: f.boundingPoly?.vertices?.[0]?.y || 0,
          width: (f.boundingPoly?.vertices?.[2]?.x || 0) - (f.boundingPoly?.vertices?.[0]?.x || 0),
          height: (f.boundingPoly?.vertices?.[2]?.y || 0) - (f.boundingPoly?.vertices?.[0]?.y || 0),
        },
        landmarks: (f.landmarks || []).map((l) => ({
          type: l.type,
          position: l.position,
        })),
        emotions: [
          { type: 'joy', likelihood: f.joyLikelihood || 'UNKNOWN' },
          { type: 'sorrow', likelihood: f.sorrowLikelihood || 'UNKNOWN' },
          { type: 'anger', likelihood: f.angerLikelihood || 'UNKNOWN' },
          { type: 'surprise', likelihood: f.surpriseLikelihood || 'UNKNOWN' },
        ],
      })),
      processingTime: Date.now() - startTime,
    };
  }

  private async analyzeVideo(payload: VisionPayload): Promise<VisionResult> {
    const startTime = Date.now();
    // Video analysis via Video Intelligence API
    // This is a long-running operation, so we start it and return
    
    const accessToken = await getAccessToken();
    const videoApiUrl = 'https://videointelligence.googleapis.com/v1';

    const response = await fetch(`${videoApiUrl}/videos:annotate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputUri: payload.artifactUri,
        outputUri: payload.outputBucket ? `${payload.outputBucket}/${payload.jobId}.json` : undefined,
        features: ['LABEL_DETECTION', 'SHOT_CHANGE_DETECTION', 'OBJECT_TRACKING'],
      }),
    });

    if (!response.ok) {
      throw new Error(`Video API error: ${response.status} ${await response.text()}`);
    }

    const operation = await response.json() as { name?: string };

    return {
      id: payload.jobId,
      operation: 'video-analysis',
      artifactUri: payload.artifactUri,
      outputUri: operation.name || '', // Operation name to check status
      processingTime: Date.now() - startTime,
    };
  }
}

// =============================================================================
// FACTORY
// =============================================================================

let worker: VisionWorker | null = null;

export function getVisionWorker(): VisionWorker {
  if (!worker) {
    worker = new VisionWorker();
  }
  return worker;
}

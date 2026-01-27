/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS GCS Artifacts Storage
 * Cloud Storage for Agent Artifacts with Signed URL Generation
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { GCP_PROJECT } from '../gcp/config';
import { getAccessToken } from '../gcp/auth';
import * as crypto from 'crypto';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface GCSBucketConfig {
  name: string;
  location: string;
  storageClass: 'STANDARD' | 'NEARLINE' | 'COLDLINE' | 'ARCHIVE';
  labels: Record<string, string>;
  lifecycle: LifecycleRule[];
  cors: CorsConfig[];
}

interface LifecycleRule {
  action: { type: 'Delete' | 'SetStorageClass'; storageClass?: string };
  condition: { age?: number; isLive?: boolean; numNewerVersions?: number };
}

interface CorsConfig {
  origin: string[];
  method: string[];
  responseHeader: string[];
  maxAgeSeconds: number;
}

/**
 * GCS Bucket configurations for SmelterOS
 */
export const GCS_BUCKETS: Record<string, GCSBucketConfig> = {
  // Agent artifacts (conversations, outputs, files)
  ARTIFACTS: {
    name: `${GCP_PROJECT.projectId}-artifacts`,
    location: 'US-CENTRAL1',
    storageClass: 'STANDARD',
    labels: {
      environment: GCP_PROJECT.environment,
      purpose: 'agent-artifacts',
    },
    lifecycle: [
      // Delete incomplete uploads after 1 day
      { action: { type: 'Delete' }, condition: { age: 1, isLive: false } },
      // Move to NEARLINE after 30 days
      { action: { type: 'SetStorageClass', storageClass: 'NEARLINE' }, condition: { age: 30 } },
      // Move to COLDLINE after 90 days
      { action: { type: 'SetStorageClass', storageClass: 'COLDLINE' }, condition: { age: 90 } },
      // Delete after 365 days
      { action: { type: 'Delete' }, condition: { age: 365 } },
    ],
    cors: [
      {
        origin: ['https://*.smelteros.com', 'http://localhost:*'],
        method: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        responseHeader: ['Content-Type', 'Content-Length', 'x-goog-resumable'],
        maxAgeSeconds: 3600,
      },
    ],
  },

  // Temporary processing files
  TEMP: {
    name: `${GCP_PROJECT.projectId}-temp`,
    location: 'US-CENTRAL1',
    storageClass: 'STANDARD',
    labels: {
      environment: GCP_PROJECT.environment,
      purpose: 'temp-processing',
    },
    lifecycle: [
      // Delete after 24 hours
      { action: { type: 'Delete' }, condition: { age: 1 } },
    ],
    cors: [],
  },

  // Model weights and checkpoints
  MODELS: {
    name: `${GCP_PROJECT.projectId}-models`,
    location: 'US-CENTRAL1',
    storageClass: 'STANDARD',
    labels: {
      environment: GCP_PROJECT.environment,
      purpose: 'model-storage',
    },
    lifecycle: [],
    cors: [],
  },

  // User uploads
  UPLOADS: {
    name: `${GCP_PROJECT.projectId}-uploads`,
    location: 'US-CENTRAL1',
    storageClass: 'STANDARD',
    labels: {
      environment: GCP_PROJECT.environment,
      purpose: 'user-uploads',
    },
    lifecycle: [
      // Delete after 7 days if not moved
      { action: { type: 'Delete' }, condition: { age: 7 } },
    ],
    cors: [
      {
        origin: ['https://*.smelteros.com', 'http://localhost:*'],
        method: ['GET', 'PUT', 'POST'],
        responseHeader: ['Content-Type', 'Content-Length', 'x-goog-resumable'],
        maxAgeSeconds: 3600,
      },
    ],
  },
};

// =============================================================================
// TYPES
// =============================================================================

export interface SignedUrlOptions {
  action: 'read' | 'write' | 'delete' | 'resumable';
  expiresIn: number; // seconds
  contentType?: string;
  contentDisposition?: string;
}

export interface ArtifactMetadata {
  artifactId: string;
  userId: string;
  organizationId: string;
  sessionId?: string;
  taskId?: string;
  type: 'file' | 'image' | 'video' | 'audio' | 'document' | 'data';
  mimeType: string;
  size: number;
  createdAt: string;
  expiresAt?: string;
  tags?: string[];
}

export interface UploadResult {
  success: boolean;
  artifactId?: string;
  uri?: string;
  signedUrl?: string;
  error?: string;
}

// =============================================================================
// GCS CLIENT
// =============================================================================

export class GCSClient {
  private baseUrl = 'https://storage.googleapis.com';
  private projectId: string;

  constructor(projectId: string = GCP_PROJECT.projectId) {
    this.projectId = projectId;
  }

  /**
   * Generate a signed URL for object access
   */
  async generateSignedUrl(
    bucket: string,
    objectPath: string,
    options: SignedUrlOptions
  ): Promise<string> {
    const accessToken = await getAccessToken();
    const expirationTime = Math.floor(Date.now() / 1000) + options.expiresIn;

    // For read/write, use simple signed URL
    const httpMethod = {
      read: 'GET',
      write: 'PUT',
      delete: 'DELETE',
      resumable: 'POST',
    }[options.action];

    // Request signed URL from GCS API
    const response = await fetch(
      `${this.baseUrl}/storage/v1/b/${bucket}/o/${encodeURIComponent(objectPath)}:generateSignedUrl`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          httpMethod,
          expiration: expirationTime,
          contentType: options.contentType,
        }),
      }
    );

    if (!response.ok) {
      // Fallback to constructing URL manually
      const encodedPath = encodeURIComponent(objectPath);
      return `${this.baseUrl}/${bucket}/${encodedPath}?token=${accessToken}&expires=${expirationTime}`;
    }

    const data = await response.json() as { signedUrl: string };
    return data.signedUrl;
  }

  /**
   * Upload an artifact
   */
  async uploadArtifact(
    bucketKey: keyof typeof GCS_BUCKETS,
    path: string,
    content: Buffer | string,
    metadata?: Partial<ArtifactMetadata>
  ): Promise<UploadResult> {
    const bucket = GCS_BUCKETS[bucketKey];
    if (!bucket) {
      return { success: false, error: `Unknown bucket: ${bucketKey}` };
    }

    try {
      const accessToken = await getAccessToken();
      const artifactId = crypto.randomUUID();
      const objectPath = `${path}/${artifactId}`;

      // Upload object
      const response = await fetch(
        `${this.baseUrl}/upload/storage/v1/b/${bucket.name}/o?uploadType=media&name=${encodeURIComponent(objectPath)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': metadata?.mimeType || 'application/octet-stream',
            'x-goog-meta-artifact-id': artifactId,
            ...(metadata?.userId && { 'x-goog-meta-user-id': metadata.userId }),
            ...(metadata?.sessionId && { 'x-goog-meta-session-id': metadata.sessionId }),
          },
          body: content,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Upload failed: ${response.status} ${error}` };
      }

      const uri = `gs://${bucket.name}/${objectPath}`;

      return {
        success: true,
        artifactId,
        uri,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get a resumable upload URL for large files
   */
  async getResumableUploadUrl(
    bucketKey: keyof typeof GCS_BUCKETS,
    path: string,
    mimeType: string,
    metadata?: Partial<ArtifactMetadata>
  ): Promise<{ success: boolean; uploadUrl?: string; artifactId?: string; error?: string }> {
    const bucket = GCS_BUCKETS[bucketKey];
    if (!bucket) {
      return { success: false, error: `Unknown bucket: ${bucketKey}` };
    }

    try {
      const accessToken = await getAccessToken();
      const artifactId = crypto.randomUUID();
      const objectPath = `${path}/${artifactId}`;

      // Initiate resumable upload
      const response = await fetch(
        `${this.baseUrl}/upload/storage/v1/b/${bucket.name}/o?uploadType=resumable&name=${encodeURIComponent(objectPath)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Type': mimeType,
          },
          body: JSON.stringify({
            name: objectPath,
            metadata: {
              artifactId,
              userId: metadata?.userId,
              sessionId: metadata?.sessionId,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Failed to initiate upload: ${response.status} ${error}` };
      }

      const uploadUrl = response.headers.get('Location');
      if (!uploadUrl) {
        return { success: false, error: 'No upload URL returned' };
      }

      return {
        success: true,
        uploadUrl,
        artifactId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Download an artifact
   */
  async downloadArtifact(uri: string): Promise<{ success: boolean; content?: Buffer; error?: string }> {
    const match = uri.match(/^gs:\/\/([^\/]+)\/(.+)$/);
    if (!match) {
      return { success: false, error: `Invalid GCS URI: ${uri}` };
    }

    const [, bucket, objectPath] = match;

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/storage/v1/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return { success: false, error: `Download failed: ${response.status}` };
      }

      const arrayBuffer = await response.arrayBuffer();
      return {
        success: true,
        content: Buffer.from(arrayBuffer),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete an artifact
   */
  async deleteArtifact(uri: string): Promise<{ success: boolean; error?: string }> {
    const match = uri.match(/^gs:\/\/([^\/]+)\/(.+)$/);
    if (!match) {
      return { success: false, error: `Invalid GCS URI: ${uri}` };
    }

    const [, bucket, objectPath] = match;

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/storage/v1/b/${bucket}/o/${encodeURIComponent(objectPath)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        return { success: false, error: `Delete failed: ${response.status}` };
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
   * List artifacts in a path
   */
  async listArtifacts(
    bucketKey: keyof typeof GCS_BUCKETS,
    prefix: string,
    maxResults: number = 100
  ): Promise<{ success: boolean; objects?: string[]; error?: string }> {
    const bucket = GCS_BUCKETS[bucketKey];
    if (!bucket) {
      return { success: false, error: `Unknown bucket: ${bucketKey}` };
    }

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/storage/v1/b/${bucket.name}/o?prefix=${encodeURIComponent(prefix)}&maxResults=${maxResults}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return { success: false, error: `List failed: ${response.status}` };
      }

      const data = await response.json() as { items?: Array<{ name: string }> };
      const objects = (data.items || []).map((item) => `gs://${bucket.name}/${item.name}`);

      return { success: true, objects };
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

let gcsClient: GCSClient | null = null;

export function getGCSClient(): GCSClient {
  if (!gcsClient) {
    gcsClient = new GCSClient();
  }
  return gcsClient;
}

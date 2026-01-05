/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS GCP Authentication Layer
 * Production-Grade Auth for All GCP API Calls
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PRODUCTION REQUIREMENTS:
 * - All GCP API calls MUST use authenticated requests
 * - Service account credentials via ADC (Application Default Credentials)
 * - Token caching to avoid re-authentication on every request
 * - Automatic token refresh before expiration
 * 
 * NO MOCK/STUB PATTERNS ALLOWED
 */

import { GCP_PROJECT } from './config';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AccessToken {
  token: string;
  expiresAt: Date;
  scopes: string[];
}

export interface GCPAuthConfig {
  projectId: string;
  region: string;
  scopes: string[];
  serviceAccountKeyPath?: string;
}

export interface AuthenticatedRequest {
  headers: Record<string, string>;
  projectId: string;
  region: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEFAULT SCOPES BY SERVICE TYPE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const GCP_SCOPES = {
  // Cloud Platform (broad access)
  CLOUD_PLATFORM: 'https://www.googleapis.com/auth/cloud-platform',
  
  // Specific service scopes
  VERTEX_AI: 'https://www.googleapis.com/auth/cloud-platform',
  FIRESTORE: 'https://www.googleapis.com/auth/datastore',
  STORAGE: 'https://www.googleapis.com/auth/devstorage.read_write',
  PUBSUB: 'https://www.googleapis.com/auth/pubsub',
  SPEECH: 'https://www.googleapis.com/auth/cloud-platform',
  VISION: 'https://www.googleapis.com/auth/cloud-platform',
  BIGQUERY: 'https://www.googleapis.com/auth/bigquery',
  LOGGING: 'https://www.googleapis.com/auth/logging.write',
  MONITORING: 'https://www.googleapis.com/auth/monitoring.write',
  SECRET_MANAGER: 'https://www.googleapis.com/auth/cloud-platform',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GCP AUTH CLIENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class GCPAuthClient {
  private config: GCPAuthConfig;
  private cachedToken: AccessToken | null = null;
  private refreshBuffer = 5 * 60 * 1000; // Refresh 5 minutes before expiration

  constructor(config?: Partial<GCPAuthConfig>) {
    this.config = {
      projectId: config?.projectId || GCP_PROJECT.projectId,
      region: config?.region || GCP_PROJECT.region,
      scopes: config?.scopes || [GCP_SCOPES.CLOUD_PLATFORM],
      serviceAccountKeyPath: config?.serviceAccountKeyPath,
    };
  }

  /**
   * Get access token (cached with automatic refresh)
   * Uses Google Cloud metadata server in Cloud Run, or ADC locally
   */
  async getAccessToken(): Promise<string> {
    // Check cached token validity
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      return this.cachedToken.token;
    }

    // Fetch new token
    const token = await this.fetchAccessToken();
    this.cachedToken = token;
    return token.token;
  }

  /**
   * Get authenticated request headers for API calls
   */
  async getAuthenticatedRequest(): Promise<AuthenticatedRequest> {
    const token = await this.getAccessToken();
    
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Goog-User-Project': this.config.projectId,
      },
      projectId: this.config.projectId,
      region: this.config.region,
    };
  }

  /**
   * Check if token is still valid (with buffer)
   */
  private isTokenValid(token: AccessToken): boolean {
    const now = Date.now();
    const expiresAt = token.expiresAt.getTime();
    return now < (expiresAt - this.refreshBuffer);
  }

  /**
   * Fetch access token from GCP
   * In Cloud Run: Uses metadata server (automatic)
   * Locally: Uses Application Default Credentials
   */
  private async fetchAccessToken(): Promise<AccessToken> {
    // Check if running in Cloud Run (metadata server available)
    const isCloudRun = process.env.K_SERVICE !== undefined;

    if (isCloudRun) {
      return this.fetchFromMetadataServer();
    }

    // Local development: Use google-auth-library
    return this.fetchFromADC();
  }

  /**
   * Fetch token from Cloud Run metadata server
   * This is the preferred method in production (no credentials needed)
   */
  private async fetchFromMetadataServer(): Promise<AccessToken> {
    const metadataUrl = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';
    
    try {
      const response = await fetch(metadataUrl, {
        headers: {
          'Metadata-Flavor': 'Google',
        },
      });

      if (!response.ok) {
        throw new Error(`Metadata server error: ${response.status}`);
      }

      const data = await response.json() as {
        access_token: string;
        expires_in: number;
        token_type: string;
      };

      return {
        token: data.access_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scopes: this.config.scopes,
      };
    } catch (error) {
      console.error('[GCPAuth] Metadata server fetch failed:', error);
      throw new Error('Failed to fetch token from metadata server. Are you running in Cloud Run?');
    }
  }

  /**
   * Fetch token using Application Default Credentials
   * For local development: run `gcloud auth application-default login`
   */
  private async fetchFromADC(): Promise<AccessToken> {
    try {
      // Dynamic import to avoid bundling issues
      const { GoogleAuth } = await import('google-auth-library');
      
      const auth = new GoogleAuth({
        scopes: this.config.scopes,
        projectId: this.config.projectId,
        keyFilename: this.config.serviceAccountKeyPath,
      });

      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();

      if (!tokenResponse.token) {
        throw new Error('No token returned from ADC');
      }

      // ADC doesn't give us expiration, assume 1 hour
      return {
        token: tokenResponse.token,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        scopes: this.config.scopes,
      };
    } catch (error) {
      console.error('[GCPAuth] ADC fetch failed:', error);
      throw new Error(
        'Failed to get Application Default Credentials. ' +
        'Run: gcloud auth application-default login'
      );
    }
  }

  /**
   * Invalidate cached token (force refresh on next call)
   */
  invalidateToken(): void {
    this.cachedToken = null;
  }

  /**
   * Get project info
   */
  getProjectInfo(): { projectId: string; region: string } {
    return {
      projectId: this.config.projectId,
      region: this.config.region,
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SINGLETON INSTANCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let authClientInstance: GCPAuthClient | null = null;

/**
 * Get singleton GCP auth client
 */
export function getGCPAuthClient(config?: Partial<GCPAuthConfig>): GCPAuthClient {
  if (!authClientInstance) {
    authClientInstance = new GCPAuthClient(config);
  }
  return authClientInstance;
}

/**
 * Convenience function to get access token
 */
export async function getAccessToken(): Promise<string> {
  return getGCPAuthClient().getAccessToken();
}

/**
 * Convenience function to get authenticated request headers
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const auth = await getGCPAuthClient().getAuthenticatedRequest();
  return auth.headers;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENDPOINT BUILDERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Build Vertex AI Gemini endpoint
 */
export function buildGeminiEndpoint(model: string = 'gemini-1.5-pro'): string {
  const { projectId, region } = getGCPAuthClient().getProjectInfo();
  return `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`;
}

/**
 * Build Vertex AI Embeddings endpoint
 */
export function buildEmbeddingsEndpoint(model: string = 'text-embedding-004'): string {
  const { projectId, region } = getGCPAuthClient().getProjectInfo();
  return `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:predict`;
}

/**
 * Build Speech-to-Text endpoint
 */
export function buildSTTEndpoint(): string {
  return 'https://speech.googleapis.com/v1/speech:recognize';
}

/**
 * Build Text-to-Speech endpoint
 */
export function buildTTSEndpoint(): string {
  return 'https://texttospeech.googleapis.com/v1/text:synthesize';
}

/**
 * Build Vision API endpoint
 */
export function buildVisionEndpoint(): string {
  return 'https://vision.googleapis.com/v1/images:annotate';
}

/**
 * Build Document AI endpoint
 */
export function buildDocumentAIEndpoint(processorId: string): string {
  const { projectId, region } = getGCPAuthClient().getProjectInfo();
  return `https://${region}-documentai.googleapis.com/v1/projects/${projectId}/locations/${region}/processors/${processorId}:process`;
}

/**
 * Build Cloud Run service endpoint
 */
export function buildCloudRunEndpoint(serviceName: string): string {
  const { projectId, region } = getGCPAuthClient().getProjectInfo();
  return `https://${serviceName}-${projectId}.${region}.run.app`;
}

/**
 * Build Pub/Sub publish endpoint
 */
export function buildPubSubEndpoint(topicName: string): string {
  const { projectId } = getGCPAuthClient().getProjectInfo();
  return `https://pubsub.googleapis.com/v1/projects/${projectId}/topics/${topicName}:publish`;
}

/**
 * Build Firestore document endpoint
 */
export function buildFirestoreEndpoint(collection: string, documentId?: string): string {
  const { projectId } = getGCPAuthClient().getProjectInfo();
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`;
  return documentId ? `${base}/${documentId}` : base;
}

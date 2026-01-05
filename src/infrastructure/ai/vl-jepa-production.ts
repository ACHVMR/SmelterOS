/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS VL-JEPA Production Client
 * Real Vertex AI Integration with Vision API Fallback
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PRODUCTION ARCHITECTURE:
 * 1. Primary: Vertex AI Text Embeddings (text-embedding-004)
 * 2. Vision: Cloud Vision API for image features
 * 3. Custom: Cloud Run VL-JEPA service (when deployed)
 * 4. Fallback: Simulation mode for development
 * 
 * NO SIMULATED EMBEDDINGS IN PRODUCTION
 */

import { getAuthHeaders, buildEmbeddingsEndpoint, buildVisionEndpoint, buildCloudRunEndpoint } from '../gcp/auth';
import { GCP_PROJECT } from '../gcp/config';
import { getEmbeddingsCache, hashText } from '../cache/lru-cache';
import { VLJEPAConfig, EmbeddingResult, SemanticEmbedding } from './vl-jepa';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type EmbeddingProvider = 'vertex-ai' | 'vision-api' | 'cloud-run' | 'simulation';

export interface ProductionVLJEPAConfig extends VLJEPAConfig {
  primaryProvider: EmbeddingProvider;
  fallbackProvider: EmbeddingProvider;
  cloudRunServiceName?: string;
  enableCaching: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export interface VertexAIEmbeddingResponse {
  predictions: Array<{
    embeddings: {
      values: number[];
      statistics: {
        truncated: boolean;
        token_count: number;
      };
    };
  }>;
}

export interface VisionAPIResponse {
  responses: Array<{
    labelAnnotations?: Array<{
      mid: string;
      description: string;
      score: number;
      topicality: number;
    }>;
    imagePropertiesAnnotation?: {
      dominantColors: {
        colors: Array<{
          color: { red: number; green: number; blue: number };
          score: number;
          pixelFraction: number;
        }>;
      };
    };
    error?: {
      code: number;
      message: string;
    };
  }>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEFAULT CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_PRODUCTION_CONFIG: ProductionVLJEPAConfig = {
  // VL-JEPA base config
  embeddingDim: 768,  // text-embedding-004 outputs 768 dims
  visionEncoder: 'google/vit-base-patch16-224',
  textEncoder: 'text-embedding-004',
  selectiveDecodingThreshold: 0.15,
  windowSize: 5,
  temperature: 0.07,
  
  // Production config
  primaryProvider: 'vertex-ai',
  fallbackProvider: 'vision-api',
  cloudRunServiceName: 'vl-jepa-service',
  enableCaching: true,
  maxRetries: 3,
  timeoutMs: 10000,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRODUCTION VL-JEPA CLIENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class ProductionVLJEPAClient {
  private config: ProductionVLJEPAConfig;
  private stats = {
    vertexAICalls: 0,
    visionAPICalls: 0,
    cloudRunCalls: 0,
    cacheHits: 0,
    errors: 0,
    avgLatencyMs: 0,
    totalLatencyMs: 0,
    totalCalls: 0,
  };

  constructor(config?: Partial<ProductionVLJEPAConfig>) {
    this.config = { ...DEFAULT_PRODUCTION_CONFIG, ...config };
  }

  /**
   * Encode text to embedding using Vertex AI
   */
  async encodeText(text: string): Promise<EmbeddingResult> {
    const startTime = Date.now();

    // Check cache first
    if (this.config.enableCaching) {
      const cached = await this.getCachedEmbedding(text);
      if (cached) {
        this.stats.cacheHits++;
        return {
          embedding: cached,
          confidence: 1.0,
          latencyMs: Date.now() - startTime,
          shouldDecode: false,
        };
      }
    }

    // Try primary provider
    try {
      const embedding = await this.encodeWithProvider(text, 'text', this.config.primaryProvider);
      const latencyMs = Date.now() - startTime;
      
      this.updateStats(latencyMs);

      // Cache result
      if (this.config.enableCaching) {
        this.cacheEmbedding(text, embedding).catch(() => {});
      }

      return {
        embedding,
        confidence: 0.95,
        latencyMs,
        shouldDecode: false,
      };
    } catch (error) {
      console.warn(`[VL-JEPA] Primary provider failed, trying fallback:`, error);
      
      // Try fallback provider
      try {
        const embedding = await this.encodeWithProvider(text, 'text', this.config.fallbackProvider);
        const latencyMs = Date.now() - startTime;
        
        this.updateStats(latencyMs);

        return {
          embedding,
          confidence: 0.85,
          latencyMs,
          shouldDecode: false,
        };
      } catch (fallbackError) {
        this.stats.errors++;
        throw new Error(`VL-JEPA encoding failed: ${fallbackError}`);
      }
    }
  }

  /**
   * Encode image to embedding using Vision API + Vertex AI
   */
  async encodeImage(imageData: Buffer | string): Promise<EmbeddingResult> {
    const startTime = Date.now();

    try {
      // Use Vision API to extract features
      const visionFeatures = await this.extractVisionFeatures(imageData);
      
      // Convert vision features to text description for embedding
      const description = this.visionFeaturesToText(visionFeatures);
      
      // Encode description using Vertex AI
      const embedding = await this.encodeWithProvider(description, 'text', 'vertex-ai');
      const latencyMs = Date.now() - startTime;

      this.updateStats(latencyMs);
      this.stats.visionAPICalls++;

      return {
        embedding,
        confidence: 0.90,
        latencyMs,
        shouldDecode: false,
      };
    } catch (error) {
      this.stats.errors++;
      throw new Error(`VL-JEPA image encoding failed: ${error}`);
    }
  }

  /**
   * Encode query + image for VQA using combined embeddings
   */
  async encodeVQA(query: string, imageData: Buffer | string): Promise<EmbeddingResult> {
    const startTime = Date.now();

    try {
      // Get text embedding for query
      const queryResult = await this.encodeText(query);
      
      // Get image embedding
      const imageResult = await this.encodeImage(imageData);
      
      // Combine embeddings
      const combined = this.combineEmbeddings(queryResult.embedding, imageResult.embedding);
      const latencyMs = Date.now() - startTime;

      return {
        embedding: combined,
        confidence: Math.min(queryResult.confidence, imageResult.confidence),
        latencyMs,
        shouldDecode: false,
      };
    } catch (error) {
      this.stats.errors++;
      throw new Error(`VL-JEPA VQA encoding failed: ${error}`);
    }
  }

  /**
   * Get client statistics
   */
  getStats() {
    return { ...this.stats };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROVIDER IMPLEMENTATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private async encodeWithProvider(
    input: string,
    inputType: 'text' | 'image',
    provider: EmbeddingProvider
  ): Promise<number[]> {
    switch (provider) {
      case 'vertex-ai':
        return this.encodeWithVertexAI(input);
      case 'vision-api':
        return this.encodeWithVisionAPI(input, inputType);
      case 'cloud-run':
        return this.encodeWithCloudRun(input, inputType);
      case 'simulation':
        return this.simulateEmbedding(input);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Vertex AI Text Embeddings
   * Model: text-embedding-004
   */
  private async encodeWithVertexAI(text: string): Promise<number[]> {
    const headers = await getAuthHeaders();
    const endpoint = buildEmbeddingsEndpoint('text-embedding-004');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        instances: [
          { content: text }
        ],
        parameters: {
          autoTruncate: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vertex AI embedding failed: ${response.status} - ${error}`);
    }

    const data = await response.json() as VertexAIEmbeddingResponse;
    this.stats.vertexAICalls++;

    return data.predictions[0].embeddings.values;
  }

  /**
   * Vision API for image features
   * Returns feature description that can be embedded
   */
  private async encodeWithVisionAPI(input: string, inputType: 'text' | 'image'): Promise<number[]> {
    if (inputType === 'text') {
      // Vision API can't directly embed text, use Vertex AI
      return this.encodeWithVertexAI(input);
    }

    // Extract vision features and embed the description
    const features = await this.extractVisionFeatures(input);
    const description = this.visionFeaturesToText(features);
    return this.encodeWithVertexAI(description);
  }

  /**
   * Cloud Run VL-JEPA Service
   * Custom model deployment
   */
  private async encodeWithCloudRun(input: string, inputType: 'text' | 'image'): Promise<number[]> {
    const headers = await getAuthHeaders();
    const serviceName = this.config.cloudRunServiceName || 'vl-jepa-service';
    const endpoint = `${buildCloudRunEndpoint(serviceName)}/api/encode`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        input,
        inputType,
        config: {
          embeddingDim: this.config.embeddingDim,
          temperature: this.config.temperature,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloud Run VL-JEPA failed: ${response.status}`);
    }

    const data = await response.json() as { embedding: number[] };
    this.stats.cloudRunCalls++;

    return data.embedding;
  }

  /**
   * Extract features using Vision API
   */
  private async extractVisionFeatures(imageData: Buffer | string): Promise<VisionAPIResponse> {
    const headers = await getAuthHeaders();
    const endpoint = buildVisionEndpoint();

    // Convert to base64 if buffer
    const imageContent = Buffer.isBuffer(imageData) 
      ? imageData.toString('base64')
      : imageData;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageContent },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'IMAGE_PROPERTIES' },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API failed: ${response.status}`);
    }

    return response.json() as Promise<VisionAPIResponse>;
  }

  /**
   * Convert Vision API response to text description
   */
  private visionFeaturesToText(response: VisionAPIResponse): string {
    const parts: string[] = [];

    for (const result of response.responses) {
      if (result.error) {
        continue;
      }

      // Add label annotations
      if (result.labelAnnotations) {
        const labels = result.labelAnnotations
          .slice(0, 5)
          .map((l) => `${l.description} (${Math.round(l.score * 100)}%)`)
          .join(', ');
        parts.push(`Objects: ${labels}`);
      }

      // Add color information
      if (result.imagePropertiesAnnotation?.dominantColors) {
        const colors = result.imagePropertiesAnnotation.dominantColors.colors
          .slice(0, 3)
          .map((c) => {
            const rgb = c.color;
            return `rgb(${rgb.red || 0},${rgb.green || 0},${rgb.blue || 0})`;
          })
          .join(', ');
        parts.push(`Colors: ${colors}`);
      }
    }

    return parts.join('. ') || 'Image content';
  }

  /**
   * Simulation for development
   */
  private simulateEmbedding(input: string): number[] {
    const seed = this.hashString(input);
    const embedding = new Array(this.config.embeddingDim);

    for (let i = 0; i < this.config.embeddingDim; i++) {
      embedding[i] = Math.sin(seed + i * 0.1) * 0.5 +
        Math.cos(seed * 0.7 + i * 0.05) * 0.3 +
        Math.sin(seed * 1.3 + i * 0.02) * 0.2;
    }

    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map((val) => val / norm);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CACHE HELPERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private async getCachedEmbedding(text: string): Promise<number[] | null> {
    try {
      const cache = await getEmbeddingsCache();
      const key = hashText(text);
      return cache.get(key);
    } catch {
      return null;
    }
  }

  private async cacheEmbedding(text: string, embedding: number[]): Promise<void> {
    try {
      const cache = await getEmbeddingsCache();
      const key = hashText(text);
      await cache.set(key, embedding);
    } catch (error) {
      console.warn('[VL-JEPA] Cache write failed:', error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UTILITY METHODS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private combineEmbeddings(a: number[], b: number[]): number[] {
    const maxLen = Math.max(a.length, b.length);
    const combined = new Array(maxLen);
    
    for (let i = 0; i < maxLen; i++) {
      const aVal = i < a.length ? a[i] : 0;
      const bVal = i < b.length ? b[i] : 0;
      combined[i] = (aVal + bVal) / 2;
    }

    const norm = Math.sqrt(combined.reduce((sum, val) => sum + val * val, 0));
    return combined.map((val) => val / norm);
  }

  private updateStats(latencyMs: number): void {
    this.stats.totalCalls++;
    this.stats.totalLatencyMs += latencyMs;
    this.stats.avgLatencyMs = this.stats.totalLatencyMs / this.stats.totalCalls;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Cosine similarity between embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    const minLen = Math.min(a.length, b.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < minLen; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Detect potential hallucination by embedding drift
   */
  detectHallucination(
    responseEmbedding: number[],
    contextEmbeddings: number[][]
  ): { isHallucination: boolean; confidence: number; drift: number } {
    if (contextEmbeddings.length === 0) {
      return { isHallucination: false, confidence: 0.5, drift: 0 };
    }

    let totalSimilarity = 0;
    for (const contextEmbed of contextEmbeddings) {
      totalSimilarity += this.cosineSimilarity(responseEmbedding, contextEmbed);
    }
    const avgSimilarity = totalSimilarity / contextEmbeddings.length;
    const drift = 1 - avgSimilarity;
    const isHallucination = drift > 0.4;

    return {
      isHallucination,
      confidence: Math.abs(drift - 0.4) / 0.4,
      drift,
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLOUD RUN DEPLOYMENT CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const VL_JEPA_CLOUD_RUN_CONFIG = {
  serviceName: 'vl-jepa-service',
  region: GCP_PROJECT.region,
  memory: '4Gi',
  cpu: '2',
  minInstances: 1,
  maxInstances: 10,
  timeout: '300s',
  concurrency: 40,
  
  // Container image (to be built with Meta's VL-JEPA weights)
  image: `us-central1-docker.pkg.dev/${GCP_PROJECT.projectId}/smelter-containers/vl-jepa:latest`,
  
  // Environment variables
  env: {
    MODEL_PATH: '/models/vl-jepa',
    EMBEDDING_DIM: '768',
    ENABLE_CACHING: 'true',
  },
  
  // Deployment commands
  deployCommand: `
gcloud run deploy vl-jepa-service \\
  --image us-central1-docker.pkg.dev/${GCP_PROJECT.projectId}/smelter-containers/vl-jepa:latest \\
  --region ${GCP_PROJECT.region} \\
  --memory 4Gi \\
  --cpu 2 \\
  --min-instances 1 \\
  --max-instances 10 \\
  --timeout 300s \\
  --concurrency 40 \\
  --set-env-vars "MODEL_PATH=/models/vl-jepa,EMBEDDING_DIM=768,ENABLE_CACHING=true" \\
  --allow-unauthenticated
`,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SINGLETON INSTANCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let productionVLJEPAClient: ProductionVLJEPAClient | null = null;

export function getProductionVLJEPAClient(config?: Partial<ProductionVLJEPAConfig>): ProductionVLJEPAClient {
  if (!productionVLJEPAClient) {
    productionVLJEPAClient = new ProductionVLJEPAClient(config);
  }
  return productionVLJEPAClient;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONVENIENCE EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Embed text using production client
 */
export async function embedText(text: string): Promise<EmbeddingResult> {
  return getProductionVLJEPAClient().encodeText(text);
}

/**
 * Embed image using production client
 */
export async function embedImage(imageData: Buffer | string): Promise<EmbeddingResult> {
  return getProductionVLJEPAClient().encodeImage(imageData);
}

/**
 * Create semantic embedding from response
 */
export async function createSemanticEmbedding(
  content: string,
  metadata: { taskId?: string; agentId?: string; userId?: string }
): Promise<SemanticEmbedding> {
  const client = getProductionVLJEPAClient();
  const result = await client.encodeText(content);

  return {
    id: `emb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    vector: result.embedding,
    dimension: result.embedding.length,
    source: 'text',
    timestamp: new Date(),
    metadata,
    confidenceScore: result.confidence,
  };
}

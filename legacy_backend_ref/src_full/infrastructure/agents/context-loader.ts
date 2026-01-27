/**
 * Agent OS Context Layer
 * Three-layer context loading system for agent sessions
 * 
 * Layers:
 * 1. Standards - Global standards, best practices, coding conventions
 * 2. Product - Product-specific context, documentation, architecture
 * 3. Specs - Current task specifications, requirements, acceptance criteria
 */

import type { AgentContext } from '../agents/types.js';

/** Context layer types */
export type ContextLayer = 'standards' | 'product' | 'specs';

/** Context source configuration */
export interface ContextSource {
  layer: ContextLayer;
  sourceType: 'firestore' | 'gcs' | 'url' | 'inline';
  path: string;
  cacheTTLMs: number;
  priority: number;
}

/** Loaded context with metadata */
export interface LoadedContext {
  layer: ContextLayer;
  data: Record<string, unknown>;
  loadedAt: string;
  expiresAt: string;
  sourceHash: string;
  sizeBytes: number;
}

/** Context loading result */
export interface ContextLoadResult {
  success: boolean;
  layers: LoadedContext[];
  totalSizeBytes: number;
  loadTimeMs: number;
  errors: ContextLoadError[];
}

/** Context loading error */
export interface ContextLoadError {
  layer: ContextLayer;
  source: string;
  message: string;
  retryable: boolean;
}

/** Default context sources */
export const DEFAULT_CONTEXT_SOURCES: ContextSource[] = [
  // Standards layer - Global standards
  {
    layer: 'standards',
    sourceType: 'firestore',
    path: 'context/standards/coding-conventions',
    cacheTTLMs: 86400000, // 24 hours
    priority: 1,
  },
  {
    layer: 'standards',
    sourceType: 'firestore',
    path: 'context/standards/security-practices',
    cacheTTLMs: 86400000,
    priority: 2,
  },
  {
    layer: 'standards',
    sourceType: 'firestore',
    path: 'context/standards/testing-guidelines',
    cacheTTLMs: 86400000,
    priority: 3,
  },
  {
    layer: 'standards',
    sourceType: 'firestore',
    path: 'context/standards/documentation-style',
    cacheTTLMs: 86400000,
    priority: 4,
  },

  // Product layer - Product-specific context
  {
    layer: 'product',
    sourceType: 'firestore',
    path: 'context/product/architecture',
    cacheTTLMs: 3600000, // 1 hour
    priority: 1,
  },
  {
    layer: 'product',
    sourceType: 'firestore',
    path: 'context/product/api-documentation',
    cacheTTLMs: 3600000,
    priority: 2,
  },
  {
    layer: 'product',
    sourceType: 'firestore',
    path: 'context/product/domain-models',
    cacheTTLMs: 3600000,
    priority: 3,
  },
  {
    layer: 'product',
    sourceType: 'gcs',
    path: 'gs://smelteros-models/product-context/embeddings.json',
    cacheTTLMs: 3600000,
    priority: 4,
  },

  // Specs layer - Current task specifications
  {
    layer: 'specs',
    sourceType: 'firestore',
    path: 'context/specs/current-requirements',
    cacheTTLMs: 300000, // 5 minutes
    priority: 1,
  },
  {
    layer: 'specs',
    sourceType: 'firestore',
    path: 'context/specs/acceptance-criteria',
    cacheTTLMs: 300000,
    priority: 2,
  },
];

/**
 * ContextLoader - Loads and caches context layers for agent sessions
 */
export class ContextLoader {
  private projectId: string;
  private accessToken: string | null = null;
  private cache: Map<string, LoadedContext> = new Map();
  private firestoreBaseUrl: string;

  constructor(projectId: string = 'smelteros') {
    this.projectId = projectId;
    this.firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  }

  /**
   * Set access token for API calls
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Load all context layers for a session
   */
  async loadAllLayers(
    sources: ContextSource[] = DEFAULT_CONTEXT_SOURCES
  ): Promise<ContextLoadResult> {
    const startTime = Date.now();
    const loadedLayers: LoadedContext[] = [];
    const errors: ContextLoadError[] = [];

    // Group sources by layer
    const layerSources = new Map<ContextLayer, ContextSource[]>();
    for (const source of sources) {
      const existing = layerSources.get(source.layer) ?? [];
      existing.push(source);
      layerSources.set(source.layer, existing);
    }

    // Load each layer
    for (const [layer, layerSourcesList] of layerSources) {
      try {
        const layerContext = await this.loadLayer(layer, layerSourcesList);
        loadedLayers.push(layerContext);
      } catch (error) {
        errors.push({
          layer,
          source: 'multiple',
          message: error instanceof Error ? error.message : String(error),
          retryable: true,
        });
      }
    }

    const totalSizeBytes = loadedLayers.reduce((sum, l) => sum + l.sizeBytes, 0);

    return {
      success: errors.length === 0,
      layers: loadedLayers,
      totalSizeBytes,
      loadTimeMs: Date.now() - startTime,
      errors,
    };
  }

  /**
   * Load a specific layer from sources
   */
  async loadLayer(
    layer: ContextLayer,
    sources: ContextSource[]
  ): Promise<LoadedContext> {
    const data: Record<string, unknown> = {};

    // Sort by priority
    const sortedSources = [...sources].sort((a, b) => a.priority - b.priority);

    for (const source of sortedSources) {
      // Check cache first
      const cacheKey = `${layer}:${source.path}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && new Date(cached.expiresAt) > new Date()) {
        Object.assign(data, cached.data);
        continue;
      }

      // Load from source
      try {
        const sourceData = await this.loadSource(source);
        Object.assign(data, sourceData);

        // Update cache
        const now = new Date();
        const loadedContext: LoadedContext = {
          layer,
          data: sourceData,
          loadedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + source.cacheTTLMs).toISOString(),
          sourceHash: this.hashData(sourceData),
          sizeBytes: JSON.stringify(sourceData).length,
        };
        this.cache.set(cacheKey, loadedContext);
      } catch (error) {
        console.error(`Failed to load source ${source.path}:`, error);
      }
    }

    return {
      layer,
      data,
      loadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      sourceHash: this.hashData(data),
      sizeBytes: JSON.stringify(data).length,
    };
  }

  /**
   * Load data from a specific source
   */
  private async loadSource(source: ContextSource): Promise<Record<string, unknown>> {
    switch (source.sourceType) {
      case 'firestore':
        return this.loadFromFirestore(source.path);
      case 'gcs':
        return this.loadFromGCS(source.path);
      case 'url':
        return this.loadFromURL(source.path);
      case 'inline':
        return JSON.parse(source.path);
      default:
        throw new Error(`Unknown source type: ${source.sourceType}`);
    }
  }

  /**
   * Load from Firestore
   */
  private async loadFromFirestore(path: string): Promise<Record<string, unknown>> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const url = `${this.firestoreBaseUrl}/${path}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {};
      }
      throw new Error(`Firestore error: ${response.status}`);
    }

    const doc = await response.json() as { fields?: Record<string, any> };
    return this.firestoreToObject(doc.fields ?? {});
  }

  /**
   * Load from GCS
   */
  private async loadFromGCS(gcsUri: string): Promise<Record<string, unknown>> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    // Parse GCS URI: gs://bucket/path
    const match = gcsUri.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (!match) {
      throw new Error(`Invalid GCS URI: ${gcsUri}`);
    }

    const [, bucket, objectPath] = match;
    const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {};
      }
      throw new Error(`GCS error: ${response.status}`);
    }

    return await response.json() as Record<string, unknown>;
  }

  /**
   * Load from URL
   */
  private async loadFromURL(url: string): Promise<Record<string, unknown>> {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`URL error: ${response.status}`);
    }

    return await response.json() as Record<string, unknown>;
  }

  /**
   * Convert context layers to AgentContext
   */
  toAgentContext(layers: LoadedContext[]): AgentContext {
    const context: AgentContext = {};

    for (const layer of layers) {
      context[layer.layer] = layer.data;
    }

    return context;
  }

  /**
   * Invalidate cached context
   */
  invalidateCache(layer?: ContextLayer): void {
    if (layer) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${layer}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number; totalBytes: number } {
    let totalBytes = 0;
    for (const entry of this.cache.values()) {
      totalBytes += entry.sizeBytes;
    }

    return {
      size: this.cache.size,
      entries: this.cache.size,
      totalBytes,
    };
  }

  /**
   * Convert Firestore document to plain object
   */
  private firestoreToObject(fields: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(fields)) {
      result[key] = this.firestoreToValue(value);
    }
    return result;
  }

  /**
   * Convert Firestore value to JS value
   */
  private firestoreToValue(value: any): any {
    if (value.nullValue !== undefined) return null;
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.integerValue !== undefined) return parseInt(value.integerValue);
    if (value.doubleValue !== undefined) return value.doubleValue;
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.arrayValue) {
      return (value.arrayValue.values ?? []).map((v: any) => this.firestoreToValue(v));
    }
    if (value.mapValue) {
      return this.firestoreToObject(value.mapValue.fields ?? {});
    }
    return null;
  }

  /**
   * Simple hash for data comparison
   */
  private hashData(data: Record<string, unknown>): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}

// Singleton instance
export const contextLoader = new ContextLoader();

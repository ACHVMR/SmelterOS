/**
 * Context Embeddings Manager
 * Manages semantic embeddings for context retrieval
 */

/** Embedding vector with metadata */
export interface ContextEmbedding {
  id: string;
  layer: 'standards' | 'product' | 'specs';
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    createdAt: string;
    version: string;
    tags: string[];
  };
}

/** Similarity search result */
export interface SimilarityResult {
  embedding: ContextEmbedding;
  score: number;
  distance: number;
}

/** Embedding index for fast similarity search */
export interface EmbeddingIndex {
  layer: 'standards' | 'product' | 'specs';
  embeddings: ContextEmbedding[];
  dimensions: number;
  createdAt: string;
  version: string;
}

/**
 * ContextEmbeddingsManager - Manages semantic embeddings for context
 */
export class ContextEmbeddingsManager {
  private projectId: string;
  private accessToken: string | null = null;
  private indexes: Map<string, EmbeddingIndex> = new Map();
  private embeddingDimensions = 768; // Gemini embedding dimensions

  constructor(projectId: string = 'smelteros') {
    this.projectId = projectId;
  }

  /**
   * Set access token
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Create embedding for text using Gemini
   */
  async createEmbedding(text: string): Promise<number[]> {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/us-central1/publishers/google/models/text-embedding-004:predict`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{ content: text }],
        parameters: {
          outputDimensionality: this.embeddingDimensions,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding error: ${response.status}`);
    }

    const result = await response.json() as { predictions: Array<{ embeddings: { values: number[] } }> };
    return result.predictions[0].embeddings.values;
  }

  /**
   * Index context content
   */
  async indexContent(
    layer: 'standards' | 'product' | 'specs',
    contents: Array<{ id: string; content: string; source: string; tags?: string[] }>
  ): Promise<EmbeddingIndex> {
    const embeddings: ContextEmbedding[] = [];

    for (const item of contents) {
      const embedding = await this.createEmbedding(item.content);
      
      embeddings.push({
        id: item.id,
        layer,
        content: item.content,
        embedding,
        metadata: {
          source: item.source,
          createdAt: new Date().toISOString(),
          version: '1.0',
          tags: item.tags ?? [],
        },
      });
    }

    const index: EmbeddingIndex = {
      layer,
      embeddings,
      dimensions: this.embeddingDimensions,
      createdAt: new Date().toISOString(),
      version: '1.0',
    };

    this.indexes.set(layer, index);
    
    // Persist to GCS
    await this.persistIndex(index);

    return index;
  }

  /**
   * Search for similar content
   */
  async search(
    query: string,
    layers?: ('standards' | 'product' | 'specs')[],
    topK: number = 5
  ): Promise<SimilarityResult[]> {
    const queryEmbedding = await this.createEmbedding(query);
    const results: SimilarityResult[] = [];

    const targetLayers = layers ?? ['standards', 'product', 'specs'];

    for (const layer of targetLayers) {
      let index = this.indexes.get(layer);
      
      if (!index) {
        const loadedIndex = await this.loadIndex(layer);
        if (loadedIndex) {
          index = loadedIndex;
          this.indexes.set(layer, index);
        }
      }

      if (!index) continue;

      for (const embedding of index.embeddings) {
        const score = this.cosineSimilarity(queryEmbedding, embedding.embedding);
        results.push({
          embedding,
          score,
          distance: 1 - score,
        });
      }
    }

    // Sort by score descending and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Get relevant context for a query
   */
  async getRelevantContext(
    query: string,
    layers?: ('standards' | 'product' | 'specs')[],
    minScore: number = 0.7
  ): Promise<Record<string, string[]>> {
    const results = await this.search(query, layers, 10);
    
    const context: Record<string, string[]> = {
      standards: [],
      product: [],
      specs: [],
    };

    for (const result of results) {
      if (result.score >= minScore) {
        context[result.embedding.layer].push(result.embedding.content);
      }
    }

    return context;
  }

  /**
   * Persist index to GCS
   */
  private async persistIndex(index: EmbeddingIndex): Promise<void> {
    if (!this.accessToken) {
      return;
    }

    const bucket = 'smelteros-models';
    const objectPath = `context-embeddings/${index.layer}/index.json`;
    const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(objectPath)}`;

    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(index),
    });
  }

  /**
   * Load index from GCS
   */
  private async loadIndex(layer: string): Promise<EmbeddingIndex | null> {
    if (!this.accessToken) {
      return null;
    }

    const bucket = 'smelteros-models';
    const objectPath = `context-embeddings/${layer}/index.json`;
    const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json() as EmbeddingIndex;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
  }

  /**
   * Clear cached indexes
   */
  clearCache(): void {
    this.indexes.clear();
  }
}

// Singleton instance
export const contextEmbeddings = new ContextEmbeddingsManager();

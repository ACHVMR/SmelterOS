/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Google File Manager RAG
 * The Vault - RAG Backbone for Context Retrieval
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The Google File Manager is NOT just a storage UI. It is the RAG
 * (Retrieval-Augmented Generation) backbone of the Foundry operation.
 * 
 * When a file is uploaded:
 * 1. It is indexed via Vertex AI embeddings
 * 2. Stored in the vector index
 * 3. Available for semantic retrieval during Smelting
 */

import { getAccessToken } from '../gcp/auth.js';
import { GCP_PROJECT } from '../gcp/config.js';
import { getFirestoreClient } from '../database/firestore-client.js';
import { GCS_BUCKETS, getGCSClient } from '../storage/gcs-client.js';

// =============================================================================
// TYPES
// =============================================================================

export interface VaultDocument {
  id: string;
  name: string;
  type: 'standard' | 'product' | 'technical' | 'blueprint' | 'resource';
  source: string;
  content: string;
  embeddings: number[];
  metadata: DocumentMetadata;
  indexedAt: string;
}

export interface DocumentMetadata {
  ingot?: string;
  category?: string;
  version?: string;
  author?: string;
  tags: string[];
  mimeType: string;
  size: number;
}

export interface RetrievalRequest {
  query: string;
  ingot?: string;
  contextTypes?: ('standard' | 'product' | 'technical' | 'blueprint' | 'resource')[];
  relevanceThreshold?: number;
  maxResults?: number;
}

export interface RetrievalResult {
  documents: VaultDocument[];
  relevanceScores: number[];
  totalMatches: number;
  queryEmbedding: number[];
}

export interface IndexingResult {
  success: boolean;
  documentId: string;
  embeddingDimensions: number;
  indexedAt: string;
  error?: string;
}

export interface VaultStats {
  totalDocuments: number;
  byType: Record<string, number>;
  byIngot: Record<string, number>;
  lastIndexed: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768;
const DEFAULT_RELEVANCE_THRESHOLD = 0.75;
const DEFAULT_MAX_RESULTS = 10;
const VAULT_COLLECTION = 'vault-documents';
const VAULT_INDEX = 'vault-embeddings-index';

// =============================================================================
// FILE MANAGER RAG CLASS
// =============================================================================

/**
 * FileManagerRAG - The Vault's RAG backbone
 * Indexes documents and retrieves context for Smelting
 */
export class FileManagerRAG {
  private static instance: FileManagerRAG | null = null;
  private accessToken: string | null = null;
  private embeddingEndpoint: string;
  private embeddingCache: Map<string, number[]> = new Map();

  private constructor() {
    this.embeddingEndpoint = `https://${GCP_PROJECT.region}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT.projectId}/locations/${GCP_PROJECT.region}/publishers/google/models/${EMBEDDING_MODEL}:predict`;
  }

  static getInstance(): FileManagerRAG {
    if (!FileManagerRAG.instance) {
      FileManagerRAG.instance = new FileManagerRAG();
    }
    return FileManagerRAG.instance;
  }

  /**
   * Initialize the RAG system
   */
  async initialize(): Promise<void> {
    this.accessToken = await getAccessToken();
    console.log('📚 Google File Manager RAG initialized');
    console.log(`   Embedding model: ${EMBEDDING_MODEL}`);
    console.log(`   Dimensions: ${EMBEDDING_DIMENSIONS}`);
  }

  // ===========================================================================
  // DOCUMENT INDEXING
  // ===========================================================================

  /**
   * Index a document into the Vault
   */
  async indexDocument(config: {
    name: string;
    content: string;
    type: VaultDocument['type'];
    source: string;
    metadata?: Partial<DocumentMetadata>;
  }): Promise<IndexingResult> {
    console.log(`📥 Indexing document: ${config.name}`);

    try {
      // Generate embeddings
      const embeddings = await this.generateEmbeddings(config.content);

      // Create document record
      const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const document: VaultDocument = {
        id: documentId,
        name: config.name,
        type: config.type,
        source: config.source,
        content: config.content,
        embeddings,
        metadata: {
          tags: [],
          mimeType: 'text/plain',
          size: config.content.length,
          ...config.metadata,
        },
        indexedAt: new Date().toISOString(),
      };

      // Store in Firestore
      const firestore = getFirestoreClient();
      await firestore.setDocument(VAULT_COLLECTION, documentId, {
        ...document,
        // Store embeddings as a separate field for vector search
        embeddingsJson: JSON.stringify(embeddings),
      });

      console.log(`   ✓ Document indexed: ${documentId}`);
      console.log(`   ✓ Embeddings: ${embeddings.length} dimensions`);

      return {
        success: true,
        documentId,
        embeddingDimensions: embeddings.length,
        indexedAt: document.indexedAt,
      };
    } catch (error) {
      console.error(`   ✗ Indexing failed:`, error);
      return {
        success: false,
        documentId: '',
        embeddingDimensions: 0,
        indexedAt: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Index a file from GCS
   */
  async indexFromGCS(config: {
    bucketKey: keyof typeof GCS_BUCKETS;
    path: string;
    type: VaultDocument['type'];
    metadata?: Partial<DocumentMetadata>;
  }): Promise<IndexingResult> {
    console.log(`📥 Indexing from GCS: ${config.path}`);

    try {
      const gcs = getGCSClient();
      const gcsUri = `gs://${GCS_BUCKETS[config.bucketKey].name}/${config.path}`;
      const result = await gcs.downloadArtifact(gcsUri);

      if (!result.success || !result.content) {
        throw new Error(`Failed to download: ${result.error}`);
      }

      const content = result.content.toString('utf-8');

      return this.indexDocument({
        name: config.path.split('/').pop() || config.path,
        content,
        type: config.type,
        source: gcsUri,
        metadata: config.metadata,
      });
    } catch (error) {
      console.error(`   ✗ GCS indexing failed:`, error);
      return {
        success: false,
        documentId: '',
        embeddingDimensions: 0,
        indexedAt: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Bulk index documents
   */
  async bulkIndex(documents: Array<{
    name: string;
    content: string;
    type: VaultDocument['type'];
    source: string;
    metadata?: Partial<DocumentMetadata>;
  }>): Promise<IndexingResult[]> {
    console.log(`📥 Bulk indexing ${documents.length} documents`);

    const results: IndexingResult[] = [];

    // Process in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(doc => this.indexDocument(doc))
      );
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`   ✓ Indexed: ${successCount}/${documents.length}`);

    return results;
  }

  // ===========================================================================
  // CONTEXT RETRIEVAL
  // ===========================================================================

  /**
   * Retrieve relevant documents from the Vault
   */
  async retrieve(request: RetrievalRequest): Promise<RetrievalResult> {
    console.log(`🔍 Retrieving context: "${request.query.substring(0, 50)}..."`);

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbeddings(request.query);

      // Get all documents from Firestore
      const firestore = getFirestoreClient();

      const allDocs = await firestore.query<VaultDocument & { id: string; embeddingsJson: string }>(
        VAULT_COLLECTION,
        { limit: 100 }
      );

      // Filter by type if specified
      let filteredDocs = allDocs.data;
      if (request.contextTypes && request.contextTypes.length > 0) {
        filteredDocs = allDocs.data.filter((doc: VaultDocument) => request.contextTypes!.includes(doc.type));
      }

      // Calculate relevance scores using cosine similarity
      const scoredDocs = filteredDocs.map((doc: VaultDocument & { id: string; embeddingsJson: string }) => {
        const docEmbeddings = JSON.parse(doc.embeddingsJson) as number[];
        const score = this.cosineSimilarity(queryEmbedding, docEmbeddings);
        return { doc, score };
      });

      // Filter by threshold and sort by score
      const threshold = request.relevanceThreshold || DEFAULT_RELEVANCE_THRESHOLD;
      const relevant = scoredDocs
        .filter(({ score }: { score: number }) => score >= threshold)
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
        .slice(0, request.maxResults || DEFAULT_MAX_RESULTS);

      console.log(`   ✓ Found ${relevant.length} relevant documents`);

      return {
        documents: relevant.map(({ doc }: { doc: VaultDocument & { embeddingsJson: string } }) => ({
          ...doc,
          embeddings: JSON.parse(doc.embeddingsJson),
        })),
        relevanceScores: relevant.map(({ score }: { score: number }) => score),
        totalMatches: scoredDocs.filter(({ score }: { score: number }) => score >= threshold).length,
        queryEmbedding,
      };
    } catch (error) {
      console.error(`   ✗ Retrieval failed:`, error);
      return {
        documents: [],
        relevanceScores: [],
        totalMatches: 0,
        queryEmbedding: [],
      };
    }
  }

  /**
   * Retrieve context for a specific Ingot's Smelting process
   */
  async retrieveForSmelting(config: {
    ingot: string;
    phase: 'blueprint' | 'smelt' | 'gild' | 'deploy';
    additionalContext?: string;
  }): Promise<RetrievalResult> {
    console.log(`🔥 Retrieving Smelting context for: ${config.ingot} (${config.phase})`);

    // Build context-aware query
    const queries: string[] = [
      `${config.ingot} blueprint specification requirements`,
      `${config.ingot} ${config.phase} phase implementation`,
    ];

    if (config.additionalContext) {
      queries.push(config.additionalContext);
    }

    // Determine context types based on phase
    const contextTypes: VaultDocument['type'][] = ['standard'];
    switch (config.phase) {
      case 'blueprint':
        contextTypes.push('blueprint', 'product');
        break;
      case 'smelt':
        contextTypes.push('technical', 'blueprint');
        break;
      case 'gild':
        contextTypes.push('product', 'resource');
        break;
      case 'deploy':
        contextTypes.push('technical', 'resource');
        break;
    }

    // Retrieve for each query and merge results
    const allResults: RetrievalResult[] = [];
    for (const query of queries) {
      const result = await this.retrieve({
        query,
        ingot: config.ingot,
        contextTypes,
        relevanceThreshold: 0.7,
        maxResults: 5,
      });
      allResults.push(result);
    }

    // Merge and deduplicate
    const seenIds = new Set<string>();
    const mergedDocs: VaultDocument[] = [];
    const mergedScores: number[] = [];

    for (const result of allResults) {
      for (let i = 0; i < result.documents.length; i++) {
        const doc = result.documents[i];
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id);
          mergedDocs.push(doc);
          mergedScores.push(result.relevanceScores[i]);
        }
      }
    }

    return {
      documents: mergedDocs,
      relevanceScores: mergedScores,
      totalMatches: mergedDocs.length,
      queryEmbedding: allResults[0]?.queryEmbedding || [],
    };
  }

  // ===========================================================================
  // EMBEDDING GENERATION
  // ===========================================================================

  /**
   * Generate embeddings using Vertex AI
   */
  private async generateEmbeddings(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = this.hashText(text);
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    if (!this.accessToken) {
      this.accessToken = await getAccessToken();
    }

    // Truncate text if too long (model has token limits)
    const maxChars = 8000;
    const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text;

    const response = await fetch(this.embeddingEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{ content: truncatedText }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding generation failed: ${response.status} ${await response.text()}`);
    }

    const result = await response.json() as {
      predictions: Array<{ embeddings: { values: number[] } }>;
    };

    const embeddings = result.predictions[0].embeddings.values;

    // Cache the result
    this.embeddingCache.set(cacheKey, embeddings);

    return embeddings;
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
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
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Hash text for caching
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash-${hash}`;
  }

  // ===========================================================================
  // VAULT MANAGEMENT
  // ===========================================================================

  /**
   * Get Vault statistics
   */
  async getStats(): Promise<VaultStats> {
    const firestore = getFirestoreClient();
    const result = await firestore.query<VaultDocument & { id: string }>(
      VAULT_COLLECTION,
      { limit: 1000 }
    );

    const allDocs = result.data;
    const byType: Record<string, number> = {};
    const byIngot: Record<string, number> = {};
    let lastIndexed = '';

    for (const doc of allDocs) {
      byType[doc.type] = (byType[doc.type] || 0) + 1;
      if (doc.metadata?.ingot) {
        byIngot[doc.metadata.ingot] = (byIngot[doc.metadata.ingot] || 0) + 1;
      }
      if (doc.indexedAt > lastIndexed) {
        lastIndexed = doc.indexedAt;
      }
    }

    return {
      totalDocuments: allDocs.length,
      byType,
      byIngot,
      lastIndexed,
    };
  }

  /**
   * Delete a document from the Vault
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    const firestore = getFirestoreClient();
    return firestore.deleteDocument(VAULT_COLLECTION, documentId);
  }

  /**
   * Clear the embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
    console.log('🧹 Embedding cache cleared');
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let ragInstance: FileManagerRAG | null = null;

export function getFileManagerRAG(): FileManagerRAG {
  if (!ragInstance) {
    ragInstance = FileManagerRAG.getInstance();
  }
  return ragInstance;
}

export default FileManagerRAG;

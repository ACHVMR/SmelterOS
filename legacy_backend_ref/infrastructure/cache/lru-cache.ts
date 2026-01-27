/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS LRU Cache Layer
 * Three-Tier Caching: Memory → Redis (Memorystore) → Firestore
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PRODUCTION REQUIREMENTS:
 * - L1: In-memory LRU cache (<1ms access)
 * - L2: Redis/Memorystore (1-5ms access, shared across instances)
 * - L3: Firestore (10-30ms access, persistent)
 * 
 * TARGET METRICS:
 * - Voice cache: 80%+ hit rate (L1)
 * - Model config: 95%+ hit rate (loaded once per session)
 * - Context cache: 70%+ hit rate
 * 
 * NO IN-MEMORY MAPS WITHOUT TTL ALLOWED
 */

import { LRUCache } from 'lru-cache';
import { getAuthHeaders, buildFirestoreEndpoint } from '../gcp/auth';
import { GCP_PROJECT } from '../gcp/config';
import * as crypto from 'crypto';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CacheConfig {
  maxSize: number;          // Max items in L1 cache
  ttlMs: number;            // Time-to-live in milliseconds
  enableL2: boolean;        // Enable Redis/Memorystore
  enableL3: boolean;        // Enable Firestore persistence
  namespace: string;        // Cache namespace (voice, config, context)
}

export interface CacheStats {
  hits: number;
  misses: number;
  l1Hits: number;
  l2Hits: number;
  l3Hits: number;
  hitRate: number;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  expiresAt: number;
  namespace: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEFAULT CACHE CONFIGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Voice cache: Frequent TTS phrases, high hit rate expected
  voice: {
    maxSize: 1000,
    ttlMs: 60 * 60 * 1000,  // 1 hour
    enableL2: true,
    enableL3: true,
    namespace: 'voice',
  },

  // Model config: Per-session, rarely changes
  modelConfig: {
    maxSize: 100,
    ttlMs: 24 * 60 * 60 * 1000,  // 24 hours
    enableL2: true,
    enableL3: false,  // No persistence needed
    namespace: 'model_config',
  },

  // Context cache: Task/agent contexts
  context: {
    maxSize: 500,
    ttlMs: 30 * 60 * 1000,  // 30 minutes
    enableL2: true,
    enableL3: true,
    namespace: 'context',
  },

  // Embeddings cache: VL-JEPA embeddings
  embeddings: {
    maxSize: 2000,
    ttlMs: 7 * 24 * 60 * 60 * 1000,  // 7 days
    enableL2: true,
    enableL3: true,
    namespace: 'embeddings',
  },

  // Session cache: User session data
  session: {
    maxSize: 1000,
    ttlMs: 4 * 60 * 60 * 1000,  // 4 hours
    enableL2: true,
    enableL3: false,
    namespace: 'session',
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REDIS CLIENT (Memorystore)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  del(key: string): Promise<void>;
  isConnected(): boolean;
}

/**
 * Create Redis client for Memorystore
 * Falls back to null if Redis not available
 */
async function createRedisClient(): Promise<RedisClient | null> {
  const redisHost = process.env.REDIS_HOST;
  const redisPort = parseInt(process.env.REDIS_PORT || '6379');

  if (!redisHost) {
    console.log('[Cache] Redis not configured, L2 cache disabled');
    return null;
  }

  try {
    // Dynamic import to avoid bundling issues if redis not installed
    const { createClient } = await import('redis');
    
    const client = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
    });

    client.on('error', (err) => {
      console.error('[Cache] Redis error:', err);
    });

    await client.connect();
    console.log(`[Cache] Redis connected: ${redisHost}:${redisPort}`);

    return {
      get: async (key: string) => {
        const value = await client.get(key);
        return value;
      },
      set: async (key: string, value: string, options?: { EX?: number }) => {
        if (options?.EX) {
          await client.set(key, value, { EX: options.EX });
        } else {
          await client.set(key, value);
        }
      },
      del: async (key: string) => {
        await client.del(key);
      },
      isConnected: () => client.isOpen,
    };
  } catch (error) {
    console.warn('[Cache] Redis connection failed, L2 cache disabled:', error);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// THREE-TIER CACHE CLASS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class ThreeTierCache<T extends {}> {
  private config: CacheConfig;
  private l1Cache: LRUCache<string, T>;
  private redisClient: RedisClient | null = null;
  private stats: CacheStats;
  private initialized = false;

  constructor(config: CacheConfig) {
    this.config = config;
    
    // L1: In-memory LRU cache
    this.l1Cache = new LRUCache<string, T>({
      max: config.maxSize,
      ttl: config.ttlMs,
      updateAgeOnGet: true,
    });

    this.stats = {
      hits: 0,
      misses: 0,
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      hitRate: 0,
    };
  }

  /**
   * Initialize cache (connect to Redis if enabled)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.config.enableL2) {
      this.redisClient = await createRedisClient();
    }

    this.initialized = true;
  }

  /**
   * Get value from cache (tries L1 → L2 → L3)
   */
  async get(key: string): Promise<T | null> {
    const cacheKey = this.buildKey(key);

    // L1: Check in-memory cache first (<1ms)
    const l1Value = this.l1Cache.get(cacheKey);
    if (l1Value !== undefined) {
      this.stats.l1Hits++;
      this.stats.hits++;
      this.updateHitRate();
      return l1Value;
    }

    // L2: Check Redis/Memorystore (1-5ms)
    if (this.config.enableL2 && this.redisClient?.isConnected()) {
      const l2Value = await this.getFromRedis(cacheKey);
      if (l2Value !== null) {
        // Warm L1 cache
        this.l1Cache.set(cacheKey, l2Value);
        this.stats.l2Hits++;
        this.stats.hits++;
        this.updateHitRate();
        return l2Value;
      }
    }

    // L3: Check Firestore (10-30ms)
    if (this.config.enableL3) {
      const l3Value = await this.getFromFirestore(cacheKey);
      if (l3Value !== null) {
        // Warm L1 and L2 caches
        this.l1Cache.set(cacheKey, l3Value);
        if (this.config.enableL2 && this.redisClient?.isConnected()) {
          await this.setInRedis(cacheKey, l3Value);
        }
        this.stats.l3Hits++;
        this.stats.hits++;
        this.updateHitRate();
        return l3Value;
      }
    }

    // Cache miss
    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set value in cache (writes to all enabled tiers)
   */
  async set(key: string, value: T): Promise<void> {
    const cacheKey = this.buildKey(key);

    // L1: Always write to in-memory cache
    this.l1Cache.set(cacheKey, value);

    // L2: Write to Redis (async, don't wait)
    if (this.config.enableL2 && this.redisClient?.isConnected()) {
      this.setInRedis(cacheKey, value).catch((err) => {
        console.warn('[Cache] Redis write failed:', err);
      });
    }

    // L3: Write to Firestore (async, don't wait)
    if (this.config.enableL3) {
      this.setInFirestore(cacheKey, value).catch((err) => {
        console.warn('[Cache] Firestore write failed:', err);
      });
    }
  }

  /**
   * Delete value from all cache tiers
   */
  async delete(key: string): Promise<void> {
    const cacheKey = this.buildKey(key);

    // L1
    this.l1Cache.delete(cacheKey);

    // L2
    if (this.config.enableL2 && this.redisClient?.isConnected()) {
      await this.redisClient.del(cacheKey);
    }

    // L3
    if (this.config.enableL3) {
      await this.deleteFromFirestore(cacheKey);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.l1Cache.clear();
    // Note: Redis and Firestore would need namespace-based deletion
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRIVATE METHODS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private buildKey(key: string): string {
    return `${this.config.namespace}:${key}`;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private async getFromRedis(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient!.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.warn('[Cache] Redis get failed:', error);
      return null;
    }
  }

  private async setInRedis(key: string, value: T): Promise<void> {
    const ttlSeconds = Math.floor(this.config.ttlMs / 1000);
    await this.redisClient!.set(key, JSON.stringify(value), { EX: ttlSeconds });
  }

  private async getFromFirestore(key: string): Promise<T | null> {
    try {
      const headers = await getAuthHeaders();
      const docId = this.hashKey(key);
      const endpoint = buildFirestoreEndpoint(`cache_${this.config.namespace}`, docId);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Firestore get failed: ${response.status}`);
      }

      const doc = await response.json() as {
        fields: {
          value: { stringValue: string };
          expiresAt: { integerValue: string };
        };
      };

      // Check expiration
      const expiresAt = parseInt(doc.fields.expiresAt.integerValue);
      if (Date.now() > expiresAt) {
        // Expired, delete async and return null
        this.deleteFromFirestore(key).catch(() => {});
        return null;
      }

      return JSON.parse(doc.fields.value.stringValue) as T;
    } catch (error) {
      console.warn('[Cache] Firestore get failed:', error);
      return null;
    }
  }

  private async setInFirestore(key: string, value: T): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      const docId = this.hashKey(key);
      const endpoint = `${buildFirestoreEndpoint(`cache_${this.config.namespace}`)}?documentId=${docId}`;

      const now = Date.now();
      const expiresAt = now + this.config.ttlMs;

      await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fields: {
            key: { stringValue: key },
            value: { stringValue: JSON.stringify(value) },
            namespace: { stringValue: this.config.namespace },
            createdAt: { integerValue: now.toString() },
            expiresAt: { integerValue: expiresAt.toString() },
          },
        }),
      });
    } catch (error) {
      console.warn('[Cache] Firestore set failed:', error);
    }
  }

  private async deleteFromFirestore(key: string): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      const docId = this.hashKey(key);
      const endpoint = buildFirestoreEndpoint(`cache_${this.config.namespace}`, docId);

      await fetch(endpoint, {
        method: 'DELETE',
        headers,
      });
    } catch (error) {
      console.warn('[Cache] Firestore delete failed:', error);
    }
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 20);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SPECIALIZED CACHE INSTANCES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Voice cache singleton
let voiceCacheInstance: ThreeTierCache<ArrayBuffer> | null = null;

export async function getVoiceCache(): Promise<ThreeTierCache<ArrayBuffer>> {
  if (!voiceCacheInstance) {
    voiceCacheInstance = new ThreeTierCache<ArrayBuffer>(CACHE_CONFIGS.voice);
    await voiceCacheInstance.initialize();
  }
  return voiceCacheInstance;
}

// Model config cache singleton
let modelConfigCacheInstance: ThreeTierCache<Record<string, unknown>> | null = null;

export async function getModelConfigCache(): Promise<ThreeTierCache<Record<string, unknown>>> {
  if (!modelConfigCacheInstance) {
    modelConfigCacheInstance = new ThreeTierCache<Record<string, unknown>>(CACHE_CONFIGS.modelConfig);
    await modelConfigCacheInstance.initialize();
  }
  return modelConfigCacheInstance;
}

// Context cache singleton
let contextCacheInstance: ThreeTierCache<Record<string, unknown>> | null = null;

export async function getContextCache(): Promise<ThreeTierCache<Record<string, unknown>>> {
  if (!contextCacheInstance) {
    contextCacheInstance = new ThreeTierCache<Record<string, unknown>>(CACHE_CONFIGS.context);
    await contextCacheInstance.initialize();
  }
  return contextCacheInstance;
}

// Embeddings cache singleton
let embeddingsCacheInstance: ThreeTierCache<number[]> | null = null;

export async function getEmbeddingsCache(): Promise<ThreeTierCache<number[]>> {
  if (!embeddingsCacheInstance) {
    embeddingsCacheInstance = new ThreeTierCache<number[]>(CACHE_CONFIGS.embeddings);
    await embeddingsCacheInstance.initialize();
  }
  return embeddingsCacheInstance;
}

// Session cache singleton
let sessionCacheInstance: ThreeTierCache<Record<string, unknown>> | null = null;

export async function getSessionCache(): Promise<ThreeTierCache<Record<string, unknown>>> {
  if (!sessionCacheInstance) {
    sessionCacheInstance = new ThreeTierCache<Record<string, unknown>>(CACHE_CONFIGS.session);
    await sessionCacheInstance.initialize();
  }
  return sessionCacheInstance;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONVENIENCE FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Hash text for cache key (e.g., TTS text → cache key)
 */
export function hashText(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Get cached TTS audio or null
 */
export async function getCachedVoice(text: string): Promise<ArrayBuffer | null> {
  const cache = await getVoiceCache();
  const key = hashText(text);
  return cache.get(key);
}

/**
 * Cache TTS audio
 */
export async function setCachedVoice(text: string, audio: ArrayBuffer): Promise<void> {
  const cache = await getVoiceCache();
  const key = hashText(text);
  await cache.set(key, audio);
}

/**
 * Get all cache stats (for monitoring)
 */
export async function getAllCacheStats(): Promise<Record<string, CacheStats>> {
  return {
    voice: (await getVoiceCache()).getStats(),
    modelConfig: (await getModelConfigCache()).getStats(),
    context: (await getContextCache()).getStats(),
    embeddings: (await getEmbeddingsCache()).getStats(),
    session: (await getSessionCache()).getStats(),
  };
}

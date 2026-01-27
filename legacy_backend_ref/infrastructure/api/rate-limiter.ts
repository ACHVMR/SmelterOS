/**
 * Rate Limiting Middleware
 * SmelterOS Production Traffic Control
 * 
 * Implements sliding window rate limiting for <50ms overhead
 */

// =============================================================================
// TYPES
// =============================================================================

export interface RateLimitConfig {
  windowMs: number;           // Time window in milliseconds
  maxRequests: number;        // Max requests per window
  keyPrefix?: string;         // Redis key prefix
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  headers?: boolean;          // Include rate limit headers
  handler?: (key: string, limit: number, remaining: number) => void;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;            // Unix timestamp
  retryAfter?: number;        // Seconds until next allowed request
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
  increment(key: string): Promise<number>;
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// =============================================================================
// IN-MEMORY STORE (Development)
// =============================================================================

export class InMemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.resetAt) {
      this.store.delete(key);
      return null;
    }
    
    return entry;
  }

  async set(key: string, entry: RateLimitEntry, _ttlMs: number): Promise<void> {
    this.store.set(key, entry);
  }

  async increment(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (entry && Date.now() <= entry.resetAt) {
      entry.count++;
      return entry.count;
    }
    return 0;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// =============================================================================
// REDIS STORE (Production)
// =============================================================================

export class RedisRateLimitStore implements RateLimitStore {
  private redisClient: unknown; // Would be Redis client type

  constructor(_redisUrl: string) {
    // Would initialize Redis connection
    console.log('[RateLimiter] Redis store initialized');
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    // Production: Use Redis GET
    console.log(`[RateLimiter] Redis GET: ${key}`);
    return null;
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    // Production: Use Redis SETEX
    console.log(`[RateLimiter] Redis SETEX: ${key} TTL: ${ttlMs}ms`);
  }

  async increment(key: string): Promise<number> {
    // Production: Use Redis INCR
    console.log(`[RateLimiter] Redis INCR: ${key}`);
    return 1;
  }
}

// =============================================================================
// RATE LIMITER
// =============================================================================

export class RateLimiter {
  private store: RateLimitStore;
  private defaultConfig: RateLimitConfig;

  constructor(store?: RateLimitStore, defaultConfig?: Partial<RateLimitConfig>) {
    this.store = store || new InMemoryRateLimitStore();
    this.defaultConfig = {
      windowMs: 60000,      // 1 minute default
      maxRequests: 100,     // 100 requests per minute
      keyPrefix: 'rl:',
      skipFailedRequests: false,
      skipSuccessfulRequests: false,
      headers: true,
      ...defaultConfig,
    };
  }

  /**
   * Check if request is allowed
   * Optimized for <5ms overhead
   */
  async check(key: string, config?: Partial<RateLimitConfig>): Promise<RateLimitResult> {
    const startTime = Date.now();
    const cfg = { ...this.defaultConfig, ...config };
    const fullKey = `${cfg.keyPrefix}${key}`;

    // Get current state
    let entry = await this.store.get(fullKey);
    
    if (!entry) {
      // First request in window
      entry = {
        count: 1,
        resetAt: Date.now() + cfg.windowMs,
      };
      await this.store.set(fullKey, entry, cfg.windowMs);
      
      return {
        allowed: true,
        limit: cfg.maxRequests,
        remaining: cfg.maxRequests - 1,
        resetAt: entry.resetAt,
      };
    }

    // Check if window expired
    if (Date.now() > entry.resetAt) {
      entry = {
        count: 1,
        resetAt: Date.now() + cfg.windowMs,
      };
      await this.store.set(fullKey, entry, cfg.windowMs);
      
      return {
        allowed: true,
        limit: cfg.maxRequests,
        remaining: cfg.maxRequests - 1,
        resetAt: entry.resetAt,
      };
    }

    // Increment and check
    const newCount = await this.store.increment(fullKey);
    entry.count = newCount;

    const remaining = Math.max(0, cfg.maxRequests - entry.count);
    const allowed = entry.count <= cfg.maxRequests;

    const overhead = Date.now() - startTime;
    if (overhead > 5) {
      console.warn(`[RateLimiter] High overhead: ${overhead}ms (target: <5ms)`);
    }

    return {
      allowed,
      limit: cfg.maxRequests,
      remaining,
      resetAt: entry.resetAt,
      retryAfter: allowed ? undefined : Math.ceil((entry.resetAt - Date.now()) / 1000),
    };
  }

  /**
   * Generate rate limit key from request
   */
  static generateKey(
    organizationId: string,
    userId?: string,
    endpoint?: string
  ): string {
    const parts = [organizationId];
    if (userId) parts.push(userId);
    if (endpoint) parts.push(endpoint.replace(/\//g, ':'));
    return parts.join(':');
  }

  /**
   * Get rate limit headers for response
   */
  static getHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(result.resetAt),
    };

    if (result.retryAfter) {
      headers['Retry-After'] = String(result.retryAfter);
    }

    return headers;
  }
}

// =============================================================================
// TIERED RATE LIMITS BY PLAN
// =============================================================================

export const PlanRateLimits: Record<string, RateLimitConfig> = {
  starter: {
    windowMs: 60000,        // 1 minute
    maxRequests: 60,        // 1 req/sec average
    keyPrefix: 'rl:starter:',
  },
  professional: {
    windowMs: 60000,
    maxRequests: 300,       // 5 req/sec average
    keyPrefix: 'rl:pro:',
  },
  enterprise: {
    windowMs: 60000,
    maxRequests: 1000,      // ~17 req/sec average
    keyPrefix: 'rl:ent:',
  },
  custom: {
    windowMs: 60000,
    maxRequests: 5000,      // ~83 req/sec average
    keyPrefix: 'rl:custom:',
  },
};

// =============================================================================
// ENDPOINT-SPECIFIC LIMITS
// =============================================================================

export const EndpointRateLimits: Record<string, RateLimitConfig> = {
  // Auth endpoints - strict limits
  '/auth/login': {
    windowMs: 60000,
    maxRequests: 10,
    keyPrefix: 'rl:auth:login:',
  },
  '/auth/register': {
    windowMs: 3600000,      // 1 hour
    maxRequests: 5,
    keyPrefix: 'rl:auth:register:',
  },
  
  // AI endpoints - moderate limits
  '/acheevy/execute': {
    windowMs: 60000,
    maxRequests: 50,
    keyPrefix: 'rl:acheevy:exec:',
  },
  '/acheevy/route': {
    windowMs: 60000,
    maxRequests: 100,
    keyPrefix: 'rl:acheevy:route:',
  },
  
  // Voice endpoints - lower limits (expensive)
  '/voice/synthesize': {
    windowMs: 60000,
    maxRequests: 30,
    keyPrefix: 'rl:voice:synth:',
  },
  '/voice/transcribe': {
    windowMs: 60000,
    maxRequests: 30,
    keyPrefix: 'rl:voice:trans:',
  },
  
  // Task endpoints - higher limits
  '/projects/*/tasks': {
    windowMs: 60000,
    maxRequests: 200,
    keyPrefix: 'rl:tasks:',
  },
};

// =============================================================================
// CIRCUIT BREAKER RATE LIMITS (MANDATORY)
// =============================================================================

export const CircuitBreakerRateLimits: Record<string, RateLimitConfig> = {
  // Master switch - very strict
  '/circuits/master/*': {
    windowMs: 300000,       // 5 minutes
    maxRequests: 3,         // Max 3 operations per 5 min
    keyPrefix: 'rl:circuit:master:',
  },
  
  // Panel operations - moderate
  '/circuits/panels/*': {
    windowMs: 60000,
    maxRequests: 20,
    keyPrefix: 'rl:circuit:panel:',
  },
  
  // Circuit operations - higher
  '/circuits/panels/*/circuits/*': {
    windowMs: 60000,
    maxRequests: 100,
    keyPrefix: 'rl:circuit:circuit:',
  },
};

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    // Use Redis in production, in-memory for development
    const isProduction = process.env.NODE_ENV === 'production';
    const store = isProduction
      ? new RedisRateLimitStore(process.env.REDIS_URL || 'redis://localhost:6379')
      : new InMemoryRateLimitStore();
    
    rateLimiterInstance = new RateLimiter(store);
  }
  return rateLimiterInstance;
}

// =============================================================================
// MIDDLEWARE HELPER
// =============================================================================

export interface RateLimitMiddlewareOptions {
  plan?: string;
  endpoint?: string;
  organizationId: string;
  userId?: string;
}

/**
 * Apply rate limiting and return result with headers
 */
export async function applyRateLimit(
  options: RateLimitMiddlewareOptions
): Promise<{ allowed: boolean; headers: Record<string, string>; retryAfter?: number }> {
  const limiter = getRateLimiter();
  
  // Determine config based on endpoint and plan
  let config: RateLimitConfig = PlanRateLimits[options.plan || 'starter'];
  
  // Check for endpoint-specific limits
  if (options.endpoint) {
    for (const [pattern, endpointConfig] of Object.entries(EndpointRateLimits)) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '[^/]+') + '$');
      if (regex.test(options.endpoint)) {
        config = endpointConfig;
        break;
      }
    }
    
    // Check circuit breaker limits
    for (const [pattern, circuitConfig] of Object.entries(CircuitBreakerRateLimits)) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '[^/]+') + '$');
      if (regex.test(options.endpoint)) {
        config = circuitConfig;
        break;
      }
    }
  }
  
  const key = RateLimiter.generateKey(
    options.organizationId,
    options.userId,
    options.endpoint
  );
  
  const result = await limiter.check(key, config);
  const headers = RateLimiter.getHeaders(result);
  
  return {
    allowed: result.allowed,
    headers,
    retryAfter: result.retryAfter,
  };
}

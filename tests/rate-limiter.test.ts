/**
 * SmelterOS Test Suite
 * Rate Limiter Unit Tests
 */

import {
  RateLimiter,
  InMemoryRateLimitStore,
  PlanRateLimits,
  EndpointRateLimits,
  applyRateLimit,
} from '../src/infrastructure/api/rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;
  let store: InMemoryRateLimitStore;

  beforeEach(() => {
    store = new InMemoryRateLimitStore();
    limiter = new RateLimiter(store, {
      windowMs: 1000, // 1 second for testing
      maxRequests: 5,
    });
  });

  afterEach(() => {
    store.destroy();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests under limit', async () => {
      const result = await limiter.check('test-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should decrement remaining count', async () => {
      await limiter.check('test-key');
      await limiter.check('test-key');
      const result = await limiter.check('test-key');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should block after limit exceeded', async () => {
      for (let i = 0; i < 5; i++) {
        await limiter.check('test-key');
      }
      
      const result = await limiter.check('test-key');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should provide retryAfter when blocked', async () => {
      for (let i = 0; i < 5; i++) {
        await limiter.check('test-key');
      }
      
      const result = await limiter.check('test-key');
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after window expires', async () => {
      for (let i = 0; i < 5; i++) {
        await limiter.check('test-key');
      }
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result = await limiter.check('test-key');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should track separate keys independently', async () => {
      for (let i = 0; i < 5; i++) {
        await limiter.check('key-1');
      }
      
      const result1 = await limiter.check('key-1');
      const result2 = await limiter.check('key-2');
      
      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('Key Generation', () => {
    it('should generate key from organization only', () => {
      const key = RateLimiter.generateKey('org_123');
      expect(key).toBe('org_123');
    });

    it('should generate key with user', () => {
      const key = RateLimiter.generateKey('org_123', 'user_456');
      expect(key).toBe('org_123:user_456');
    });

    it('should generate key with endpoint', () => {
      const key = RateLimiter.generateKey('org_123', 'user_456', '/api/test');
      expect(key).toBe('org_123:user_456::api:test');
    });
  });

  describe('Headers', () => {
    it('should generate rate limit headers', () => {
      const result = {
        allowed: true,
        limit: 100,
        remaining: 95,
        resetAt: Date.now() + 60000,
      };

      const headers = RateLimiter.getHeaders(result);
      
      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('95');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should include Retry-After when blocked', () => {
      const result = {
        allowed: false,
        limit: 100,
        remaining: 0,
        resetAt: Date.now() + 60000,
        retryAfter: 30,
      };

      const headers = RateLimiter.getHeaders(result);
      
      expect(headers['Retry-After']).toBe('30');
    });
  });

  describe('Performance', () => {
    it('should check rate limit in <5ms', async () => {
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        await limiter.check(`perf-key-${i}`);
      }
      
      const elapsed = performance.now() - start;
      const avgMs = elapsed / 100;
      
      expect(avgMs).toBeLessThan(5);
    });
  });
});

describe('Plan Rate Limits', () => {
  it('should have starter plan limits', () => {
    expect(PlanRateLimits.starter).toBeDefined();
    expect(PlanRateLimits.starter.maxRequests).toBe(60);
  });

  it('should have professional plan limits', () => {
    expect(PlanRateLimits.professional).toBeDefined();
    expect(PlanRateLimits.professional.maxRequests).toBe(300);
  });

  it('should have enterprise plan limits', () => {
    expect(PlanRateLimits.enterprise).toBeDefined();
    expect(PlanRateLimits.enterprise.maxRequests).toBe(1000);
  });

  it('should have custom plan limits', () => {
    expect(PlanRateLimits.custom).toBeDefined();
    expect(PlanRateLimits.custom.maxRequests).toBe(5000);
  });

  it('should increase limits with plan tier', () => {
    expect(PlanRateLimits.professional.maxRequests)
      .toBeGreaterThan(PlanRateLimits.starter.maxRequests);
    expect(PlanRateLimits.enterprise.maxRequests)
      .toBeGreaterThan(PlanRateLimits.professional.maxRequests);
    expect(PlanRateLimits.custom.maxRequests)
      .toBeGreaterThan(PlanRateLimits.enterprise.maxRequests);
  });
});

describe('Endpoint Rate Limits', () => {
  it('should have strict auth login limits', () => {
    expect(EndpointRateLimits['/auth/login']).toBeDefined();
    expect(EndpointRateLimits['/auth/login'].maxRequests).toBeLessThan(20);
  });

  it('should have stricter auth register limits', () => {
    expect(EndpointRateLimits['/auth/register']).toBeDefined();
    expect(EndpointRateLimits['/auth/register'].maxRequests).toBeLessThan(10);
    expect(EndpointRateLimits['/auth/register'].windowMs).toBe(3600000);
  });

  it('should have voice synthesis limits', () => {
    expect(EndpointRateLimits['/voice/synthesize']).toBeDefined();
    expect(EndpointRateLimits['/voice/synthesize'].maxRequests).toBe(30);
  });

  it('should have ACHEEVY execution limits', () => {
    expect(EndpointRateLimits['/acheevy/execute']).toBeDefined();
    expect(EndpointRateLimits['/acheevy/execute'].maxRequests).toBe(50);
  });
});

describe('Rate Limit Middleware', () => {
  it('should apply organization rate limit', async () => {
    const result = await applyRateLimit({
      organizationId: 'org_test',
      plan: 'starter',
    });

    expect(result.allowed).toBe(true);
    expect(result.headers['X-RateLimit-Limit']).toBeDefined();
  });

  it('should include user in rate limit key', async () => {
    const result = await applyRateLimit({
      organizationId: 'org_test',
      userId: 'user_test',
      plan: 'starter',
    });

    expect(result.allowed).toBe(true);
  });

  it('should apply endpoint-specific limits', async () => {
    const result = await applyRateLimit({
      organizationId: 'org_test',
      endpoint: '/auth/login',
    });

    expect(result.headers['X-RateLimit-Limit']).toBe('10');
  });
});

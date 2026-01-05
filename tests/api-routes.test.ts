/**
 * SmelterOS Test Suite
 * API Routes Unit Tests
 */

import {
  allRoutes,
  matchRoute,
  extractParams,
  handleRequest,
  Responses,
  CloudRunRequest,
} from '../src/infrastructure/api/routes';

describe('API Routes', () => {
  describe('Route Matching', () => {
    it('should match health endpoint', () => {
      const route = matchRoute('GET', '/health');
      expect(route).not.toBeNull();
      expect(route?.path).toBe('/health');
    });

    it('should match parameterized routes', () => {
      const route = matchRoute('GET', '/projects/proj_123');
      expect(route).not.toBeNull();
      expect(route?.path).toBe('/projects/:projectId');
    });

    it('should match nested parameterized routes', () => {
      const route = matchRoute('GET', '/projects/proj_123/tasks');
      expect(route).not.toBeNull();
    });

    it('should return null for unknown routes', () => {
      const route = matchRoute('GET', '/unknown/path');
      expect(route).toBeNull();
    });

    it('should respect HTTP method', () => {
      const getRoute = matchRoute('GET', '/health');
      const postRoute = matchRoute('POST', '/health');
      
      expect(getRoute).not.toBeNull();
      expect(postRoute).toBeNull();
    });
  });

  describe('Parameter Extraction', () => {
    it('should extract single parameter', () => {
      const params = extractParams('/projects/:projectId', '/projects/proj_123');
      expect(params.projectId).toBe('proj_123');
    });

    it('should extract multiple parameters', () => {
      const params = extractParams(
        '/circuits/panels/:panelId/circuits/:circuitId/:action',
        '/circuits/panels/ai-agents/circuits/voice/on'
      );
      expect(params.panelId).toBe('ai-agents');
      expect(params.circuitId).toBe('voice');
      expect(params.action).toBe('on');
    });

    it('should return empty object for no parameters', () => {
      const params = extractParams('/health', '/health');
      expect(Object.keys(params).length).toBe(0);
    });
  });

  describe('Response Helpers', () => {
    it('should create OK response', () => {
      const response = Responses.ok({ data: 'test' });
      expect(response.status).toBe(200);
      expect((response.body as any).success).toBe(true);
    });

    it('should create created response', () => {
      const response = Responses.created({ id: '123' });
      expect(response.status).toBe(201);
    });

    it('should create badRequest response', () => {
      const response = Responses.badRequest('Invalid input');
      expect(response.status).toBe(400);
      expect((response.body as any).error).toBe('Invalid input');
    });

    it('should create unauthorized response', () => {
      const response = Responses.unauthorized();
      expect(response.status).toBe(401);
    });

    it('should create notFound response', () => {
      const response = Responses.notFound('User');
      expect(response.status).toBe(404);
      expect((response.body as any).error).toBe('User not found');
    });

    it('should create tooManyRequests response', () => {
      const response = Responses.tooManyRequests(30);
      expect(response.status).toBe(429);
      expect(response.headers?.['Retry-After']).toBe('30');
    });
  });

  describe('Request Handler', () => {
    it('should handle health check', async () => {
      const request: CloudRunRequest = {
        method: 'GET',
        url: 'http://localhost:8080/health',
        headers: {},
        body: null,
      };

      const response = await handleRequest(request);
      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('healthy');
    });

    it('should return 404 for unknown routes', async () => {
      const request: CloudRunRequest = {
        method: 'GET',
        url: 'http://localhost:8080/unknown',
        headers: {},
        body: null,
      };

      const response = await handleRequest(request);
      expect(response.statusCode).toBe(404);
    });

    it('should include request ID header', async () => {
      const request: CloudRunRequest = {
        method: 'GET',
        url: 'http://localhost:8080/health',
        headers: {},
        body: null,
      };

      const response = await handleRequest(request);
      expect(response.headers['X-Request-Id']).toBeDefined();
      expect(response.headers['X-Request-Id']).toContain('req_');
    });

    it('should include response time header', async () => {
      const request: CloudRunRequest = {
        method: 'GET',
        url: 'http://localhost:8080/health',
        headers: {},
        body: null,
      };

      const response = await handleRequest(request);
      expect(response.headers['X-Response-Time']).toBeDefined();
      expect(response.headers['X-Response-Time']).toContain('ms');
    });
  });

  describe('Route Registry', () => {
    it('should have health routes', () => {
      const healthRoutes = allRoutes.filter(r => r.path.startsWith('/health'));
      expect(healthRoutes.length).toBeGreaterThanOrEqual(3);
    });

    it('should have auth routes', () => {
      const authRoutes = allRoutes.filter(r => r.path.startsWith('/auth'));
      expect(authRoutes.length).toBeGreaterThanOrEqual(3);
    });

    it('should have project routes', () => {
      const projectRoutes = allRoutes.filter(r => r.path.includes('project'));
      expect(projectRoutes.length).toBeGreaterThanOrEqual(4);
    });

    it('should have circuit routes', () => {
      const circuitRoutes = allRoutes.filter(r => r.path.startsWith('/circuits'));
      expect(circuitRoutes.length).toBeGreaterThanOrEqual(4);
    });

    it('should have ACHEEVY routes', () => {
      const acheevyRoutes = allRoutes.filter(r => r.path.startsWith('/acheevy'));
      expect(acheevyRoutes.length).toBeGreaterThanOrEqual(3);
    });

    it('should have voice routes', () => {
      const voiceRoutes = allRoutes.filter(r => r.path.startsWith('/voice'));
      expect(voiceRoutes.length).toBeGreaterThanOrEqual(2);
    });

    it('should have webhook routes', () => {
      const webhookRoutes = allRoutes.filter(r => r.path.startsWith('/webhooks'));
      expect(webhookRoutes.length).toBeGreaterThanOrEqual(2);
    });

    it('should all have valid auth levels', () => {
      const validAuthLevels = ['public', 'required', 'admin', 'owner'];
      
      allRoutes.forEach(route => {
        expect(validAuthLevels).toContain(route.auth);
      });
    });
  });
});

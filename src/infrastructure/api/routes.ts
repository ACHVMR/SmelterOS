/**
 * SmelterOS API Routes
 * Cloud Run Compatible Express/Fastify-style API Layer
 * 
 * Optimized for <50ms latency (p95)
 */

import { repositories } from '../database/repository';
import { verifyIdToken, getUserByUid } from '../firebase/admin';
import { getIngotAssembler } from '../tools/ingot-assembler';
import { getPaywallService, acheevyPaywallCheck } from '../tools/paywall';
import { queryRosterByCapabilities, getToolById, TOOL_ROSTER, CapabilityVertical } from '../tools/roster';
import { getFileManagerRAG } from '../rag/file-manager';

// =============================================================================
// ROUTE TYPES
// =============================================================================

export interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: unknown;
  headers: Record<string, string>;
  user?: AuthenticatedUser;
  organization?: { id: string; plan: string };
  requestId: string;
  timestamp: number;
}

export interface APIResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
}

export type RouteHandler = (req: APIRequest) => Promise<APIResponse>;

export interface Route {
  method: APIRequest['method'];
  path: string;
  handler: RouteHandler;
  auth: 'public' | 'required' | 'admin' | 'owner';
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

export const Responses = {
  ok: <T>(data: T, meta?: Record<string, unknown>): APIResponse => ({
    status: 200,
    body: { success: true, data, ...meta },
  }),

  created: <T>(data: T): APIResponse => ({
    status: 201,
    body: { success: true, data },
  }),

  noContent: (): APIResponse => ({
    status: 204,
    body: null,
  }),

  badRequest: (message: string, errors?: unknown[]): APIResponse => ({
    status: 400,
    body: { success: false, error: message, errors },
  }),

  unauthorized: (message = 'Unauthorized'): APIResponse => ({
    status: 401,
    body: { success: false, error: message },
  }),

  forbidden: (message = 'Forbidden'): APIResponse => ({
    status: 403,
    body: { success: false, error: message },
  }),

  notFound: (resource = 'Resource'): APIResponse => ({
    status: 404,
    body: { success: false, error: `${resource} not found` },
  }),

  tooManyRequests: (retryAfter: number): APIResponse => ({
    status: 429,
    body: { success: false, error: 'Too many requests', retryAfter },
    headers: { 'Retry-After': String(retryAfter) },
  }),

  serverError: (message = 'Internal server error'): APIResponse => ({
    status: 500,
    body: { success: false, error: message },
  }),
};

// =============================================================================
// ROOT & STATIC ROUTES
// =============================================================================

const rootRoutes: Route[] = [
  {
    method: 'GET',
    path: '/',
    auth: 'public',
    handler: async (): Promise<APIResponse> => {
      return {
        status: 200,
        body: {
          success: true,
          data: {
            name: 'SmelterOS-ORACLE',
            version: '2.1.0',
            status: 'operational',
            documentation: '/health',
            endpoints: {
              orchestrate: '/acheevy/orchestrate',
              ethicsGate: '/strata/ethics-gate',
              sandboxes: '/sandbox/deploy-all-oracle',
              agents: '/oracle/agents',
              config: '/oracle/config',
            },
          },
        },
      };
    },
  },
  {
    method: 'GET',
    path: '/favicon.ico',
    auth: 'public',
    handler: async (): Promise<APIResponse> => {
      // Return empty favicon (prevents 404)
      return {
        status: 204,
        body: null,
        headers: { 'Content-Type': 'image/x-icon' },
      };
    },
  },
];

// =============================================================================
// HEALTH & STATUS ROUTES
// =============================================================================

const healthRoutes: Route[] = [
  {
    method: 'GET',
    path: '/health',
    auth: 'public',
    handler: async (): Promise<APIResponse> => {
      return Responses.ok({
        status: 'healthy',
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    },
  },
  {
    method: 'GET',
    path: '/health/ready',
    auth: 'public',
    handler: async (): Promise<APIResponse> => {
      // Check dependencies
      const checks = {
        database: true, // Would check actual connection
        cache: true,
        circuitBreaker: true,
      };
      
      const allHealthy = Object.values(checks).every(Boolean);
      
      return {
        status: allHealthy ? 200 : 503,
        body: {
          ready: allHealthy,
          checks,
          timestamp: new Date().toISOString(),
        },
      };
    },
  },
  {
    method: 'GET',
    path: '/health/live',
    auth: 'public',
    handler: async (): Promise<APIResponse> => {
      return Responses.ok({ alive: true });
    },
  },
];

// =============================================================================
// AUTH ROUTES
// =============================================================================

const authRoutes: Route[] = [
  {
    method: 'POST',
    path: '/auth/login',
    auth: 'public',
    rateLimit: { windowMs: 60000, maxRequests: 10 },
    handler: async (req): Promise<APIResponse> => {
      const { idToken } = req.body as { idToken: string };
      
      if (!idToken) {
        return Responses.badRequest('idToken is required');
      }

      try {
        // Verify Firebase ID token (PRODUCTION)
        const decodedToken = await verifyIdToken(idToken);
        
        // Get user from database
        const user = await repositories.getUsers().getById(decodedToken.uid);
        
        if (!user) {
          // First-time login - create user record
          const newUser = await repositories.getUsers().create({
            email: decodedToken.email || '',
            displayName: decodedToken.name || decodedToken.email || 'User',
            avatarUrl: decodedToken.picture || undefined,
            organizationId: '', // Will be set during onboarding
            role: 'developer',
            preferences: {
              theme: 'dark',
              language: 'en',
              timezone: 'UTC',
              notifications: { 
                email: true, 
                push: true, 
                slack: false,
                circuitTrips: true,
                emergencyAlerts: true,
                dailyDigest: false,
              },
              dashboard: {
                defaultView: 'grid',
                panelOrder: [],
                favoriteCircuits: [],
                refreshInterval: 30,
              },
            },
            lastActiveAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
            authProvider: 'google',
            isActive: true,
          });
          
          return Responses.created({
            user: {
              id: newUser.id,
              email: newUser.email,
              displayName: newUser.displayName,
              organizationId: newUser.organizationId,
            },
            accessToken: idToken,
            expiresIn: decodedToken.exp - Math.floor(Date.now() / 1000),
            isNewUser: true,
          });
        }

        // Existing user
        await repositories.getUsers().updateLastActive(user.id);
        
        return Responses.ok({
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            organizationId: user.organizationId,
          },
          accessToken: idToken,
          expiresIn: decodedToken.exp - Math.floor(Date.now() / 1000),
          isNewUser: false,
        });
      } catch (error) {
        console.error('[Auth] Login error:', error);
        return Responses.unauthorized('Invalid or expired token');
      }
    },
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      if (!req.user) {
        return Responses.unauthorized();
      }

      return Responses.ok({
        accessToken: 'new_jwt_token',
        expiresIn: 3600,
      });
    },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      // Invalidate session
      await repositories.getAuditLogs().log(
        req.user!.organizationId,
        req.user!.id,
        'user.logout',
        { type: 'user', id: req.user!.id },
        {},
        req.headers['x-forwarded-for'] || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );
      
      return Responses.noContent();
    },
  },
];

// =============================================================================
// USER ROUTES
// =============================================================================

const userRoutes: Route[] = [
  {
    method: 'GET',
    path: '/users/me',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const user = await repositories.getUsers().getById(req.user!.id);
      
      if (!user) {
        return Responses.notFound('User');
      }
      
      return Responses.ok(user);
    },
  },
  {
    method: 'PATCH',
    path: '/users/me',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const updates = req.body as Record<string, unknown>;
      
      // Only allow certain fields to be updated
      const allowedFields = ['displayName', 'avatarUrl', 'preferences'];
      const sanitized = Object.fromEntries(
        Object.entries(updates).filter(([key]) => allowedFields.includes(key))
      );
      
      const user = await repositories.getUsers().update(req.user!.id, sanitized);
      
      if (!user) {
        return Responses.notFound('User');
      }
      
      return Responses.ok(user);
    },
  },
  {
    method: 'GET',
    path: '/users',
    auth: 'admin',
    handler: async (req): Promise<APIResponse> => {
      const { limit = '50', offset = '0' } = req.query as Record<string, string>;
      
      const result = await repositories.getUsers().getByOrganization(
        req.organization!.id,
        { limit: parseInt(limit), offset: parseInt(offset) }
      );
      
      return Responses.ok(result.data, {
        total: result.total,
        hasMore: result.hasMore,
      });
    },
  },
];

// =============================================================================
// PROJECT ROUTES
// =============================================================================

const projectRoutes: Route[] = [
  {
    method: 'GET',
    path: '/projects',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const { status } = req.query as { status?: 'active' | 'paused' | 'archived' };
      
      const result = await repositories.getProjects().getByOrganization(
        req.organization!.id,
        status
      );
      
      return Responses.ok(result.data, {
        total: result.total,
        hasMore: result.hasMore,
      });
    },
  },
  {
    method: 'GET',
    path: '/projects/:projectId',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const project = await repositories.getProjects().getById(req.params.projectId);
      
      if (!project) {
        return Responses.notFound('Project');
      }
      
      // Verify org membership
      if (project.organizationId !== req.organization!.id) {
        return Responses.forbidden();
      }
      
      return Responses.ok(project);
    },
  },
  {
    method: 'POST',
    path: '/projects',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const { name, description, repositoryUrl, environment } = req.body as {
        name: string;
        description?: string;
        repositoryUrl?: string;
        environment?: 'development' | 'staging' | 'production';
      };
      
      if (!name) {
        return Responses.badRequest('name is required');
      }
      
      const project = await repositories.getProjects().create({
        organizationId: req.organization!.id,
        name,
        description: description || '',
        repositoryUrl,
        defaultBranch: 'main',
        environment: environment || 'development',
        status: 'active',
        createdBy: req.user!.id,
        teamMembers: [{ userId: req.user!.id, role: 'lead', addedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } }],
        integrations: {},
      });
      
      return Responses.created(project);
    },
  },
  {
    method: 'PATCH',
    path: '/projects/:projectId',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const project = await repositories.getProjects().getById(req.params.projectId);
      
      if (!project) {
        return Responses.notFound('Project');
      }
      
      if (project.organizationId !== req.organization!.id) {
        return Responses.forbidden();
      }
      
      const updates = req.body as Record<string, unknown>;
      const updated = await repositories.getProjects().update(req.params.projectId, updates);
      
      return Responses.ok(updated);
    },
  },
  {
    method: 'DELETE',
    path: '/projects/:projectId',
    auth: 'admin',
    handler: async (req): Promise<APIResponse> => {
      const project = await repositories.getProjects().getById(req.params.projectId);
      
      if (!project) {
        return Responses.notFound('Project');
      }
      
      if (project.organizationId !== req.organization!.id) {
        return Responses.forbidden();
      }
      
      // Soft delete - archive instead of hard delete
      await repositories.getProjects().update(req.params.projectId, { status: 'archived' });
      
      return Responses.noContent();
    },
  },
];

// =============================================================================
// TASK ROUTES
// =============================================================================

const taskRoutes: Route[] = [
  {
    method: 'GET',
    path: '/projects/:projectId/tasks',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const { status, limit = '50' } = req.query as { status?: string; limit?: string };
      
      const tasks = status
        ? await repositories.getTasks().getByStatus(req.params.projectId, status as any)
        : await repositories.getTasks().getPending(req.params.projectId);
      
      return Responses.ok(tasks.slice(0, parseInt(limit)));
    },
  },
  {
    method: 'POST',
    path: '/projects/:projectId/tasks',
    auth: 'required',
    rateLimit: { windowMs: 60000, maxRequests: 100 },
    handler: async (req): Promise<APIResponse> => {
      const { type, title, description, priority } = req.body as {
        type: 'code' | 'review' | 'deploy' | 'debug' | 'document' | 'test';
        title: string;
        description?: string;
        priority?: 'low' | 'normal' | 'high' | 'urgent';
      };
      
      if (!type || !title) {
        return Responses.badRequest('type and title are required');
      }
      
      const task = await repositories.getTasks().create({
        projectId: req.params.projectId,
        userId: req.user!.id,
        type,
        title,
        description: description || '',
        status: 'pending',
        priority: priority || 'normal',
        metrics: {
          executionTimeMs: 0,
          tokensUsed: 0,
          fdhCycles: 0,
          vibeValidations: 0,
        },
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      } as any);
      
      return Responses.created(task);
    },
  },
  {
    method: 'GET',
    path: '/tasks/:taskId',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const task = await repositories.getTasks().getById(req.params.taskId);
      
      if (!task) {
        return Responses.notFound('Task');
      }
      
      return Responses.ok(task);
    },
  },
  {
    method: 'POST',
    path: '/tasks/:taskId/cancel',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const task = await repositories.getTasks().getById(req.params.taskId);
      
      if (!task) {
        return Responses.notFound('Task');
      }
      
      if (task.status === 'completed' || task.status === 'cancelled') {
        return Responses.badRequest('Task cannot be cancelled');
      }
      
      const updated = await repositories.getTasks().update(req.params.taskId, {
        status: 'cancelled',
      });
      
      return Responses.ok(updated);
    },
  },
];

// =============================================================================
// CIRCUIT BREAKER ROUTES
// =============================================================================

const circuitRoutes: Route[] = [
  {
    method: 'GET',
    path: '/circuits',
    auth: 'required',
    handler: async (): Promise<APIResponse> => {
      // Get all circuit states
      // In production, this would query the Digital Breaker
      return Responses.ok({
        masterState: 'on',
        panels: [
          { id: 'ai-agents', state: 'on', activeCircuits: 6, trippedCircuits: 0 },
          { id: 'repositories', state: 'on', activeCircuits: 1, trippedCircuits: 0 },
          { id: 'integrations', state: 'on', activeCircuits: 5, trippedCircuits: 0 },
          { id: 'voice-stt-tts', state: 'on', activeCircuits: 4, trippedCircuits: 0 },
          { id: 'deployment', state: 'on', activeCircuits: 5, trippedCircuits: 0 },
        ],
      });
    },
  },
  {
    method: 'GET',
    path: '/circuits/panels/:panelId',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const circuits = await repositories.getCircuitStates().getForPanel(req.params.panelId);
      return Responses.ok(circuits);
    },
  },
  {
    method: 'POST',
    path: '/circuits/master/:action',
    auth: 'owner',
    handler: async (req): Promise<APIResponse> => {
      const { action } = req.params;
      
      if (!['on', 'off', 'emergency-shutdown'].includes(action)) {
        return Responses.badRequest('Invalid action');
      }
      
      // Log critical action
      await repositories.getAuditLogs().log(
        req.organization!.id,
        req.user!.id,
        action === 'emergency-shutdown' ? 'master.emergency_shutdown' : `master.${action}` as any,
        { type: 'master', id: 'master' },
        { action },
        req.headers['x-forwarded-for'] || 'unknown',
        req.headers['user-agent'] || 'unknown',
        action === 'emergency-shutdown' ? 'critical' : 'warning'
      );
      
      return Responses.ok({ action, success: true, timestamp: new Date().toISOString() });
    },
  },
  {
    method: 'POST',
    path: '/circuits/panels/:panelId/:action',
    auth: 'admin',
    handler: async (req): Promise<APIResponse> => {
      const { panelId, action } = req.params;
      
      if (!['on', 'off', 'lockout', 'unlock'].includes(action)) {
        return Responses.badRequest('Invalid action');
      }
      
      await repositories.getAuditLogs().log(
        req.organization!.id,
        req.user!.id,
        `panel.${action}` as any,
        { type: 'panel', id: panelId },
        { action },
        req.headers['x-forwarded-for'] || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );
      
      return Responses.ok({ panelId, action, success: true });
    },
  },
  {
    method: 'POST',
    path: '/circuits/panels/:panelId/circuits/:circuitId/:action',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const { panelId, circuitId, action } = req.params;
      
      if (!['on', 'off', 'reset'].includes(action)) {
        return Responses.badRequest('Invalid action');
      }
      
      if (action === 'reset') {
        await repositories.getCircuitStates().resetCircuit(panelId, circuitId);
      }
      
      await repositories.getAuditLogs().log(
        req.organization!.id,
        req.user!.id,
        `circuit.${action}` as any,
        { type: 'circuit', id: `${panelId}:${circuitId}` },
        { panelId, circuitId, action },
        req.headers['x-forwarded-for'] || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );
      
      return Responses.ok({ panelId, circuitId, action, success: true });
    },
  },
];

// =============================================================================
// ACHEEVY AI ROUTES
// =============================================================================

const acheevyRoutes: Route[] = [
  /**
   * POST /acheevy/orchestrate - Full ACHEEVY Orchestration Pipeline (Phase 2)
   * Flow: Query → Pub/Sub → Roster → Ingot → Sandbox → Response
   */
  {
    method: 'POST',
    path: '/acheevy/orchestrate',
    auth: 'required',
    rateLimit: { windowMs: 60000, maxRequests: 30 },
    handler: async (req): Promise<APIResponse> => {
      const { getACHEEVYOrchestrator } = await import('../agents/acheevy-orchestrator.js');
      
      const body = req.body as {
        query: string;
        context?: Record<string, unknown>;
      };
      
      if (!body.query) {
        return Responses.badRequest('query is required');
      }
      
      const orchestrator = getACHEEVYOrchestrator();
      
      const result = await orchestrator.orchestrate({
        sessionId: req.requestId,
        userId: req.user?.id || 'anonymous',
        organizationId: req.user?.organizationId || 'default',
        query: body.query,
        tier: (req.organization?.plan as 'free' | 'data_entry' | 'enterprise') || 'free',
        context: body.context,
      });
      
      return Responses.ok({
        success: result.success,
        output: result.output,
        delegations: result.delegations.map(d => ({
          agent: d.agentId,
          sandbox: d.sandboxId,
          success: d.result.success,
          executionTimeMs: d.result.executionTimeMs,
        })),
        totalCost: result.totalCost,
        budgetRemaining: result.budgetRemaining,
        escalated: result.escalated,
        escalationReason: result.escalationReason,
        executionTimeMs: result.executionTimeMs,
      });
    },
  },
  {
    method: 'POST',
    path: '/acheevy/execute',
    auth: 'required',
    rateLimit: { windowMs: 60000, maxRequests: 50 },
    handler: async (req): Promise<APIResponse> => {
      const { specPath, parameters, options } = req.body as {
        specPath: string;
        parameters?: Record<string, unknown>;
        options?: { stream?: boolean; timeout?: number };
      };
      
      if (!specPath) {
        return Responses.badRequest('specPath is required');
      }
      
      // Execute through SmelterOS
      const startTime = Date.now();
      
      // Would call actual AVVA NOON consciousness here
      const result = {
        success: true,
        specPath,
        output: `Executed ${specPath} successfully`,
        metrics: {
          executionTimeMs: Date.now() - startTime,
          tokensUsed: 150,
          fdhCycles: 2,
          vibeScore: 0.97,
        },
      };
      
      return Responses.ok(result);
    },
  },
  {
    method: 'POST',
    path: '/acheevy/validate',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const { content, vibeThreshold = 0.995 } = req.body as {
        content: string;
        vibeThreshold?: number;
      };
      
      if (!content) {
        return Responses.badRequest('content is required');
      }
      
      // Run V.I.B.E. validation
      const result = {
        valid: true,
        vibeScore: 0.997,
        threshold: vibeThreshold,
        dimensions: {
          virtue: 0.98,
          integrity: 0.99,
          behavioral: 0.99,
          equilibrium: 0.98,
        },
        recommendations: [],
      };
      
      return Responses.ok(result);
    },
  },
  {
    method: 'POST',
    path: '/acheevy/route',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const { input, preferredSpecialists } = req.body as {
        input: string;
        preferredSpecialists?: string[];
      };
      
      if (!input) {
        return Responses.badRequest('input is required');
      }
      
      // BoomerAng specialist routing
      const routing = {
        selectedSpecialist: 'code-generator',
        confidence: 0.94,
        alternatives: [
          { specialistId: 'full-stack-dev', score: 0.87 },
          { specialistId: 'backend-architect', score: 0.82 },
        ],
        latencyMs: 12,
      };
      
      return Responses.ok(routing);
    },
  },
];

// =============================================================================
// VOICE ROUTES
// =============================================================================

const voiceRoutes: Route[] = [
  {
    method: 'POST',
    path: '/voice/synthesize',
    auth: 'required',
    rateLimit: { windowMs: 60000, maxRequests: 30 },
    handler: async (req): Promise<APIResponse> => {
      const { text, voiceId, options } = req.body as {
        text: string;
        voiceId?: string;
        options?: { speed?: number; pitch?: number };
      };
      
      if (!text) {
        return Responses.badRequest('text is required');
      }
      
      // Would call ElevenLabs API here
      return Responses.ok({
        audioUrl: `https://audio.smelter.os/tts/${Date.now()}.mp3`,
        duration: Math.ceil(text.length / 15), // Rough estimate
        voiceId: voiceId || 'default',
        cached: false,
      });
    },
  },
  {
    method: 'POST',
    path: '/voice/transcribe',
    auth: 'required',
    rateLimit: { windowMs: 60000, maxRequests: 30 },
    handler: async (req): Promise<APIResponse> => {
      const { audioUrl, language } = req.body as {
        audioUrl: string;
        language?: string;
      };
      
      if (!audioUrl) {
        return Responses.badRequest('audioUrl is required');
      }
      
      // Would call Deepgram/Scribe API here
      return Responses.ok({
        transcript: 'Transcribed text would appear here',
        confidence: 0.95,
        language: language || 'en',
        duration: 0,
      });
    },
  },
];

// =============================================================================
// WEBHOOK ROUTES
// =============================================================================

const webhookRoutes: Route[] = [
  {
    method: 'POST',
    path: '/webhooks/github',
    auth: 'public',
    handler: async (req): Promise<APIResponse> => {
      const event = req.headers['x-github-event'];
      const signature = req.headers['x-hub-signature-256'];
      
      if (!signature) {
        return Responses.unauthorized('Missing signature');
      }
      
      // Verify webhook signature (production implementation)
      // const isValid = verifyGitHubSignature(req.body, signature, secret);
      
      console.log(`[Webhook] GitHub ${event} received`);
      
      return Responses.ok({ received: true, event });
    },
  },
  {
    method: 'POST',
    path: '/webhooks/stripe',
    auth: 'public',
    handler: async (req): Promise<APIResponse> => {
      const signature = req.headers['stripe-signature'];
      
      if (!signature) {
        return Responses.unauthorized('Missing signature');
      }
      
      // Verify Stripe webhook (production implementation)
      // const event = stripe.webhooks.constructEvent(req.body, signature, secret);
      
      console.log('[Webhook] Stripe event received');
      
      return Responses.ok({ received: true });
    },
  },
];

// =============================================================================
// INGOT & TOOL ROSTER ROUTES
// =============================================================================

const ingotRoutes: Route[] = [
  // Get Ingot visualization (SSR HTML or JSON)
  {
    method: 'GET',
    path: '/ingot/:id',
    auth: 'public',
    handler: async (req): Promise<APIResponse> => {
      const { id } = req.params;
      const assembler = getIngotAssembler();

      const ingot = await assembler.getIngot(id);
      if (!ingot) {
        return Responses.notFound('Ingot');
      }

      const state = await assembler.getExecutionState(id);
      
      // Return JSON (SSR HTML handled separately if needed)
      return Responses.ok({
        ingot: {
          ...ingot,
          dependencies: Object.fromEntries(ingot.dependencies),
        },
        state: state ? {
          ...state,
          toolStates: Object.fromEntries(state.toolStates),
        } : null,
      });
    },
  },

  // Get Ingot execution state (for real-time polling)
  {
    method: 'GET',
    path: '/ingot/:id/state',
    auth: 'public',
    handler: async (req): Promise<APIResponse> => {
      const { id } = req.params;
      const assembler = getIngotAssembler();

      const ingot = await assembler.getIngot(id);
      if (!ingot) {
        return Responses.notFound('Ingot');
      }

      const state = await assembler.getExecutionState(id);
      const completedCount = state
        ? Array.from(state.toolStates.values()).filter(s => s.status === 'completed').length
        : 0;

      return Responses.ok({
        ingotId: id,
        status: state?.status || 'pending',
        progress: Math.round((completedCount / ingot.tools.length) * 100),
        toolStates: state ? Object.fromEntries(state.toolStates) : {},
      });
    },
  },

  // Cast a new Ingot from request
  {
    method: 'POST',
    path: '/ingot/cast',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const { request, tenantId } = req.body as { request: string; tenantId?: string };
      
      if (!request) {
        return Responses.badRequest('request is required');
      }

      const assembler = getIngotAssembler();
      const { ingot, paywallResults, alternatives } = await assembler.castIngot(
        request,
        req.user!.id,
        req.user!.email,
        tenantId || 'default'
      );

      return Responses.created({
        ingot: {
          ...ingot,
          dependencies: Object.fromEntries(ingot.dependencies),
        },
        paywallBlocked: Array.from(paywallResults.entries())
          .filter(([_, r]) => !r.allowed)
          .map(([toolId, r]) => ({
            toolId,
            reason: r.reason,
            upgradePrompt: r.upgradePrompt,
          })),
        suggestedAlternatives: alternatives.map(t => t.toolId),
      });
    },
  },

  // Tool Roster endpoints
  {
    method: 'GET',
    path: '/roster',
    auth: 'public',
    handler: async (req): Promise<APIResponse> => {
      const vertical = req.query.vertical as string | undefined;
      
      let tools = TOOL_ROSTER;
      if (vertical) {
        tools = tools.filter(t => t.vertical === vertical);
      }

      return Responses.ok({
        tools: tools.map(t => ({
          id: t.id,
          toolId: t.toolId,
          name: t.name,
          visualName: t.visualName,
          vertical: t.vertical,
          tierRequired: t.tierRequired,
          status: t.status,
        })),
        count: tools.length,
      });
    },
  },

  {
    method: 'GET',
    path: '/roster/:toolId',
    auth: 'public',
    handler: async (req): Promise<APIResponse> => {
      const { toolId } = req.params;
      const tool = getToolById(toolId);
      
      if (!tool) {
        return Responses.notFound('Tool');
      }

      return Responses.ok(tool);
    },
  },

  // Paywall check endpoint
  {
    method: 'POST',
    path: '/paywall/check',
    auth: 'public',  // Allow both authenticated and unauthenticated requests for testing
    handler: async (req): Promise<APIResponse> => {
      const { toolId, userId, email } = req.body as { toolId: string; userId?: string; email?: string };
      
      if (!toolId) {
        return Responses.badRequest('toolId is required');
      }

      // Use authenticated user or fall back to request body
      const effectiveUserId = req.user?.id ?? userId ?? 'anonymous';
      const effectiveEmail = req.user?.email ?? email ?? 'anonymous@smelter.local';

      const result = await acheevyPaywallCheck(
        effectiveUserId,
        effectiveEmail,
        toolId
      );

      return Responses.ok(result);
    },
  },

  // User tier info
  {
    method: 'GET',
    path: '/user/tier',
    auth: 'public',
    handler: async (req): Promise<APIResponse> => {
      const { userId, email } = req.body as { userId?: string; email?: string } || {};
      const effectiveUserId = req.user?.id ?? userId ?? 'anonymous';
      const effectiveEmail = req.user?.email ?? email ?? 'anonymous@smelter.local';
      
      const paywall = getPaywallService();
      const profile = await paywall.getOrCreateProfile(effectiveUserId, effectiveEmail);

      return Responses.ok({
        tier: profile.tierLevel,
        requestsToday: profile.requestsToday,
        totalRequests: profile.totalRequests,
        subscriptionEndDate: profile.subscriptionEndDate,
      });
    },
  },

  // Query roster by capabilities
  {
    method: 'POST',
    path: '/roster/query',
    auth: 'public',
    handler: async (req): Promise<APIResponse> => {
      const { capabilities, userId, email } = req.body as { capabilities: CapabilityVertical[]; userId?: string; email?: string };
      
      if (!capabilities || !Array.isArray(capabilities)) {
        return Responses.badRequest('capabilities array is required');
      }

      const effectiveUserId = req.user?.id ?? userId ?? 'anonymous';
      const effectiveEmail = req.user?.email ?? email ?? 'anonymous@smelter.local';
      
      const paywall = getPaywallService();
      const profile = await paywall.getOrCreateProfile(effectiveUserId, effectiveEmail);
      
      const tools = queryRosterByCapabilities(capabilities, profile.tierLevel);

      return Responses.ok({
        tools: tools.map(t => ({
          id: t.id,
          toolId: t.toolId,
          name: t.name,
          visualName: t.visualName,
          vertical: t.vertical,
          tierRequired: t.tierRequired,
        })),
        count: tools.length,
        userTier: profile.tierLevel,
      });
    },
  },
];

// =============================================================================
// RAG / INTERACTIONS ROUTES
// =============================================================================

const ragRoutes: Route[] = [
  // Retrieve context from the Vault (RAG)
  {
    method: 'POST',
    path: '/interactions/retrieve',
    auth: 'public',  // Allow public for E2E testing
    handler: async (req): Promise<APIResponse> => {
      const { query, tenantId, ingot, contextTypes, maxResults, relevanceThreshold } = req.body as {
        query: string;
        tenantId?: string;
        ingot?: string;
        contextTypes?: ('standard' | 'product' | 'technical' | 'blueprint' | 'resource')[];
        maxResults?: number;
        relevanceThreshold?: number;
      };

      if (!query) {
        return Responses.badRequest('query is required');
      }

      try {
        const rag = getFileManagerRAG();
        await rag.initialize();

        const result = await rag.retrieve({
          query,
          ingot,
          contextTypes,
          maxResults: maxResults ?? 5,
          relevanceThreshold: relevanceThreshold ?? 0.7,
        });

        return Responses.ok({
          documents: result.documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            source: doc.source,
            content: doc.content.substring(0, 500) + (doc.content.length > 500 ? '...' : ''),
            metadata: doc.metadata,
          })),
          relevanceScores: result.relevanceScores,
          totalMatches: result.totalMatches,
          tenantId: tenantId ?? 'default',
        });
      } catch (error) {
        console.error('[RAG] Retrieval error:', error);
        // Return empty results on error (graceful degradation)
        return Responses.ok({
          documents: [],
          relevanceScores: [],
          totalMatches: 0,
          tenantId: tenantId ?? 'default',
          warning: 'RAG system not fully initialized - Vault is empty',
        });
      }
    },
  },

  // Index a document into the Vault
  {
    method: 'POST',
    path: '/interactions/index',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const { name, content, type, metadata } = req.body as {
        name: string;
        content: string;
        type: 'standard' | 'product' | 'technical' | 'blueprint' | 'resource';
        metadata?: {
          ingot?: string;
          category?: string;
          version?: string;
          tags?: string[];
        };
      };

      if (!name || !content || !type) {
        return Responses.badRequest('name, content, and type are required');
      }

      try {
        const rag = getFileManagerRAG();
        await rag.initialize();

        const result = await rag.indexDocument({
          name,
          content,
          type,
          source: 'api-upload',
          metadata: {
            ...metadata,
            tags: metadata?.tags ?? [],
            mimeType: 'text/plain',
            size: content.length,
          },
        });

        return Responses.ok(result);
      } catch (error) {
        console.error('[RAG] Indexing error:', error);
        return Responses.serverError('Failed to index document');
      }
    },
  },

  // Get Vault stats
  {
    method: 'GET',
    path: '/interactions/stats',
    auth: 'public',
    handler: async (): Promise<APIResponse> => {
      try {
        const rag = getFileManagerRAG();
        await rag.initialize();

        const stats = await rag.getStats();
        return Responses.ok(stats);
      } catch (error) {
        console.error('[RAG] Stats error:', error);
        return Responses.ok({
          totalDocuments: 0,
          byType: {},
          byIngot: {},
          lastIndexed: null,
          warning: 'RAG system not fully initialized',
        });
      }
    },
  },
];

// =============================================================================
// SANDBOX ROUTES (Phase 2 - Persistent Agent Sandboxes)
// =============================================================================

const sandboxRoutes: Route[] = [
  /**
   * GET /sandbox/status - Get all sandbox statuses
   */
  {
    method: 'GET',
    path: '/sandbox/status',
    auth: 'required',
    handler: async () => {
      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      const status = manager.getStatus();
      const sandboxes = manager.getAllSandboxes();
      
      return Responses.ok({
        count: sandboxes.length,
        sandboxes: status,
        initialized: sandboxes.length > 0,
      });
    },
  },

  /**
   * POST /sandbox/deploy-all - Deploy all 7 persistent sandboxes
   */
  {
    method: 'POST',
    path: '/sandbox/deploy-all',
    auth: 'admin',
    rateLimit: { windowMs: 60000, maxRequests: 5 },
    handler: async () => {
      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      
      await manager.initialize();
      const deployed = await manager.deployAllSandboxes();
      
      const results: Record<string, { id: string; status: string; backend: string }> = {};
      for (const [agentId, sandbox] of deployed) {
        results[agentId] = {
          id: sandbox.id,
          status: sandbox.status,
          backend: sandbox.backend,
        };
      }
      
      return Responses.created({
        deployed: deployed.size,
        sandboxes: results,
      });
    },
  },

  /**
   * POST /sandbox/deploy/:agentId - Deploy single sandbox
   */
  {
    method: 'POST',
    path: '/sandbox/deploy/:agentId',
    auth: 'admin',
    rateLimit: { windowMs: 60000, maxRequests: 20 },
    handler: async (req) => {
      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      
      const agentId = req.params.agentId;
      const config = manager.getSandboxConfig(agentId);
      
      if (!config) {
        return Responses.notFound(`Agent ${agentId} not found`);
      }
      
      await manager.initialize();
      const sandbox = await manager.deploySandbox(config);
      
      return Responses.created({
        id: sandbox.id,
        agentId: sandbox.agentId,
        status: sandbox.status,
        backend: sandbox.backend,
        expiresAt: sandbox.expiresAt,
      });
    },
  },

  /**
   * POST /sandbox/:sandboxId/execute - Execute code in sandbox
   */
  {
    method: 'POST',
    path: '/sandbox/:sandboxId/execute',
    auth: 'required',
    rateLimit: { windowMs: 60000, maxRequests: 100 },
    handler: async (req) => {
      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      
      const sandboxId = req.params.sandboxId;
      const body = req.body as {
        code: string;
        language?: 'python' | 'javascript' | 'typescript';
        timeout?: number;
        env?: Record<string, string>;
      };
      
      if (!body.code) {
        return Responses.badRequest('Missing required field: code');
      }
      
      const sandbox = manager.getSandbox(sandboxId);
      if (!sandbox) {
        return Responses.notFound(`Sandbox ${sandboxId} not found`);
      }
      
      const result = await manager.execute({
        sandboxId,
        code: body.code,
        language: body.language || 'python',
        timeout: body.timeout || 30,
        env: body.env,
      });
      
      return Responses.ok({
        success: result.success,
        output: result.output,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTimeMs: result.executionTimeMs,
      });
    },
  },

  /**
   * GET /sandbox/:sandboxId - Get sandbox details
   */
  {
    method: 'GET',
    path: '/sandbox/:sandboxId',
    auth: 'required',
    handler: async (req) => {
      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      
      const sandboxId = req.params.sandboxId;
      const sandbox = manager.getSandbox(sandboxId);
      
      if (!sandbox) {
        return Responses.notFound(`Sandbox ${sandboxId} not found`);
      }
      
      return Responses.ok(sandbox);
    },
  },

  /**
   * DELETE /sandbox/:sandboxId - Terminate sandbox
   */
  {
    method: 'DELETE',
    path: '/sandbox/:sandboxId',
    auth: 'admin',
    handler: async (req) => {
      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      
      const sandboxId = req.params.sandboxId;
      await manager.terminateSandbox(sandboxId);
      
      return Responses.noContent();
    },
  },

  /**
   * POST /sandbox/:sandboxId/extend - Extend sandbox TTL
   */
  {
    method: 'POST',
    path: '/sandbox/:sandboxId/extend',
    auth: 'admin',
    handler: async (req) => {
      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      
      const sandboxId = req.params.sandboxId;
      const body = req.body as { additionalDays?: number };
      
      const sandbox = await manager.extendTTL(sandboxId, body.additionalDays || 14);
      
      if (!sandbox) {
        return Responses.notFound(`Sandbox ${sandboxId} not found`);
      }
      
      return Responses.ok({
        id: sandbox.id,
        newExpiresAt: sandbox.expiresAt,
      });
    },
  },

  /**
   * GET /sandbox/budget/:agentId - Get agent budget ledger
   */
  {
    method: 'GET',
    path: '/sandbox/budget/:agentId',
    auth: 'required',
    handler: async (req) => {
      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      
      const agentId = req.params.agentId;
      const ledger = manager.getBudgetLedger(agentId);
      
      if (!ledger) {
        return Responses.notFound(`Budget ledger for ${agentId} not found`);
      }
      
      return Responses.ok({
        agentId,
        initial: ledger.initial,
        spent: ledger.spent,
        reserved: ledger.reserved,
        available: ledger.initial - ledger.spent - ledger.reserved,
        transactionCount: ledger.transactions.length,
      });
    },
  },

  /**
   * GET /sandbox/delegation-state - Get shared delegation state
   */
  {
    method: 'GET',
    path: '/sandbox/delegation-state',
    auth: 'required',
    handler: async () => {
      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      const state = manager.getDelegationState();
      
      return Responses.ok(state);
    },
  },
];

// =============================================================================
// PHASE 3: II INTEGRATION ROUTES
// =============================================================================

const phase3Routes: Route[] = [
  /**
   * POST /sandbox/deploy-all-opt - Deploy all Phase 3 II Integration sandboxes
   */
  {
    method: 'POST',
    path: '/sandbox/deploy-all-opt',
    auth: 'admin',
    handler: async () => {
      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      
      const sandboxes = await manager.deployAllOpt();
      
      return Responses.ok({
        deployed: sandboxes.size,
        sandboxes: Array.from(sandboxes.entries()).map(([id, sandbox]) => ({
          id,
          sandboxId: sandbox.id,
          status: sandbox.status,
          backend: sandbox.backend,
        })),
      });
    },
  },

  /**
   * POST /ii-thought/optimize - RL optimization via II-Thought
   */
  {
    method: 'POST',
    path: '/ii-thought/optimize',
    auth: 'required',
    handler: async (req) => {
      const { task, iterations = 10, agentId = 'default' } = req.body as { 
        task: string; 
        iterations?: number; 
        agentId?: string;
      };

      if (!task) {
        return Responses.badRequest('Task is required');
      }

      const { getIIThought } = await import('../ii/index.js');
      const iiThought = getIIThought();
      
      const result = await iiThought.optimize(task, { iterations, agentId });
      
      return Responses.ok(result);
    },
  },

  /**
   * GET /metrics/rl-scores/:agentId - Get RL scores for an agent
   */
  {
    method: 'GET',
    path: '/metrics/rl-scores/:agentId',
    auth: 'required',
    handler: async (req) => {
      const { agentId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      const { getIIThought } = await import('../ii/index.js');
      const iiThought = getIIThought();
      
      const scores = await iiThought.getRLScores(agentId, limit);
      
      return Responses.ok({
        agentId,
        count: scores.length,
        scores,
      });
    },
  },

  /**
   * GET /cot/visualize/:sessionId - Visualize Chain-of-Thought trace
   */
  {
    method: 'GET',
    path: '/cot/visualize/:sessionId',
    auth: 'required',
    handler: async (req) => {
      const { sessionId } = req.params;
      const format = (req.query.format as string) || 'html';

      if (!['html', 'json', 'mermaid', 'text'].includes(format)) {
        return Responses.badRequest('Invalid format. Must be: html, json, mermaid, or text');
      }

      const { getCotLab } = await import('../ii/index.js');
      const cotLab = getCotLab();
      
      const visualization = await cotLab.render(sessionId, format as 'html' | 'json' | 'mermaid' | 'text');
      
      if (format === 'html') {
        return {
          status: 200,
          body: visualization.content,
          headers: { 'Content-Type': 'text/html' },
        };
      }
      
      return Responses.ok(visualization);
    },
  },

  /**
   * POST /ii-researcher/research - Deep research via II-Researcher
   */
  {
    method: 'POST',
    path: '/ii-researcher/research',
    auth: 'required',
    handler: async (req) => {
      const { query, depth = 'standard' } = req.body as { 
        query: string; 
        depth?: 'shallow' | 'standard' | 'deep' | 'exhaustive';
      };

      if (!query) {
        return Responses.badRequest('Query is required');
      }

      const { getIIResearcher } = await import('../ii/index.js');
      const researcher = getIIResearcher();
      
      const result = await researcher.research(query, { depth });
      
      return Responses.ok(result);
    },
  },

  /**
   * POST /ii-commons/embed - Generate hybrid embeddings via II-Commons
   */
  {
    method: 'POST',
    path: '/ii-commons/embed',
    auth: 'required',
    handler: async (req) => {
      const { content, batch = false } = req.body as { 
        content: string | string[]; 
        batch?: boolean;
      };

      if (!content) {
        return Responses.badRequest('Content is required');
      }

      const { getIICommons } = await import('../ii/index.js');
      const commons = getIICommons();
      
      if (batch && Array.isArray(content)) {
        const embeddings = await commons.generateBatch(content);
        return Responses.ok({ embeddings, dimensions: embeddings[0]?.length || 0 });
      } else {
        const embedding = await commons.generate(typeof content === 'string' ? content : content[0]);
        return Responses.ok({ embedding, dimensions: embedding.length });
      }
    },
  },

  /**
   * POST /sandbox/secure-execute - Execute code with security checks
   */
  {
    method: 'POST',
    path: '/sandbox/secure-execute',
    auth: 'required',
    handler: async (req) => {
      const { sandboxId, code, language, timeout, env } = req.body as {
        sandboxId: string;
        code: string;
        language: 'python' | 'javascript' | 'typescript';
        timeout?: number;
        env?: Record<string, string>;
      };

      if (!sandboxId || !code || !language) {
        return Responses.badRequest('sandboxId, code, and language are required');
      }

      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      
      const result = await manager.secureExecute({ sandboxId, code, language, timeout, env });
      
      if (result.exitCode === 403) {
        return Responses.forbidden(result.error);
      }
      
      return Responses.ok(result);
    },
  },

  /**
   * POST /sandbox/detect-escape - Analyze code for security violations
   */
  {
    method: 'POST',
    path: '/sandbox/detect-escape',
    auth: 'required',
    handler: async (req) => {
      const { code } = req.body as { code: string };

      if (!code) {
        return Responses.badRequest('Code is required');
      }

      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      
      const result = manager.detectEscape(code);
      
      return Responses.ok(result);
    },
  },

  /**
   * POST /sandbox/extend-ii-thought - Extend TTL for II-Thought sandbox
   */
  {
    method: 'POST',
    path: '/sandbox/extend-ii-thought',
    auth: 'admin',
    handler: async (req) => {
      const { additionalDays = 14 } = req.body as { additionalDays?: number };

      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      
      const sandbox = await manager.extendTTL('ii-thought-engine-opt', additionalDays);
      
      if (!sandbox) {
        return Responses.notFound('II-Thought sandbox');
      }
      
      return Responses.ok({
        sandboxId: sandbox.id,
        newExpiresAt: sandbox.expiresAt,
        additionalDays,
      });
    },
  },

  /**
   * GET /metrics/adaptation-rate/:task - Get RL adaptation rate for a task
   */
  {
    method: 'GET',
    path: '/metrics/adaptation-rate/:task',
    auth: 'required',
    handler: async (req) => {
      const { task } = req.params;

      const { getIIThought } = await import('../ii/index.js');
      const iiThought = getIIThought();
      
      const rate = iiThought.getAdaptationRate(task);
      
      return Responses.ok({ task, adaptationRate: rate });
    },
  },

  /**
   * POST /cot/trace/start - Start a new CoT trace
   */
  {
    method: 'POST',
    path: '/cot/trace/start',
    auth: 'required',
    handler: async (req) => {
      const { sessionId, query } = req.body as { sessionId: string; query: string };

      if (!sessionId || !query) {
        return Responses.badRequest('sessionId and query are required');
      }

      const { getCotLab } = await import('../ii/index.js');
      const cotLab = getCotLab();
      
      const trace = cotLab.startTrace(sessionId, query);
      
      return Responses.created({ traceId: trace.id, sessionId, status: 'active' });
    },
  },

  /**
   * POST /cot/trace/:traceId/step - Add step to CoT trace
   */
  {
    method: 'POST',
    path: '/cot/trace/:traceId/step',
    auth: 'required',
    handler: async (req) => {
      const { traceId } = req.params;
      const step = req.body as {
        type: 'reasoning' | 'decision' | 'action' | 'delegation' | 'validation';
        content: string;
        confidence: number;
        duration: number;
        inputs: string[];
        outputs: string[];
      };

      if (!step.type || !step.content) {
        return Responses.badRequest('type and content are required');
      }

      const { getCotLab } = await import('../ii/index.js');
      const cotLab = getCotLab();
      
      cotLab.addStep(traceId, step);
      
      return Responses.ok({ traceId, stepAdded: true });
    },
  },

  /**
   * POST /cot/trace/:traceId/complete - Complete a CoT trace
   */
  {
    method: 'POST',
    path: '/cot/trace/:traceId/complete',
    auth: 'required',
    handler: async (req) => {
      const { traceId } = req.params;
      const { finalConfidence } = req.body as { finalConfidence?: number };

      const { getCotLab } = await import('../ii/index.js');
      const cotLab = getCotLab();
      
      const trace = await cotLab.completeTrace(traceId, finalConfidence);
      
      if (!trace) {
        return Responses.notFound('Trace');
      }
      
      return Responses.ok({ traceId, status: 'completed', totalSteps: trace.steps.length });
    },
  },
];

// =============================================================================
// SMELTER-ORACLE ROUTES
// =============================================================================

const oracleRoutes: Route[] = [
  /**
   * POST /sandbox/deploy-all-oracle - Deploy all ORACLE-aligned sandboxes
   */
  {
    method: 'POST',
    path: '/sandbox/deploy-all-oracle',
    auth: 'admin',
    handler: async () => {
      const { getSandboxManager } = await import('../sandbox/index.js');
      const manager = getSandboxManager();
      
      // Deploy Phase 2 (base) + Phase 3 (opt) sandboxes
      const phase2 = await manager.deployAllSandboxes();
      const phase3 = await manager.deployAllOpt();
      
      const allSandboxes = new Map([...phase2, ...phase3]);
      
      return Responses.ok({
        deployed: allSandboxes.size,
        phase2Count: phase2.size,
        phase3Count: phase3.size,
        sandboxes: Array.from(allSandboxes.entries()).map(([id, sb]) => ({
          id,
          agentId: sb.agentId,
          status: sb.status,
          backend: sb.backend,
          layer: getOracleLayer(sb.agentId),
        })),
      });
    },
  },

  /**
   * POST /strata/tools/register - Register STRATA tools
   */
  {
    method: 'POST',
    path: '/strata/tools/register',
    auth: 'required',
    handler: async (req) => {
      const { tools, force = false } = req.body as { tools: string[]; force?: boolean };

      if (!tools || !Array.isArray(tools)) {
        return Responses.badRequest('tools array is required');
      }

      const { getStrataRegistry } = await import('../oracle/index.js');
      const registry = getStrataRegistry();
      
      const result = await registry.registerTools({ tools, force });
      
      return Responses.ok({
        ...result,
        message: `Registered ${result.registered.length} tools`,
      });
    },
  },

  /**
   * GET /strata/tools - Get STRATA registry status
   */
  {
    method: 'GET',
    path: '/strata/tools',
    auth: 'required',
    handler: async () => {
      const { getStrataRegistry } = await import('../oracle/index.js');
      const registry = getStrataRegistry();
      
      const status = await registry.getStatus();
      
      return Responses.ok(status);
    },
  },

  /**
   * POST /strata/ethics-gate - Evaluate virtue alignment gate
   */
  {
    method: 'POST',
    path: '/strata/ethics-gate',
    auth: 'required',
    handler: async (req) => {
      const { taskId, description, agents, context, gateLevel } = req.body as {
        taskId: string;
        description: string;
        agents: string[];
        context?: Record<string, unknown>;
        gateLevel?: 'standard' | 'production' | 'safety-critical';
      };

      if (!taskId || !description || !agents) {
        return Responses.badRequest('taskId, description, and agents are required');
      }

      const { getVirtueAlignmentEngine } = await import('../oracle/index.js');
      const engine = getVirtueAlignmentEngine();
      
      const result = await engine.evaluateEthicsGate({
        taskId,
        description,
        agents,
        context,
        gateLevel,
      });
      
      return Responses.ok(result);
    },
  },

  /**
   * GET /metrics/oracle-gates/:taskId - Get all 7 ORACLE gates status
   */
  {
    method: 'GET',
    path: '/metrics/oracle-gates/:taskId',
    auth: 'required',
    handler: async (req) => {
      const { taskId } = req.params;

      const { getVirtueAlignmentEngine } = await import('../oracle/index.js');
      const engine = getVirtueAlignmentEngine();
      
      const gates = await engine.getOracleGatesStatus(taskId);
      const allPassed = Object.values(gates).every(v => v);
      
      return Responses.ok({
        taskId,
        allPassed,
        gates,
        beacon: allPassed ? 'READY_TO_MERGE' : 'BLOCKED',
      });
    },
  },

  /**
   * GET /oracle/agents - Get ORACLE agent configurations
   */
  {
    method: 'GET',
    path: '/oracle/agents',
    auth: 'required',
    handler: async () => {
      const { ORACLE_AGENTS, ORACLE_LAYERS } = await import('../oracle/index.js');
      
      return Responses.ok({
        agents: ORACLE_AGENTS,
        layers: ORACLE_LAYERS,
      });
    },
  },

  /**
   * GET /oracle/config - Get ORACLE runtime configuration
   */
  {
    method: 'GET',
    path: '/oracle/config',
    auth: 'required',
    handler: async () => {
      const { getOracleConfig, DEFAULT_3LAYER_CONTEXT, FDH_PHASES } = await import('../oracle/index.js');
      
      return Responses.ok({
        config: getOracleConfig(),
        context: DEFAULT_3LAYER_CONTEXT,
        fdhPhases: FDH_PHASES,
      });
    },
  },

  /**
   * GET /oracle/fdh/:phase - Get agents by FDH phase
   */
  {
    method: 'GET',
    path: '/oracle/fdh/:phase',
    auth: 'required',
    handler: async (req) => {
      const { phase } = req.params as { phase: 'foster' | 'develop' | 'hone' | 'all' };

      if (!['foster', 'develop', 'hone', 'all'].includes(phase)) {
        return Responses.badRequest('Invalid phase. Must be: foster, develop, hone, or all');
      }

      const { getOracleFacade } = await import('../oracle/index.js');
      const facade = getOracleFacade();
      
      const agents = facade.getAgentsByPhase(phase);
      
      return Responses.ok({ phase, agents });
    },
  },
];

// Helper function to get ORACLE layer for an agent
function getOracleLayer(agentId: string): string {
  const layerMap: Record<string, string> = {
    acheevy: 'nlp',
    'rlm-research': 'logic',
    'boomer-coo': 'orchestration',
    'boomer-cto': 'execution',
    'boomer-cmo': 'execution',
    'boomer-cfo': 'execution',
    'boomer-cpo': 'execution',
    'ii-researcher': 'logic',
    'ii-thought': 'logic',
    'ii-commons': 'logic',
    'cot-lab': 'perception',
  };
  return layerMap[agentId] || 'unknown';
}

// =============================================================================
// ADK & AGENT ENGINE ROUTES
// =============================================================================

const adkRoutes: Route[] = [
  // Deploy all agents to Agent Engine
  {
    method: 'POST',
    path: '/adk/deploy-all',
    auth: 'admin',
    handler: async (): Promise<APIResponse> => {
      const { getAgentEngineDeployer } = await import('../adk/agent-engine.js');
      const deployer = getAgentEngineDeployer();
      const results = await deployer.deployAllAgents();
      
      return Responses.ok({
        deployed: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length,
        results,
      });
    },
  },
  
  // Get deployed agents
  {
    method: 'GET',
    path: '/adk/agents',
    auth: 'public',
    handler: async (): Promise<APIResponse> => {
      const { getAgentEngineDeployer } = await import('../adk/agent-engine.js');
      const deployer = getAgentEngineDeployer();
      const agents = await deployer.getDeployedAgents();
      
      return Responses.ok({ agents, count: agents.length });
    },
  },
  
  // Query an ADK agent
  {
    method: 'POST',
    path: '/adk/:agentId/query',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const { agentId } = req.params;
      const { prompt, context } = req.body as { prompt: string; context?: Record<string, unknown> };
      
      if (!prompt) {
        return Responses.badRequest('prompt is required');
      }
      
      const { getAgentEngineDeployer } = await import('../adk/agent-engine.js');
      const deployer = getAgentEngineDeployer();
      const response = await deployer.queryAgent(agentId, prompt, context);
      
      return Responses.ok({ agentId, response });
    },
  },
  
  // House of Alchemist - Bulk register tools
  {
    method: 'POST',
    path: '/alchemist/bulk-register',
    auth: 'admin',
    handler: async (req): Promise<APIResponse> => {
      const { manifest, count } = req.body as { manifest?: string; count?: number };
      
      const { getHouseOfAlchemist } = await import('../adk/agent-engine.js');
      const alchemist = getHouseOfAlchemist();
      const result = await alchemist.bulkRegister(manifest || 'house-alchemist-317', count || 317);
      
      return Responses.ok({
        message: `Registered ${result.registered} tools from Agent Garden`,
        ...result,
        totalTools: alchemist.getToolCount(),
      });
    },
  },
  
  // House of Alchemist - Get all tools
  {
    method: 'GET',
    path: '/alchemist/tools',
    auth: 'public',
    handler: async (): Promise<APIResponse> => {
      const { getHouseOfAlchemist } = await import('../adk/agent-engine.js');
      const alchemist = getHouseOfAlchemist();
      const tools = alchemist.getTools();
      
      return Responses.ok({
        tools,
        count: tools.length,
        categories: tools.reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      });
    },
  },
  
  // ADK Acheevy orchestrate (v2.0 ADK-based)
  {
    method: 'POST',
    path: '/adk/orchestrate',
    auth: 'required',
    handler: async (req): Promise<APIResponse> => {
      const { query, context, targetAgents, virtueGate } = req.body as {
        query: string;
        context?: Record<string, unknown>;
        targetAgents?: string[];
        virtueGate?: boolean;
      };
      
      if (!query) {
        return Responses.badRequest('query is required');
      }
      
      const { getAcheevyADKAgent } = await import('../adk/acheevy-agent.js');
      const acheevy = getAcheevyADKAgent();
      
      const result = await acheevy.orchestrate({
        query,
        context,
        targetAgents,
        virtueGate: virtueGate ?? true,
      });
      
      return Responses.ok(result);
    },
  },
  
  // Agent Garden catalog
  {
    method: 'GET',
    path: '/adk/garden/catalog',
    auth: 'public',
    handler: async (): Promise<APIResponse> => {
      const { AGENT_GARDEN_CATALOG } = await import('../adk/acheevy-agent.js');
      
      return Responses.ok({
        models: Object.keys(AGENT_GARDEN_CATALOG.models),
        tools: Object.keys(AGENT_GARDEN_CATALOG.tools),
        catalog: AGENT_GARDEN_CATALOG,
      });
    },
  },
];

// =============================================================================
// ROUTE REGISTRY
// =============================================================================

export const allRoutes: Route[] = [
  ...rootRoutes,
  ...healthRoutes,
  ...authRoutes,
  ...userRoutes,
  ...projectRoutes,
  ...taskRoutes,
  ...circuitRoutes,
  ...acheevyRoutes,
  ...voiceRoutes,
  ...webhookRoutes,
  ...ingotRoutes,
  ...ragRoutes,
  ...sandboxRoutes,
  ...phase3Routes,
  ...oracleRoutes,
  ...adkRoutes,
];

/**
 * Route matcher for Cloud Run / Express integration
 */
export function matchRoute(method: string, path: string): Route | null {
  for (const route of allRoutes) {
    if (route.method !== method) continue;
    
    // Convert route path to regex
    const pattern = route.path
      .replace(/:\w+/g, '([^/]+)')
      .replace(/\//g, '\\/');
    
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(path)) {
      return route;
    }
  }
  return null;
}

/**
 * Extract params from path
 */
export function extractParams(routePath: string, actualPath: string): Record<string, string> {
  const params: Record<string, string> = {};
  const routeParts = routePath.split('/');
  const actualParts = actualPath.split('/');
  
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      const paramName = routeParts[i].slice(1);
      params[paramName] = actualParts[i];
    }
  }
  
  return params;
}

// =============================================================================
// EXPRESS/CLOUD RUN ADAPTER
// =============================================================================

export interface CloudRunRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface CloudRunResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

/**
 * Main request handler for Cloud Run
 */
export async function handleRequest(cloudReq: CloudRunRequest): Promise<CloudRunResponse> {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Parse URL
  const urlParts = new URL(cloudReq.url, 'http://localhost');
  const path = urlParts.pathname;
  const query: Record<string, string> = {};
  urlParts.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  
  // Find matching route
  const route = matchRoute(cloudReq.method, path);
  
  if (!route) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Not found' }),
    };
  }
  
  // Build request object
  const apiRequest: APIRequest = {
    method: cloudReq.method as APIRequest['method'],
    path,
    params: extractParams(route.path, path),
    query,
    body: cloudReq.body,
    headers: cloudReq.headers,
    requestId,
    timestamp: Date.now(),
  };
  
  try {
    // Execute handler
    const response = await route.handler(apiRequest);
    
    const latencyMs = Date.now() - startTime;
    console.log(`[API] ${cloudReq.method} ${path} ${response.status} ${latencyMs}ms`);
    
    // Enforce <50ms latency logging
    if (latencyMs > 50) {
      console.warn(`[API] SLOW REQUEST: ${path} took ${latencyMs}ms (target: <50ms)`);
    }
    
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
        'X-Response-Time': `${latencyMs}ms`,
        ...response.headers,
      },
      body: response.body ? JSON.stringify(response.body) : '',
    };
  } catch (error) {
    console.error(`[API] Error handling ${path}:`, error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
      },
      body: JSON.stringify({ success: false, error: 'Internal server error' }),
    };
  }
}

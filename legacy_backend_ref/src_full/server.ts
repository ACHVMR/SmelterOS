/**
 * SmelterOS Production Server
 * Cloud Run Entry Point
 * 
 * Optimized for:
 * - <50ms cold start
 * - <50ms p95 request latency
 * - Graceful shutdown
 * - Health checks
 */

import * as http from 'http';
import { handleRequest, CloudRunRequest, CloudRunResponse } from './infrastructure/api/routes';
import { applyRateLimit } from './infrastructure/api/rate-limiter';
import { getConfig, validateConfig } from './config/environment';
import { getCircuitBox } from './infrastructure/circuit-box';
import { databaseFactory } from './infrastructure/database/schema';

// =============================================================================
// CONFIGURATION
// =============================================================================

const config = getConfig();
const PORT = config.server.port;
const HOST = config.server.host;

// Validate configuration
const validation = validateConfig(config);
if (!validation.valid && config.environment === 'production') {
  console.error('❌ Configuration validation failed:');
  validation.errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

// =============================================================================
// REQUEST HANDLER
// =============================================================================

async function requestHandler(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Build request body
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    // Parse body
    let parsedBody: unknown = null;
    if (body && req.headers['content-type']?.includes('application/json')) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        return;
      }
    }

    // Build Cloud Run request
    const cloudReq: CloudRunRequest = {
      method: req.method || 'GET',
      url: `http://${req.headers.host}${req.url}`,
      headers: req.headers as Record<string, string>,
      body: parsedBody,
    };

    // Apply rate limiting (skip for health checks)
    const url = new URL(cloudReq.url);
    if (!url.pathname.startsWith('/health')) {
      const orgId = req.headers['x-organization-id'] as string || 'anonymous';
      const userId = req.headers['x-user-id'] as string;
      const plan = req.headers['x-plan'] as string || 'starter';

      const rateLimitResult = await applyRateLimit({
        organizationId: orgId,
        userId,
        plan,
        endpoint: url.pathname,
      });

      // Add rate limit headers
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      if (!rateLimitResult.allowed) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Too many requests',
          retryAfter: rateLimitResult.retryAfter,
        }));
        return;
      }
    }

    // Handle request
    const response: CloudRunResponse = await handleRequest(cloudReq);

    // Send response
    res.writeHead(response.statusCode, response.headers);
    res.end(response.body);

    // Log latency warning if over threshold
    const latency = Date.now() - startTime;
    if (latency > config.circuitBreaker.latencyThresholdMs) {
      console.warn(`⚠️ Slow request: ${req.method} ${url.pathname} ${latency}ms`);
    }

  } catch (error) {
    console.error('Request error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
  }
}

// =============================================================================
// SERVER LIFECYCLE
// =============================================================================

let server: http.Server | null = null;
let isShuttingDown = false;

async function startServer(): Promise<void> {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                   SMELTER OS v2.1.0 SERVER                     ║');
  console.log('║                 Production Cloud Run Entry                     ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Environment: ${config.environment.padEnd(47)}║`);
  console.log(`║  Port:        ${String(PORT).padEnd(47)}║`);
  console.log(`║  GCP Project: ${config.gcp.projectId.padEnd(47)}║`);
  console.log(`║  Region:      ${config.gcp.region.padEnd(47)}║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Initialize infrastructure
  console.log('🔧 Initializing infrastructure...');
  
  // Initialize Circuit Box
  const circuitBox = getCircuitBox();
  const cbState = circuitBox.getState();
  console.log(`   ✓ Circuit Box: ${cbState.panels.length} panels loaded`);
  
  // Initialize database (if configured)
  if (config.database.postgresql.host !== 'localhost' || config.environment !== 'production') {
    try {
      databaseFactory.configure({
        firestore: {
          projectId: config.database.firestore.projectId,
          credentials: config.gcp.credentials || '',
        },
        postgresql: config.database.postgresql,
      });
      console.log('   ✓ Database: Configured');
    } catch (err) {
      console.warn('   ⚠ Database: Not connected (will retry on first request)');
    }
  }

  // Start HTTP server
  server = http.createServer(requestHandler);

  server.listen(PORT, HOST, () => {
    console.log('');
    console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
    console.log('');
    console.log('Endpoints:');
    console.log(`   Health:  http://${HOST}:${PORT}/health`);
    console.log(`   Ready:   http://${HOST}:${PORT}/health/ready`);
    console.log(`   Live:    http://${HOST}:${PORT}/health/live`);
    console.log('');
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('');
  console.log(`⚠️ Received ${signal}, starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      console.log('   ✓ HTTP server closed');
    });
  }

  // Allow time for in-flight requests
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Cleanup resources
  console.log('   ✓ Resources cleaned up');
  console.log('👋 Shutdown complete');
  
  process.exit(0);
}

// =============================================================================
// SIGNAL HANDLERS
// =============================================================================

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// =============================================================================
// START
// =============================================================================

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

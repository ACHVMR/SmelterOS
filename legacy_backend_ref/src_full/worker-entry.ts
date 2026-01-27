/**
 * SmelterOS Worker Entry Point
 * Standalone entry for Cloud Run worker instances
 */

import * as http from 'http';
import { getWorkerOrchestrator } from './infrastructure/pubsub';
import { getConfig } from './config/environment';
import { getCircuitBox } from './infrastructure/circuit-box';

// =============================================================================
// CONFIGURATION
// =============================================================================

const config = getConfig();
const PORT = parseInt(process.env.PORT || '8080');
const HOST = process.env.HOST || '0.0.0.0';

// =============================================================================
// HEALTH SERVER
// =============================================================================

const orchestrator = getWorkerOrchestrator();

async function healthHandler(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  if (url.pathname === '/health' || url.pathname === '/health/live') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'smelteros-workers',
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  if (url.pathname === '/health/ready') {
    const status = orchestrator.getStatus();
    const allRunning = Object.values(status).every(s => s.isRunning);
    
    res.writeHead(allRunning ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: allRunning ? 'ready' : 'not_ready',
      workers: status,
    }));
    return;
  }

  if (url.pathname === '/metrics') {
    const metrics = orchestrator.getMetrics();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// =============================================================================
// LIFECYCLE
// =============================================================================

let server: http.Server | null = null;
let isShuttingDown = false;

async function start(): Promise<void> {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                SMELTER OS WORKER FLEET v2.1.0                  ║');
  console.log('║                   Cloud Run Worker Entry                       ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Environment: ${config.environment.padEnd(47)}║`);
  console.log(`║  Port:        ${String(PORT).padEnd(47)}║`);
  console.log(`║  GCP Project: ${config.gcp.projectId.padEnd(47)}║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Initialize Circuit Box
  console.log('🔧 Initializing infrastructure...');
  const circuitBox = getCircuitBox();
  console.log(`   ✓ Circuit Box: ${circuitBox.getState().panels.length} panels`);

  // Start health server
  server = http.createServer(healthHandler);
  server.listen(PORT, HOST, () => {
    console.log(`   ✓ Health server: http://${HOST}:${PORT}/health`);
  });

  // Start all workers
  await orchestrator.startAll();

  console.log('');
  console.log('🚀 Worker fleet ready');
  console.log('');
}

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('');
  console.log(`⚠️ Received ${signal}, shutting down...`);

  // Stop accepting new work
  await orchestrator.stopAll();

  // Close health server
  if (server) {
    server.close();
  }

  console.log('👋 Worker fleet shutdown complete');
  process.exit(0);
}

// =============================================================================
// SIGNAL HANDLERS
// =============================================================================

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// =============================================================================
// START
// =============================================================================

start().catch((error) => {
  console.error('Failed to start workers:', error);
  process.exit(1);
});

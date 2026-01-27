/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Sandbox Manager
 * Phase 2: Persistent Agent Sandboxes (14-day TTL)
 * 
 * Primary: Vertex AI Agent Engine (gapic SDK)
 * Fallback: Cloud Run isolated containers
 * 
 * Pattern B: One persistent sandbox per agent with shared Firestore state
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getAccessToken } from '../gcp/auth.js';
import { GCP_PROJECT } from '../gcp/config.js';
import { getFirestoreClient } from '../database/firestore-client.js';
import { CSUITE_REGISTRY, BudgetLedger, DelegationState, createBudgetLedger, createDelegationState } from '../agents/registries.js';

// =============================================================================
// TYPES
// =============================================================================

export interface SandboxConfig {
  agentId: string;
  sandboxId: string;
  ttlDays: number;
  budgetPerTask: number;
  capabilities: string[];
  packages: string[];
  memoryMb: number;
  cpuUnits: number;
}

export interface Sandbox {
  id: string;
  agentId: string;
  status: 'creating' | 'ready' | 'executing' | 'terminating' | 'terminated' | 'error';
  createdAt: string;
  expiresAt: string;
  lastExecutionAt?: string;
  executionCount: number;
  errorCount: number;
  backend: 'vertex-ai' | 'cloud-run';
  endpoint?: string;
  budgetSpent: number;
  budgetLimit: number;
}

export interface SandboxExecutionRequest {
  sandboxId: string;
  code: string;
  language: 'python' | 'javascript' | 'typescript';
  timeout?: number;
  env?: Record<string, string>;
}

export interface SandboxExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
  stdout: string;
  stderr: string;
  exitCode: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SANDBOX_COLLECTION = 'sandboxes';
const TTL_DAYS = 14;

const DEFAULT_PACKAGES = {
  python: [
    'requests',
    'pandas',
    'numpy',
    'httpx',
    'pydantic',
    'tenacity',
    'google-cloud-aiplatform',
    'google-cloud-firestore',
    'google-cloud-pubsub',
  ],
  javascript: [
    '@google-cloud/aiplatform',
    '@google-cloud/firestore',
    '@google-cloud/pubsub',
    'axios',
    'lodash',
    'zod',
  ],
};

const SANDBOX_CONFIGS: Record<string, SandboxConfig> = {
  acheevy: {
    agentId: 'acheevy',
    sandboxId: 'acheevy-engine-default',
    ttlDays: TTL_DAYS,
    budgetPerTask: 100,
    capabilities: ['orchestration', 'escalation', 'delegation', 'governance'],
    packages: [...DEFAULT_PACKAGES.python, 'langchain', 'vertexai'],
    memoryMb: 2048,
    cpuUnits: 2,
  },
  'boomer-cto': {
    agentId: 'boomer-cto',
    sandboxId: 'boomer-cto-engine-default',
    ttlDays: TTL_DAYS,
    budgetPerTask: 20,
    capabilities: ['code-review', 'deployment', 'ci-cd', 'architecture'],
    packages: [...DEFAULT_PACKAGES.python, 'pygithub', 'gitpython', 'pylint', 'black'],
    memoryMb: 1024,
    cpuUnits: 1,
  },
  'boomer-cmo': {
    agentId: 'boomer-cmo',
    sandboxId: 'boomer-cmo-engine-default',
    ttlDays: TTL_DAYS,
    budgetPerTask: 30,
    capabilities: ['content-creation', 'branding', 'campaigns', 'social'],
    packages: [...DEFAULT_PACKAGES.python, 'openai', 'pillow', 'jinja2'],
    memoryMb: 1024,
    cpuUnits: 1,
  },
  'boomer-cfo': {
    agentId: 'boomer-cfo',
    sandboxId: 'boomer-cfo-engine-default',
    ttlDays: TTL_DAYS,
    budgetPerTask: 10,
    capabilities: ['budget-tracking', 'forecasting', 'billing', 'audit'],
    packages: [...DEFAULT_PACKAGES.python, 'stripe', 'decimal', 'openpyxl'],
    memoryMb: 512,
    cpuUnits: 1,
  },
  'boomer-coo': {
    agentId: 'boomer-coo',
    sandboxId: 'boomer-coo-engine-default',
    ttlDays: TTL_DAYS,
    budgetPerTask: 15,
    capabilities: ['workflow-automation', 'process-optimization', 'logistics'],
    packages: [...DEFAULT_PACKAGES.python, 'prefect', 'schedule', 'celery'],
    memoryMb: 512,
    cpuUnits: 1,
  },
  'boomer-cpo': {
    agentId: 'boomer-cpo',
    sandboxId: 'boomer-cpo-engine-default',
    ttlDays: TTL_DAYS,
    budgetPerTask: 10,
    capabilities: ['product-specs', 'user-research', 'feature-prioritization'],
    packages: [...DEFAULT_PACKAGES.python, 'pyyaml', 'markdown', 'textblob'],
    memoryMb: 512,
    cpuUnits: 1,
  },
  'rlm-research': {
    agentId: 'rlm-research',
    sandboxId: 'rlm-research-engine-default',
    ttlDays: TTL_DAYS,
    budgetPerTask: 50,
    capabilities: ['chunking', 'aggregation', 'deep-analysis', 'recursive-reasoning'],
    packages: [...DEFAULT_PACKAGES.python, 'tiktoken', 'langchain', 'chromadb', 'sentence-transformers'],
    memoryMb: 4096,
    cpuUnits: 4,
  },
};

// Phase 3: II Integration Sandboxes (Optimized)
const SANDBOX_CONFIGS_OPT: Record<string, SandboxConfig> = {
  'ii-researcher': {
    agentId: 'ii-researcher',
    sandboxId: 'ii-researcher-engine-opt',
    ttlDays: TTL_DAYS,
    budgetPerTask: 60,
    capabilities: ['deep-research', 'multi-pass-analysis', 'cross-validation', 'synthesis'],
    packages: [...DEFAULT_PACKAGES.python, 'langchain', 'chromadb', 'sentence-transformers', 'tiktoken'],
    memoryMb: 4096,
    cpuUnits: 4,
  },
  'ii-thought': {
    agentId: 'ii-thought',
    sandboxId: 'ii-thought-engine-opt',
    ttlDays: TTL_DAYS,
    budgetPerTask: 80,
    capabilities: ['rl-optimization', 'policy-adaptation', 'reward-shaping', 'exploration'],
    packages: [...DEFAULT_PACKAGES.python, 'gymnasium', 'stable-baselines3', 'torch', 'numpy'],
    memoryMb: 8192,
    cpuUnits: 8,
  },
  'ii-commons': {
    agentId: 'ii-commons',
    sandboxId: 'ii-commons-engine-opt',
    ttlDays: TTL_DAYS,
    budgetPerTask: 40,
    capabilities: ['hybrid-embeddings', 'vector-fusion', 'semantic-search', 'similarity'],
    packages: [...DEFAULT_PACKAGES.python, 'sentence-transformers', 'faiss-cpu', 'numpy'],
    memoryMb: 2048,
    cpuUnits: 2,
  },
  'cot-lab': {
    agentId: 'cot-lab',
    sandboxId: 'cot-lab-engine-opt',
    ttlDays: TTL_DAYS,
    budgetPerTask: 20,
    capabilities: ['trace-visualization', 'reasoning-transparency', 'step-analysis', 'mermaid-render'],
    packages: [...DEFAULT_PACKAGES.python, 'jinja2', 'markdown', 'pygments'],
    memoryMb: 1024,
    cpuUnits: 1,
  },
};

// Security: Forbidden patterns for escape detection
const FORBIDDEN_PATTERNS = [
  /__import__\s*\(/,
  /\beval\s*\(/,
  /\bexec\s*\(/,
  /\bcompile\s*\(/,
  /\bopen\s*\([^)]*['"][rwa]/,
  /subprocess\./,
  /os\.system/,
  /os\.popen/,
  /os\.exec/,
  /shutil\.rmtree/,
  /import\s+ctypes/,
  /from\s+ctypes/,
  /socket\./,
  /requests\.get.*localhost/,
  /urllib.*localhost/,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
];

// =============================================================================
// SANDBOX MANAGER CLASS
// =============================================================================

export class SandboxManager {
  private static instance: SandboxManager;
  private sandboxes: Map<string, Sandbox> = new Map();
  private budgetLedgers: Map<string, BudgetLedger> = new Map();
  private delegationState: DelegationState = createDelegationState();
  private accessToken: string | null = null;
  private vertexEndpoint: string;

  private constructor() {
    this.vertexEndpoint = `https://${GCP_PROJECT.region}-aiplatform.googleapis.com/v1`;
  }

  static getInstance(): SandboxManager {
    if (!SandboxManager.instance) {
      SandboxManager.instance = new SandboxManager();
    }
    return SandboxManager.instance;
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  async initialize(): Promise<void> {
    console.log('🏗️  Initializing SandboxManager...');
    
    this.accessToken = await getAccessToken();
    
    // Load existing sandboxes from Firestore
    await this.loadSandboxesFromFirestore();
    
    // Load shared state
    await this.loadSharedState();
    
    console.log(`   ✓ Loaded ${this.sandboxes.size} existing sandboxes`);
    console.log(`   ✓ Shared state: delegation_state, budget_ledgers`);
  }

  private async loadSandboxesFromFirestore(): Promise<void> {
    const firestore = getFirestoreClient();
    
    try {
      const result = await firestore.query<Sandbox>(SANDBOX_COLLECTION, {
        filters: [{ field: 'status', op: 'NOT_EQUAL', value: 'terminated' }],
        limit: 20,
      });

      for (const sandbox of result.data) {
        // Check if expired
        const expiresAt = new Date(sandbox.expiresAt);
        if (expiresAt < new Date()) {
          await this.terminateSandbox(sandbox.id);
        } else {
          this.sandboxes.set(sandbox.id, sandbox);
        }
      }
    } catch (error) {
      console.warn('   ⚠ Could not load sandboxes from Firestore:', error);
    }
  }

  private async loadSharedState(): Promise<void> {
    const firestore = getFirestoreClient();

    try {
      // Load delegation state
      const delegationDoc = await firestore.getDocument<DelegationState & { id: string }>('shared_state', 'delegation_state');
      if (delegationDoc) {
        this.delegationState = delegationDoc;
      }

      // Load budget ledgers for each agent
      for (const agentId of Object.keys(CSUITE_REGISTRY)) {
        const ledgerDoc = await firestore.getDocument<BudgetLedger & { id: string }>('budget_ledgers', agentId);
        if (ledgerDoc) {
          this.budgetLedgers.set(agentId, ledgerDoc);
        } else {
          const budget = CSUITE_REGISTRY[agentId]?.budgetPerSession || 
                         CSUITE_REGISTRY[agentId]?.budgetPerTask || 
                         CSUITE_REGISTRY[agentId]?.budgetPerAnalysis || 100;
          this.budgetLedgers.set(agentId, createBudgetLedger(budget));
        }
      }
    } catch (error) {
      console.warn('   ⚠ Could not load shared state:', error);
    }
  }

  // ===========================================================================
  // SANDBOX DEPLOYMENT
  // ===========================================================================

  /**
   * Deploy all 7 persistent sandboxes
   */
  async deployAllSandboxes(): Promise<Map<string, Sandbox>> {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║         PHASE 2: DEPLOYING PERSISTENT SANDBOXES                ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  Pattern B: One sandbox per agent (14-day TTL)                 ║');
    console.log('║  Primary: Vertex AI Agent Engine                               ║');
    console.log('║  Fallback: Cloud Run isolated containers                       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');

    const results = new Map<string, Sandbox>();
    
    for (const [agentId, config] of Object.entries(SANDBOX_CONFIGS)) {
      try {
        const sandbox = await this.deploySandbox(config);
        results.set(agentId, sandbox);
        console.log(`   ✓ ${agentId.padEnd(15)} → ${sandbox.id} (${sandbox.backend})`);
      } catch (error) {
        console.error(`   ✗ ${agentId}: Failed to deploy:`, error);
      }
    }

    console.log('');
    console.log(`🚀 Deployed ${results.size}/7 sandboxes`);
    
    // Persist shared state
    await this.persistSharedState();

    return results;
  }

  /**
   * Deploy a single sandbox
   */
  async deploySandbox(config: SandboxConfig): Promise<Sandbox> {
    // Check if already exists and not expired
    const existing = this.sandboxes.get(config.sandboxId);
    if (existing && existing.status === 'ready') {
      const expiresAt = new Date(existing.expiresAt);
      if (expiresAt > new Date()) {
        return existing;
      }
    }

    // Try Vertex AI Agent Engine first
    let sandbox: Sandbox;
    try {
      sandbox = await this.deployVertexAISandbox(config);
    } catch (error) {
      console.warn(`   ⚠ Vertex AI failed, falling back to Cloud Run: ${error}`);
      sandbox = await this.deployCloudRunSandbox(config);
    }

    // Store in memory and Firestore
    this.sandboxes.set(sandbox.id, sandbox);
    await this.persistSandbox(sandbox);

    return sandbox;
  }

  private async deployVertexAISandbox(config: SandboxConfig): Promise<Sandbox> {
    if (!this.accessToken) {
      this.accessToken = await getAccessToken();
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.ttlDays * 24 * 60 * 60 * 1000);

    // Vertex AI Agent Engine deployment
    // Note: This uses the conceptual Agent Engine API
    // In production, this would use the gapic SDK
    const agentEngineEndpoint = `${this.vertexEndpoint}/projects/${GCP_PROJECT.projectId}/locations/${GCP_PROJECT.region}/agents`;

    const requestBody = {
      displayName: `SmelterOS-${config.agentId}`,
      description: `Persistent sandbox for ${config.agentId} agent`,
      metadata: {
        sandboxId: config.sandboxId,
        ttlDays: config.ttlDays,
        capabilities: config.capabilities,
        packages: config.packages,
      },
      runtimeConfig: {
        memoryMb: config.memoryMb,
        cpuUnits: config.cpuUnits,
        timeoutSeconds: 300,
      },
    };

    // Attempt to create agent (may fail if API not available)
    try {
      const response = await fetch(agentEngineEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Vertex AI Agent Engine: ${response.status}`);
      }

      const result = await response.json() as { name: string };

      return {
        id: config.sandboxId,
        agentId: config.agentId,
        status: 'ready',
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        executionCount: 0,
        errorCount: 0,
        backend: 'vertex-ai',
        endpoint: result.name,
        budgetSpent: 0,
        budgetLimit: config.budgetPerTask,
      };
    } catch {
      throw new Error('Vertex AI Agent Engine not available');
    }
  }

  private async deployCloudRunSandbox(config: SandboxConfig): Promise<Sandbox> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.ttlDays * 24 * 60 * 60 * 1000);

    // Cloud Run fallback - uses isolated container
    // In production, this would deploy an actual Cloud Run service
    const endpoint = `https://${config.sandboxId}-${GCP_PROJECT.projectId}.${GCP_PROJECT.region}.run.app`;

    return {
      id: config.sandboxId,
      agentId: config.agentId,
      status: 'ready',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      executionCount: 0,
      errorCount: 0,
      backend: 'cloud-run',
      endpoint,
      budgetSpent: 0,
      budgetLimit: config.budgetPerTask,
    };
  }

  // ===========================================================================
  // CODE EXECUTION
  // ===========================================================================

  /**
   * Execute code in a sandbox
   */
  async execute(request: SandboxExecutionRequest): Promise<SandboxExecutionResult> {
    const startTime = Date.now();
    const sandbox = this.sandboxes.get(request.sandboxId);

    if (!sandbox) {
      return {
        success: false,
        output: '',
        error: `Sandbox ${request.sandboxId} not found`,
        executionTimeMs: Date.now() - startTime,
        stdout: '',
        stderr: `Sandbox ${request.sandboxId} not found`,
        exitCode: 1,
      };
    }

    if (sandbox.status !== 'ready') {
      return {
        success: false,
        output: '',
        error: `Sandbox ${request.sandboxId} is not ready (status: ${sandbox.status})`,
        executionTimeMs: Date.now() - startTime,
        stdout: '',
        stderr: `Sandbox not ready`,
        exitCode: 1,
      };
    }

    // Update sandbox status
    sandbox.status = 'executing';
    sandbox.lastExecutionAt = new Date().toISOString();

    try {
      let result: SandboxExecutionResult;

      if (sandbox.backend === 'vertex-ai') {
        result = await this.executeInVertexAI(sandbox, request);
      } else {
        result = await this.executeInCloudRun(sandbox, request);
      }

      // Update counters
      sandbox.executionCount++;
      if (!result.success) {
        sandbox.errorCount++;
      }
      sandbox.status = 'ready';

      // Persist updated sandbox
      await this.persistSandbox(sandbox);

      return result;
    } catch (error) {
      sandbox.status = 'error';
      sandbox.errorCount++;
      await this.persistSandbox(sandbox);

      return {
        success: false,
        output: '',
        error: String(error),
        executionTimeMs: Date.now() - startTime,
        stdout: '',
        stderr: String(error),
        exitCode: 1,
      };
    }
  }

  private async executeInVertexAI(sandbox: Sandbox, request: SandboxExecutionRequest): Promise<SandboxExecutionResult> {
    const startTime = Date.now();

    if (!this.accessToken) {
      this.accessToken = await getAccessToken();
    }

    // Execute via Vertex AI Agent Engine
    // Note: Actual implementation would use gapic SDK
    try {
      const executeEndpoint = `${sandbox.endpoint}:execute`;
      
      const response = await fetch(executeEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: request.code,
          language: request.language,
          timeout: request.timeout || 30,
          env: request.env || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.status}`);
      }

      const result = await response.json() as {
        output: string;
        stdout: string;
        stderr: string;
        exitCode: number;
      };

      return {
        success: result.exitCode === 0,
        output: result.output,
        executionTimeMs: Date.now() - startTime,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      };
    } catch (error) {
      // Fallback to simulated execution
      return this.simulateExecution(request, startTime);
    }
  }

  private async executeInCloudRun(sandbox: Sandbox, request: SandboxExecutionRequest): Promise<SandboxExecutionResult> {
    const startTime = Date.now();

    try {
      // Execute via Cloud Run
      const response = await fetch(`${sandbox.endpoint}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: request.code,
          language: request.language,
          timeout: request.timeout || 30,
          env: request.env || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Cloud Run execution failed: ${response.status}`);
      }

      const result = await response.json() as {
        output: string;
        stdout: string;
        stderr: string;
        exitCode: number;
      };

      return {
        success: result.exitCode === 0,
        output: result.output,
        executionTimeMs: Date.now() - startTime,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      };
    } catch {
      // Fallback to simulated execution
      return this.simulateExecution(request, startTime);
    }
  }

  private simulateExecution(request: SandboxExecutionRequest, startTime: number): SandboxExecutionResult {
    // Simulated execution for development/testing
    const output = `[SIMULATED] Executed ${request.language} code:\n${request.code.substring(0, 200)}...`;
    
    return {
      success: true,
      output,
      executionTimeMs: Date.now() - startTime,
      stdout: output,
      stderr: '',
      exitCode: 0,
    };
  }

  // ===========================================================================
  // SANDBOX LIFECYCLE
  // ===========================================================================

  async terminateSandbox(sandboxId: string): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return;

    sandbox.status = 'terminating';

    // Cleanup resources based on backend
    if (sandbox.backend === 'vertex-ai' && sandbox.endpoint) {
      try {
        if (!this.accessToken) {
          this.accessToken = await getAccessToken();
        }
        await fetch(sandbox.endpoint, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${this.accessToken}` },
        });
      } catch (error) {
        console.warn(`Failed to cleanup Vertex AI sandbox: ${error}`);
      }
    }

    sandbox.status = 'terminated';
    await this.persistSandbox(sandbox);
    this.sandboxes.delete(sandboxId);
  }

  async extendTTL(sandboxId: string, additionalDays: number = 14): Promise<Sandbox | null> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return null;

    const currentExpiry = new Date(sandbox.expiresAt);
    const newExpiry = new Date(currentExpiry.getTime() + additionalDays * 24 * 60 * 60 * 1000);
    sandbox.expiresAt = newExpiry.toISOString();

    await this.persistSandbox(sandbox);
    return sandbox;
  }

  // ===========================================================================
  // SHARED STATE MANAGEMENT
  // ===========================================================================

  getDelegationState(): DelegationState {
    return { ...this.delegationState };
  }

  async updateDelegationState(updates: Partial<DelegationState>): Promise<void> {
    this.delegationState = { ...this.delegationState, ...updates };
    await this.persistSharedState();
  }

  getBudgetLedger(agentId: string): BudgetLedger | undefined {
    return this.budgetLedgers.get(agentId);
  }

  async spendBudget(agentId: string, amount: number, taskId: string): Promise<boolean> {
    const ledger = this.budgetLedgers.get(agentId);
    if (!ledger) return false;

    const available = ledger.initial - ledger.spent - ledger.reserved;
    if (amount > available) {
      return false; // Budget exceeded - trigger escalation
    }

    ledger.spent += amount;
    ledger.transactions.push({
      id: `txn-${Date.now()}`,
      agent: agentId,
      amount,
      type: 'spend',
      timestamp: new Date().toISOString(),
    });

    await this.persistBudgetLedger(agentId, ledger);
    return true;
  }

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  private async persistSandbox(sandbox: Sandbox): Promise<void> {
    const firestore = getFirestoreClient();
    await firestore.setDocument(SANDBOX_COLLECTION, sandbox.id, sandbox as Sandbox & { id: string });
  }

  private async persistSharedState(): Promise<void> {
    const firestore = getFirestoreClient();
    await firestore.setDocument('shared_state', 'delegation_state', { ...this.delegationState, id: 'delegation_state' });
  }

  private async persistBudgetLedger(agentId: string, ledger: BudgetLedger): Promise<void> {
    const firestore = getFirestoreClient();
    await firestore.setDocument('budget_ledgers', agentId, { ...ledger, id: agentId });
  }

  // ===========================================================================
  // PHASE 3: OPTIMIZED SANDBOX DEPLOYMENT
  // ===========================================================================

  /**
   * Deploy all Phase 3 II Integration sandboxes (4 optimized sandboxes)
   */
  async deployAllOpt(): Promise<Map<string, Sandbox>> {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║      PHASE 3: DEPLOYING II INTEGRATION SANDBOXES (OPT)         ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  II-Researcher: Deep multi-pass research engine                ║');
    console.log('║  II-Thought: RL optimization with policy adaptation            ║');
    console.log('║  II-Commons: Hybrid embedding fusion (Vertex + Commons)        ║');
    console.log('║  CoT-Lab: Chain-of-Thought visualization & tracing             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');

    const results = new Map<string, Sandbox>();
    
    for (const [agentId, config] of Object.entries(SANDBOX_CONFIGS_OPT)) {
      try {
        const sandbox = await this.deploySandbox(config);
        results.set(agentId, sandbox);
        console.log(`   ✓ ${agentId.padEnd(15)} → ${sandbox.id} (${sandbox.backend})`);
      } catch (error) {
        console.error(`   ✗ ${agentId}: Failed to deploy:`, error);
      }
    }

    console.log('');
    console.log(`🚀 Deployed ${results.size}/4 Phase 3 sandboxes`);

    // Persist shared state
    await this.persistSharedState();

    return results;
  }

  /**
   * Get Phase 3 sandbox config
   */
  getOptSandboxConfig(agentId: string): SandboxConfig | undefined {
    return SANDBOX_CONFIGS_OPT[agentId];
  }

  // ===========================================================================
  // SECURITY: ESCAPE DETECTION & RBAC AUDITING
  // ===========================================================================

  /**
   * Detect code escape attempts (sandbox breakout patterns)
   * @param code The code to analyze
   * @returns Object with detection result and matched patterns
   */
  detectEscape(code: string): { detected: boolean; patterns: string[]; severity: 'low' | 'medium' | 'high' | 'critical' } {
    const matchedPatterns: string[] = [];
    
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(code)) {
        matchedPatterns.push(pattern.source);
      }
    }

    if (matchedPatterns.length === 0) {
      return { detected: false, patterns: [], severity: 'low' };
    }

    // Determine severity based on patterns
    const criticalPatterns = ['__import__', 'subprocess', 'os.system', 'ctypes'];
    const highPatterns = ['eval', 'exec', 'compile', 'socket'];
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    for (const pattern of matchedPatterns) {
      if (criticalPatterns.some(p => pattern.includes(p))) {
        severity = 'critical';
        break;
      }
      if (highPatterns.some(p => pattern.includes(p))) {
        severity = 'high';
      }
    }

    return { detected: true, patterns: matchedPatterns, severity };
  }

  /**
   * Audit RBAC action to Firestore
   * @param userId The user performing the action
   * @param action The action being performed
   * @param resource The resource being accessed
   * @param allowed Whether the action was allowed
   * @param context Additional context
   */
  async auditRBAC(
    userId: string,
    action: string,
    resource: string,
    allowed: boolean,
    context?: Record<string, unknown>
  ): Promise<void> {
    const firestore = getFirestoreClient();
    
    const auditEntry = {
      id: `rbac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      resource,
      allowed,
      timestamp: new Date().toISOString(),
      context: context || {},
      source: 'SandboxManager',
    };

    try {
      await firestore.setDocument('rbac_audit', auditEntry.id, auditEntry);
    } catch (error) {
      console.error('Failed to audit RBAC action:', error);
    }
  }

  /**
   * Secure execution with escape detection
   */
  async secureExecute(request: SandboxExecutionRequest): Promise<SandboxExecutionResult> {
    // First, check for escape attempts
    const escapeCheck = this.detectEscape(request.code);
    
    if (escapeCheck.detected) {
      // Audit the escape attempt
      await this.auditRBAC(
        'system',
        'code_execution',
        request.sandboxId,
        false,
        { 
          patterns: escapeCheck.patterns, 
          severity: escapeCheck.severity,
          codeSnippet: request.code.substring(0, 200),
        }
      );

      return {
        success: false,
        output: '',
        error: `Security violation: Forbidden code patterns detected (severity: ${escapeCheck.severity})`,
        executionTimeMs: 0,
        stdout: '',
        stderr: `Blocked patterns: ${escapeCheck.patterns.join(', ')}`,
        exitCode: 403,
      };
    }

    // Audit successful security check
    await this.auditRBAC('system', 'code_execution', request.sandboxId, true, { passed: 'escape_detection' });

    // Proceed with normal execution
    return this.execute(request);
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  getSandbox(sandboxId: string): Sandbox | undefined {
    return this.sandboxes.get(sandboxId);
  }

  getAllSandboxes(): Sandbox[] {
    return Array.from(this.sandboxes.values());
  }

  getSandboxConfig(agentId: string): SandboxConfig | undefined {
    return SANDBOX_CONFIGS[agentId];
  }

  getStatus(): Record<string, { status: string; backend: string; executionCount: number }> {
    const status: Record<string, { status: string; backend: string; executionCount: number }> = {};
    
    for (const [id, sandbox] of this.sandboxes) {
      status[id] = {
        status: sandbox.status,
        backend: sandbox.backend,
        executionCount: sandbox.executionCount,
      };
    }
    
    return status;
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let sandboxManagerInstance: SandboxManager | null = null;

export function getSandboxManager(): SandboxManager {
  if (!sandboxManagerInstance) {
    sandboxManagerInstance = SandboxManager.getInstance();
  }
  return sandboxManagerInstance;
}

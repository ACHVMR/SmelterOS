/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Agent Registries
 * C-Suite and Specialized Agent Definitions for Pattern B Persistent Sandboxes
 * ═══════════════════════════════════════════════════════════════════════════
 */

// =============================================================================
// TYPES
// =============================================================================

export interface CSuiteAgentDefinition {
  id: string;
  type: 'digital-ceo' | 'executive-agent' | 'specialized-agent';
  displayName: string;
  domain?: string;
  sandboxTtlDays: number;
  budgetPerSession?: number;
  budgetPerTask?: number;
  budgetPerAnalysis?: number;
  capabilities: string[];
  triggerKeywords?: string[];
  trigger?: string;
  description: string;
}

export interface DelegationState {
  cto_status: 'pending' | 'processing' | 'completed' | 'failed';
  cmo_status: 'pending' | 'processing' | 'completed' | 'failed';
  cfo_status: 'pending' | 'processing' | 'completed' | 'failed';
  coo_status: 'pending' | 'processing' | 'completed' | 'failed';
  cpo_status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface BudgetLedger {
  initial: number;
  spent: number;
  reserved: number;
  transactions: BudgetTransaction[];
}

export interface BudgetTransaction {
  id: string;
  agent: string;
  amount: number;
  type: 'reserve' | 'spend' | 'release';
  timestamp: string;
}

// =============================================================================
// C-SUITE REGISTRY
// Pattern B: One persistent sandbox per agent (14-day TTL)
// =============================================================================

export const CSUITE_REGISTRY: Record<string, CSuiteAgentDefinition> = {
  acheevy: {
    id: 'acheevy',
    type: 'digital-ceo',
    displayName: 'ACHEEVY: Digital CEO',
    sandboxTtlDays: 14,
    budgetPerSession: 100.0,
    capabilities: ['orchestration', 'delegation', 'escalation', 'governance'],
    description: 'Orchestrates C-Suite agents, manages delegation state, enforces budget gates',
  },
  'boomer-cto': {
    id: 'boomer-cto',
    type: 'executive-agent',
    displayName: 'BOOMER_CTO: Chief Technology Officer',
    domain: 'technology',
    sandboxTtlDays: 14,
    budgetPerTask: 20.0,
    capabilities: ['code-review', 'deployment', 'ci-cd', 'architecture'],
    triggerKeywords: ['code', 'deploy', 'build', 'test', 'ci', 'cd', 'architecture', 'technical'],
    description: 'Reviews code, manages deployments, evaluates technical decisions',
  },
  'boomer-cmo': {
    id: 'boomer-cmo',
    type: 'executive-agent',
    displayName: 'BOOMER_CMO: Chief Marketing Officer',
    domain: 'marketing',
    sandboxTtlDays: 14,
    budgetPerTask: 30.0,
    capabilities: ['content-creation', 'branding', 'campaigns', 'social'],
    triggerKeywords: ['content', 'marketing', 'brand', 'campaign', 'social', 'post', 'blog'],
    description: 'Creates marketing content, manages brand guidelines, plans campaigns',
  },
  'boomer-cfo': {
    id: 'boomer-cfo',
    type: 'executive-agent',
    displayName: 'BOOMER_CFO: Chief Financial Officer',
    domain: 'finance',
    sandboxTtlDays: 14,
    budgetPerTask: 10.0,
    capabilities: ['budget-tracking', 'forecasting', 'billing', 'audit'],
    triggerKeywords: ['budget', 'cost', 'finance', 'money', 'spend', 'billing', 'invoice'],
    description: 'Tracks budgets, forecasts costs, enforces financial gates',
  },
  'boomer-coo': {
    id: 'boomer-coo',
    type: 'executive-agent',
    displayName: 'BOOMER_COO: Chief Operating Officer',
    domain: 'operations',
    sandboxTtlDays: 14,
    budgetPerTask: 15.0,
    capabilities: ['workflow-automation', 'process-optimization', 'logistics'],
    triggerKeywords: ['workflow', 'process', 'operations', 'logistics', 'automate', 'schedule'],
    description: 'Optimizes operations, automates workflows, manages logistics',
  },
  'boomer-cpo': {
    id: 'boomer-cpo',
    type: 'executive-agent',
    displayName: 'BOOMER_CPO: Chief Product Officer',
    domain: 'product',
    sandboxTtlDays: 14,
    budgetPerTask: 10.0,
    capabilities: ['product-specs', 'user-research', 'feature-prioritization'],
    triggerKeywords: ['product', 'feature', 'spec', 'user', 'roadmap', 'requirement'],
    description: 'Defines product specs, conducts user research, prioritizes features',
  },
  'rlm-research': {
    id: 'rlm-research',
    type: 'specialized-agent',
    displayName: 'RLM Research Agent',
    trigger: 'context > 1M tokens OR recursive reasoning required',
    sandboxTtlDays: 14,
    budgetPerAnalysis: 50.0,
    capabilities: ['chunking', 'sub-lm-calls', 'aggregation', 'deep-analysis'],
    triggerKeywords: ['research', 'analyze', 'deep', 'comprehensive', 'study'],
    description: 'Specialized agent for analyzing massive contexts using RLM pattern',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export type CSuiteAgentId = keyof typeof CSUITE_REGISTRY;

/**
 * Get a C-Suite agent definition by ID
 */
export function getCSuiteAgent(agentId: string): CSuiteAgentDefinition | undefined {
  return CSUITE_REGISTRY[agentId];
}

/**
 * Get all executive agents (CTO, CMO, CFO, COO, CPO)
 */
export function getExecutiveAgents(): CSuiteAgentDefinition[] {
  return Object.values(CSUITE_REGISTRY).filter(a => a.type === 'executive-agent');
}

/**
 * Analyze a query to determine which C-Suite chiefs are needed
 */
export function analyzeQueryForChiefs(query: string): string[] {
  const queryLower = query.toLowerCase();
  const chiefsNeeded: string[] = [];

  for (const [agentId, config] of Object.entries(CSUITE_REGISTRY)) {
    if (agentId === 'acheevy' || agentId === 'rlm-research') continue;

    const triggerKeywords = config.triggerKeywords || [];
    const hasMatch = triggerKeywords.some(keyword => queryLower.includes(keyword));

    if (hasMatch) {
      chiefsNeeded.push(agentId);
    }
  }

  return chiefsNeeded;
}

/**
 * Get budget for a specific agent task
 */
export function getAgentBudget(agentId: string): number {
  const agent = CSUITE_REGISTRY[agentId];
  if (!agent) return 10.0; // default
  
  return agent.budgetPerTask || agent.budgetPerSession || agent.budgetPerAnalysis || 10.0;
}

/**
 * Create an initial budget ledger
 */
export function createBudgetLedger(initialBudget: number = 100.0): BudgetLedger {
  return {
    initial: initialBudget,
    spent: 0.0,
    reserved: 0.0,
    transactions: [],
  };
}

/**
 * Create an initial delegation state
 */
export function createDelegationState(): DelegationState {
  return {
    cto_status: 'pending',
    cmo_status: 'pending',
    cfo_status: 'pending',
    coo_status: 'pending',
    cpo_status: 'pending',
  };
}

/**
 * Check if budget allows a task
 */
export function canAffordTask(ledger: BudgetLedger, amount: number): boolean {
  return (ledger.initial - ledger.spent - ledger.reserved) >= amount;
}

/**
 * Reserve budget for a task
 */
export function reserveBudget(
  ledger: BudgetLedger,
  agentId: string,
  amount: number
): BudgetLedger {
  const transaction: BudgetTransaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    agent: agentId,
    amount,
    type: 'reserve',
    timestamp: new Date().toISOString(),
  };

  return {
    ...ledger,
    reserved: ledger.reserved + amount,
    transactions: [...ledger.transactions, transaction],
  };
}

/**
 * Commit reserved budget as spent
 */
export function commitBudget(
  ledger: BudgetLedger,
  agentId: string,
  reservedAmount: number,
  actualAmount: number
): BudgetLedger {
  const spendTransaction: BudgetTransaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    agent: agentId,
    amount: actualAmount,
    type: 'spend',
    timestamp: new Date().toISOString(),
  };

  const releaseAmount = reservedAmount - actualAmount;
  const transactions = [...ledger.transactions, spendTransaction];

  if (releaseAmount > 0) {
    transactions.push({
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      agent: agentId,
      amount: releaseAmount,
      type: 'release',
      timestamp: new Date().toISOString(),
    });
  }

  return {
    ...ledger,
    spent: ledger.spent + actualAmount,
    reserved: ledger.reserved - reservedAmount,
    transactions,
  };
}

// =============================================================================
// COMBINED REGISTRY
// =============================================================================

/**
 * Combined registry for unified agent lookups
 * Import AGENT_REGISTRY from registry.ts if you need to merge with HTTP tools
 * 
 * Usage:
 * ```typescript
 * import { AGENT_REGISTRY } from './registry.js';
 * import { CSUITE_REGISTRY, createCombinedRegistry } from './registries.js';
 * const AGENT_REGISTRY_COMBINED = createCombinedRegistry(AGENT_REGISTRY);
 * ```
 */
export function createCombinedRegistry<T>(httpAgentRegistry: Record<string, T>): Record<string, T | CSuiteAgentDefinition> {
  return {
    ...httpAgentRegistry,
    ...CSUITE_REGISTRY,
  };
}

/**
 * Get all agent IDs across both registries
 */
export function getAllAgentIds(): string[] {
  return Object.keys(CSUITE_REGISTRY);
}

/**
 * Check if an agent exists in the C-Suite registry
 */
export function isCSuiteAgent(agentId: string): boolean {
  return agentId in CSUITE_REGISTRY;
}

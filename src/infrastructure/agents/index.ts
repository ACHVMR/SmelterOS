/**
 * Agent Infrastructure Module
 * Exports all agent routing backbone components
 */

// Types
export type {
  AgentRole,
  AgentStatus,
  AgentCapabilities,
  AgentDefinition,
  AgentTask,
  AgentTaskPayload,
  AgentAttachment,
  AgentContext,
  ConversationMessage,
  AgentTaskResult,
  AgentArtifact,
  NextAction,
  DelegationRequest,
  AgentError,
  AgentMetrics,
  RoutingDecision,
  AgentSession,
  SessionMetrics,
} from './types.js';

// Registry
export {
  AGENT_REGISTRY,
  getAgentDefinition,
  getAgentsByTopic,
  getAgentsByContext,
  getVibeRequiredAgents,
  getAgentsByPriority,
} from './registry.js';

// Router
export { AgentRouter, agentRouter } from './router.js';

// Task Manager
export { TaskManager, taskManager } from './task-manager.js';
export type { CreateTaskOptions } from './task-manager.js';

// Session Manager
export { SessionManager, sessionManager } from './session-manager.js';
export type { CreateSessionOptions } from './session-manager.js';

// Gateway
export { AgentGateway, agentGateway } from './gateway.js';
export type { AgentRequest, AgentResponse } from './gateway.js';

// Context Layer
export {
  ContextLoader,
  contextLoader,
  DEFAULT_CONTEXT_SOURCES,
} from './context-loader.js';
export type {
  ContextLayer,
  ContextSource,
  LoadedContext,
  ContextLoadResult,
  ContextLoadError,
} from './context-loader.js';

// Context Embeddings
export {
  ContextEmbeddingsManager,
  contextEmbeddings,
} from './context-embeddings.js';
export type {
  ContextEmbedding,
  SimilarityResult,
  EmbeddingIndex,
} from './context-embeddings.js';

// C-Suite Registries (Pattern B Persistent Sandboxes)
export {
  CSUITE_REGISTRY,
  getCSuiteAgent,
  getExecutiveAgents,
  analyzeQueryForChiefs,
  getAgentBudget,
  createBudgetLedger,
  createDelegationState,
  canAffordTask,
  reserveBudget,
  commitBudget,
} from './registries.js';
export type {
  CSuiteAgentDefinition,
  CSuiteAgentId,
  DelegationState,
  BudgetLedger,
  BudgetTransaction,
} from './registries.js';

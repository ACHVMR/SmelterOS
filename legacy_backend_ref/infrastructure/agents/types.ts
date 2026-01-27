/**
 * Agent OS Type Definitions
 * Core types for the agent routing backbone
 */

/** Agent roles in the SmelterOS ecosystem */
export type AgentRole = 
  | 'acheevy-concierge'     // Main orchestrator - routes to specialists
  | 'boomerang-dev'         // Development specialist (BoomerAng)
  | 'boomerang-test'        // Testing specialist (BoomerAng)
  | 'boomerang-deploy'      // Deployment specialist (BoomerAng)
  | 'research'              // Research/analysis agent
  | 'coding'                // Code generation agent
  | 'documentation'         // Documentation agent
  | 'security'              // Security analysis agent
  | 'vision';               // Vision/image processing agent

/** Agent status in the system */
export type AgentStatus = 'idle' | 'processing' | 'waiting' | 'error' | 'offline';

/** Agent capability flags */
export interface AgentCapabilities {
  canAccessFirestore: boolean;
  canAccessGCS: boolean;
  canPublishPubSub: boolean;
  canCallExternalAPIs: boolean;
  canExecuteCode: boolean;
  canAccessVisionAI: boolean;
  maxConcurrentTasks: number;
  timeoutMs: number;
}

/** Agent definition in the registry */
export interface AgentDefinition {
  role: AgentRole;
  name: string;
  description: string;
  capabilities: AgentCapabilities;
  triggerTopics: string[];      // Pub/Sub topics this agent subscribes to
  outputTopics: string[];       // Pub/Sub topics this agent can publish to
  requiredContext: ('standards' | 'product' | 'specs')[];
  vibeProofRequired: boolean;
  priority: number;             // 1-10, higher = more priority
}

/** Task handed to an agent */
export interface AgentTask {
  taskId: string;
  sessionId: string;
  conversationId: string;
  agentRole: AgentRole;
  payload: AgentTaskPayload;
  priority: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  result?: AgentTaskResult;
  parentTaskId?: string;        // For subtasks delegated from concierge
  metadata: Record<string, unknown>;
}

/** Task payload sent to agents */
export interface AgentTaskPayload {
  intent: string;
  content: string;
  attachments?: AgentAttachment[];
  context?: AgentContext;
  parameters?: Record<string, unknown>;
}

/** File/data attachment */
export interface AgentAttachment {
  id: string;
  type: 'file' | 'image' | 'code' | 'data';
  name: string;
  mimeType: string;
  gcsUri?: string;
  inlineData?: string;
  size: number;
}

/** Agent execution context */
export interface AgentContext {
  standards?: Record<string, unknown>;
  product?: Record<string, unknown>;
  specs?: Record<string, unknown>;
  conversationHistory?: ConversationMessage[];
  previousResults?: AgentTaskResult[];
  userPreferences?: Record<string, unknown>;
}

/** Conversation message for context */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentRole?: AgentRole;
}

/** Result returned by an agent */
export interface AgentTaskResult {
  success: boolean;
  output?: string;
  structuredData?: Record<string, unknown>;
  artifacts?: AgentArtifact[];
  nextActions?: NextAction[];
  delegateTo?: DelegationRequest[];
  error?: AgentError;
  metrics: AgentMetrics;
}

/** Artifact produced by an agent */
export interface AgentArtifact {
  id: string;
  type: 'code' | 'document' | 'image' | 'data' | 'report';
  name: string;
  gcsUri: string;
  mimeType: string;
  size: number;
  checksum: string;
}

/** Suggested next actions */
export interface NextAction {
  action: string;
  description: string;
  priority: number;
  autoExecute: boolean;
  parameters?: Record<string, unknown>;
}

/** Delegation request to another agent */
export interface DelegationRequest {
  targetRole: AgentRole;
  intent: string;
  payload: Partial<AgentTaskPayload>;
  priority: number;
  waitForResult: boolean;
}

/** Agent execution error */
export interface AgentError {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

/** Agent execution metrics */
export interface AgentMetrics {
  executionTimeMs: number;
  tokensUsed?: number;
  apiCalls: number;
  firestoreReads: number;
  firestoreWrites: number;
  gcsOperations: number;
}

/** Routing decision made by the router */
export interface RoutingDecision {
  selectedAgent: AgentRole;
  confidence: number;
  reasoning: string;
  alternativeAgents: AgentRole[];
  requiresProofGate: boolean;
  estimatedTimeMs: number;
}

/** Session state for an agent OS session */
export interface AgentSession {
  sessionId: string;
  userId: string;
  initialized: boolean;
  initializedAt?: string;
  context: AgentContext;
  activeAgents: AgentRole[];
  taskQueue: string[];          // Task IDs
  completedTasks: string[];
  metrics: SessionMetrics;
  expiresAt: string;
}

/** Session-level metrics */
export interface SessionMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalExecutionTimeMs: number;
  totalTokensUsed: number;
  agentUsage: Record<AgentRole, number>;
}

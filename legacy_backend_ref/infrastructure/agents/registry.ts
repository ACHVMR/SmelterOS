/**
 * Agent Registry
 * Defines all agents in the SmelterOS ecosystem with their capabilities
 */

import type { AgentDefinition, AgentRole } from './types.js';

/** Default capability presets */
const FULL_CAPABILITIES = {
  canAccessFirestore: true,
  canAccessGCS: true,
  canPublishPubSub: true,
  canCallExternalAPIs: true,
  canExecuteCode: true,
  canAccessVisionAI: false,
  maxConcurrentTasks: 5,
  timeoutMs: 120000,
};

const RESTRICTED_CAPABILITIES = {
  canAccessFirestore: true,
  canAccessGCS: true,
  canPublishPubSub: false,
  canCallExternalAPIs: false,
  canExecuteCode: false,
  canAccessVisionAI: false,
  maxConcurrentTasks: 10,
  timeoutMs: 60000,
};

/** Agent registry - all agents in the system */
export const AGENT_REGISTRY: Record<AgentRole, AgentDefinition> = {
  'acheevy-concierge': {
    role: 'acheevy-concierge',
    name: 'ACHEEVY Concierge',
    description: 'Main orchestrator that routes requests to specialist agents. Maintains conversation context and delegates tasks.',
    capabilities: {
      ...FULL_CAPABILITIES,
      maxConcurrentTasks: 20,
      timeoutMs: 180000,
    },
    triggerTopics: ['acheevy-initialization', 'agent-orchestration'],
    outputTopics: ['agent-orchestration', 'proof-gate-validation'],
    requiredContext: ['standards', 'product', 'specs'],
    vibeProofRequired: false,
    priority: 10,
  },

  'boomerang-dev': {
    role: 'boomerang-dev',
    name: 'BoomerAng Developer',
    description: 'Development specialist. Handles code generation, refactoring, and implementation tasks.',
    capabilities: {
      ...FULL_CAPABILITIES,
      canExecuteCode: true,
    },
    triggerTopics: ['agent-orchestration'],
    outputTopics: ['agent-orchestration', 'file-processing'],
    requiredContext: ['product', 'specs'],
    vibeProofRequired: true,
    priority: 8,
  },

  'boomerang-test': {
    role: 'boomerang-test',
    name: 'BoomerAng Tester',
    description: 'Testing specialist. Creates and runs tests, validates implementations.',
    capabilities: {
      ...FULL_CAPABILITIES,
      canExecuteCode: true,
    },
    triggerTopics: ['agent-orchestration'],
    outputTopics: ['agent-orchestration', 'alerts'],
    requiredContext: ['specs'],
    vibeProofRequired: true,
    priority: 7,
  },

  'boomerang-deploy': {
    role: 'boomerang-deploy',
    name: 'BoomerAng Deployer',
    description: 'Deployment specialist. Handles CI/CD, infrastructure, and release management.',
    capabilities: {
      ...FULL_CAPABILITIES,
      canCallExternalAPIs: true,
    },
    triggerTopics: ['agent-orchestration'],
    outputTopics: ['agent-orchestration', 'alerts'],
    requiredContext: ['product'],
    vibeProofRequired: true,
    priority: 6,
  },

  'research': {
    role: 'research',
    name: 'Research Agent',
    description: 'Research and analysis specialist. Gathers information, analyzes data, produces reports.',
    capabilities: {
      ...RESTRICTED_CAPABILITIES,
      canCallExternalAPIs: true,
      canAccessGCS: true,
    },
    triggerTopics: ['agent-orchestration'],
    outputTopics: ['agent-orchestration', 'file-processing'],
    requiredContext: ['standards'],
    vibeProofRequired: false,
    priority: 5,
  },

  'coding': {
    role: 'coding',
    name: 'Coding Agent',
    description: 'Code generation specialist. Writes, reviews, and optimizes code.',
    capabilities: {
      ...FULL_CAPABILITIES,
      canExecuteCode: true,
    },
    triggerTopics: ['agent-orchestration'],
    outputTopics: ['agent-orchestration', 'proof-gate-validation'],
    requiredContext: ['specs'],
    vibeProofRequired: true,
    priority: 7,
  },

  'documentation': {
    role: 'documentation',
    name: 'Documentation Agent',
    description: 'Documentation specialist. Creates and maintains technical documentation.',
    capabilities: {
      ...RESTRICTED_CAPABILITIES,
      canAccessGCS: true,
    },
    triggerTopics: ['agent-orchestration'],
    outputTopics: ['agent-orchestration', 'file-processing'],
    requiredContext: ['product', 'specs'],
    vibeProofRequired: false,
    priority: 4,
  },

  'security': {
    role: 'security',
    name: 'Security Agent',
    description: 'Security analysis specialist. Audits code, identifies vulnerabilities, recommends fixes.',
    capabilities: {
      ...FULL_CAPABILITIES,
      canExecuteCode: false,
    },
    triggerTopics: ['agent-orchestration'],
    outputTopics: ['agent-orchestration', 'alerts', 'proof-gate-validation'],
    requiredContext: ['standards', 'specs'],
    vibeProofRequired: true,
    priority: 9,
  },

  'vision': {
    role: 'vision',
    name: 'Vision Agent',
    description: 'Vision processing specialist. Analyzes images, extracts text, identifies objects.',
    capabilities: {
      ...RESTRICTED_CAPABILITIES,
      canAccessVisionAI: true,
      canAccessGCS: true,
    },
    triggerTopics: ['vision-processing'],
    outputTopics: ['agent-orchestration', 'file-processing'],
    requiredContext: [],
    vibeProofRequired: false,
    priority: 6,
  },
};

/**
 * Get agent definition by role
 */
export function getAgentDefinition(role: AgentRole): AgentDefinition {
  const definition = AGENT_REGISTRY[role];
  if (!definition) {
    throw new Error(`Unknown agent role: ${role}`);
  }
  return definition;
}

/**
 * Get all agents that can handle a specific topic
 */
export function getAgentsByTopic(topic: string): AgentDefinition[] {
  return Object.values(AGENT_REGISTRY).filter(
    agent => agent.triggerTopics.includes(topic)
  );
}

/**
 * Get all agents requiring a specific context layer
 */
export function getAgentsByContext(contextLayer: 'standards' | 'product' | 'specs'): AgentDefinition[] {
  return Object.values(AGENT_REGISTRY).filter(
    agent => agent.requiredContext.includes(contextLayer)
  );
}

/**
 * Get all agents requiring V.I.B.E. proof gates
 */
export function getVibeRequiredAgents(): AgentDefinition[] {
  return Object.values(AGENT_REGISTRY).filter(
    agent => agent.vibeProofRequired
  );
}

/**
 * Get agents sorted by priority (highest first)
 */
export function getAgentsByPriority(): AgentDefinition[] {
  return Object.values(AGENT_REGISTRY).sort((a, b) => b.priority - a.priority);
}

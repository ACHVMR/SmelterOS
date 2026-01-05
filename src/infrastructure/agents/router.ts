/**
 * Agent Router
 * Routes incoming requests to the appropriate agent based on intent analysis
 */

import type {
  AgentRole,
  AgentTaskPayload,
  RoutingDecision,
  AgentContext,
} from './types.js';
import { AGENT_REGISTRY, getAgentDefinition } from './registry.js';

/** Intent patterns for routing */
interface IntentPattern {
  patterns: RegExp[];
  keywords: string[];
  targetRole: AgentRole;
  confidence: number;
}

/** Intent patterns used for routing decisions */
const INTENT_PATTERNS: IntentPattern[] = [
  // Development intents
  {
    patterns: [
      /implement|create|build|develop|code|write|refactor|fix bug|add feature/i,
      /new (component|function|class|module|service|api)/i,
    ],
    keywords: ['implement', 'create', 'build', 'develop', 'code', 'write', 'refactor', 'feature'],
    targetRole: 'boomerang-dev',
    confidence: 0.85,
  },

  // Testing intents
  {
    patterns: [
      /test|spec|validate|verify|check|assert|coverage|unit test|integration test/i,
      /write tests for|create tests|add tests/i,
    ],
    keywords: ['test', 'spec', 'validate', 'verify', 'coverage', 'assertion'],
    targetRole: 'boomerang-test',
    confidence: 0.85,
  },

  // Deployment intents
  {
    patterns: [
      /deploy|release|publish|ship|rollout|ci\/cd|pipeline|infrastructure/i,
      /set up (deployment|pipeline|ci|cd)/i,
    ],
    keywords: ['deploy', 'release', 'publish', 'ship', 'rollout', 'pipeline', 'infrastructure'],
    targetRole: 'boomerang-deploy',
    confidence: 0.85,
  },

  // Research intents
  {
    patterns: [
      /research|analyze|investigate|explore|compare|evaluate|study|assess/i,
      /find (information|data|resources) about/i,
    ],
    keywords: ['research', 'analyze', 'investigate', 'explore', 'compare', 'evaluate', 'study'],
    targetRole: 'research',
    confidence: 0.80,
  },

  // Pure coding intents
  {
    patterns: [
      /generate code|code snippet|algorithm|data structure|optimize code/i,
      /convert|translate|transform code/i,
    ],
    keywords: ['algorithm', 'snippet', 'optimize', 'convert', 'translate'],
    targetRole: 'coding',
    confidence: 0.80,
  },

  // Documentation intents
  {
    patterns: [
      /document|documentation|readme|api docs|jsdoc|comments|explain code/i,
      /write (docs|documentation|readme)/i,
    ],
    keywords: ['document', 'documentation', 'readme', 'docs', 'explain', 'comments'],
    targetRole: 'documentation',
    confidence: 0.85,
  },

  // Security intents
  {
    patterns: [
      /security|vulnerability|audit|penetration|exploit|authentication|authorization/i,
      /check for (vulnerabilities|security issues)/i,
    ],
    keywords: ['security', 'vulnerability', 'audit', 'exploit', 'authentication', 'authorization'],
    targetRole: 'security',
    confidence: 0.90,
  },

  // Vision intents
  {
    patterns: [
      /image|photo|picture|screenshot|diagram|chart|ocr|extract text from/i,
      /analyze (image|photo|screenshot)/i,
    ],
    keywords: ['image', 'photo', 'picture', 'screenshot', 'diagram', 'ocr', 'visual'],
    targetRole: 'vision',
    confidence: 0.90,
  },
];

/**
 * AgentRouter - Routes requests to appropriate agents
 */
export class AgentRouter {
  private intentCache: Map<string, RoutingDecision> = new Map();
  private cacheMaxSize = 1000;
  private cacheTTLMs = 300000; // 5 minutes

  /**
   * Route a task payload to the appropriate agent
   */
  async route(
    payload: AgentTaskPayload,
    context?: AgentContext
  ): Promise<RoutingDecision> {
    const cacheKey = this.getCacheKey(payload);
    const cached = this.intentCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const decision = await this.analyzeIntent(payload, context);
    
    // Cache the decision
    if (this.intentCache.size >= this.cacheMaxSize) {
      // Clear oldest entries
      const keys = Array.from(this.intentCache.keys());
      for (let i = 0; i < keys.length / 2; i++) {
        this.intentCache.delete(keys[i]);
      }
    }
    this.intentCache.set(cacheKey, decision);

    return decision;
  }

  /**
   * Analyze intent and determine routing
   */
  private async analyzeIntent(
    payload: AgentTaskPayload,
    context?: AgentContext
  ): Promise<RoutingDecision> {
    const intent = payload.intent.toLowerCase();
    const content = payload.content.toLowerCase();
    const combined = `${intent} ${content}`;

    // Check for attachments that suggest vision processing
    if (payload.attachments?.some(a => a.type === 'image')) {
      return this.createDecision('vision', 0.95, 'Image attachment detected');
    }

    // Pattern matching
    const matches: Array<{ role: AgentRole; score: number; reason: string }> = [];

    for (const pattern of INTENT_PATTERNS) {
      let score = 0;
      let matchedPatterns = 0;
      let matchedKeywords = 0;

      // Check regex patterns
      for (const regex of pattern.patterns) {
        if (regex.test(combined)) {
          matchedPatterns++;
          score += 0.3;
        }
      }

      // Check keywords
      for (const keyword of pattern.keywords) {
        if (combined.includes(keyword)) {
          matchedKeywords++;
          score += 0.1;
        }
      }

      if (matchedPatterns > 0 || matchedKeywords >= 2) {
        const confidence = Math.min(pattern.confidence + score * 0.5, 0.99);
        matches.push({
          role: pattern.targetRole,
          score: confidence,
          reason: `Matched ${matchedPatterns} patterns and ${matchedKeywords} keywords`,
        });
      }
    }

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    if (matches.length > 0) {
      const best = matches[0];
      const alternatives = matches.slice(1, 4).map(m => m.role);
      
      return this.createDecision(
        best.role,
        best.score,
        best.reason,
        alternatives
      );
    }

    // Default to ACHEEVY concierge for complex/unclear intents
    return this.createDecision(
      'acheevy-concierge',
      0.60,
      'No specific pattern matched, routing to concierge for clarification',
      ['research', 'coding', 'documentation']
    );
  }

  /**
   * Create a routing decision
   */
  private createDecision(
    role: AgentRole,
    confidence: number,
    reasoning: string,
    alternatives: AgentRole[] = []
  ): RoutingDecision {
    const agentDef = getAgentDefinition(role);

    return {
      selectedAgent: role,
      confidence,
      reasoning,
      alternativeAgents: alternatives,
      requiresProofGate: agentDef.vibeProofRequired,
      estimatedTimeMs: agentDef.capabilities.timeoutMs / 2, // Estimate half of max
    };
  }

  /**
   * Get cache key for payload
   */
  private getCacheKey(payload: AgentTaskPayload): string {
    return `${payload.intent}:${payload.content.slice(0, 100)}`;
  }

  /**
   * Force route to a specific agent (bypass routing logic)
   */
  forceRoute(role: AgentRole): RoutingDecision {
    return this.createDecision(role, 1.0, 'Forced routing');
  }

  /**
   * Get routing suggestions without committing
   */
  async suggest(payload: AgentTaskPayload): Promise<RoutingDecision[]> {
    const primary = await this.route(payload);
    
    const suggestions: RoutingDecision[] = [primary];
    
    for (const altRole of primary.alternativeAgents) {
      suggestions.push(this.createDecision(
        altRole,
        primary.confidence * 0.8,
        'Alternative routing option'
      ));
    }

    return suggestions;
  }

  /**
   * Clear the intent cache
   */
  clearCache(): void {
    this.intentCache.clear();
  }
}

// Singleton instance
export const agentRouter = new AgentRouter();

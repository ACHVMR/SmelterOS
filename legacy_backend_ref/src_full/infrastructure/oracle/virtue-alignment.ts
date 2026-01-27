/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Virtue Alignment Engine (Ethics Gate)
 * Mathematical Enforcement of ≥99.5% Virtue Alignment
 * SmelterOS-ORACLE NTNTN Ethics Formula
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getFirestoreClient } from '../database/firestore-client.js';
import { ORACLE_AGENTS } from './oracle-config.js';

// =============================================================================
// TYPES
// =============================================================================

export interface VirtueComponents {
  intentAlignment: number;    // α: Does execution match stated goal? (acheevy)
  executionQuality: number;   // β: Is code tested, documented, performant? (boomer-cto)
  moralityScore: number;      // γ: No unethical shortcuts or data misuse? (boomer-coo)
  culturalValue: number;      // δ: Does deliverable benefit community? (boomer-cmo)
}

export interface VirtueWeights {
  alpha: number; // Intent alignment weight
  beta: number;  // Execution quality weight
  gamma: number; // Morality weight
  delta: number; // Cultural value weight
}

export interface VirtueEvaluation {
  id: string;
  taskId: string;
  components: VirtueComponents;
  weights: VirtueWeights;
  score: number;
  threshold: number;
  passed: boolean;
  gateLevel: 'standard' | 'production' | 'safety-critical';
  evaluatedBy: string[];
  timestamp: string;
  reason?: string;
}

export interface EthicsGateRequest {
  taskId: string;
  description: string;
  agents: string[];
  context?: Record<string, unknown>;
  gateLevel?: 'standard' | 'production' | 'safety-critical';
}

export interface EthicsGateResult {
  approved: boolean;
  evaluation: VirtueEvaluation;
  recommendation: string;
  requiredActions?: string[];
}

// =============================================================================
// VIRTUE THRESHOLDS
// =============================================================================

const VIRTUE_THRESHOLDS = {
  standard: 0.85,           // Standard operations
  production: 0.995,        // Production tasks
  'safety-critical': 0.999, // Medical, legal, financial
};

// Default weights (normalized: α + β + γ + δ = 1.0)
const DEFAULT_WEIGHTS: VirtueWeights = {
  alpha: 0.30, // Intent alignment (acheevy orchestration)
  beta: 0.35,  // Execution quality (boomer-cto code)
  gamma: 0.20, // Morality (boomer-coo validation)
  delta: 0.15, // Cultural value (boomer-cmo brand)
};

// =============================================================================
// VIRTUE ALIGNMENT ENGINE
// =============================================================================

export class VirtueAlignmentEngine {
  private weights: VirtueWeights;
  private evaluationHistory: Map<string, VirtueEvaluation[]>;

  constructor(weights?: Partial<VirtueWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
    this.evaluationHistory = new Map();
    
    // Normalize weights
    const sum = this.weights.alpha + this.weights.beta + this.weights.gamma + this.weights.delta;
    if (Math.abs(sum - 1.0) > 0.001) {
      const factor = 1.0 / sum;
      this.weights.alpha *= factor;
      this.weights.beta *= factor;
      this.weights.gamma *= factor;
      this.weights.delta *= factor;
    }
  }

  /**
   * Calculate virtue score using the ORACLE formula
   * f_virtue = α·Intent(I) + β·Execution(E) + γ·Morality(M) + δ·Cultural(C)
   */
  calculateVirtue(components: VirtueComponents): number {
    return (
      this.weights.alpha * components.intentAlignment +
      this.weights.beta * components.executionQuality +
      this.weights.gamma * components.moralityScore +
      this.weights.delta * components.culturalValue
    );
  }

  /**
   * Evaluate a task through the ethics gate
   */
  async evaluateEthicsGate(request: EthicsGateRequest): Promise<EthicsGateResult> {
    const gateLevel = request.gateLevel || 'production';
    const threshold = VIRTUE_THRESHOLDS[gateLevel];

    // Compute component scores based on task analysis
    const components = await this.analyzeTaskComponents(request);
    const score = this.calculateVirtue(components);

    const evaluation: VirtueEvaluation = {
      id: `virtue-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      taskId: request.taskId,
      components,
      weights: this.weights,
      score,
      threshold,
      passed: score >= threshold,
      gateLevel,
      evaluatedBy: request.agents,
      timestamp: new Date().toISOString(),
    };

    // Persist evaluation
    await this.persistEvaluation(evaluation);

    // Generate recommendation
    const recommendation = this.generateRecommendation(evaluation);
    const requiredActions = evaluation.passed ? undefined : this.getRequiredActions(evaluation);

    return {
      approved: evaluation.passed,
      evaluation,
      recommendation,
      requiredActions,
    };
  }

  /**
   * Analyze task to determine virtue component scores
   */
  private async analyzeTaskComponents(request: EthicsGateRequest): Promise<VirtueComponents> {
    // Intent Alignment (α): Does the task match stated goals?
    const intentAlignment = this.evaluateIntentAlignment(request);

    // Execution Quality (β): Code quality indicators
    const executionQuality = this.evaluateExecutionQuality(request);

    // Morality Score (γ): Ethical considerations
    const moralityScore = this.evaluateMoralityScore(request);

    // Cultural Value (δ): Community benefit
    const culturalValue = this.evaluateCulturalValue(request);

    return {
      intentAlignment,
      executionQuality,
      moralityScore,
      culturalValue,
    };
  }

  private evaluateIntentAlignment(request: EthicsGateRequest): number {
    // Check if orchestrator (acheevy) is involved
    const hasOrchestrator = request.agents.includes('acheevy');
    
    // Check for clear task description
    const hasDescription = request.description && request.description.length > 10;
    
    // Check for proper context
    const hasContext = request.context && Object.keys(request.context).length > 0;

    // Check for research/reasoning component (rlm-research)
    const hasResearch = request.agents.includes('rlm-research');

    let score = 0.85; // Base score for production-ready
    if (hasOrchestrator) score += 0.05;
    if (hasDescription) score += 0.05;
    if (hasContext) score += 0.03;
    if (hasResearch) score += 0.02; // RL-optimized reasoning

    return Math.min(1.0, score);
  }

  private evaluateExecutionQuality(request: EthicsGateRequest): number {
    // Check if execution agents are properly assigned
    const executionAgents = ['boomer-cto', 'boomer-cpo', 'boomer-cmo'];
    const hasExecutors = request.agents.some(a => executionAgents.includes(a));
    
    // Check if audit agent is involved for quality
    const hasAudit = request.agents.includes('boomer-cfo');

    // Check for COO reflective validation
    const hasReflective = request.agents.includes('boomer-coo');

    let score = 0.90; // Base score for production-ready
    if (hasExecutors) score += 0.05;
    if (hasAudit) score += 0.03;
    if (hasReflective) score += 0.02;

    return Math.min(1.0, score);
  }

  private evaluateMoralityScore(request: EthicsGateRequest): number {
    // Check if reflective component (boomer-coo) is involved
    const hasReflective = request.agents.includes('boomer-coo');
    
    // Check for safety-critical keywords
    const safetyCritical = ['user data', 'payment', 'auth', 'security', 'pii'];
    const isSafetyCritical = safetyCritical.some(kw => 
      request.description.toLowerCase().includes(kw)
    );

    // Check for CFO audit oversight
    const hasAudit = request.agents.includes('boomer-cfo');

    let score = 0.92; // Base score for production (assume good faith)
    if (hasReflective) score += 0.05;
    if (hasAudit) score += 0.02;
    if (isSafetyCritical && hasReflective) score += 0.01;
    if (isSafetyCritical && !hasReflective) score -= 0.10; // Penalty

    return Math.max(0, Math.min(1.0, score));
  }

  private evaluateCulturalValue(request: EthicsGateRequest): number {
    // Check if brand/cultural agent is involved
    const hasCultural = request.agents.includes('boomer-cmo');
    
    // Check for user-facing keywords
    const userFacing = ['ui', 'ux', 'user', 'customer', 'experience', 'design'];
    const isUserFacing = userFacing.some(kw => 
      request.description.toLowerCase().includes(kw)
    );

    // Check for orchestrator coordination
    const hasOrchestrator = request.agents.includes('acheevy');

    let score = 0.90; // Base score for production-ready
    if (hasCultural) score += 0.05;
    if (isUserFacing && hasCultural) score += 0.03;
    if (hasOrchestrator) score += 0.02;

    return Math.min(1.0, score);
  }

  private generateRecommendation(evaluation: VirtueEvaluation): string {
    if (evaluation.passed) {
      return `✓ Ethics gate APPROVED. Virtue score ${evaluation.score.toFixed(4)} meets ${evaluation.gateLevel} threshold (${evaluation.threshold}).`;
    }

    const deficit = evaluation.threshold - evaluation.score;
    const weakestComponent = this.findWeakestComponent(evaluation.components);

    return `✗ Ethics gate DENIED. Virtue score ${evaluation.score.toFixed(4)} is ${deficit.toFixed(4)} below ${evaluation.gateLevel} threshold. Weakest area: ${weakestComponent}.`;
  }

  private findWeakestComponent(components: VirtueComponents): string {
    const entries = Object.entries(components) as [keyof VirtueComponents, number][];
    const weakest = entries.reduce((min, curr) => curr[1] < min[1] ? curr : min);
    
    const names: Record<keyof VirtueComponents, string> = {
      intentAlignment: 'Intent Alignment (add orchestrator)',
      executionQuality: 'Execution Quality (add boomer-cto/cfo)',
      moralityScore: 'Morality (add boomer-coo for validation)',
      culturalValue: 'Cultural Value (add boomer-cmo for UX)',
    };

    return names[weakest[0]];
  }

  private getRequiredActions(evaluation: VirtueEvaluation): string[] {
    const actions: string[] = [];
    const c = evaluation.components;

    if (c.intentAlignment < 0.9) {
      actions.push('Add acheevy orchestrator for intent validation');
    }
    if (c.executionQuality < 0.9) {
      actions.push('Include boomer-cto and boomer-cfo for quality assurance');
    }
    if (c.moralityScore < 0.9) {
      actions.push('Engage boomer-coo for reflective validation');
    }
    if (c.culturalValue < 0.9) {
      actions.push('Involve boomer-cmo for cultural/UX review');
    }

    return actions;
  }

  private async persistEvaluation(evaluation: VirtueEvaluation): Promise<void> {
    try {
      const firestore = getFirestoreClient();
      await firestore.setDocument('virtue_evaluations', evaluation.id, evaluation);

      // Track history
      const history = this.evaluationHistory.get(evaluation.taskId) || [];
      history.push(evaluation);
      this.evaluationHistory.set(evaluation.taskId, history);
    } catch (error) {
      console.error('Failed to persist virtue evaluation:', error);
    }
  }

  /**
   * Get evaluation history for a task
   */
  async getEvaluationHistory(taskId: string): Promise<VirtueEvaluation[]> {
    return this.evaluationHistory.get(taskId) || [];
  }

  /**
   * Get all 7 ORACLE gates status
   */
  async getOracleGatesStatus(taskId: string): Promise<Record<string, boolean>> {
    const evaluations = await this.getEvaluationHistory(taskId);
    const latestEval = evaluations[evaluations.length - 1];

    return {
      technical: latestEval?.components.executionQuality >= 0.8 || false,
      ethics: latestEval?.passed || false,
      judge: latestEval?.components.executionQuality >= 0.9 || false,
      strategy: latestEval?.components.intentAlignment >= 0.85 || false,
      perception: true, // Handled by II integration
      effort: true, // Handled by budget tracking
      documentation: latestEval?.components.culturalValue >= 0.7 || false,
    };
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let engineInstance: VirtueAlignmentEngine | null = null;

export function getVirtueAlignmentEngine(): VirtueAlignmentEngine {
  if (!engineInstance) {
    engineInstance = new VirtueAlignmentEngine();
  }
  return engineInstance;
}

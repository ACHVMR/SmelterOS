/**
 * ═══════════════════════════════════════════════════════════════════════════
 * II Integration Module
 * Unified Client for Intelligent Internet Repositories
 * Phase 3: Deep Research, RL Reasoning, Embeddings, CoT Visualization
 * ═══════════════════════════════════════════════════════════════════════════
 */

export { IIResearcher, getIIResearcher, type ResearchResult, type ResearchFinding } from './ii-researcher.js';
export { IIThought, getIIThought, type RLOptimizationResult, type RLPolicy, type RLScore } from './ii-thought.js';
export { IICommons, getIICommons, type HybridEmbedding, type VectorSearchResult } from './ii-commons.js';
export { CotLab, getCotLab, type CoTTrace, type CoTStep, type CoTVisualization } from './cot-lab.js';

import { getIIResearcher, ResearchResult } from './ii-researcher.js';
import { getIIThought, RLOptimizationResult } from './ii-thought.js';
import { getIICommons } from './ii-commons.js';
import { getCotLab, CoTVisualization } from './cot-lab.js';

// =============================================================================
// II INTEGRATOR - UNIFIED CLIENT
// =============================================================================

export class IIIntegrator {
  private researcher = getIIResearcher();
  private thought = getIIThought();
  private commons = getIICommons();
  private cotLab = getCotLab();

  /**
   * Deep research using II-Researcher
   */
  async deepResearch(query: string, depth: 'shallow' | 'standard' | 'deep' | 'exhaustive' = 'standard'): Promise<ResearchResult> {
    return this.researcher.research(query, { depth });
  }

  /**
   * RL optimization using II-Thought
   */
  async rlOptimize(task: string, iterations: number = 10): Promise<RLOptimizationResult> {
    return this.thought.optimize(task, { iterations });
  }

  /**
   * Hybrid embedding using II-Commons
   */
  async embedHybrid(content: string): Promise<number[]> {
    return this.commons.generate(content);
  }

  /**
   * CoT visualization using CoT-Lab
   */
  async visualizeCot(sessionId: string, format: 'html' | 'json' | 'mermaid' | 'text' = 'html'): Promise<CoTVisualization> {
    return this.cotLab.render(sessionId, format);
  }

  /**
   * Start CoT trace
   */
  startCoTTrace(sessionId: string, query: string) {
    return this.cotLab.startTrace(sessionId, query);
  }

  /**
   * Add step to CoT trace
   */
  addCoTStep(traceId: string, step: {
    type: 'reasoning' | 'decision' | 'action' | 'delegation' | 'validation';
    content: string;
    confidence: number;
    duration: number;
    inputs: string[];
    outputs: string[];
  }) {
    return this.cotLab.addStep(traceId, step);
  }

  /**
   * Complete CoT trace
   */
  async completeCoTTrace(traceId: string, finalConfidence?: number) {
    return this.cotLab.completeTrace(traceId, finalConfidence);
  }

  /**
   * Get RL scores
   */
  async getRLScores(agentId?: string, limit: number = 100) {
    return this.thought.getRLScores(agentId, limit);
  }

  /**
   * Get adaptation rate
   */
  getAdaptationRate(task: string): number {
    return this.thought.getAdaptationRate(task);
  }

  /**
   * Calculate cosine similarity
   */
  cosineSimilarity(a: number[], b: number[]): number {
    return this.commons.cosineSimilarity(a, b);
  }

  /**
   * Batch embed
   */
  async batchEmbed(contents: string[]): Promise<number[][]> {
    return this.commons.generateBatch(contents);
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let integratorInstance: IIIntegrator | null = null;

export function getIIIntegrator(): IIIntegrator {
  if (!integratorInstance) {
    integratorInstance = new IIIntegrator();
  }
  return integratorInstance;
}

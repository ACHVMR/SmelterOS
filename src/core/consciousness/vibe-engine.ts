/**
 * V.I.B.E. Engine - Virtue Integrity Behavioral Equilibrium
 * 
 * Formula: f(virtue) = I(intent) + E(execution) + M(morality) + C(cultural_value)
 * Threshold: ≥ 0.995 for production readiness
 */

import {
  VibeComponents,
  VibeValidation,
  HaltCondition,
  NoonCheckpoint
} from './types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// V.I.B.E. ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class VibeEngine {
  private readonly threshold: number;
  private readonly warningLevel: number;
  private readonly criticalLevel: number;
  
  constructor(threshold: number = 0.995) {
    this.threshold = threshold;
    this.warningLevel = 0.98;
    this.criticalLevel = 0.95;
  }
  
  /**
   * Calculate V.I.B.E. score from components
   * Each component is weighted equally at 0.25
   */
  calculateScore(components: VibeComponents): number {
    const weights = {
      intent: 0.25,
      execution: 0.25,
      morality: 0.25,
      culturalValue: 0.25
    };
    
    const score = 
      components.intent * weights.intent +
      components.execution * weights.execution +
      components.morality * weights.morality +
      components.culturalValue * weights.culturalValue;
    
    // Clamp to valid range [0, 1]
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Validate V.I.B.E. alignment
   */
  validate(components: VibeComponents): VibeValidation {
    const score = this.calculateScore(components);
    
    return {
      score,
      components,
      isAligned: score >= this.threshold,
      threshold: this.threshold,
      timestamp: new Date()
    };
  }
  
  /**
   * Check if score triggers a warning
   */
  isWarning(score: number): boolean {
    return score < this.threshold && score >= this.warningLevel;
  }
  
  /**
   * Check if score is critical
   */
  isCritical(score: number): boolean {
    return score < this.warningLevel && score >= this.criticalLevel;
  }
  
  /**
   * Check if score requires immediate halt
   */
  requiresHalt(score: number): boolean {
    return score < this.criticalLevel;
  }
  
  /**
   * Get detailed component analysis
   */
  analyzeComponents(components: VibeComponents): ComponentAnalysis[] {
    const analyses: ComponentAnalysis[] = [];
    
    // Intent Analysis
    analyses.push({
      component: 'intent',
      score: components.intent,
      status: this.getComponentStatus(components.intent),
      recommendations: this.getIntentRecommendations(components.intent)
    });
    
    // Execution Analysis
    analyses.push({
      component: 'execution',
      score: components.execution,
      status: this.getComponentStatus(components.execution),
      recommendations: this.getExecutionRecommendations(components.execution)
    });
    
    // Morality Analysis
    analyses.push({
      component: 'morality',
      score: components.morality,
      status: this.getComponentStatus(components.morality),
      recommendations: this.getMoralityRecommendations(components.morality)
    });
    
    // Cultural Value Analysis
    analyses.push({
      component: 'culturalValue',
      score: components.culturalValue,
      status: this.getComponentStatus(components.culturalValue),
      recommendations: this.getCulturalValueRecommendations(components.culturalValue)
    });
    
    return analyses;
  }
  
  private getComponentStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 0.995) return 'excellent';
    if (score >= 0.98) return 'good';
    if (score >= 0.95) return 'warning';
    return 'critical';
  }
  
  private getIntentRecommendations(score: number): string[] {
    if (score >= 0.995) return [];
    
    const recommendations: string[] = [];
    if (score < 0.98) {
      recommendations.push('Clarify purpose and goal alignment');
      recommendations.push('Verify stakeholder benefit is explicit');
    }
    if (score < 0.95) {
      recommendations.push('Re-evaluate task objectives');
      recommendations.push('Consult tri-consciousness for guidance');
    }
    return recommendations;
  }
  
  private getExecutionRecommendations(score: number): string[] {
    if (score >= 0.995) return [];
    
    const recommendations: string[] = [];
    if (score < 0.98) {
      recommendations.push('Improve technical quality metrics');
      recommendations.push('Enhance reliability testing');
    }
    if (score < 0.95) {
      recommendations.push('Conduct thorough code review');
      recommendations.push('Implement additional validation');
    }
    return recommendations;
  }
  
  private getMoralityRecommendations(score: number): string[] {
    if (score >= 0.995) return [];
    
    const recommendations: string[] = [];
    if (score < 0.98) {
      recommendations.push('Review ethical implications');
      recommendations.push('Verify harm prevention measures');
    }
    if (score < 0.95) {
      recommendations.push('Consult NTNTN for ethical review');
      recommendations.push('Conduct fairness assessment');
    }
    return recommendations;
  }
  
  private getCulturalValueRecommendations(score: number): string[] {
    if (score >= 0.995) return [];
    
    const recommendations: string[] = [];
    if (score < 0.98) {
      recommendations.push('Assess community benefit');
      recommendations.push('Verify cultural alignment');
    }
    if (score < 0.95) {
      recommendations.push('Review Elder axiom compliance');
      recommendations.push('Consult cultural governance');
    }
    return recommendations;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HALT CONDITION ENFORCER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class HaltConditionEnforcer {
  private readonly vibeEngine: VibeEngine;
  
  constructor(vibeEngine: VibeEngine) {
    this.vibeEngine = vibeEngine;
  }
  
  /**
   * Check all halt conditions and create NOON checkpoint
   */
  createCheckpoint(
    checkpointId: string,
    vibeScore: number,
    elderAxiomCompliance: boolean,
    culturalLawCompliance: boolean,
    securityTierValid: boolean
  ): NoonCheckpoint {
    const haltConditions = this.evaluateHaltConditions(
      vibeScore,
      elderAxiomCompliance,
      culturalLawCompliance,
      securityTierValid
    );
    
    return {
      checkpointId,
      vibeScore,
      elderAxiomCompliance,
      culturalLawCompliance,
      securityTierValid,
      canProceed: haltConditions.length === 0,
      haltReason: haltConditions.length > 0 ? haltConditions.join(', ') : undefined
    };
  }
  
  /**
   * Evaluate all halt conditions
   */
  private evaluateHaltConditions(
    vibeScore: number,
    elderAxiomCompliance: boolean,
    culturalLawCompliance: boolean,
    securityTierValid: boolean
  ): HaltCondition[] {
    const conditions: HaltCondition[] = [];
    
    if (vibeScore < 0.995) {
      conditions.push('vibe_below_threshold');
    }
    
    if (!elderAxiomCompliance) {
      conditions.push('elder_axiom_violation');
    }
    
    if (!culturalLawCompliance) {
      conditions.push('cultural_law_violation');
    }
    
    if (!securityTierValid) {
      conditions.push('security_violation');
    }
    
    return conditions;
  }
  
  /**
   * Get remediation steps for halt condition
   */
  getRemediationSteps(condition: HaltCondition): string[] {
    switch (condition) {
      case 'vibe_below_threshold':
        return [
          'Review V.I.B.E. component scores',
          'Address weakest components',
          'Re-run validation after improvements'
        ];
        
      case 'elder_axiom_violation':
        return [
          'Identify violated axiom(s)',
          'Consult Elder governance',
          'Modify approach to comply'
        ];
        
      case 'cultural_law_violation':
        return [
          'Review cultural law requirements',
          'Consult NTNTN for guidance',
          'Adjust to align with cultural values'
        ];
        
      case 'security_violation':
        return [
          'Audit security tier requirements',
          'Review access controls',
          'Implement required security measures'
        ];
        
      case 'forbidden_value_exposure':
        return [
          'Identify exposed values',
          'Implement redaction',
          'Review data handling procedures'
        ];
        
      default:
        return ['Contact tri-consciousness for guidance'];
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUPPORTING TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ComponentAnalysis {
  component: keyof VibeComponents;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  recommendations: string[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const vibeEngine = new VibeEngine();
export const haltEnforcer = new HaltConditionEnforcer(vibeEngine);

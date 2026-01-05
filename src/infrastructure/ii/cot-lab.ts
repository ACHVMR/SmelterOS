/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CoT-Lab Visualization Client
 * Chain-of-Thought Reasoning Transparency & Visualization
 * Phase 3: Reasoning Chain Transparency for Debugging & Audit
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getFirestoreClient } from '../database/firestore-client.js';

// =============================================================================
// TYPES
// =============================================================================

export interface CoTStep {
  id: string;
  step: number;
  type: 'reasoning' | 'decision' | 'action' | 'delegation' | 'validation';
  content: string;
  confidence: number;
  duration: number;
  inputs: string[];
  outputs: string[];
  metadata?: Record<string, unknown>;
}

export interface CoTTrace {
  id: string;
  sessionId: string;
  query: string;
  steps: CoTStep[];
  totalDuration: number;
  finalConfidence: number;
  status: 'in-progress' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface CoTVisualization {
  traceId: string;
  format: 'html' | 'json' | 'mermaid' | 'text';
  content: string;
  renderTimeMs: number;
}

// =============================================================================
// COT-LAB CLASS
// =============================================================================

export class CotLab {
  private enabled: boolean;
  private activeTraces: Map<string, CoTTrace>;
  private maxStepsPerTrace: number;

  constructor() {
    this.enabled = process.env.COT_LAB_ENABLED === 'true';
    this.activeTraces = new Map();
    this.maxStepsPerTrace = parseInt(process.env.COT_MAX_STEPS || '50', 10);
  }

  /**
   * Start a new CoT trace
   */
  startTrace(sessionId: string, query: string): CoTTrace {
    const traceId = `cot-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const trace: CoTTrace = {
      id: traceId,
      sessionId,
      query,
      steps: [],
      totalDuration: 0,
      finalConfidence: 0,
      status: 'in-progress',
      createdAt: new Date().toISOString(),
    };

    this.activeTraces.set(traceId, trace);
    console.log(`🔗 CoT-Lab: Started trace ${traceId}`);

    return trace;
  }

  /**
   * Add a step to an active trace
   */
  addStep(traceId: string, step: Omit<CoTStep, 'id' | 'step'>): CoTStep | null {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      console.warn(`CoT trace ${traceId} not found`);
      return null;
    }

    if (trace.steps.length >= this.maxStepsPerTrace) {
      console.warn(`CoT trace ${traceId} reached max steps`);
      return null;
    }

    const cotStep: CoTStep = {
      id: `step-${trace.steps.length + 1}-${Date.now()}`,
      step: trace.steps.length + 1,
      ...step,
    };

    trace.steps.push(cotStep);
    trace.totalDuration += step.duration;

    return cotStep;
  }

  /**
   * Complete a trace
   */
  async completeTrace(traceId: string, finalConfidence?: number): Promise<CoTTrace | null> {
    const trace = this.activeTraces.get(traceId);
    if (!trace) {
      console.warn(`CoT trace ${traceId} not found`);
      return null;
    }

    trace.status = 'completed';
    trace.completedAt = new Date().toISOString();
    trace.finalConfidence = finalConfidence ?? this.calculateFinalConfidence(trace);

    // Persist to Firestore
    await this.persistTrace(trace);
    
    // Remove from active traces
    this.activeTraces.delete(traceId);

    console.log(`   ✓ CoT trace completed: ${trace.steps.length} steps, confidence=${trace.finalConfidence.toFixed(2)}`);
    return trace;
  }

  /**
   * Fail a trace
   */
  async failTrace(traceId: string, reason: string): Promise<CoTTrace | null> {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;

    trace.status = 'failed';
    trace.completedAt = new Date().toISOString();
    
    // Add failure step
    this.addStep(traceId, {
      type: 'action',
      content: `Trace failed: ${reason}`,
      confidence: 0,
      duration: 0,
      inputs: [],
      outputs: [reason],
    });

    await this.persistTrace(trace);
    this.activeTraces.delete(traceId);

    return trace;
  }

  /**
   * Render visualization for a session
   */
  async render(sessionId: string, format: CoTVisualization['format'] = 'html'): Promise<CoTVisualization> {
    const startTime = Date.now();

    console.log(`🎨 CoT-Lab: Rendering visualization for session ${sessionId}`);

    // Get trace from active or Firestore
    let trace = this.findActiveTraceBySession(sessionId);
    
    if (!trace) {
      trace = await this.loadTraceFromFirestore(sessionId);
    }

    if (!trace) {
      return {
        traceId: 'not-found',
        format,
        content: this.renderNotFound(sessionId, format),
        renderTimeMs: Date.now() - startTime,
      };
    }

    let content: string;
    switch (format) {
      case 'mermaid':
        content = this.renderMermaid(trace);
        break;
      case 'json':
        content = JSON.stringify(trace, null, 2);
        break;
      case 'text':
        content = this.renderText(trace);
        break;
      case 'html':
      default:
        content = this.renderHtml(trace);
    }

    const visualization: CoTVisualization = {
      traceId: trace.id,
      format,
      content,
      renderTimeMs: Date.now() - startTime,
    };

    console.log(`   ✓ Visualization rendered: ${format}, ${visualization.renderTimeMs}ms`);
    return visualization;
  }

  /**
   * Render HTML visualization
   */
  private renderHtml(trace: CoTTrace): string {
    const stepsHtml = trace.steps.map(step => `
      <div class="cot-step cot-step-${step.type}" style="margin: 10px 0; padding: 15px; border-left: 4px solid ${this.getStepColor(step.type)}; background: #f8f9fa;">
        <div style="font-weight: bold; color: ${this.getStepColor(step.type)};">
          Step ${step.step}: ${step.type.toUpperCase()}
        </div>
        <div style="margin: 8px 0;">${this.escapeHtml(step.content)}</div>
        <div style="font-size: 12px; color: #666;">
          Confidence: ${(step.confidence * 100).toFixed(1)}% | Duration: ${step.duration}ms
        </div>
        ${step.inputs.length > 0 ? `<div style="font-size: 11px; color: #888;">Inputs: ${step.inputs.join(', ')}</div>` : ''}
        ${step.outputs.length > 0 ? `<div style="font-size: 11px; color: #888;">Outputs: ${step.outputs.join(', ')}</div>` : ''}
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <title>CoT Trace: ${trace.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .stats { display: flex; gap: 20px; margin-top: 10px; }
    .stat { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 4px; }
    .trace-container { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">Chain of Thought Trace</h1>
    <p style="margin: 5px 0; opacity: 0.9;">${this.escapeHtml(trace.query)}</p>
    <div class="stats">
      <span class="stat">Steps: ${trace.steps.length}</span>
      <span class="stat">Duration: ${trace.totalDuration}ms</span>
      <span class="stat">Confidence: ${(trace.finalConfidence * 100).toFixed(1)}%</span>
      <span class="stat">Status: ${trace.status}</span>
    </div>
  </div>
  <div class="trace-container">
    ${stepsHtml}
  </div>
</body>
</html>`;
  }

  /**
   * Render Mermaid flowchart
   */
  private renderMermaid(trace: CoTTrace): string {
    const nodes = trace.steps.map((step, i) => 
      `    S${i}["${step.type}: ${step.content.substring(0, 30)}..."]`
    ).join('\n');

    const links = trace.steps.slice(0, -1).map((_, i) => 
      `    S${i} --> S${i + 1}`
    ).join('\n');

    return `flowchart TD
    subgraph "CoT Trace: ${trace.id}"
${nodes}
${links}
    end`;
  }

  /**
   * Render text visualization
   */
  private renderText(trace: CoTTrace): string {
    let text = `═══ Chain of Thought Trace ═══\n`;
    text += `ID: ${trace.id}\n`;
    text += `Query: ${trace.query}\n`;
    text += `Status: ${trace.status}\n`;
    text += `Total Duration: ${trace.totalDuration}ms\n`;
    text += `Final Confidence: ${(trace.finalConfidence * 100).toFixed(1)}%\n`;
    text += `\n═══ Steps ═══\n\n`;

    for (const step of trace.steps) {
      text += `[Step ${step.step}] ${step.type.toUpperCase()}\n`;
      text += `  Content: ${step.content}\n`;
      text += `  Confidence: ${(step.confidence * 100).toFixed(1)}%\n`;
      text += `  Duration: ${step.duration}ms\n`;
      if (step.inputs.length) text += `  Inputs: ${step.inputs.join(', ')}\n`;
      if (step.outputs.length) text += `  Outputs: ${step.outputs.join(', ')}\n`;
      text += '\n';
    }

    return text;
  }

  /**
   * Render not found message
   */
  private renderNotFound(sessionId: string, format: string): string {
    if (format === 'html') {
      return `<html><body><h1>Trace Not Found</h1><p>No CoT trace found for session: ${sessionId}</p></body></html>`;
    }
    return `CoT trace not found for session: ${sessionId}`;
  }

  /**
   * Get step color by type
   */
  private getStepColor(type: CoTStep['type']): string {
    const colors: Record<CoTStep['type'], string> = {
      reasoning: '#3498db',
      decision: '#9b59b6',
      action: '#2ecc71',
      delegation: '#f39c12',
      validation: '#e74c3c',
    };
    return colors[type] || '#95a5a6';
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Calculate final confidence from steps
   */
  private calculateFinalConfidence(trace: CoTTrace): number {
    if (trace.steps.length === 0) return 0;
    
    // Weighted average with later steps having more weight
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (let i = 0; i < trace.steps.length; i++) {
      const weight = i + 1;
      weightedSum += trace.steps[i].confidence * weight;
      totalWeight += weight;
    }
    
    return weightedSum / totalWeight;
  }

  /**
   * Find active trace by session
   */
  private findActiveTraceBySession(sessionId: string): CoTTrace | null {
    for (const trace of this.activeTraces.values()) {
      if (trace.sessionId === sessionId) {
        return trace;
      }
    }
    return null;
  }

  /**
   * Persist trace to Firestore
   */
  private async persistTrace(trace: CoTTrace): Promise<void> {
    try {
      const firestore = getFirestoreClient();
      await firestore.setDocument('cot_traces', trace.id, { ...trace, id: trace.id });
    } catch (error) {
      console.warn('Failed to persist CoT trace:', error);
    }
  }

  /**
   * Load trace from Firestore
   */
  private async loadTraceFromFirestore(sessionId: string): Promise<CoTTrace | null> {
    try {
      const firestore = getFirestoreClient();
      const result = await firestore.query<CoTTrace>('cot_traces', {
        filters: [{ field: 'sessionId', op: 'EQUAL', value: sessionId }],
        orderBy: [{ field: 'createdAt', direction: 'DESCENDING' }],
        limit: 1,
      });
      
      return result.data[0] || null;
    } catch (error) {
      console.warn('Failed to load CoT trace:', error);
      return null;
    }
  }

  /**
   * Get all traces for a session
   */
  async getTracesForSession(sessionId: string, limit: number = 10): Promise<CoTTrace[]> {
    try {
      const firestore = getFirestoreClient();
      const result = await firestore.query<CoTTrace>('cot_traces', {
        filters: [{ field: 'sessionId', op: 'EQUAL', value: sessionId }],
        orderBy: [{ field: 'createdAt', direction: 'DESCENDING' }],
        limit,
      });
      
      return result.data;
    } catch (error) {
      console.error('Failed to get CoT traces:', error);
      return [];
    }
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let cotLabInstance: CotLab | null = null;

export function getCotLab(): CotLab {
  if (!cotLabInstance) {
    cotLabInstance = new CotLab();
  }
  return cotLabInstance;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS-ORACLE Integration Module
 * Unified Exports for ORACLE Framework Adaptation
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Configuration
export {
  ORACLE_AGENTS,
  ORACLE_LAYERS,
  DEFAULT_3LAYER_CONTEXT,
  FDH_PHASES,
  getOracleConfig,
  type OracleAgent,
  type OracleLayer,
  type Oracle3LayerContext,
  type StandardsLayer,
  type ProductLayer,
  type SpecsLayer,
} from './oracle-config.js';

// Virtue Alignment / Ethics Gate
export {
  VirtueAlignmentEngine,
  getVirtueAlignmentEngine,
  type VirtueComponents,
  type VirtueWeights,
  type VirtueEvaluation,
  type EthicsGateRequest,
  type EthicsGateResult,
} from './virtue-alignment.js';

// STRATA Tools Registry
export {
  StrataRegistry,
  getStrataRegistry,
  type StrataTool,
  type StrataToolRegistration,
  type StrataRegistryStatus,
} from './strata-registry.js';

// =============================================================================
// ORACLE FACADE
// =============================================================================

import { getVirtueAlignmentEngine, EthicsGateRequest, EthicsGateResult } from './virtue-alignment.js';
import { getStrataRegistry, StrataToolRegistration } from './strata-registry.js';
import { ORACLE_AGENTS, ORACLE_LAYERS, getOracleConfig } from './oracle-config.js';

export class OracleFacade {
  private virtueEngine = getVirtueAlignmentEngine();
  private strataRegistry = getStrataRegistry();

  /**
   * Evaluate ethics gate for a task
   */
  async evaluateEthicsGate(request: EthicsGateRequest): Promise<EthicsGateResult> {
    return this.virtueEngine.evaluateEthicsGate(request);
  }

  /**
   * Register STRATA tools
   */
  async registerStrataTools(request: StrataToolRegistration) {
    return this.strataRegistry.registerTools(request);
  }

  /**
   * Get all 7 ORACLE gates status
   */
  async getOracleGatesStatus(taskId: string) {
    return this.virtueEngine.getOracleGatesStatus(taskId);
  }

  /**
   * Get STRATA registry status
   */
  async getStrataStatus() {
    return this.strataRegistry.getStatus();
  }

  /**
   * Get agent configuration
   */
  getAgentConfig(agentId: string) {
    return ORACLE_AGENTS[agentId];
  }

  /**
   * Get layer configuration
   */
  getLayerConfig(layerId: string) {
    return ORACLE_LAYERS[layerId];
  }

  /**
   * Get overall ORACLE config
   */
  getConfig() {
    return getOracleConfig();
  }

  /**
   * Get agents by FDH phase
   */
  getAgentsByPhase(phase: 'foster' | 'develop' | 'hone' | 'all') {
    return Object.values(ORACLE_AGENTS).filter(a => a.fdhPhase === phase || a.fdhPhase === 'all');
  }

  /**
   * Get agents by layer
   */
  getAgentsByLayer(layer: 'nlp' | 'logic' | 'orchestration' | 'execution') {
    return Object.values(ORACLE_AGENTS).filter(a => a.layer === layer);
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let facadeInstance: OracleFacade | null = null;

export function getOracleFacade(): OracleFacade {
  if (!facadeInstance) {
    facadeInstance = new OracleFacade();
  }
  return facadeInstance;
}

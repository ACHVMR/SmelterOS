/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Tools Module Index
 * Exports: Roster, Paywall, Ingot Assembler, Visualization
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Tool Roster (Vertex AI Model Garden Taxonomy)
export {
  // Types
  type CapabilityVertical,
  type ModelType,
  type TaskType,
  type TierLevel,
  type TierConfig,
  type ToolProfile,
  
  // Constants
  TIER_CONFIGS,
  TOOL_ROSTER,
  
  // Functions
  getToolById,
  getToolsByVertical,
  getToolsForTier,
  getFreeAlternative,
  canAccessTool,
  queryRosterByCapabilities,
  getVerticalStats,
} from './roster';

// Paywall Service
export {
  // Types
  type UserProfile,
  type PaywallResult,
  
  // Service
  PaywallService,
  getPaywallService,
  
  // ACHEEVY Integration
  acheevyPaywallCheck,
} from './paywall';

// Ingot Assembler
export {
  // Types
  type WiringMode,
  type ToolIngot,
  type IngotExecutionState,
  type ToolExecutionState,
  
  // Service
  IngotAssembler,
  getIngotAssembler,
  
  // Function Gemma T5 Integration
  gemmaT5AssembleIngot,
} from './ingot-assembler';

// Ingot Visualization (SSR HTML Renderer)
export {
  type IngotVisualization,
  type ToolVisualization,
  buildVisualization,
  renderIngotHTML,
} from './ingot-visualization';

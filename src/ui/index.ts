/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - UI MODULE INDEX
 * Central export for all UI components, layouts, screens, and services
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS (CSS)
// ─────────────────────────────────────────────────────────────────────────────

// Import: src/ui/styles/smelter-tokens.css

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Types
  type ButtonVariant,
  type StatusTone,
  type WaveformMode,
  type PanelTone,
  type TextFieldProps,
  type ButtonProps,
  type ToggleSwitchProps,
  type StatusPillProps,
  type WaveformBarProps,
  type PanelCardProps,
  
  // Renderers
  renderTextField,
  renderButton,
  renderToggleSwitch,
  renderStatusPill,
  renderWaveformBar,
  renderPanelCard,
  renderLoadBar,
  renderDivider,
  renderCheckbox,
  renderLinkButton,
  renderStepper,
  renderOAuthButton,
  renderVoiceSignInButton,
  
  // Styles
  getComponentStyles
} from './components';

// ─────────────────────────────────────────────────────────────────────────────
// ACHEEVY CONCIERGE
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Types
  type AcheevyState,
  type AcheevyMessage,
  type AcheevyAttachment,
  type AcheevySuggestion,
  type AcheevyConfig,
  
  // Constants
  DEFAULT_ACHEEVY_SUGGESTIONS,
  
  // Renderers
  renderAcheevyAvatar,
  renderAcheevyWidget,
  renderAcheevyPanel,
  
  // Styles
  getAcheevyStyles
} from './components/Acheevy';

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL LAYOUT
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Types
  type NavItem,
  type QuickAction,
  type UserMenuData,
  type AppShellConfig,
  
  // Constants
  SMELTER_NAV_ITEMS,
  
  // Renderers
  renderBrandMark,
  renderTopBar,
  renderLeftNav,
  renderRightRail,
  renderMain,
  renderSmelterAppShell,
  
  // Styles
  getAppShellStyles
} from './layouts/SmelterAppShell';

// ─────────────────────────────────────────────────────────────────────────────
// SCREENS
// ─────────────────────────────────────────────────────────────────────────────

// Auth Gate
export {
  type LoginFormState,
  type RegistrationFormState,
  type AuthGateConfig,
  renderLoginPanel,
  renderRegistrationPanel,
  renderSmelterAuthGate,
  getAuthGateStyles
} from './screens/SmelterAuthGate';

// Workbench Lab
export {
  type Tool,
  type ScenarioConfig,
  type EndpointConfig,
  type RequestState,
  type ResponseState,
  type QuotaState,
  type WorkbenchLabState,
  SAMPLE_TOOLS,
  POPULAR_APIS,
  renderToolCatalogPanel,
  renderScenarioPanel,
  renderRealtimeResultsPanel,
  renderWorkbenchLabScreen,
  getWorkbenchLabStyles
} from './screens/WorkbenchLab';

// CircuitBox System Management
export {
  type AgentLoadItem,
  type RepoHealthItem,
  type IntegrationItem,
  type VoicePipelineState,
  type DeploymentItem,
  type AlertItem,
  type CircuitBoxState,
  SAMPLE_CIRCUIT_BOX_STATE,
  renderAgentLoadPanel,
  renderRepoHealthPanel,
  renderIntegrationsPanel,
  renderVoicePipelinePanel,
  renderDeploymentPanel,
  renderAlertsPanel,
  renderCircuitBoxScreen,
  getCircuitBoxStyles
} from './screens/CircuitBoxSystemManagement';

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export {
  type AcheevyContext,
  type AcheevyRequest,
  type AcheevyResponse,
  type AcheevyAction,
  AcheevyService,
  getAcheevyService
} from './services/AcheevyService';

// ─────────────────────────────────────────────────────────────────────────────
// FULL STYLESHEET GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

import { getComponentStyles } from './components';
import { getAcheevyStyles } from './components/Acheevy';
import { getAppShellStyles } from './layouts/SmelterAppShell';
import { getAuthGateStyles } from './screens/SmelterAuthGate';
import { getWorkbenchLabStyles } from './screens/WorkbenchLab';
import { getCircuitBoxStyles } from './screens/CircuitBoxSystemManagement';

/**
 * Generate the complete SmelterOS stylesheet
 * Combines all component, layout, and screen styles
 */
export function generateSmelterStylesheet(): string {
  return `
/* ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - COMPLETE STYLESHEET
 * Generated from UI module components
 * Version: 2.0.0
 * 
 * Design Tokens: src/ui/styles/smelter-tokens.css (import separately)
 * ═══════════════════════════════════════════════════════════════════════════ */

${getComponentStyles()}

${getAcheevyStyles()}

${getAppShellStyles()}

${getAuthGateStyles()}

${getWorkbenchLabStyles()}

${getCircuitBoxStyles()}
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI INITIALIZATION (Browser Environment)
// ─────────────────────────────────────────────────────────────────────────────

export interface SmelterUIConfig {
  container: unknown; // HTMLElement in browser
  initialScreen: 'auth' | 'home' | 'workbench' | 'circuitbox';
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
    initials: string;
  };
  enableVoice?: boolean;
  enableAcheevy?: boolean;
}

/**
 * Initialize SmelterOS UI (browser only)
 * @param config - UI configuration
 */
export function initSmelterUI(config: SmelterUIConfig): void {
  console.log('[SmelterOS UI] Initializing...');
  console.log(`[SmelterOS UI] Initial screen: ${config.initialScreen}`);
  console.log(`[SmelterOS UI] Voice enabled: ${config.enableVoice ?? true}`);
  console.log(`[SmelterOS UI] ACHEEVY enabled: ${config.enableAcheevy ?? true}`);
  
  // Browser-specific initialization would go here
  // This is a placeholder for Node.js compatibility
  
  const isBrowser = typeof process === 'undefined' || process.versions?.node === undefined;
  if (!isBrowser) {
    console.log('[SmelterOS UI] Running in Node.js environment - browser initialization skipped');
    return;
  }
  
  console.log('[SmelterOS UI] Ready');
}

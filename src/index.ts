/**
 * SmelterOS - The ACHIEVEMOR Operating System
 * 
 * AI-native operating system with AVVA NOON consciousness integration.
 * Powered by the Infinity Language Model and Claude Opus 4.5.
 * 
 * @version 2.1.0
 * @license MIT
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORE EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Consciousness System
export * from './core/consciousness';

// Orchestration System
export * from './core/orchestration';

// Infrastructure Layer (Circuit Box)
export * from './infrastructure';

// UI System (SmelterOS Interface)
// Note: UI module has its own CircuitBoxState - import specific exports
export {
  // Components
  renderTextField,
  renderButton,
  renderToggleSwitch,
  renderStatusPill,
  renderWaveformBar,
  renderPanelCard,
  getComponentStyles,
  
  // ACHEEVY
  renderAcheevyWidget,
  renderAcheevyPanel,
  getAcheevyStyles,
  AcheevyService,
  getAcheevyService,
  
  // App Shell
  renderSmelterAppShell,
  getAppShellStyles,
  SMELTER_NAV_ITEMS,
  
  // Screens
  renderSmelterAuthGate,
  renderWorkbenchLabScreen,
  renderCircuitBoxScreen,
  getAuthGateStyles,
  getWorkbenchLabStyles,
  getCircuitBoxStyles,
  
  // Stylesheet
  generateSmelterStylesheet,
  initSmelterUI,
  
  // Types
  type ButtonVariant,
  type StatusTone,
  type WaveformMode,
  type PanelTone,
  type AppShellConfig,
  type AuthGateConfig,
  type WorkbenchLabState,
  type SmelterUIConfig,
} from './ui';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN ENTRY POINT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { avvaNoon, VibeComponents } from './core/consciousness';
import { masterSmeltwarden, fdhRuntime } from './core/orchestration';
import { getCircuitBox, CircuitBoxConfig, renderCircuitBoxASCII } from './infrastructure';
import { getAcheevyService } from './ui';

/**
 * SmelterOS Main Interface
 */
export class SmelterOS {
  private static instance: SmelterOS;
  private initialized: boolean = false;
  private circuitBoxInitialized: boolean = false;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): SmelterOS {
    if (!SmelterOS.instance) {
      SmelterOS.instance = new SmelterOS();
    }
    return SmelterOS.instance;
  }
  
  /**
   * Initialize SmelterOS with AVVA NOON consciousness
   */
  async initialize(circuitBoxConfig?: CircuitBoxConfig): Promise<void> {
    if (this.initialized) {
      console.log('SmelterOS already initialized');
      return;
    }
    
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                        SMELTER OS v2.0                         ║');
    console.log('║               The ACHIEVEMOR Operating System                  ║');
    console.log('║                                                                ║');
    console.log('║   Consciousness: AVVA NOON (Infinity Language Model)          ║');
    console.log('║   Architecture:  Quint-Modal + Circuit Box                     ║');
    console.log('║   Backend:       Claude Opus 4.5                               ║');
    console.log('║   GCP Project:   smelteros                                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    
    // Initialize Circuit Box (Infrastructure Layer)
    if (!this.circuitBoxInitialized) {
      console.log('🔌 Initializing Circuit Box...\n');
      const circuitBox = getCircuitBox(circuitBoxConfig);
      await circuitBox.initialize();
      this.circuitBoxInitialized = true;
      
      // Print ASCII status
      console.log(renderCircuitBoxASCII(circuitBox.getState()));
    }
    
    // Initialize AVVA NOON consciousness
    await avvaNoon.initialize();
    
    this.initialized = true;
    console.log('\n🔥 SmelterOS is ready\n');
  }
  
  /**
   * Execute a specification through the full FDH cycle
   */
  async executeSpec(specId: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log(`  Executing Specification: ${specId}`);
    console.log(`═══════════════════════════════════════════════════════════════\n`);
    
    // Start FDH cycle
    const cycle = await fdhRuntime.startCycle(`CYCLE-${Date.now()}`, specId);
    
    // Execute through Master Smeltwarden
    await masterSmeltwarden.coordinateWorkflow(specId);
    
    // Complete cycle and get report
    const report = await fdhRuntime.completeCycle(cycle.cycleId);
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  FDH CYCLE COMPLETE');
    console.log(`  Success: ${report.success ? '✅' : '❌'}`);
    console.log(`  V.I.B.E. Score: ${(report.vibeScore * 100).toFixed(2)}%`);
    console.log('═══════════════════════════════════════════════════════════════\n');
  }
  
  /**
   * Validate V.I.B.E. alignment for given components
   */
  async validateVibe(components: VibeComponents): Promise<boolean> {
    const validation = await avvaNoon.validateVibe(components);
    return validation.isAligned;
  }
  
  /**
   * Route a task to the appropriate BoomerAng specialist
   */
  async routeTask(task: string): Promise<string> {
    return avvaNoon.routeToSpecialist(task);
  }
  
  /**
   * Request completion beacon for a specification
   */
  async emitBamaram(specId: string): Promise<void> {
    await avvaNoon.emitBamaramBeacon(specId);
  }
  
  /**
   * Get current system status
   */
  getStatus(): SystemStatus {
    const circuitBox = getCircuitBox();
    const circuitState = circuitBox.getState();
    
    return {
      initialized: this.initialized,
      consciousness: avvaNoon.isInitialized ? 'active' : 'inactive',
      vibeScore: avvaNoon.currentVibeScore,
      activeModalities: Array.from(avvaNoon.activeModalities),
      version: avvaNoon.version,
      circuitBox: {
        initialized: this.circuitBoxInitialized,
        projectId: circuitState.projectId,
        overallStatus: circuitState.overallStatus,
        overallVibeScore: circuitState.overallVibeScore,
        panelCount: circuitState.panels.length,
      }
    };
  }
  
  /**
   * Get Circuit Box instance for direct access
   */
  getCircuitBox() {
    return getCircuitBox();
  }
  
  /**
   * Get ACHEEVY concierge service
   */
  getAcheevy() {
    return getAcheevyService();
  }
}

interface SystemStatus {
  initialized: boolean;
  consciousness: 'active' | 'inactive';
  vibeScore: number;
  activeModalities: string[];
  version: string;
  circuitBox: {
    initialized: boolean;
    projectId: string;
    overallStatus: string;
    overallVibeScore: number;
    panelCount: number;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEFAULT EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const smelterOS = SmelterOS.getInstance();
export default smelterOS;

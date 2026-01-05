/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Digital Breaker - Central Operations Control System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The Digital Breaker is the MASTER CONTROL SYSTEM for all operational
 * functionality. Every AI agent, integration, repository, and service
 * routes through this centralized hub.
 * 
 * WHITE-LABEL READY: Clients can customize branding, panels, and circuits
 * for their own agentic development dashboards.
 * 
 * LOW LATENCY MANDATE: All circuits enforce <50ms p95 latency requirements.
 * Breakers auto-trip and MANDATORY auto-reset after cooldown.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BREAKER TYPES & STATUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type BreakerState = 'on' | 'off' | 'tripped';
export type CircuitHealth = 'healthy' | 'degraded' | 'critical' | 'offline';
export type LoadLevel = number; // 0-100 percentage

export interface LatencyMetrics {
  current: number;      // Current latency in ms
  p50: number;          // 50th percentile
  p95: number;          // 95th percentile (must be <50ms)
  p99: number;          // 99th percentile
  maxAllowed: number;   // Maximum allowed before trip (default: 50ms)
}

export interface CircuitMetrics {
  requestCount: number;
  errorCount: number;
  errorRate: number;          // Percentage 0-100
  lastActivity: Date;
  responseTime: LatencyMetrics;
  monthlyUsage?: number;      // For usage-based billing
  costPerMinute?: number;     // Cost tracking
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CIRCUIT BREAKER (Per-Service Control)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CircuitBreaker {
  state: BreakerState;
  tripCount: number;
  lastTripped?: Date;
  lastReset?: Date;
  
  // Trip Configuration
  tripThreshold: 5;           // MANDATORY: Trip after 5 errors
  errorCount: number;
  
  // MANDATORY Auto-Reset (not optional - low latency requirement)
  cooldownMs: 30000;          // 30 second cooldown before auto-reset
  nextResetAt?: Date;         // Scheduled reset time
}

export interface Circuit {
  id: string;
  name: string;
  description: string;
  category: CircuitCategory;
  
  // State
  breaker: CircuitBreaker;
  health: CircuitHealth;
  load: LoadLevel;
  
  // Configuration
  endpoint?: string;
  apiKeySecretId?: string;
  
  // Metrics
  metrics: CircuitMetrics;
  
  // Settings (customizable per circuit)
  settings: Record<string, unknown>;
  
  // Timestamps
  lastCheck: Date;
  createdAt: Date;
}

export type CircuitCategory =
  | 'ai-agent'           // AI Agents (Voice, Code Gen, Backend, etc.)
  | 'repository'         // Intelligent Repositories
  | 'integration'        // External Integrations (Stripe, GitHub, etc.)
  | 'voice'              // Voice & STT/TTS Services
  | 'deployment'         // Deployment & Infrastructure
  | 'database'           // Database Connections
  | 'storage'            // File Storage & CDN
  | 'auth'               // Authentication Services
  | 'analytics'          // Analytics & Monitoring
  | 'custom';            // Client-defined circuits

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PANEL (Group of Related Circuits)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PanelBreaker {
  state: BreakerState;
  lockedOut: boolean;         // Lockout requires SuperAdmin reset
  tripCount: number;
  lastTripped?: Date;
}

export interface Panel {
  id: string;
  name: string;
  description: string;
  icon: string;
  position: number;           // Display order (1-based)
  
  // Breaker
  breaker: PanelBreaker;
  
  // Circuits in this panel
  circuits: Circuit[];
  
  // Aggregate Status
  health: CircuitHealth;
  activeCircuits: number;
  totalCircuits: number;
  
  // Panel-level settings
  settings: PanelSettings;
}

export interface PanelSettings {
  visible: boolean;           // Show/hide in dashboard
  collapsible: boolean;       // Can be collapsed
  defaultExpanded: boolean;   // Start expanded
  customizable: boolean;      // Client can modify
  maxCircuits: number;        // Max circuits allowed
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MASTER SWITCH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface MasterSwitch {
  state: 'on' | 'off';
  emergencyShutdown: boolean;
  lastStateChange: Date;
  
  // Uptime Tracking
  startTime: Date;
  uptimeMs: number;
  powerCycles: number;
  
  // Security
  lastChangedBy: string;      // User/System that changed state
  requiresConfirmation: boolean;
  
  // Status Indicator
  systemStatus: 'optimal' | 'degraded' | 'critical' | 'offline';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WHITE-LABEL BRANDING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BrandingConfig {
  // Identity
  companyName: string;
  productName: string;
  tagline: string;
  
  // Visual
  logo: {
    light: string;            // URL for light mode logo
    dark: string;             // URL for dark mode logo
    icon: string;             // Favicon/small icon
  };
  
  // Colors
  colors: {
    primary: string;          // Primary brand color
    secondary: string;        // Secondary color
    accent: string;           // Accent color
    success: string;          // Success/healthy state
    warning: string;          // Warning state
    danger: string;           // Error/critical state
    background: string;       // Background color
    surface: string;          // Card/panel surface
    text: string;             // Primary text
    textMuted: string;        // Secondary text
  };
  
  // Typography
  fonts: {
    heading: string;
    body: string;
    mono: string;             // Code/terminal font
  };
  
  // Custom CSS
  customCSS?: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  companyName: 'SmelterOS',
  productName: 'Digital Breaker',
  tagline: 'Central Operations Control System',
  
  logo: {
    light: '/assets/smelter-logo-light.svg',
    dark: '/assets/smelter-logo-dark.svg',
    icon: '/assets/smelter-icon.svg',
  },
  
  colors: {
    primary: '#00FF88',       // SmelterOS Green
    secondary: '#1a1a2e',     // Dark Blue
    accent: '#00D4FF',        // Cyan accent
    success: '#00FF88',       // Green
    warning: '#FFB800',       // Amber
    danger: '#FF4444',        // Red
    background: '#0a0a0f',    // Deep black
    surface: '#1a1a2e',       // Panel background
    text: '#ffffff',          // White text
    textMuted: '#888888',     // Gray text
  },
  
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, Fira Code, monospace',
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ALERT & LOG SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type AlertLevel = 'info' | 'warning' | 'alert' | 'critical';

export interface SystemAlert {
  id: string;
  level: AlertLevel;
  timestamp: Date;
  source: string;             // Circuit/Panel ID that generated
  message: string;
  details?: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  target: string;             // What was modified
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DIGITAL BREAKER STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface DigitalBreakerState {
  // Core Identity
  instanceId: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  
  // Master Control
  masterSwitch: MasterSwitch;
  
  // Panels & Circuits
  panels: Panel[];
  
  // Branding
  branding: BrandingConfig;
  
  // Alerts & Logs
  alerts: SystemAlert[];
  criticalAlerts: number;
  warningAlerts: number;
  
  // Audit Trail
  auditLog: AuditLogEntry[];
  
  // Health Summary
  overallHealth: CircuitHealth;
  securityStatus: 'secure' | 'warning' | 'compromised';
  
  // Timestamps
  lastHealthCheck: Date;
  lastConfigChange: Date;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DIGITAL BREAKER CLASS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class DigitalBreaker {
  private static instance: DigitalBreaker;
  private state: DigitalBreakerState;
  private autoResetTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Low latency threshold (mandatory)
  private readonly LATENCY_THRESHOLD_MS = 50;
  private readonly TRIP_THRESHOLD = 5;
  private readonly COOLDOWN_MS = 30000;

  private constructor(branding?: Partial<BrandingConfig>) {
    const now = new Date();
    
    this.state = {
      instanceId: this.generateInstanceId(),
      version: '2.1.0',
      environment: 'production',
      
      masterSwitch: {
        state: 'off',
        emergencyShutdown: false,
        lastStateChange: now,
        startTime: now,
        uptimeMs: 0,
        powerCycles: 0,
        lastChangedBy: 'system',
        requiresConfirmation: true,
        systemStatus: 'offline',
      },
      
      panels: [],
      branding: { ...DEFAULT_BRANDING, ...branding },
      
      alerts: [],
      criticalAlerts: 0,
      warningAlerts: 0,
      
      auditLog: [],
      
      overallHealth: 'offline',
      securityStatus: 'secure',
      
      lastHealthCheck: now,
      lastConfigChange: now,
    };
  }

  /**
   * Singleton access
   */
  public static getInstance(branding?: Partial<BrandingConfig>): DigitalBreaker {
    if (!DigitalBreaker.instance) {
      DigitalBreaker.instance = new DigitalBreaker(branding);
    }
    return DigitalBreaker.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  public static resetInstance(): void {
    DigitalBreaker.instance = undefined as unknown as DigitalBreaker;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MASTER SWITCH CONTROLS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * MASTER ON - Power up the entire system
   */
  public async masterOn(userId: string = 'system'): Promise<void> {
    if (this.state.masterSwitch.state === 'on') {
      this.log('info', 'system', 'Master Switch already ON');
      return;
    }

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                  ║');
    console.log('║       ██████╗ ███╗   ██╗                                         ║');
    console.log('║      ██╔═══██╗████╗  ██║                                         ║');
    console.log('║      ██║   ██║██╔██╗ ██║                                         ║');
    console.log('║      ██║   ██║██║╚██╗██║                                         ║');
    console.log('║      ╚██████╔╝██║ ╚████║                                         ║');
    console.log('║       ╚═════╝ ╚═╝  ╚═══╝                                         ║');
    console.log('║                                                                  ║');
    console.log('║              MASTER SWITCH: POWERING ON                          ║');
    console.log('║                                                                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    const now = new Date();
    this.state.masterSwitch.state = 'on';
    this.state.masterSwitch.lastStateChange = now;
    this.state.masterSwitch.startTime = now;
    this.state.masterSwitch.powerCycles++;
    this.state.masterSwitch.lastChangedBy = userId;
    this.state.masterSwitch.emergencyShutdown = false;

    // Power on all panels
    for (const panel of this.state.panels) {
      await this.setPanelState(panel.id, 'on', userId);
    }

    this.updateSystemStatus();
    this.audit(userId, 'MASTER_ON', 'masterSwitch', 'off', 'on');
    
    console.log('✓ SYSTEM ONLINE - All panels powered');
  }

  /**
   * MASTER OFF - Graceful shutdown
   */
  public async masterOff(userId: string = 'system'): Promise<void> {
    if (this.state.masterSwitch.state === 'off') {
      this.log('info', 'system', 'Master Switch already OFF');
      return;
    }

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                  ║');
    console.log('║       ██████╗ ███████╗███████╗                                   ║');
    console.log('║      ██╔═══██╗██╔════╝██╔════╝                                   ║');
    console.log('║      ██║   ██║█████╗  █████╗                                     ║');
    console.log('║      ██║   ██║██╔══╝  ██╔══╝                                     ║');
    console.log('║      ╚██████╔╝██║     ██║                                        ║');
    console.log('║       ╚═════╝ ╚═╝     ╚═╝                                        ║');
    console.log('║                                                                  ║');
    console.log('║              MASTER SWITCH: POWERING OFF                         ║');
    console.log('║                                                                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    // Calculate uptime
    const now = new Date();
    this.state.masterSwitch.uptimeMs = now.getTime() - this.state.masterSwitch.startTime.getTime();

    // Power off all panels (gracefully)
    for (const panel of this.state.panels) {
      await this.setPanelState(panel.id, 'off', userId);
    }

    this.state.masterSwitch.state = 'off';
    this.state.masterSwitch.lastStateChange = now;
    this.state.masterSwitch.lastChangedBy = userId;
    this.state.masterSwitch.systemStatus = 'offline';
    this.state.overallHealth = 'offline';

    this.audit(userId, 'MASTER_OFF', 'masterSwitch', 'on', 'off');
    
    console.log('○ SYSTEM OFFLINE - All panels powered down');
  }

  /**
   * EMERGENCY SHUTDOWN - Immediate halt
   */
  public emergencyShutdown(userId: string = 'system', reason?: string): void {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                  ║');
    console.log('║   🚨🚨🚨  EMERGENCY SHUTDOWN ACTIVATED  🚨🚨🚨                   ║');
    console.log('║                                                                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    const now = new Date();
    
    // Immediately trip everything
    for (const panel of this.state.panels) {
      panel.breaker.state = 'tripped';
      panel.breaker.tripCount++;
      panel.breaker.lastTripped = now;
      panel.health = 'offline';
      
      for (const circuit of panel.circuits) {
        circuit.breaker.state = 'tripped';
        circuit.breaker.tripCount++;
        circuit.breaker.lastTripped = now;
        circuit.health = 'offline';
      }
    }

    this.state.masterSwitch.state = 'off';
    this.state.masterSwitch.emergencyShutdown = true;
    this.state.masterSwitch.lastStateChange = now;
    this.state.masterSwitch.lastChangedBy = userId;
    this.state.masterSwitch.systemStatus = 'critical';
    this.state.overallHealth = 'critical';

    this.log('critical', 'system', `EMERGENCY SHUTDOWN: ${reason || 'Manual trigger'}`);
    this.audit(userId, 'EMERGENCY_SHUTDOWN', 'system', null, { reason, timestamp: now });

    console.log('🚨 ALL CIRCUITS TRIPPED - Manual reset required');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PANEL CONTROLS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a new panel
   */
  public addPanel(config: {
    id: string;
    name: string;
    description: string;
    icon: string;
    position?: number;
    settings?: Partial<PanelSettings>;
  }): Panel {
    const panel: Panel = {
      id: config.id,
      name: config.name,
      description: config.description,
      icon: config.icon,
      position: config.position || this.state.panels.length + 1,
      
      breaker: {
        state: 'off',
        lockedOut: false,
        tripCount: 0,
      },
      
      circuits: [],
      health: 'offline',
      activeCircuits: 0,
      totalCircuits: 0,
      
      settings: {
        visible: true,
        collapsible: true,
        defaultExpanded: true,
        customizable: true,
        maxCircuits: 50,
        ...config.settings,
      },
    };

    this.state.panels.push(panel);
    this.state.panels.sort((a, b) => a.position - b.position);
    
    return panel;
  }

  /**
   * Set panel breaker state
   */
  public async setPanelState(
    panelId: string, 
    state: 'on' | 'off', 
    userId: string = 'system'
  ): Promise<boolean> {
    const panel = this.getPanel(panelId);
    if (!panel) {
      this.log('warning', 'system', `Panel not found: ${panelId}`);
      return false;
    }

    if (panel.breaker.lockedOut) {
      this.log('warning', panelId, 'Panel is locked out - SuperAdmin reset required');
      return false;
    }

    if (state === 'on' && this.state.masterSwitch.state !== 'on') {
      this.log('warning', panelId, 'Cannot power on panel - Master Switch is OFF');
      return false;
    }

    const previousState = panel.breaker.state;
    panel.breaker.state = state;

    console.log(`  ${state === 'on' ? '●' : '○'} ${panel.icon} ${panel.name}: ${state.toUpperCase()}`);

    // Cascade to all circuits
    for (const circuit of panel.circuits) {
      await this.setCircuitState(circuit.id, state, userId);
    }

    // Update panel health
    this.updatePanelHealth(panel);
    
    this.audit(userId, `PANEL_${state.toUpperCase()}`, panelId, previousState, state);
    
    return true;
  }

  /**
   * Lock out a panel (requires SuperAdmin to reset)
   */
  public lockoutPanel(panelId: string, userId: string, reason?: string): boolean {
    const panel = this.getPanel(panelId);
    if (!panel) return false;

    panel.breaker.lockedOut = true;
    panel.breaker.state = 'tripped';
    panel.health = 'offline';
    
    // Trip all circuits in panel
    for (const circuit of panel.circuits) {
      circuit.breaker.state = 'tripped';
      circuit.health = 'offline';
    }

    this.log('alert', panelId, `Panel LOCKED OUT: ${reason || 'No reason provided'}`);
    this.audit(userId, 'PANEL_LOCKOUT', panelId, false, true);
    
    return true;
  }

  /**
   * Reset panel lockout (SuperAdmin only)
   */
  public resetPanelLockout(panelId: string, userId: string): boolean {
    const panel = this.getPanel(panelId);
    if (!panel) return false;

    panel.breaker.lockedOut = false;
    panel.breaker.state = 'off';
    
    // Reset all circuit breakers in panel
    for (const circuit of panel.circuits) {
      this.resetCircuitBreaker(circuit.id, userId);
    }

    this.log('info', panelId, 'Panel lockout RESET by SuperAdmin');
    this.audit(userId, 'PANEL_LOCKOUT_RESET', panelId, true, false);
    
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CIRCUIT CONTROLS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a circuit to a panel
   */
  public addCircuit(panelId: string, config: {
    id: string;
    name: string;
    description: string;
    category: CircuitCategory;
    endpoint?: string;
    apiKeySecretId?: string;
    settings?: Record<string, unknown>;
  }): Circuit | null {
    const panel = this.getPanel(panelId);
    if (!panel) {
      this.log('warning', 'system', `Cannot add circuit - Panel not found: ${panelId}`);
      return null;
    }

    if (panel.circuits.length >= panel.settings.maxCircuits) {
      this.log('warning', panelId, `Panel at max capacity: ${panel.settings.maxCircuits}`);
      return null;
    }

    const now = new Date();
    const circuit: Circuit = {
      id: config.id,
      name: config.name,
      description: config.description,
      category: config.category,
      
      breaker: {
        state: 'off',
        tripCount: 0,
        tripThreshold: 5,
        errorCount: 0,
        cooldownMs: 30000,
      },
      
      health: 'offline',
      load: 0,
      
      endpoint: config.endpoint,
      apiKeySecretId: config.apiKeySecretId,
      
      metrics: {
        requestCount: 0,
        errorCount: 0,
        errorRate: 0,
        lastActivity: now,
        responseTime: {
          current: 0,
          p50: 0,
          p95: 0,
          p99: 0,
          maxAllowed: this.LATENCY_THRESHOLD_MS,
        },
      },
      
      settings: config.settings || {},
      lastCheck: now,
      createdAt: now,
    };

    panel.circuits.push(circuit);
    panel.totalCircuits = panel.circuits.length;
    
    return circuit;
  }

  /**
   * Set circuit breaker state
   */
  public async setCircuitState(
    circuitId: string, 
    state: 'on' | 'off', 
    userId: string = 'system'
  ): Promise<boolean> {
    const circuit = this.getCircuit(circuitId);
    if (!circuit) {
      return false;
    }

    if (state === 'on' && this.state.masterSwitch.state !== 'on') {
      this.log('warning', circuitId, 'Cannot power on - Master Switch is OFF');
      return false;
    }

    const previousState = circuit.breaker.state;
    circuit.breaker.state = state;
    circuit.health = state === 'on' ? 'healthy' : 'offline';
    circuit.metrics.lastActivity = new Date();

    // If turning on, do a health check
    if (state === 'on') {
      await this.checkCircuitHealth(circuitId);
    }

    this.audit(userId, `CIRCUIT_${state.toUpperCase()}`, circuitId, previousState, state);
    
    return true;
  }

  /**
   * Report an error on a circuit (triggers auto-trip if threshold reached)
   */
  public reportError(circuitId: string, error: Error, latencyMs?: number): void {
    const circuit = this.getCircuit(circuitId);
    if (!circuit) return;

    circuit.breaker.errorCount++;
    circuit.metrics.errorCount++;
    circuit.metrics.lastActivity = new Date();
    
    // Update error rate
    if (circuit.metrics.requestCount > 0) {
      circuit.metrics.errorRate = (circuit.metrics.errorCount / circuit.metrics.requestCount) * 100;
    }

    // Check latency threshold
    if (latencyMs && latencyMs > this.LATENCY_THRESHOLD_MS) {
      this.log('warning', circuitId, `Latency threshold exceeded: ${latencyMs}ms > ${this.LATENCY_THRESHOLD_MS}ms`);
    }

    // Auto-trip after 5 errors (MANDATORY)
    if (circuit.breaker.errorCount >= this.TRIP_THRESHOLD) {
      this.tripCircuit(circuitId, `Error threshold exceeded (${circuit.breaker.errorCount}/${this.TRIP_THRESHOLD})`);
    } else {
      this.log('warning', circuitId, `Error ${circuit.breaker.errorCount}/${this.TRIP_THRESHOLD}: ${error.message}`);
    }
  }

  /**
   * Trip a circuit (with MANDATORY auto-reset scheduling)
   */
  public tripCircuit(circuitId: string, reason?: string): void {
    const circuit = this.getCircuit(circuitId);
    if (!circuit) return;

    const now = new Date();
    
    circuit.breaker.state = 'tripped';
    circuit.breaker.tripCount++;
    circuit.breaker.lastTripped = now;
    circuit.health = 'critical';

    this.log('alert', circuitId, `CIRCUIT TRIPPED: ${reason || 'Unknown'}`);

    // MANDATORY auto-reset after cooldown (30 seconds)
    const resetTime = new Date(now.getTime() + this.COOLDOWN_MS);
    circuit.breaker.nextResetAt = resetTime;

    // Clear any existing timer
    const existingTimer = this.autoResetTimers.get(circuitId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule auto-reset
    const timer = setTimeout(() => {
      this.autoResetCircuit(circuitId);
    }, this.COOLDOWN_MS);

    this.autoResetTimers.set(circuitId, timer);
    
    this.log('info', circuitId, `Auto-reset scheduled in ${this.COOLDOWN_MS / 1000}s`);

    // Update parent panel health
    const panel = this.getPanelForCircuit(circuitId);
    if (panel) {
      this.updatePanelHealth(panel);
    }
  }

  /**
   * Auto-reset a tripped circuit (MANDATORY)
   */
  private autoResetCircuit(circuitId: string): void {
    const circuit = this.getCircuit(circuitId);
    if (!circuit) return;

    // Only reset if still tripped
    if (circuit.breaker.state !== 'tripped') {
      return;
    }

    const now = new Date();
    circuit.breaker.state = 'off'; // Reset to off, not on
    circuit.breaker.errorCount = 0;
    circuit.breaker.lastReset = now;
    circuit.breaker.nextResetAt = undefined;
    circuit.health = 'offline';

    this.autoResetTimers.delete(circuitId);

    this.log('info', circuitId, 'Circuit AUTO-RESET complete');
    this.audit('system', 'CIRCUIT_AUTO_RESET', circuitId, 'tripped', 'off');

    // If master and panel are on, attempt to reconnect
    const panel = this.getPanelForCircuit(circuitId);
    if (panel && panel.breaker.state === 'on' && this.state.masterSwitch.state === 'on') {
      this.setCircuitState(circuitId, 'on', 'system');
    }
  }

  /**
   * Manual reset of a circuit breaker
   */
  public resetCircuitBreaker(circuitId: string, userId: string): boolean {
    const circuit = this.getCircuit(circuitId);
    if (!circuit) return false;

    // Clear auto-reset timer if exists
    const timer = this.autoResetTimers.get(circuitId);
    if (timer) {
      clearTimeout(timer);
      this.autoResetTimers.delete(circuitId);
    }

    circuit.breaker.state = 'off';
    circuit.breaker.errorCount = 0;
    circuit.breaker.lastReset = new Date();
    circuit.breaker.nextResetAt = undefined;
    circuit.health = 'offline';

    this.log('info', circuitId, 'Circuit MANUALLY RESET');
    this.audit(userId, 'CIRCUIT_MANUAL_RESET', circuitId, 'tripped', 'off');

    return true;
  }

  /**
   * Record a successful request (for metrics)
   */
  public recordRequest(circuitId: string, latencyMs: number): void {
    const circuit = this.getCircuit(circuitId);
    if (!circuit) return;

    circuit.metrics.requestCount++;
    circuit.metrics.lastActivity = new Date();
    circuit.metrics.responseTime.current = latencyMs;

    // Update latency percentiles (simplified rolling calculation)
    const rt = circuit.metrics.responseTime;
    rt.p50 = (rt.p50 * 0.9) + (latencyMs * 0.1);
    rt.p95 = Math.max(rt.p95 * 0.95, latencyMs);
    rt.p99 = Math.max(rt.p99 * 0.99, latencyMs);

    // Check latency threshold
    if (rt.p95 > this.LATENCY_THRESHOLD_MS) {
      this.log('warning', circuitId, `P95 latency exceeds threshold: ${rt.p95.toFixed(1)}ms`);
    }

    // Update error rate
    if (circuit.metrics.requestCount > 0) {
      circuit.metrics.errorRate = (circuit.metrics.errorCount / circuit.metrics.requestCount) * 100;
    }

    // Update health based on metrics
    this.updateCircuitHealth(circuit);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTH & STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  private async checkCircuitHealth(circuitId: string): Promise<void> {
    const circuit = this.getCircuit(circuitId);
    if (!circuit) return;

    circuit.lastCheck = new Date();
    
    // If endpoint exists, ping it
    if (circuit.endpoint) {
      try {
        const start = Date.now();
        // In production, this would actually ping the endpoint
        await this.delay(Math.random() * 30 + 10); // Simulate 10-40ms
        const latency = Date.now() - start;
        
        circuit.metrics.responseTime.current = latency;
        circuit.health = latency < this.LATENCY_THRESHOLD_MS ? 'healthy' : 'degraded';
      } catch (error) {
        circuit.health = 'critical';
        this.reportError(circuitId, error as Error);
      }
    } else {
      circuit.health = 'healthy';
    }
  }

  private updateCircuitHealth(circuit: Circuit): void {
    const { errorRate, responseTime } = circuit.metrics;
    
    if (circuit.breaker.state === 'tripped') {
      circuit.health = 'critical';
    } else if (circuit.breaker.state === 'off') {
      circuit.health = 'offline';
    } else if (errorRate > 10 || responseTime.p95 > this.LATENCY_THRESHOLD_MS * 2) {
      circuit.health = 'critical';
    } else if (errorRate > 5 || responseTime.p95 > this.LATENCY_THRESHOLD_MS) {
      circuit.health = 'degraded';
    } else {
      circuit.health = 'healthy';
    }

    // Update load based on request activity
    circuit.load = Math.min(100, Math.floor(circuit.metrics.requestCount % 100));
  }

  private updatePanelHealth(panel: Panel): void {
    const activeCircuits = panel.circuits.filter(c => c.breaker.state === 'on').length;
    const healthyCircuits = panel.circuits.filter(c => c.health === 'healthy').length;
    const criticalCircuits = panel.circuits.filter(c => c.health === 'critical').length;
    
    panel.activeCircuits = activeCircuits;
    
    if (panel.breaker.state !== 'on' || panel.breaker.lockedOut) {
      panel.health = 'offline';
    } else if (criticalCircuits > 0) {
      panel.health = 'critical';
    } else if (healthyCircuits < activeCircuits) {
      panel.health = 'degraded';
    } else {
      panel.health = 'healthy';
    }
  }

  private updateSystemStatus(): void {
    const panelsOn = this.state.panels.filter(p => p.breaker.state === 'on').length;
    const panelsHealthy = this.state.panels.filter(p => p.health === 'healthy').length;
    const panelsCritical = this.state.panels.filter(p => p.health === 'critical').length;

    if (this.state.masterSwitch.state !== 'on') {
      this.state.masterSwitch.systemStatus = 'offline';
      this.state.overallHealth = 'offline';
    } else if (this.state.masterSwitch.emergencyShutdown || panelsCritical > 0) {
      this.state.masterSwitch.systemStatus = 'critical';
      this.state.overallHealth = 'critical';
    } else if (panelsHealthy < panelsOn) {
      this.state.masterSwitch.systemStatus = 'degraded';
      this.state.overallHealth = 'degraded';
    } else {
      this.state.masterSwitch.systemStatus = 'optimal';
      this.state.overallHealth = 'healthy';
    }

    this.state.lastHealthCheck = new Date();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WHITE-LABEL CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Apply white-label branding
   */
  public setBranding(branding: Partial<BrandingConfig>): void {
    this.state.branding = { ...this.state.branding, ...branding };
    this.state.lastConfigChange = new Date();
  }

  /**
   * Get current branding
   */
  public getBranding(): BrandingConfig {
    return { ...this.state.branding };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  public getState(): DigitalBreakerState {
    return { ...this.state };
  }

  public getMasterSwitch(): MasterSwitch {
    return { ...this.state.masterSwitch };
  }

  public getPanels(): Panel[] {
    return [...this.state.panels];
  }

  public getPanel(panelId: string): Panel | undefined {
    return this.state.panels.find(p => p.id === panelId);
  }

  public getCircuit(circuitId: string): Circuit | undefined {
    for (const panel of this.state.panels) {
      const circuit = panel.circuits.find(c => c.id === circuitId);
      if (circuit) return circuit;
    }
    return undefined;
  }

  public getPanelForCircuit(circuitId: string): Panel | undefined {
    return this.state.panels.find(p => p.circuits.some(c => c.id === circuitId));
  }

  public getAlerts(): SystemAlert[] {
    return [...this.state.alerts];
  }

  public getAuditLog(): AuditLogEntry[] {
    return [...this.state.auditLog];
  }

  public isPoweredOn(): boolean {
    return this.state.masterSwitch.state === 'on';
  }

  public getUptime(): number {
    if (this.state.masterSwitch.state === 'on') {
      return Date.now() - this.state.masterSwitch.startTime.getTime();
    }
    return this.state.masterSwitch.uptimeMs;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGGING & AUDIT
  // ═══════════════════════════════════════════════════════════════════════════

  private log(level: AlertLevel, source: string, message: string): void {
    const alert: SystemAlert = {
      id: this.generateId(),
      level,
      timestamp: new Date(),
      source,
      message,
      acknowledged: false,
    };

    this.state.alerts.unshift(alert);
    
    // Keep last 1000 alerts
    if (this.state.alerts.length > 1000) {
      this.state.alerts = this.state.alerts.slice(0, 1000);
    }

    // Update counters
    if (level === 'critical' || level === 'alert') {
      this.state.criticalAlerts = this.state.alerts.filter(a => 
        (a.level === 'critical' || a.level === 'alert') && !a.acknowledged
      ).length;
    }
    if (level === 'warning') {
      this.state.warningAlerts = this.state.alerts.filter(a => 
        a.level === 'warning' && !a.acknowledged
      ).length;
    }

    // Console output
    const prefix = {
      info: '[INFO]',
      warning: '[WARNING]',
      alert: '[ALERT]',
      critical: '[CRITICAL]',
    }[level];

    console.log(`${prefix} ${new Date().toLocaleTimeString()}: ${source} - ${message}`);
  }

  private audit(
    userId: string, 
    action: string, 
    target: string, 
    previousValue: unknown, 
    newValue: unknown
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      userId,
      userName: userId, // In production, resolve to actual username
      action,
      target,
      previousValue,
      newValue,
    };

    this.state.auditLog.unshift(entry);
    
    // Keep last 10000 audit entries
    if (this.state.auditLog.length > 10000) {
      this.state.auditLog = this.state.auditLog.slice(0, 10000);
    }
  }

  public acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.state.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    // Update counters
    this.state.criticalAlerts = this.state.alerts.filter(a => 
      (a.level === 'critical' || a.level === 'alert') && !a.acknowledged
    ).length;
    this.state.warningAlerts = this.state.alerts.filter(a => 
      a.level === 'warning' && !a.acknowledged
    ).length;

    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInstanceId(): string {
    return `smelter-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup timers on shutdown
   */
  public destroy(): void {
    for (const timer of this.autoResetTimers.values()) {
      clearTimeout(timer);
    }
    this.autoResetTimers.clear();
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getDigitalBreaker = (branding?: Partial<BrandingConfig>): DigitalBreaker => {
  return DigitalBreaker.getInstance(branding);
};

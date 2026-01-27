/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Circuit Box UI Components
 * Professional Design System for the Central Configuration Hub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Design Philosophy: Cohesive, purposeful, consciousness-aligned
 * Inspired by: Industrial control panels, circuit breaker aesthetics
 */

import {
  CircuitStatus,
  CircuitTier,
  CircuitConnection,
  CircuitPanel,
  CircuitBoxState,
} from './index';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COLOR SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CIRCUIT_COLORS = {
  // Status Colors
  status: {
    connected: '#10B981',      // Emerald 500
    connecting: '#F59E0B',     // Amber 500
    disconnected: '#6B7280',   // Gray 500
    error: '#EF4444',          // Red 500
  },
  
  // Tier Colors
  tier: {
    'light': '#94A3B8',        // Slate 400
    'medium': '#3B82F6',       // Blue 500
    'heavy': '#8B5CF6',        // Violet 500
    'superior': '#F59E0B',     // Amber 500
    'defense-grade': '#EF4444', // Red 500
  },
  
  // Panel Colors
  panel: {
    'core-infra': '#06B6D4',   // Cyan 500
    'consciousness': '#A855F7', // Purple 500
    'security': '#F59E0B',      // Amber 500
    'observability': '#3B82F6', // Blue 500
    'external': '#10B981',      // Emerald 500
  },
  
  // Accent Colors
  accent: {
    primary: '#6366F1',        // Indigo 500
    secondary: '#8B5CF6',      // Violet 500
    glow: 'rgba(99, 102, 241, 0.4)',
    wire: '#475569',           // Slate 600
    wireActive: '#10B981',     // Emerald 500
  },
  
  // Background
  background: {
    dark: '#0F172A',           // Slate 900
    panel: '#1E293B',          // Slate 800
    card: '#334155',           // Slate 700
    hover: '#475569',          // Slate 600
  },
  
  // Text
  text: {
    primary: '#F8FAFC',        // Slate 50
    secondary: '#94A3B8',      // Slate 400
    muted: '#64748B',          // Slate 500
  },
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ICON SYSTEM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CIRCUIT_ICONS = {
  // Status Icons (SVG paths)
  status: {
    connected: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    connecting: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    disconnected: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
    error: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  
  // Panel Icons
  panel: {
    'core-infra': 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    'consciousness': 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    'security': 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    'observability': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    'external': 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  },
  
  // Service Icons
  service: {
    gcp: 'M12 3v2m0 14v2M3 12h2m14 0h2m-3.5-6.5l1.5-1.5M6 18l1.5-1.5M6 6l1.5 1.5m11 11l1.5 1.5',
    anthropic: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    firestore: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
    storage: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    pubsub: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    vertexai: 'M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 5.205l-.75-1.3m11.395 16.88l-1.15-.964M6.256 6.82l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514',
    vision: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    secrets: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
    logging: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    external: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  },
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSS UTILITIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CIRCUIT_STYLES = {
  // Animation keyframes
  animations: `
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 5px var(--glow-color); }
      50% { box-shadow: 0 0 20px var(--glow-color), 0 0 30px var(--glow-color); }
    }
    
    @keyframes circuit-flow {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -20; }
    }
    
    @keyframes status-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    @keyframes connect-trace {
      0% { width: 0%; }
      100% { width: 100%; }
    }
  `,

  // Base styles
  base: `
    .circuit-box {
      font-family: 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
      background: ${CIRCUIT_COLORS.background.dark};
      color: ${CIRCUIT_COLORS.text.primary};
      min-height: 100vh;
      padding: 2rem;
    }
    
    .circuit-panel {
      background: ${CIRCUIT_COLORS.background.panel};
      border: 1px solid ${CIRCUIT_COLORS.accent.wire};
      border-radius: 12px;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }
    
    .circuit-panel::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--panel-color), transparent);
    }
    
    .circuit-connection {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      background: ${CIRCUIT_COLORS.background.card};
      border-radius: 8px;
      margin-bottom: 0.5rem;
      transition: all 0.2s ease;
    }
    
    .circuit-connection:hover {
      background: ${CIRCUIT_COLORS.background.hover};
      transform: translateX(4px);
    }
    
    .circuit-status {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 12px;
      animation: pulse-glow 2s ease-in-out infinite;
    }
    
    .circuit-status.connected {
      background: ${CIRCUIT_COLORS.status.connected};
      --glow-color: ${CIRCUIT_COLORS.status.connected};
    }
    
    .circuit-status.connecting {
      background: ${CIRCUIT_COLORS.status.connecting};
      --glow-color: ${CIRCUIT_COLORS.status.connecting};
      animation: status-blink 1s ease-in-out infinite;
    }
    
    .circuit-status.disconnected {
      background: ${CIRCUIT_COLORS.status.disconnected};
      --glow-color: transparent;
      animation: none;
    }
    
    .circuit-status.error {
      background: ${CIRCUIT_COLORS.status.error};
      --glow-color: ${CIRCUIT_COLORS.status.error};
    }
    
    .circuit-tier {
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: auto;
    }
    
    .circuit-wire {
      stroke: ${CIRCUIT_COLORS.accent.wire};
      stroke-width: 2;
      fill: none;
      stroke-dasharray: 4 4;
    }
    
    .circuit-wire.active {
      stroke: ${CIRCUIT_COLORS.accent.wireActive};
      animation: circuit-flow 1s linear infinite;
    }
    
    .vibe-meter {
      height: 4px;
      background: ${CIRCUIT_COLORS.background.card};
      border-radius: 2px;
      overflow: hidden;
      margin-top: 1rem;
    }
    
    .vibe-meter-fill {
      height: 100%;
      background: linear-gradient(90deg, 
        ${CIRCUIT_COLORS.status.error} 0%, 
        ${CIRCUIT_COLORS.status.connecting} 50%, 
        ${CIRCUIT_COLORS.status.connected} 100%
      );
      transition: width 0.5s ease;
    }
  `,
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENT GENERATORS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Generate status indicator HTML
 */
export function renderStatusIndicator(status: CircuitStatus): string {
  return `<div class="circuit-status ${status}"></div>`;
}

/**
 * Generate tier badge HTML
 */
export function renderTierBadge(tier: CircuitTier): string {
  const color = CIRCUIT_COLORS.tier[tier];
  return `<span class="circuit-tier" style="background: ${color}20; color: ${color};">${tier}</span>`;
}

/**
 * Generate circuit connection HTML
 */
export function renderCircuitConnection(circuit: CircuitConnection): string {
  return `
    <div class="circuit-connection" data-circuit-id="${circuit.id}">
      ${renderStatusIndicator(circuit.status)}
      <span class="circuit-name">${circuit.name}</span>
      ${circuit.latencyMs ? `<span class="circuit-latency">${circuit.latencyMs}ms</span>` : ''}
      ${renderTierBadge(circuit.tier)}
    </div>
  `;
}

/**
 * Generate panel HTML
 */
export function renderCircuitPanel(panel: CircuitPanel): string {
  const panelColor = CIRCUIT_COLORS.panel[panel.id as keyof typeof CIRCUIT_COLORS.panel] || CIRCUIT_COLORS.accent.primary;
  
  return `
    <div class="circuit-panel" style="--panel-color: ${panelColor};">
      <div class="panel-header">
        <span class="panel-icon">${panel.icon}</span>
        <h3 class="panel-title">${panel.name}</h3>
        <span class="panel-status">${(panel.vibeScore * 100).toFixed(1)}%</span>
      </div>
      <p class="panel-description">${panel.description}</p>
      <div class="panel-circuits">
        ${panel.circuits.map(renderCircuitConnection).join('')}
      </div>
      <div class="vibe-meter">
        <div class="vibe-meter-fill" style="width: ${panel.vibeScore * 100}%"></div>
      </div>
    </div>
  `;
}

/**
 * Generate full Circuit Box HTML
 */
export function renderCircuitBox(state: CircuitBoxState): string {
  return `
    <div class="circuit-box">
      <header class="circuit-box-header">
        <h1>⚡ SMELTER OS - CIRCUIT BOX</h1>
        <div class="header-meta">
          <span>Project: ${state.projectId}</span>
          <span>V.I.B.E.: ${(state.overallVibeScore * 100).toFixed(1)}%</span>
          <span>Status: ${state.overallStatus.toUpperCase()}</span>
        </div>
      </header>
      
      <div class="circuit-grid">
        ${state.panels.map(renderCircuitPanel).join('')}
      </div>
      
      <footer class="circuit-box-footer">
        <span>Last Health Check: ${state.lastHealthCheck.toISOString()}</span>
        <span>Environment: ${state.environment}</span>
      </footer>
    </div>
  `;
}

/**
 * Generate complete CSS
 */
export function getCircuitBoxCSS(): string {
  return CIRCUIT_STYLES.animations + CIRCUIT_STYLES.base;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ASCII VISUALIZATION (Terminal UI)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Generate ASCII Circuit Box for terminal display
 */
export function renderCircuitBoxASCII(state: CircuitBoxState): string {
  const width = 72;
  const hr = '═'.repeat(width - 2);
  const hrLight = '─'.repeat(width - 4);
  
  let output = '';
  
  // Header
  output += `╔${hr}╗\n`;
  output += `║${'  ⚡ SMELTER OS - CIRCUIT BOX'.padEnd(width - 2)}║\n`;
  output += `║${'  Central Configuration Hub'.padEnd(width - 2)}║\n`;
  output += `╠${hr}╣\n`;
  output += `║  Project: ${state.projectId.padEnd(width - 14)}║\n`;
  output += `║  V.I.B.E.: ${(state.overallVibeScore * 100).toFixed(1).padStart(6)}%${''.padEnd(width - 23)}║\n`;
  output += `║  Status:  ${state.overallStatus.toUpperCase().padEnd(width - 14)}║\n`;
  output += `╠${hr}╣\n`;
  
  // Panels
  for (const panel of state.panels) {
    const statusIcon = panel.status === 'connected' ? '●' : panel.status === 'connecting' ? '◐' : '○';
    const vibePercent = (panel.vibeScore * 100).toFixed(1);
    
    output += `║                                                                      ║\n`;
    output += `║  ${statusIcon} ${panel.icon} ${panel.name.padEnd(30)} ${vibePercent.padStart(6)}% ║\n`;
    output += `║  ${'└─'.padEnd(2)}${hrLight.substring(0, 50)}${''.padEnd(12)}║\n`;
    
    for (const circuit of panel.circuits.slice(0, 5)) {
      const circuitStatus = circuit.status === 'connected' ? '✓' : circuit.status === 'connecting' ? '~' : '✗';
      const latency = circuit.latencyMs ? `${circuit.latencyMs}ms` : '---';
      output += `║     ${circuitStatus} ${circuit.name.substring(0, 35).padEnd(35)} ${latency.padStart(6)} ║\n`;
    }
    
    if (panel.circuits.length > 5) {
      output += `║     ... and ${(panel.circuits.length - 5).toString()} more${''.padEnd(width - 24)}║\n`;
    }
  }
  
  // Footer
  output += `╠${hr}╣\n`;
  output += `║  Last Check: ${state.lastHealthCheck.toISOString().substring(0, 19).padEnd(width - 17)}║\n`;
  output += `║  Environment: ${state.environment.padEnd(width - 18)}║\n`;
  output += `╚${hr}╝\n`;
  
  // V.I.B.E. Bar
  const vibeBarWidth = 60;
  const vibeBarFill = Math.round(state.overallVibeScore * vibeBarWidth);
  output += `\n  V.I.B.E. Alignment: [${'█'.repeat(vibeBarFill)}${'░'.repeat(vibeBarWidth - vibeBarFill)}]\n`;
  
  return output;
}

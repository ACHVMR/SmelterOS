/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Ingot Visualization
 * SSR HTML Renderer for JARVIS-like Transparency UI
 * Endpoint: /ingot/{id}
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ToolIngot, IngotExecutionState, ToolExecutionState } from './ingot-assembler';
import { ToolProfile } from './roster';

// =============================================================================
// VISUALIZATION TYPES
// =============================================================================

export interface IngotVisualization {
  ingotId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  tools: ToolVisualization[];
  wiring: string;
  progress: number;
  estimatedTimeRemaining?: number;
  createdAt: string;
}

export interface ToolVisualization {
  id: string;
  name: string;
  visualName: string;
  iconUrl: string;
  status: 'pending' | 'loading' | 'running' | 'completed' | 'failed' | 'skipped';
  vertical: string;
  animationClass: string;
  progress?: number;
  error?: string;
}

// =============================================================================
// ICON RESOLVER
// =============================================================================

const DEFAULT_ICONS: Record<string, string> = {
  vision: '👁️',
  audio: '🎵',
  code: '💻',
  data: '📊',
  social: '🌐',
  finance: '💰',
  research: '🔍',
  security: '🔒',
  system: '⚙️',
  creative: '🎨',
};

function resolveIconUrl(tool: ToolProfile): string {
  if (tool.iconUrl) return tool.iconUrl;
  if (tool.githubRepo) {
    return `https://github.com/${tool.githubRepo}/raw/main/icon.svg`;
  }
  // Return emoji as fallback (rendered as SVG on client)
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${DEFAULT_ICONS[tool.vertical] || '🔧'}</text></svg>`;
}

function getAnimationClass(status: ToolExecutionState['status']): string {
  switch (status) {
    case 'loading': return 'pulse';
    case 'running': return 'spin';
    case 'completed': return 'glow-success';
    case 'failed': return 'glow-error';
    case 'skipped': return 'fade';
    default: return '';
  }
}

function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    pending: 'Waiting...',
    loading: 'Loading...',
    running: 'Processing...',
    completed: 'Complete',
    failed: 'Failed',
    skipped: 'Skipped',
  };
  return statusTexts[status] || status;
}

// =============================================================================
// VISUALIZATION BUILDER
// =============================================================================

export function buildVisualization(
  ingot: ToolIngot,
  state: IngotExecutionState | null
): IngotVisualization {
  const toolViz: ToolVisualization[] = ingot.tools.map(tool => {
    const toolState = state?.toolStates.get(tool.toolId);
    const status = toolState?.status || 'pending';

    return {
      id: tool.toolId,
      name: tool.name,
      visualName: tool.visualName,
      iconUrl: resolveIconUrl(tool),
      status,
      vertical: tool.vertical,
      animationClass: getAnimationClass(status),
      error: toolState?.error,
    };
  });

  // Calculate overall progress
  const completedCount = toolViz.filter(t => t.status === 'completed' || t.status === 'skipped').length;
  const progress = Math.round((completedCount / toolViz.length) * 100);

  // Determine overall status
  let status: IngotVisualization['status'] = 'pending';
  if (state) {
    if (toolViz.every(t => t.status === 'completed' || t.status === 'skipped')) {
      status = 'completed';
    } else if (toolViz.some(t => t.status === 'failed')) {
      status = 'failed';
    } else if (toolViz.some(t => t.status === 'loading' || t.status === 'running')) {
      status = 'running';
    }
  }

  return {
    ingotId: ingot.ingotId,
    status,
    tools: toolViz,
    wiring: ingot.wiring,
    progress,
    estimatedTimeRemaining: status === 'running' 
      ? Math.round(ingot.estimatedTimeMs * (1 - progress / 100))
      : undefined,
    createdAt: ingot.createdAt,
  };
}

// =============================================================================
// HTML RENDERER (SSR)
// =============================================================================

export function renderIngotHTML(viz: IngotVisualization): string {
  const toolCards = viz.tools.map(tool => `
    <div class="tool-card ${tool.animationClass}" data-status="${tool.status}">
      <div class="tool-icon">
        <img src="${tool.iconUrl}" alt="${tool.visualName}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><text y=\\'.9em\\' font-size=\\'90\\'>🔧</text></svg>'" />
      </div>
      <div class="tool-info">
        <span class="tool-name">${tool.visualName}</span>
        <span class="tool-status ${tool.status}">${getStatusText(tool.status)}</span>
      </div>
      ${tool.error ? `<div class="tool-error">${tool.error}</div>` : ''}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ingot: ${viz.ingotId}</title>
  <style>
    :root {
      --bg-primary: #0a0a0f;
      --bg-secondary: #12121a;
      --accent-blue: #00d4ff;
      --accent-purple: #8b5cf6;
      --accent-green: #10b981;
      --accent-red: #ef4444;
      --text-primary: #ffffff;
      --text-secondary: #9ca3af;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      padding: 2rem;
    }

    .ingot-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .ingot-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #333;
    }

    .ingot-title {
      font-size: 1.5rem;
      font-weight: 600;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .ingot-status {
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .ingot-status.running { background: rgba(0, 212, 255, 0.2); color: var(--accent-blue); }
    .ingot-status.completed { background: rgba(16, 185, 129, 0.2); color: var(--accent-green); }
    .ingot-status.failed { background: rgba(239, 68, 68, 0.2); color: var(--accent-red); }
    .ingot-status.pending { background: rgba(156, 163, 175, 0.2); color: var(--text-secondary); }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
      transition: width 0.5s ease;
    }

    .ingot-process {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }

    .tool-card {
      background: var(--bg-secondary);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;
      border: 1px solid transparent;
    }

    .tool-card[data-status="running"],
    .tool-card[data-status="loading"] {
      border-color: var(--accent-blue);
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
    }

    .tool-card[data-status="completed"] {
      border-color: var(--accent-green);
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
    }

    .tool-card[data-status="failed"] {
      border-color: var(--accent-red);
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
    }

    .tool-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tool-icon img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .tool-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .tool-name {
      font-weight: 600;
      font-size: 1rem;
    }

    .tool-status {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .tool-status.pending { color: var(--text-secondary); }
    .tool-status.loading { color: var(--accent-blue); }
    .tool-status.running { color: var(--accent-blue); }
    .tool-status.completed { color: var(--accent-green); }
    .tool-status.failed { color: var(--accent-red); }
    .tool-status.skipped { color: var(--text-secondary); opacity: 0.6; }

    .tool-error {
      font-size: 0.75rem;
      color: var(--accent-red);
      text-align: center;
      margin-top: 0.5rem;
    }

    /* Animations */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
      50% { box-shadow: 0 0 40px rgba(0, 212, 255, 0.6); }
    }

    .pulse { animation: pulse 2s ease-in-out infinite; }
    .spin .tool-icon { animation: spin 1s linear infinite; }
    .glow-success { animation: glow 2s ease-in-out infinite; }

    .wiring-info {
      margin-top: 2rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .wiring-info code {
      color: var(--accent-purple);
      background: rgba(139, 92, 246, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="ingot-container">
    <div class="ingot-header">
      <h1 class="ingot-title">Processing Ingot</h1>
      <span class="ingot-status ${viz.status}">${viz.status}</span>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" style="width: ${viz.progress}%"></div>
    </div>

    <div class="ingot-process glow">
      ${toolCards}
    </div>

    <div class="wiring-info">
      <p>Wiring Mode: <code>${viz.wiring}</code> | Tools: <code>${viz.tools.length}</code> | Progress: <code>${viz.progress}%</code></p>
      ${viz.estimatedTimeRemaining ? `<p>Estimated Time Remaining: <code>${Math.round(viz.estimatedTimeRemaining / 1000)}s</code></p>` : ''}
    </div>
  </div>

  <script>
    // Auto-refresh while running
    ${viz.status === 'running' || viz.status === 'pending' ? `
      setTimeout(() => location.reload(), 2000);
    ` : ''}
  </script>
</body>
</html>`;
}

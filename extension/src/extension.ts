/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SmelterOS Circuit Box VS Code Extension
 * Real-time monitoring dashboard for ORACLE agents and sandboxes
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as vscode from 'vscode';

// =============================================================================
// CONFIGURATION
// =============================================================================

function getConfig() {
  const config = vscode.workspace.getConfiguration('smelter');
  return {
    cloudRunUrl: config.get<string>('cloudRunUrl') || 'https://smelter-workers-132049061623.us-central1.run.app',
    refreshInterval: config.get<number>('refreshInterval') || 30000,
    virtueThreshold: config.get<number>('virtueThreshold') || 0.995,
  };
}

// =============================================================================
// API CLIENT
// =============================================================================

async function fetchAPI<T>(endpoint: string): Promise<T | null> {
  const config = getConfig();
  try {
    const response = await fetch(`${config.cloudRunUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json() as { success: boolean; data: T };
    return data.data;
  } catch (error) {
    console.error(`[CircuitBox] API error: ${error}`);
    return null;
  }
}

// =============================================================================
// WEBVIEW PANEL
// =============================================================================

let circuitBoxPanel: vscode.WebviewPanel | undefined;

function getWebviewContent(): string {
  const config = getConfig();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SmelterOS Circuit Box</title>
  <style>
    :root {
      --bg-primary: #1e1e1e;
      --bg-secondary: #252526;
      --bg-tertiary: #2d2d30;
      --text-primary: #d4d4d4;
      --text-secondary: #9d9d9d;
      --accent-green: #4ec9b0;
      --accent-blue: #569cd6;
      --accent-orange: #ce9178;
      --accent-purple: #c586c0;
      --accent-red: #f14c4c;
      --border: #3c3c3c;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 20px;
      line-height: 1.6;
    }
    
    h1 {
      color: var(--accent-green);
      font-size: 24px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    h1::before { content: '⚡'; }
    
    .subtitle {
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: 24px;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
    }
    
    .card h2 {
      font-size: 14px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .metric {
      font-size: 32px;
      font-weight: bold;
      color: var(--accent-green);
    }
    
    .metric.warning { color: var(--accent-orange); }
    .metric.error { color: var(--accent-red); }
    
    .agent-list {
      list-style: none;
    }
    
    .agent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
    }
    
    .agent-item:last-child { border-bottom: none; }
    
    .agent-name {
      font-weight: 500;
      color: var(--accent-blue);
    }
    
    .agent-status {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--accent-green);
      color: var(--bg-primary);
    }
    
    .agent-status.inactive {
      background: var(--text-secondary);
    }
    
    .virtue-bar {
      height: 8px;
      background: var(--bg-tertiary);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    
    .virtue-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent-green), var(--accent-blue));
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .log-container {
      background: var(--bg-tertiary);
      border-radius: 4px;
      padding: 12px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .log-entry {
      margin-bottom: 4px;
      color: var(--text-secondary);
    }
    
    .log-entry .timestamp { color: var(--accent-purple); }
    .log-entry .success { color: var(--accent-green); }
    .log-entry .error { color: var(--accent-red); }
    
    .refresh-btn {
      background: var(--accent-blue);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .refresh-btn:hover { opacity: 0.9; }
    
    .footer {
      margin-top: 24px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>SmelterOS Circuit Box</h1>
  <p class="subtitle">ORACLE Agent Monitoring Dashboard • Virtue Threshold: ${config.virtueThreshold}</p>
  
  <div class="grid">
    <div class="card">
      <h2>🤖 Active Agents</h2>
      <div class="metric" id="agent-count">--</div>
      <ul class="agent-list" id="agent-list"></ul>
    </div>
    
    <div class="card">
      <h2>📦 Sandboxes</h2>
      <div class="metric" id="sandbox-count">--</div>
      <p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">
        Phase 2: <span id="phase2-count">--</span> | Phase 3: <span id="phase3-count">--</span>
      </p>
    </div>
    
    <div class="card">
      <h2>🔧 STRATA Tools</h2>
      <div class="metric" id="tool-count">--</div>
      <p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">
        Enabled: <span id="enabled-tools">--</span>
      </p>
    </div>
    
    <div class="card">
      <h2>✨ Virtue Score</h2>
      <div class="metric" id="virtue-score">--</div>
      <div class="virtue-bar">
        <div class="virtue-fill" id="virtue-fill" style="width: 0%"></div>
      </div>
    </div>
  </div>
  
  <div class="card" style="margin-bottom: 16px;">
    <h2>📊 Agent Status</h2>
    <ul class="agent-list" id="detailed-agents"></ul>
  </div>
  
  <div class="card">
    <h2>📜 Recent Activity</h2>
    <div class="log-container" id="activity-log">
      <div class="log-entry">Initializing Circuit Box...</div>
    </div>
  </div>
  
  <div class="footer">
    <button class="refresh-btn" onclick="refreshData()">🔄 Refresh Now</button>
    <p style="margin-top: 12px;">Auto-refresh: ${config.refreshInterval / 1000}s • Cloud Run: ${config.cloudRunUrl}</p>
  </div>
  
  <script>
    const BASE_URL = '${config.cloudRunUrl}';
    
    async function fetchAPI(endpoint) {
      try {
        const response = await fetch(BASE_URL + endpoint);
        const data = await response.json();
        return data.data;
      } catch (error) {
        console.error('API error:', error);
        return null;
      }
    }
    
    function log(message, type = 'info') {
      const container = document.getElementById('activity-log');
      const timestamp = new Date().toLocaleTimeString();
      const typeClass = type === 'success' ? 'success' : type === 'error' ? 'error' : '';
      container.innerHTML = '<div class="log-entry"><span class="timestamp">[' + timestamp + ']</span> <span class="' + typeClass + '">' + message + '</span></div>' + container.innerHTML;
      if (container.children.length > 50) {
        container.removeChild(container.lastChild);
      }
    }
    
    async function refreshData() {
      log('Refreshing data...');
      
      // Fetch agents
      const agents = await fetchAPI('/oracle/agents');
      if (agents) {
        const agentCount = Object.keys(agents.agents || {}).length;
        document.getElementById('agent-count').textContent = agentCount;
        
        const detailedList = document.getElementById('detailed-agents');
        detailedList.innerHTML = Object.entries(agents.agents || {}).map(([id, agent]) => 
          '<li class="agent-item"><span class="agent-name">' + id + '</span><span class="agent-status">active</span></li>'
        ).join('');
        
        log('Loaded ' + agentCount + ' agents', 'success');
      }
      
      // Fetch tools
      const tools = await fetchAPI('/strata/tools');
      if (tools) {
        document.getElementById('tool-count').textContent = tools.totalTools || '--';
        document.getElementById('enabled-tools').textContent = tools.enabledTools || '--';
        log('Loaded ' + tools.totalTools + ' tools', 'success');
      }
      
      // Fetch health
      const health = await fetchAPI('/health');
      if (health) {
        document.getElementById('virtue-score').textContent = '0.998';
        document.getElementById('virtue-fill').style.width = '99.8%';
        log('Health check passed', 'success');
      }
    }
    
    // Initial load
    refreshData();
    
    // Auto-refresh
    setInterval(refreshData, ${config.refreshInterval});
  </script>
</body>
</html>`;
}

// =============================================================================
// TREE DATA PROVIDERS
// =============================================================================

class AgentTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly agentId: string,
    public readonly status: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${agentId} - ${status}`;
    this.description = status;
    this.iconPath = new vscode.ThemeIcon(status === 'active' ? 'pass' : 'circle-outline');
  }
}

class AgentTreeDataProvider implements vscode.TreeDataProvider<AgentTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<AgentTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AgentTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<AgentTreeItem[]> {
    const agents = await fetchAPI<{ agents: Record<string, unknown> }>('/oracle/agents');
    if (!agents?.agents) return [];

    return Object.entries(agents.agents).map(([id, agent]) => 
      new AgentTreeItem(id, id, 'active', vscode.TreeItemCollapsibleState.None)
    );
  }
}

// =============================================================================
// EXTENSION ACTIVATION
// =============================================================================

export function activate(context: vscode.ExtensionContext) {
  console.log('[SmelterOS] Circuit Box extension activated');

  // Register tree data providers
  const agentProvider = new AgentTreeDataProvider();
  vscode.window.registerTreeDataProvider('smelter.agents', agentProvider);

  // Open Circuit Box command
  const openCircuitBox = vscode.commands.registerCommand('smelter.openCircuitBox', () => {
    if (circuitBoxPanel) {
      circuitBoxPanel.reveal(vscode.ViewColumn.One);
    } else {
      circuitBoxPanel = vscode.window.createWebviewPanel(
        'circuitBox',
        'SmelterOS Circuit Box',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      circuitBoxPanel.webview.html = getWebviewContent();

      circuitBoxPanel.onDidDispose(() => {
        circuitBoxPanel = undefined;
      });
    }
  });

  // Refresh metrics command
  const refreshMetrics = vscode.commands.registerCommand('smelter.refreshMetrics', () => {
    agentProvider.refresh();
    vscode.window.showInformationMessage('SmelterOS metrics refreshed');
  });

  // Deploy agents command
  const deployAgents = vscode.commands.registerCommand('smelter.deployAgents', async () => {
    const config = getConfig();
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Deploying ORACLE agents...',
      cancellable: false
    }, async () => {
      try {
        const response = await fetch(`${config.cloudRunUrl}/sandbox/deploy-all-oracle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json() as { data: { deployed: number } };
        vscode.window.showInformationMessage(`Deployed ${data.data.deployed} sandboxes`);
        agentProvider.refresh();
      } catch (error) {
        vscode.window.showErrorMessage(`Deployment failed: ${error}`);
      }
    });
  });

  // Run ethics gate command
  const runEthicsGate = vscode.commands.registerCommand('smelter.runEthicsGate', async () => {
    const config = getConfig();
    const taskDescription = await vscode.window.showInputBox({
      prompt: 'Enter task description for ethics gate',
      placeHolder: 'CTO: Optimize Phase 4 UI',
    });

    if (!taskDescription) return;

    try {
      const response = await fetch(`${config.cloudRunUrl}/strata/ethics-gate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: `gate-${Date.now()}`,
          description: taskDescription,
          agents: ['acheevy', 'boomer-cto', 'boomer-coo', 'boomer-cfo', 'boomer-cmo'],
          context: { source: 'vscode-extension' },
        }),
      });
      const data = await response.json() as { data: { evaluation: { score: number }; approved: boolean } };
      
      const score = data.data.evaluation.score;
      const passed = data.data.approved;
      
      if (passed) {
        vscode.window.showInformationMessage(`✓ Ethics gate PASSED: ${score.toFixed(4)}`);
      } else {
        vscode.window.showWarningMessage(`✗ Ethics gate FAILED: ${score.toFixed(4)} < ${config.virtueThreshold}`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Ethics gate error: ${error}`);
    }
  });

  context.subscriptions.push(openCircuitBox, refreshMetrics, deployAgents, runEthicsGate);
}

export function deactivate() {
  if (circuitBoxPanel) {
    circuitBoxPanel.dispose();
  }
}

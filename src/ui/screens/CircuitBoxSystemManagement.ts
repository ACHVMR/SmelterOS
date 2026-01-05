/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - CIRCUIT BOX SYSTEM MANAGEMENT SCREEN
 * "Switchboard" dashboard with panel grid for system control
 * All integrations wired through the central Circuit Box
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  renderPanelCard,
  renderToggleSwitch,
  renderStatusPill,
  renderLoadBar,
  renderButton,
  PanelTone
} from '../components';
import { renderSmelterAppShell, AppShellConfig } from '../layouts/SmelterAppShell';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentLoadItem {
  id: string;
  name: string;
  isActive: boolean;
  load: number;
  lastActivity: string;
}

export interface RepoHealthItem {
  id: string;
  name: string;
  lastSync: string;
  errorCount: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface IntegrationItem {
  id: string;
  name: string;
  icon: string;
  isConnected: boolean;
  status: 'healthy' | 'warning' | 'critical';
  endpoint?: string;
}

export interface VoicePipelineState {
  sttEnabled: boolean;
  ttsEnabled: boolean;
  streamingEnabled: boolean;
  sttLatency: number;
  ttsLatency: number;
}

export interface DeploymentItem {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
  lastDeploy?: string;
}

export interface AlertItem {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
}

export interface CircuitBoxState {
  agents: AgentLoadItem[];
  repos: RepoHealthItem[];
  integrations: IntegrationItem[];
  voicePipeline: VoicePipelineState;
  deployments: DeploymentItem[];
  alerts: AlertItem[];
  auditTrailCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DATA
// ─────────────────────────────────────────────────────────────────────────────

export const SAMPLE_CIRCUIT_BOX_STATE: CircuitBoxState = {
  agents: [
    { id: 'acheevy', name: 'ACHEEVY Concierge', isActive: true, load: 45, lastActivity: '2 min ago' },
    { id: 'research', name: 'Research Agent', isActive: true, load: 78, lastActivity: '5 min ago' },
    { id: 'deploy', name: 'Deploy Agent', isActive: false, load: 0, lastActivity: '1 hour ago' },
    { id: 'monitor', name: 'Monitor Agent', isActive: true, load: 23, lastActivity: 'Just now' },
  ],
  repos: [
    { id: 'smelter-core', name: 'smelter-core', lastSync: '3 min ago', errorCount: 0, status: 'healthy' },
    { id: 'smelter-ui', name: 'smelter-ui', lastSync: '15 min ago', errorCount: 2, status: 'warning' },
    { id: 'smelter-api', name: 'smelter-api', lastSync: '1 hour ago', errorCount: 0, status: 'healthy' },
  ],
  integrations: [
    { id: 'vertex-ai', name: 'Vertex AI', icon: '🧠', isConnected: true, status: 'healthy', endpoint: 'aiplatform.googleapis.com' },
    { id: 'cloud-run', name: 'Cloud Run', icon: '🚀', isConnected: true, status: 'healthy', endpoint: 'run.googleapis.com' },
    { id: 'firestore', name: 'Firestore', icon: '🔥', isConnected: true, status: 'healthy', endpoint: 'firestore.googleapis.com' },
    { id: 'stripe', name: 'Stripe', icon: '💳', isConnected: true, status: 'healthy', endpoint: 'api.stripe.com' },
    { id: 'github', name: 'GitHub', icon: '⬡', isConnected: true, status: 'healthy', endpoint: 'api.github.com' },
    { id: 'pubsub', name: 'Pub/Sub', icon: '📡', isConnected: true, status: 'warning', endpoint: 'pubsub.googleapis.com' },
  ],
  voicePipeline: {
    sttEnabled: true,
    ttsEnabled: true,
    streamingEnabled: true,
    sttLatency: 145,
    ttsLatency: 89,
  },
  deployments: [
    { id: 'cloud-run-registry', name: 'Cloud Run Registry', icon: '📦', isActive: true, lastDeploy: '2 hours ago' },
    { id: 'cloud-run-service', name: 'Cloud Run Service', icon: '🌐', isActive: true, lastDeploy: '30 min ago' },
    { id: 'cloud-functions', name: 'Cloud Functions', icon: '⚡', isActive: true, lastDeploy: '1 day ago' },
    { id: 'scheduled-backup', name: 'Scheduled Backup', icon: '💾', isActive: true, lastDeploy: 'Daily 3:00 AM' },
    { id: 'health-check', name: 'Health Check', icon: '❤️', isActive: true, lastDeploy: 'Every 5 min' },
  ],
  alerts: [
    { id: 'a1', type: 'warning', message: 'Pub/Sub latency increased by 15%', timestamp: '10 min ago' },
    { id: 'a2', type: 'info', message: 'ACHEEVY handled 127 queries today', timestamp: '1 hour ago' },
  ],
  auditTrailCount: 1247,
};

// ─────────────────────────────────────────────────────────────────────────────
// AGENT LOAD PANEL
// ─────────────────────────────────────────────────────────────────────────────

export function renderAgentLoadPanel(agents: AgentLoadItem[]): string {
  const rows = agents.map(agent => `
    <div class="circuit-agent-row">
      <div class="circuit-agent-row__toggle">
        ${renderToggleSwitch({
          id: `agent-${agent.id}`,
          checked: agent.isActive,
          onCheckedChange: () => {},
          label: agent.name
        })}
      </div>
      <div class="circuit-agent-row__load">
        ${renderLoadBar(agent.load, agent.load > 80 ? 'governance' : 'research')}
      </div>
      <span class="circuit-agent-row__activity">${agent.lastActivity}</span>
    </div>
  `).join('');

  return renderPanelCard({
    title: 'Agent Load',
    icon: '🤖',
    tone: 'compute',
    children: `<div class="circuit-agent-panel">${rows}</div>`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// REPO HEALTH PANEL
// ─────────────────────────────────────────────────────────────────────────────

export function renderRepoHealthPanel(repos: RepoHealthItem[]): string {
  const tiles = repos.map(repo => `
    <div class="circuit-repo-tile circuit-repo-tile--${repo.status}">
      <div class="circuit-repo-tile__header">
        <span class="circuit-repo-tile__name">${repo.name}</span>
        ${renderStatusPill({ tone: repo.status, text: repo.status })}
      </div>
      <div class="circuit-repo-tile__stats">
        <span>Sync: ${repo.lastSync}</span>
        <span class="${repo.errorCount > 0 ? 'text-shielding' : ''}">Errors: ${repo.errorCount}</span>
      </div>
    </div>
  `).join('');

  return renderPanelCard({
    title: 'Repository Health',
    icon: '📁',
    tone: 'default',
    children: `<div class="circuit-repo-panel">${tiles}</div>`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATIONS PANEL
// ─────────────────────────────────────────────────────────────────────────────

export function renderIntegrationsPanel(integrations: IntegrationItem[]): string {
  const rows = integrations.map(integration => `
    <div class="circuit-integration-row">
      <span class="circuit-integration-row__icon">${integration.icon}</span>
      <div class="circuit-integration-row__info">
        <span class="circuit-integration-row__name">${integration.name}</span>
        ${integration.endpoint ? `<span class="circuit-integration-row__endpoint">${integration.endpoint}</span>` : ''}
      </div>
      ${renderToggleSwitch({
        id: `integration-${integration.id}`,
        checked: integration.isConnected,
        onCheckedChange: () => {},
        label: ''
      })}
      ${renderStatusPill({ tone: integration.status, text: integration.status })}
    </div>
  `).join('');

  return renderPanelCard({
    title: 'Integrations',
    icon: '🔌',
    tone: 'core',
    toolbarSlot: renderButton({ variant: 'ghost', children: '+ Add' }),
    children: `<div class="circuit-integrations-panel">${rows}</div>`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE PIPELINE PANEL
// ─────────────────────────────────────────────────────────────────────────────

export function renderVoicePipelinePanel(voice: VoicePipelineState): string {
  return renderPanelCard({
    title: 'Voice Pipeline',
    icon: '🎙️',
    tone: 'forge',
    children: `
      <div class="circuit-voice-panel">
        <div class="circuit-voice-panel__circuits">
          <div class="circuit-voice-panel__breaker">
            ${renderToggleSwitch({
              id: 'voice-stt',
              checked: voice.sttEnabled,
              onCheckedChange: () => {},
              label: 'STT (Speech-to-Text)'
            })}
            <span class="circuit-voice-panel__latency">${voice.sttLatency}ms</span>
          </div>
          
          <div class="circuit-voice-panel__breaker">
            ${renderToggleSwitch({
              id: 'voice-tts',
              checked: voice.ttsEnabled,
              onCheckedChange: () => {},
              label: 'TTS (Text-to-Speech)'
            })}
            <span class="circuit-voice-panel__latency">${voice.ttsLatency}ms</span>
          </div>
          
          <div class="circuit-voice-panel__breaker">
            ${renderToggleSwitch({
              id: 'voice-streaming',
              checked: voice.streamingEnabled,
              onCheckedChange: () => {},
              label: 'Streaming Mode'
            })}
          </div>
        </div>
        
        <div class="circuit-voice-panel__monitor">
          <div class="circuit-voice-panel__monitor-row">
            <span>STT Latency</span>
            ${renderLoadBar(Math.min(100, voice.sttLatency / 3), voice.sttLatency > 200 ? 'governance' : 'research')}
          </div>
          <div class="circuit-voice-panel__monitor-row">
            <span>TTS Latency</span>
            ${renderLoadBar(Math.min(100, voice.ttsLatency / 2), voice.ttsLatency > 150 ? 'governance' : 'research')}
          </div>
        </div>
      </div>
    `
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYMENT PANEL
// ─────────────────────────────────────────────────────────────────────────────

export function renderDeploymentPanel(deployments: DeploymentItem[]): string {
  const rows = deployments.map(deploy => `
    <div class="circuit-deploy-row">
      <span class="circuit-deploy-row__icon">${deploy.icon}</span>
      <div class="circuit-deploy-row__info">
        <span class="circuit-deploy-row__name">${deploy.name}</span>
        ${deploy.lastDeploy ? `<span class="circuit-deploy-row__time">${deploy.lastDeploy}</span>` : ''}
      </div>
      ${renderToggleSwitch({
        id: `deploy-${deploy.id}`,
        checked: deploy.isActive,
        onCheckedChange: () => {},
        label: ''
      })}
    </div>
  `).join('');

  return renderPanelCard({
    title: 'Deployments',
    icon: '🚀',
    tone: 'research',
    children: `<div class="circuit-deploy-panel">${rows}</div>`
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERTS PANEL
// ─────────────────────────────────────────────────────────────────────────────

export function renderAlertsPanel(alerts: AlertItem[], auditCount: number): string {
  const alertRows = alerts.map(alert => {
    const tone = alert.type === 'critical' ? 'shielding' : alert.type === 'warning' ? 'governance' : 'compute';
    return `
      <div class="circuit-alert-row circuit-alert-row--${alert.type}">
        <span class="circuit-alert-row__icon">${
          alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵'
        }</span>
        <div class="circuit-alert-row__content">
          <span class="circuit-alert-row__message">${alert.message}</span>
          <span class="circuit-alert-row__time">${alert.timestamp}</span>
        </div>
      </div>
    `;
  }).join('');

  return renderPanelCard({
    title: 'Alerts & Audit',
    icon: '🔔',
    tone: 'shielding' as PanelTone,
    toolbarSlot: `<span class="circuit-alerts-count">${alerts.length} active</span>`,
    children: `
      <div class="circuit-alerts-panel">
        <div class="circuit-alerts-list">
          ${alertRows || '<span class="text-muted">No active alerts</span>'}
        </div>
        <div class="circuit-audit-entry">
          <button class="circuit-audit-btn focus-ring">
            <span class="circuit-audit-btn__icon">📋</span>
            <span class="circuit-audit-btn__text">User Access Audit Trail</span>
            <span class="circuit-audit-btn__count">${auditCount.toLocaleString()} entries</span>
          </button>
        </div>
      </div>
    `
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL CIRCUIT BOX SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export function renderCircuitBoxScreen(state: CircuitBoxState, shellConfig: AppShellConfig): string {
  const mainContent = `
    <div class="circuit-box-screen">
      <div class="circuit-box-header">
        <h1 class="circuit-box-header__title">⚡ CircuitBox</h1>
        <p class="circuit-box-header__subtitle">System Management & Switchboard</p>
      </div>
      
      <div class="circuit-box-grid">
        <!-- Row 1 -->
        <div class="circuit-box-cell circuit-box-cell--agents">
          ${renderAgentLoadPanel(state.agents)}
        </div>
        <div class="circuit-box-cell circuit-box-cell--repos">
          ${renderRepoHealthPanel(state.repos)}
        </div>
        <div class="circuit-box-cell circuit-box-cell--voice">
          ${renderVoicePipelinePanel(state.voicePipeline)}
        </div>
        
        <!-- Row 2 -->
        <div class="circuit-box-cell circuit-box-cell--integrations">
          ${renderIntegrationsPanel(state.integrations)}
        </div>
        <div class="circuit-box-cell circuit-box-cell--deployments">
          ${renderDeploymentPanel(state.deployments)}
        </div>
        <div class="circuit-box-cell circuit-box-cell--alerts">
          ${renderAlertsPanel(state.alerts, state.auditTrailCount)}
        </div>
      </div>
      
      <!-- Circuit Traces Decoration -->
      <div class="circuit-box-traces">
        <svg class="circuit-box-traces__svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trace-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:var(--smelter-core);stop-opacity:0.3" />
              <stop offset="50%" style="stop-color:var(--smelter-foundation);stop-opacity:0.6" />
              <stop offset="100%" style="stop-color:var(--smelter-core);stop-opacity:0.3" />
            </linearGradient>
          </defs>
          <path d="M0,50 Q25,20 50,50 T100,50" stroke="url(#trace-gradient)" stroke-width="2" fill="none" vector-effect="non-scaling-stroke"/>
        </svg>
      </div>
    </div>
  `;

  return renderSmelterAppShell(shellConfig, mainContent);
}

// ─────────────────────────────────────────────────────────────────────────────
// CIRCUIT BOX STYLES
// ─────────────────────────────────────────────────────────────────────────────

export function getCircuitBoxStyles(): string {
  return `
/* ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - CIRCUIT BOX STYLES
 * Switchboard with "metal plate" aesthetic and circuit traces
 * ═══════════════════════════════════════════════════════════════════════════ */

.circuit-box-screen {
  position: relative;
}

.circuit-box-header {
  margin-bottom: var(--space-6);
}

.circuit-box-header__title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-0);
}

.circuit-box-header__subtitle {
  font-size: var(--text-sm);
  color: var(--text-2);
  margin-top: var(--space-1);
}

/* Grid Layout */
.circuit-box-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: var(--space-4);
}

.circuit-box-cell {
  min-height: 280px;
}

/* Circuit Traces Decoration */
.circuit-box-traces {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: -1;
  opacity: 0.3;
}

.circuit-box-traces__svg {
  width: 100%;
  height: 100%;
}

/* Agent Panel */
.circuit-agent-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.circuit-agent-row {
  display: grid;
  grid-template-columns: 1fr 120px 80px;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3);
  background-color: var(--bg-2);
  border-radius: var(--radius-md);
}

.circuit-agent-row__load {
  display: flex;
  align-items: center;
}

.circuit-agent-row__activity {
  font-size: var(--text-xs);
  color: var(--text-2);
  text-align: right;
}

/* Repo Panel */
.circuit-repo-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
}

.circuit-repo-tile {
  padding: var(--space-4);
  background-color: var(--bg-2);
  border: 1px solid var(--stroke-0);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}

.circuit-repo-tile--healthy {
  border-left: 3px solid var(--smelter-research);
}

.circuit-repo-tile--warning {
  border-left: 3px solid var(--smelter-governance);
}

.circuit-repo-tile--critical {
  border-left: 3px solid var(--smelter-shielding);
}

.circuit-repo-tile__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
}

.circuit-repo-tile__name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-0);
}

.circuit-repo-tile__stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-2);
}

/* Integrations Panel */
.circuit-integrations-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.circuit-integration-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--bg-2);
  border-radius: var(--radius-md);
}

.circuit-integration-row__icon {
  font-size: var(--text-xl);
}

.circuit-integration-row__info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.circuit-integration-row__name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-0);
}

.circuit-integration-row__endpoint {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-2);
}

/* Voice Pipeline Panel */
.circuit-voice-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.circuit-voice-panel__circuits {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.circuit-voice-panel__breaker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background-color: var(--bg-2);
  border-radius: var(--radius-md);
  border: 1px solid var(--stroke-0);
}

.circuit-voice-panel__latency {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--smelter-compute);
}

.circuit-voice-panel__monitor {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.circuit-voice-panel__monitor-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.circuit-voice-panel__monitor-row > span:first-child {
  font-size: var(--text-xs);
  color: var(--text-2);
  width: 80px;
}

/* Deployment Panel */
.circuit-deploy-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.circuit-deploy-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--bg-2);
  border-radius: var(--radius-md);
}

.circuit-deploy-row__icon {
  font-size: var(--text-lg);
}

.circuit-deploy-row__info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.circuit-deploy-row__name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-0);
}

.circuit-deploy-row__time {
  font-size: var(--text-xs);
  color: var(--text-2);
}

/* Alerts Panel */
.circuit-alerts-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.circuit-alerts-count {
  font-size: var(--text-xs);
  color: var(--text-2);
}

.circuit-alerts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 160px;
  overflow-y: auto;
}

.circuit-alert-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--bg-2);
  border-radius: var(--radius-md);
}

.circuit-alert-row--warning {
  border-left: 3px solid var(--smelter-governance);
}

.circuit-alert-row--critical {
  border-left: 3px solid var(--smelter-shielding);
}

.circuit-alert-row--info {
  border-left: 3px solid var(--smelter-compute);
}

.circuit-alert-row__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.circuit-alert-row__message {
  font-size: var(--text-sm);
  color: var(--text-0);
}

.circuit-alert-row__time {
  font-size: var(--text-xs);
  color: var(--text-2);
}

.circuit-audit-entry {
  padding-top: var(--space-4);
  border-top: 1px solid var(--stroke-0);
}

.circuit-audit-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-2);
  border: 1px solid var(--stroke-1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.circuit-audit-btn:hover {
  background-color: var(--bg-3);
  border-color: var(--smelter-foundation);
}

.circuit-audit-btn__icon {
  font-size: var(--text-lg);
}

.circuit-audit-btn__text {
  flex: 1;
  text-align: left;
  font-size: var(--text-sm);
  color: var(--text-0);
}

.circuit-audit-btn__count {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--smelter-compute);
}

/* Responsive */
@media (max-width: 1200px) {
  .circuit-box-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .circuit-box-grid {
    grid-template-columns: 1fr;
  }
  
  .circuit-agent-row {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }
}
`;
}

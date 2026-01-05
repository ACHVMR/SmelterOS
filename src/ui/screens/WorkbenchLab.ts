/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - WORKBENCH LAB SCREEN
 * Lab console with ToolCatalog, ScenarioPanel, and RealtimeResults
 * Cloud Run deployment integration - no local Docker
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  renderTextField,
  renderButton,
  renderPanelCard,
  renderStatusPill,
  renderWaveformBar,
  renderLoadBar,
  renderToggleSwitch
} from '../components';
import { renderSmelterAppShell, AppShellConfig } from '../layouts/SmelterAppShell';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Tool {
  id: string;
  name: string;
  icon: string;
  status: 'available' | 'beta' | 'draft';
  description: string;
  endpoint: string;
}

export interface ScenarioConfig {
  name: string;
  language: string;
  bitrate: number;
  metadata: Record<string, string>;
}

export interface EndpointConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  params: Record<string, string>;
}

export interface RequestState {
  body: string;
  isRunning: boolean;
}

export interface ResponseState {
  status: number;
  latency: number;
  accuracy?: number;
  body: string;
  audioWaveform?: number[];
  logs: string[];
}

export interface QuotaState {
  used: number;
  limit: number;
  costPerTest: number;
  remaining: number;
}

export interface WorkbenchLabState {
  mode: 'testing' | 'workbench';
  searchQuery: string;
  tools: Tool[];
  popularApis: Tool[];
  savedTools: Tool[];
  scenario: ScenarioConfig;
  endpoint: EndpointConfig;
  request: RequestState;
  response?: ResponseState;
  quota: QuotaState;
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DATA
// ─────────────────────────────────────────────────────────────────────────────

export const SAMPLE_TOOLS: Tool[] = [
  { id: 'vertex-gemini', name: 'Vertex AI - Gemini', icon: '🧠', status: 'available', description: 'Large language model inference', endpoint: 'aiplatform.googleapis.com' },
  { id: 'cloud-run', name: 'Cloud Run Deploy', icon: '🚀', status: 'available', description: 'Serverless container deployment', endpoint: 'run.googleapis.com' },
  { id: 'speech-to-text', name: 'Speech-to-Text', icon: '🎤', status: 'available', description: 'Audio transcription', endpoint: 'speech.googleapis.com' },
  { id: 'text-to-speech', name: 'Text-to-Speech', icon: '🔊', status: 'available', description: 'Voice synthesis', endpoint: 'texttospeech.googleapis.com' },
  { id: 'vision-api', name: 'Vision AI', icon: '👁', status: 'available', description: 'Image analysis', endpoint: 'vision.googleapis.com' },
  { id: 'document-ai', name: 'Document AI', icon: '📄', status: 'beta', description: 'Document processing', endpoint: 'documentai.googleapis.com' },
];

export const POPULAR_APIS: Tool[] = [
  { id: 'gemini-pro', name: 'Gemini Pro', icon: '✨', status: 'available', description: 'Multimodal AI', endpoint: 'generativelanguage.googleapis.com' },
  { id: 'firestore', name: 'Firestore', icon: '🔥', status: 'available', description: 'NoSQL database', endpoint: 'firestore.googleapis.com' },
  { id: 'pubsub', name: 'Pub/Sub', icon: '📡', status: 'available', description: 'Messaging', endpoint: 'pubsub.googleapis.com' },
];

// ─────────────────────────────────────────────────────────────────────────────
// TOOL CATALOG PANEL
// ─────────────────────────────────────────────────────────────────────────────

function renderToolRow(tool: Tool): string {
  return `
    <div class="workbench-tool-row">
      <span class="workbench-tool-row__icon">${tool.icon}</span>
      <div class="workbench-tool-row__info">
        <span class="workbench-tool-row__name">${tool.name}</span>
        <span class="workbench-tool-row__endpoint">${tool.endpoint}</span>
      </div>
      ${renderStatusPill({ tone: tool.status, text: tool.status })}
      <button class="workbench-tool-row__action focus-ring">+</button>
    </div>
  `;
}

function renderToolSection(title: string, tools: Tool[]): string {
  return `
    <div class="workbench-tool-section">
      <h4 class="workbench-tool-section__title">${title}</h4>
      <div class="workbench-tool-section__list">
        ${tools.map(renderToolRow).join('')}
      </div>
    </div>
  `;
}

export function renderToolCatalogPanel(state: WorkbenchLabState): string {
  return renderPanelCard({
    title: 'Tool Catalog',
    icon: '🛠',
    tone: 'compute',
    children: `
      <div class="workbench-catalog">
        ${renderTextField({
          id: 'tool-search',
          label: '',
          value: state.searchQuery,
          placeholder: 'Find tools and APIs...',
          type: 'search',
          leadingIcon: '🔍',
          onChange: () => {}
        })}
        
        ${renderToolSection('Available Tools & APIs', state.tools)}
        ${renderToolSection('Popular APIs', state.popularApis)}
        ${renderToolSection('Saved Tools', state.savedTools)}
      </div>
    `
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO PANEL
// ─────────────────────────────────────────────────────────────────────────────

export function renderScenarioPanel(state: WorkbenchLabState): string {
  const { scenario, endpoint, request, response } = state;

  return renderPanelCard({
    title: 'Test Scenario',
    icon: '🧪',
    tone: 'forge',
    toolbarSlot: renderButton({
      variant: request.isRunning ? 'secondary' : 'primary',
      children: request.isRunning ? 'Running...' : 'Run Test',
      leftIcon: '▶',
      loading: request.isRunning
    }),
    children: `
      <div class="workbench-scenario">
        <!-- Scenario Config -->
        <div class="workbench-scenario__config">
          <h4 class="workbench-scenario__subtitle">Scenario Configuration</h4>
          <div class="workbench-scenario__grid">
            ${renderTextField({
              id: 'scenario-name',
              label: 'Scenario Name',
              value: scenario.name,
              placeholder: 'My Test Scenario',
              onChange: () => {}
            })}
            ${renderTextField({
              id: 'scenario-language',
              label: 'Language',
              value: scenario.language,
              placeholder: 'en-US',
              onChange: () => {}
            })}
            ${renderTextField({
              id: 'scenario-bitrate',
              label: 'Bitrate',
              value: scenario.bitrate.toString(),
              placeholder: '16000',
              onChange: () => {}
            })}
          </div>
        </div>
        
        <!-- Endpoint Config -->
        <div class="workbench-scenario__endpoint">
          <h4 class="workbench-scenario__subtitle">Endpoint</h4>
          <div class="workbench-scenario__url-row">
            <select class="workbench-scenario__method" id="method-select">
              <option value="GET" ${endpoint.method === 'GET' ? 'selected' : ''}>GET</option>
              <option value="POST" ${endpoint.method === 'POST' ? 'selected' : ''}>POST</option>
              <option value="PUT" ${endpoint.method === 'PUT' ? 'selected' : ''}>PUT</option>
              <option value="DELETE" ${endpoint.method === 'DELETE' ? 'selected' : ''}>DELETE</option>
              <option value="PATCH" ${endpoint.method === 'PATCH' ? 'selected' : ''}>PATCH</option>
            </select>
            ${renderTextField({
              id: 'endpoint-url',
              label: '',
              value: endpoint.url,
              placeholder: 'https://api.smelter.io/v1/...',
              onChange: () => {}
            })}
          </div>
        </div>
        
        <!-- Request Body -->
        <div class="workbench-scenario__request">
          <h4 class="workbench-scenario__subtitle">Request Body</h4>
          <textarea 
            class="workbench-scenario__editor" 
            id="request-body"
            placeholder='{ "query": "..." }'
          >${request.body}</textarea>
        </div>
        
        <!-- Response Viewer -->
        ${response ? `
          <div class="workbench-scenario__response">
            <div class="workbench-scenario__tabs">
              <button class="workbench-scenario__tab workbench-scenario__tab--active">Audio</button>
              <button class="workbench-scenario__tab">JSON</button>
              <button class="workbench-scenario__tab">Logs</button>
            </div>
            <div class="workbench-scenario__tab-content">
              ${response.audioWaveform ? `
                <div class="workbench-scenario__audio">
                  ${renderWaveformBar({ mode: 'idle', amplitude: 0.6, colorVariant: 'research' })}
                </div>
              ` : `
                <pre class="workbench-scenario__json">${response.body}</pre>
              `}
            </div>
          </div>
        ` : ''}
      </div>
    `
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// REALTIME RESULTS PANEL
// ─────────────────────────────────────────────────────────────────────────────

export function renderRealtimeResultsPanel(state: WorkbenchLabState): string {
  const { request, response, quota } = state;
  
  return `
    <div class="workbench-results">
      <!-- Progress -->
      ${renderPanelCard({
        title: 'Status',
        icon: '📊',
        tone: request.isRunning ? 'forge' : 'default',
        children: `
          <div class="workbench-results__progress">
            ${renderLoadBar(request.isRunning ? 60 : (response ? 100 : 0), 'research')}
            <span class="workbench-results__status">${
              request.isRunning ? 'Processing...' : (response ? 'Complete' : 'Ready')
            }</span>
          </div>
        `
      })}
      
      <!-- Status Card -->
      ${response ? renderPanelCard({
        title: 'Response Metrics',
        icon: '📈',
        tone: response.status < 400 ? 'research' : 'shielding',
        children: `
          <div class="workbench-results__metrics">
            <div class="workbench-results__metric">
              <span class="workbench-results__metric-label">HTTP Status</span>
              <span class="workbench-results__metric-value ${response.status < 400 ? 'text-research' : 'text-shielding'}">${response.status}</span>
            </div>
            <div class="workbench-results__metric">
              <span class="workbench-results__metric-label">Latency</span>
              <span class="workbench-results__metric-value">${response.latency}ms</span>
            </div>
            ${response.accuracy !== undefined ? `
              <div class="workbench-results__metric">
                <span class="workbench-results__metric-label">Accuracy</span>
                <span class="workbench-results__metric-value text-research">${(response.accuracy * 100).toFixed(1)}%</span>
              </div>
            ` : ''}
          </div>
        `
      }) : ''}
      
      <!-- Log Stream -->
      ${renderPanelCard({
        title: 'Event Log',
        icon: '📜',
        children: `
          <div class="workbench-results__logs">
            ${response?.logs.length ? response.logs.map(log => `
              <div class="workbench-results__log-entry">${log}</div>
            `).join('') : '<span class="text-muted">No events yet</span>'}
          </div>
        `
      })}
      
      <!-- Quota Card -->
      ${renderPanelCard({
        title: 'Quota',
        icon: '💰',
        tone: 'finops' as any,
        children: `
          <div class="workbench-results__quota">
            <div class="workbench-results__quota-row">
              <span>API Calls Used</span>
              <span class="text-core">${quota.used} / ${quota.limit}</span>
            </div>
            ${renderLoadBar(Math.round((quota.used / quota.limit) * 100), quota.used > quota.limit * 0.8 ? 'governance' : 'research')}
            <div class="workbench-results__quota-row">
              <span>Cost Per Test</span>
              <span>$${quota.costPerTest.toFixed(4)}</span>
            </div>
            <div class="workbench-results__quota-row">
              <span>Remaining Budget</span>
              <span class="text-research">$${quota.remaining.toFixed(2)}</span>
            </div>
          </div>
        `
      })}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER ROW
// ─────────────────────────────────────────────────────────────────────────────

function renderWorkbenchHeader(state: WorkbenchLabState): string {
  return `
    <div class="workbench-header">
      <div class="workbench-header__mode">
        <span class="workbench-header__mode-label">Mode:</span>
        <div class="workbench-header__mode-toggle">
          ${renderToggleSwitch({
            id: 'mode-toggle',
            checked: state.mode === 'workbench',
            onCheckedChange: () => {},
            label: state.mode === 'workbench' ? 'Workbench Mode' : 'Testing Lab Mode'
          })}
        </div>
      </div>
      
      <div class="workbench-header__actions">
        ${renderButton({
          variant: 'primary',
          children: 'Create New',
          leftIcon: '+'
        })}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL WORKBENCH LAB SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export function renderWorkbenchLabScreen(state: WorkbenchLabState, shellConfig: AppShellConfig): string {
  const mainContent = `
    <div class="workbench-lab">
      ${renderWorkbenchHeader(state)}
      
      <div class="workbench-lab__grid">
        <!-- Left: Tool Catalog -->
        <div class="workbench-lab__column workbench-lab__column--catalog">
          ${renderToolCatalogPanel(state)}
        </div>
        
        <!-- Center: Scenario -->
        <div class="workbench-lab__column workbench-lab__column--scenario">
          ${renderScenarioPanel(state)}
        </div>
        
        <!-- Right: Results -->
        <div class="workbench-lab__column workbench-lab__column--results">
          ${renderRealtimeResultsPanel(state)}
        </div>
      </div>
    </div>
  `;

  return renderSmelterAppShell(shellConfig, mainContent);
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKBENCH LAB STYLES
// ─────────────────────────────────────────────────────────────────────────────

export function getWorkbenchLabStyles(): string {
  return `
/* ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - WORKBENCH LAB STYLES
 * ═══════════════════════════════════════════════════════════════════════════ */

.workbench-lab {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  height: 100%;
}

.workbench-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background-color: var(--bg-1);
  border: 1px solid var(--stroke-0);
  border-radius: var(--radius-lg);
}

.workbench-header__mode {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.workbench-header__mode-label {
  font-size: var(--text-sm);
  color: var(--text-1);
}

.workbench-header__mode-toggle .smelter-toggle__input:checked + .smelter-toggle__track {
  background-color: var(--smelter-forge);
  border-color: var(--smelter-forge);
  box-shadow: var(--glow-forge);
}

.workbench-header__actions {
  display: flex;
  gap: var(--space-3);
}

/* Grid Layout */
.workbench-lab__grid {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: var(--space-4);
  flex: 1;
  min-height: 0;
}

.workbench-lab__column {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

/* Tool Catalog */
.workbench-catalog {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.workbench-catalog .smelter-textfield__label {
  display: none;
}

.workbench-tool-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.workbench-tool-section__title {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: var(--space-2) 0;
}

.workbench-tool-section__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.workbench-tool-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background-color: var(--bg-2);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.workbench-tool-row:hover {
  background-color: var(--bg-3);
}

.workbench-tool-row__icon {
  font-size: var(--text-lg);
}

.workbench-tool-row__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.workbench-tool-row__name {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.workbench-tool-row__endpoint {
  font-size: var(--text-xs);
  color: var(--text-2);
  font-family: var(--font-mono);
}

.workbench-tool-row__action {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-1);
  border: 1px solid var(--stroke-0);
  border-radius: var(--radius-sm);
  color: var(--text-1);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.workbench-tool-row__action:hover {
  border-color: var(--smelter-core);
  color: var(--smelter-core);
}

/* Scenario Panel */
.workbench-scenario {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.workbench-scenario__subtitle {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: var(--space-3);
}

.workbench-scenario__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.workbench-scenario__url-row {
  display: flex;
  gap: var(--space-3);
}

.workbench-scenario__method {
  padding: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-0);
  background-color: var(--bg-2);
  border: 1px solid var(--stroke-0);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.workbench-scenario__url-row .smelter-textfield {
  flex: 1;
}

.workbench-scenario__url-row .smelter-textfield__label {
  display: none;
}

.workbench-scenario__editor {
  width: 100%;
  min-height: 200px;
  padding: var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-0);
  background-color: var(--bg-2);
  border: 1px solid var(--stroke-0);
  border-radius: var(--radius-md);
  resize: vertical;
}

.workbench-scenario__editor:focus {
  outline: none;
  border-color: var(--smelter-foundation);
}

.workbench-scenario__tabs {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-2);
  background-color: var(--bg-2);
  border-radius: var(--radius-md);
}

.workbench-scenario__tab {
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--text-1);
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.workbench-scenario__tab:hover {
  color: var(--text-0);
  background-color: var(--bg-3);
}

.workbench-scenario__tab--active {
  color: var(--text-0);
  background-color: var(--smelter-forge);
}

.workbench-scenario__tab-content {
  padding: var(--space-4);
  background-color: var(--bg-2);
  border-radius: var(--radius-md);
  margin-top: var(--space-2);
}

.workbench-scenario__json {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-0);
  white-space: pre-wrap;
  overflow-x: auto;
}

.workbench-scenario__audio {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

/* Results Panel */
.workbench-results {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.workbench-results__progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.workbench-results__status {
  font-size: var(--text-sm);
  color: var(--text-1);
}

.workbench-results__metrics {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.workbench-results__metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.workbench-results__metric-label {
  font-size: var(--text-sm);
  color: var(--text-2);
}

.workbench-results__metric-value {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-0);
}

.workbench-results__logs {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.workbench-results__log-entry {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-1);
  padding: var(--space-1) var(--space-2);
  background-color: var(--bg-2);
  border-radius: var(--radius-sm);
}

.workbench-results__quota {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.workbench-results__quota-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
}

/* Responsive */
@media (max-width: 1200px) {
  .workbench-lab__grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .workbench-lab__column--results {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .workbench-lab__grid {
    grid-template-columns: 1fr;
  }
  
  .workbench-scenario__grid {
    grid-template-columns: 1fr;
  }
}
`;
}

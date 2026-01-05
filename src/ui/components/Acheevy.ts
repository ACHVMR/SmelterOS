/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - ACHEEVY CONCIERGE
 * On-location AI assistant (formerly ii-Agent)
 * Wired through Circuit Box to all SmelterOS services
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { renderButton, renderWaveformBar, WaveformMode } from '../components';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type AcheevyState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface AcheevyMessage {
  id: string;
  role: 'user' | 'acheevy';
  content: string;
  timestamp: Date;
  attachments?: AcheevyAttachment[];
}

export interface AcheevyAttachment {
  type: 'code' | 'file' | 'link' | 'action';
  label: string;
  data: string;
}

export interface AcheevySuggestion {
  id: string;
  icon: string;
  label: string;
  action: string;
}

export interface AcheevyConfig {
  state: AcheevyState;
  messages: AcheevyMessage[];
  suggestions: AcheevySuggestion[];
  isExpanded: boolean;
  voiceEnabled: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SUGGESTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_ACHEEVY_SUGGESTIONS: AcheevySuggestion[] = [
  { id: 'deploy', icon: '🚀', label: 'Deploy to Cloud Run', action: 'deploy:cloudrun' },
  { id: 'test', icon: '🧪', label: 'Run test suite', action: 'test:all' },
  { id: 'status', icon: '📊', label: 'Check system status', action: 'status:check' },
  { id: 'help', icon: '❓', label: 'How can I help?', action: 'help:general' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ACHEEVY AVATAR
// ─────────────────────────────────────────────────────────────────────────────

export function renderAcheevyAvatar(state: AcheevyState): string {
  const stateClass = `acheevy-avatar--${state}`;
  return `
    <div class="acheevy-avatar ${stateClass}">
      <div class="acheevy-avatar__ring"></div>
      <div class="acheevy-avatar__core">
        <span class="acheevy-avatar__icon">🤖</span>
      </div>
      ${state === 'listening' || state === 'speaking' ? `
        <div class="acheevy-avatar__pulse"></div>
      ` : ''}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHEEVY MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────────────────────

function renderAcheevyMessage(message: AcheevyMessage): string {
  const isAcheevy = message.role === 'acheevy';
  
  const attachmentsHtml = message.attachments?.map(att => {
    const iconMap: Record<string, string> = {
      code: '📝',
      file: '📁',
      link: '🔗',
      action: '⚡'
    };
    return `
      <div class="acheevy-attachment acheevy-attachment--${att.type}">
        <span class="acheevy-attachment__icon">${iconMap[att.type]}</span>
        <span class="acheevy-attachment__label">${att.label}</span>
      </div>
    `;
  }).join('') || '';

  return `
    <div class="acheevy-message acheevy-message--${message.role}">
      ${isAcheevy ? renderAcheevyAvatar('idle') : ''}
      <div class="acheevy-message__bubble">
        <div class="acheevy-message__content">${message.content}</div>
        ${attachmentsHtml ? `<div class="acheevy-message__attachments">${attachmentsHtml}</div>` : ''}
        <span class="acheevy-message__time">${formatTime(message.timestamp)}</span>
      </div>
    </div>
  `;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHEEVY SUGGESTIONS
// ─────────────────────────────────────────────────────────────────────────────

function renderSuggestions(suggestions: AcheevySuggestion[]): string {
  const chips = suggestions.map(s => `
    <button class="acheevy-suggestion focus-ring" data-action="${s.action}">
      <span class="acheevy-suggestion__icon">${s.icon}</span>
      <span class="acheevy-suggestion__label">${s.label}</span>
    </button>
  `).join('');

  return `<div class="acheevy-suggestions">${chips}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHEEVY INPUT BAR
// ─────────────────────────────────────────────────────────────────────────────

function renderAcheevyInput(state: AcheevyState, voiceEnabled: boolean): string {
  const waveformMode: WaveformMode = state === 'listening' ? 'listening' : state === 'speaking' ? 'speaking' : 'idle';
  
  return `
    <div class="acheevy-input">
      ${voiceEnabled && (state === 'listening' || state === 'speaking') ? `
        <div class="acheevy-input__waveform">
          ${renderWaveformBar({ mode: waveformMode, amplitude: 0.7, colorVariant: 'core' })}
        </div>
      ` : `
        <input 
          type="text" 
          class="acheevy-input__field focus-ring" 
          placeholder="Ask ACHEEVY anything..."
          ${state === 'thinking' ? 'disabled' : ''}
        />
      `}
      
      <div class="acheevy-input__actions">
        ${voiceEnabled ? `
          <button class="acheevy-input__voice focus-ring ${state === 'listening' ? 'acheevy-input__voice--active' : ''}">
            🎤
          </button>
        ` : ''}
        ${renderButton({
          variant: 'primary',
          children: state === 'thinking' ? '...' : '→',
          loading: state === 'thinking',
          disabled: state === 'thinking'
        })}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHEEVY FLOATING WIDGET (Minimized)
// ─────────────────────────────────────────────────────────────────────────────

export function renderAcheevyWidget(config: AcheevyConfig): string {
  if (!config.isExpanded) {
    return `
      <button class="acheevy-widget focus-ring" aria-label="Open ACHEEVY">
        ${renderAcheevyAvatar(config.state)}
        <span class="acheevy-widget__label">ACHEEVY</span>
        ${config.state !== 'idle' ? `
          <span class="acheevy-widget__status acheevy-widget__status--${config.state}">
            ${config.state === 'listening' ? 'Listening...' : config.state === 'thinking' ? 'Thinking...' : 'Speaking...'}
          </span>
        ` : ''}
      </button>
    `;
  }

  return renderAcheevyPanel(config);
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHEEVY PANEL (Expanded)
// ─────────────────────────────────────────────────────────────────────────────

export function renderAcheevyPanel(config: AcheevyConfig): string {
  const messagesHtml = config.messages.map(renderAcheevyMessage).join('');

  return `
    <div class="acheevy-panel">
      <div class="acheevy-panel__header">
        <div class="acheevy-panel__title">
          ${renderAcheevyAvatar(config.state)}
          <div class="acheevy-panel__title-text">
            <span class="acheevy-panel__name">ACHEEVY</span>
            <span class="acheevy-panel__subtitle">Your SmelterOS Concierge</span>
          </div>
        </div>
        <button class="acheevy-panel__close focus-ring">×</button>
      </div>
      
      <div class="acheevy-panel__messages">
        ${messagesHtml || `
          <div class="acheevy-panel__empty">
            ${renderAcheevyAvatar('idle')}
            <p>Hi! I'm ACHEEVY, your SmelterOS concierge.</p>
            <p class="text-muted">How can I help you today?</p>
          </div>
        `}
      </div>
      
      ${renderSuggestions(config.suggestions)}
      ${renderAcheevyInput(config.state, config.voiceEnabled)}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHEEVY STYLES
// ─────────────────────────────────────────────────────────────────────────────

export function getAcheevyStyles(): string {
  return `
/* ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - ACHEEVY CONCIERGE STYLES
 * ═══════════════════════════════════════════════════════════════════════════ */

/* Avatar */
.acheevy-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.acheevy-avatar__ring {
  position: absolute;
  inset: 0;
  border: 2px solid var(--smelter-forge);
  border-radius: 50%;
  transition: all var(--transition-fast);
}

.acheevy-avatar--listening .acheevy-avatar__ring,
.acheevy-avatar--speaking .acheevy-avatar__ring {
  border-color: var(--smelter-core);
  box-shadow: var(--glow-core);
}

.acheevy-avatar--thinking .acheevy-avatar__ring {
  border-color: var(--smelter-compute);
  animation: acheevy-think 1s ease-in-out infinite;
}

.acheevy-avatar__core {
  position: absolute;
  inset: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-2), var(--bg-3));
  border-radius: 50%;
}

.acheevy-avatar__icon {
  font-size: var(--text-lg);
}

.acheevy-avatar__pulse {
  position: absolute;
  inset: -8px;
  border: 2px solid var(--smelter-core);
  border-radius: 50%;
  animation: acheevy-pulse 1.5s ease-out infinite;
}

@keyframes acheevy-pulse {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}

@keyframes acheevy-think {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(180deg); }
}

/* Floating Widget */
.acheevy-widget {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  background: linear-gradient(135deg, var(--bg-2), var(--bg-3));
  border: 1px solid var(--smelter-forge);
  border-radius: var(--radius-full);
  cursor: pointer;
  z-index: var(--z-modal);
  transition: all var(--transition-fast);
}

.acheevy-widget:hover {
  box-shadow: var(--glow-forge);
  transform: translateY(-2px);
}

.acheevy-widget__label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-0);
}

.acheevy-widget__status {
  font-size: var(--text-xs);
  color: var(--smelter-core);
  animation: acheevy-blink 1s ease-in-out infinite;
}

@keyframes acheevy-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Panel */
.acheevy-panel {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  width: 380px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-1);
  border: 1px solid var(--smelter-forge);
  border-radius: var(--radius-xl);
  box-shadow: var(--glow-forge), 0 20px 40px rgba(0, 0, 0, 0.4);
  z-index: var(--z-modal);
  overflow: hidden;
}

.acheevy-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background-color: var(--bg-2);
  border-bottom: 1px solid var(--stroke-0);
}

.acheevy-panel__title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.acheevy-panel__title-text {
  display: flex;
  flex-direction: column;
}

.acheevy-panel__name {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-0);
}

.acheevy-panel__subtitle {
  font-size: var(--text-xs);
  color: var(--text-2);
}

.acheevy-panel__close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-1);
  font-size: var(--text-lg);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.acheevy-panel__close:hover {
  background-color: var(--bg-3);
  color: var(--text-0);
}

.acheevy-panel__messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 200px;
}

.acheevy-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-3);
  padding: var(--space-8);
  color: var(--text-1);
}

/* Messages */
.acheevy-message {
  display: flex;
  gap: var(--space-3);
}

.acheevy-message--user {
  flex-direction: row-reverse;
}

.acheevy-message__bubble {
  max-width: 80%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  background-color: var(--bg-2);
}

.acheevy-message--user .acheevy-message__bubble {
  background-color: var(--smelter-forge);
  color: var(--text-0);
}

.acheevy-message__content {
  font-size: var(--text-sm);
  line-height: 1.5;
}

.acheevy-message__attachments {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.acheevy-attachment {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background-color: var(--bg-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--smelter-compute);
  cursor: pointer;
}

.acheevy-attachment:hover {
  background-color: var(--bg-1);
}

.acheevy-message__time {
  font-size: var(--text-xs);
  color: var(--text-2);
  margin-top: var(--space-1);
  display: block;
}

/* Suggestions */
.acheevy-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--stroke-0);
}

.acheevy-suggestion {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: var(--bg-2);
  border: 1px solid var(--stroke-0);
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--text-1);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.acheevy-suggestion:hover {
  border-color: var(--smelter-foundation);
  color: var(--text-0);
}

/* Input */
.acheevy-input {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background-color: var(--bg-2);
  border-top: 1px solid var(--stroke-0);
}

.acheevy-input__field {
  flex: 1;
  padding: var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--text-0);
  background-color: var(--bg-1);
  border: 1px solid var(--stroke-0);
  border-radius: var(--radius-md);
}

.acheevy-input__field::placeholder {
  color: var(--text-2);
}

.acheevy-input__field:focus {
  border-color: var(--smelter-foundation);
}

.acheevy-input__waveform {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.acheevy-input__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.acheevy-input__voice {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-1);
  border: 1px solid var(--stroke-0);
  border-radius: 50%;
  font-size: var(--text-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.acheevy-input__voice:hover {
  border-color: var(--smelter-core);
}

.acheevy-input__voice--active {
  background-color: var(--smelter-core);
  border-color: var(--smelter-core);
  box-shadow: var(--glow-core);
}

/* Responsive */
@media (max-width: 480px) {
  .acheevy-panel {
    right: var(--space-3);
    left: var(--space-3);
    bottom: var(--space-3);
    width: auto;
    max-height: 80vh;
  }
}
`;
}

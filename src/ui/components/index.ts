/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - SHARED UI COMPONENTS
 * Reusable component library for Auth, Workbench, CircuitBox, and dashboards
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type StatusTone = 'available' | 'beta' | 'healthy' | 'warning' | 'critical' | 'draft' | 'published';
export type WaveformMode = 'listening' | 'speaking' | 'idle';
export type PanelTone = 'default' | 'core' | 'compute' | 'research' | 'forge' | 'shielding';

export interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'search';
  leadingIcon?: string;
  trailingIcon?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
}

export interface ButtonProps {
  variant: ButtonVariant;
  children: string;
  onClick?: () => void;
  leftIcon?: string;
  rightIcon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  statusText?: string;
  disabled?: boolean;
}

export interface StatusPillProps {
  tone: StatusTone;
  text: string;
}

export interface WaveformBarProps {
  mode: WaveformMode;
  amplitude: number; // 0-1
  colorVariant?: 'core' | 'compute' | 'research';
}

export interface PanelCardProps {
  title: string;
  icon?: string;
  toolbarSlot?: string; // HTML string for toolbar
  children: string; // HTML content
  tone?: PanelTone;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT RENDERERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TextField Component
 * Styled input with label, icons, and validation states
 */
export function renderTextField(props: TextFieldProps): string {
  const {
    id,
    label,
    value,
    placeholder = '',
    type = 'text',
    leadingIcon,
    trailingIcon,
    helperText,
    errorText,
    disabled = false
  } = props;

  const stateClass = errorText ? 'smelter-textfield--error' : '';
  const disabledClass = disabled ? 'smelter-textfield--disabled' : '';

  return `
    <div class="smelter-textfield ${stateClass} ${disabledClass}">
      <label class="smelter-textfield__label" for="${id}">${label}</label>
      <div class="smelter-textfield__wrapper">
        ${leadingIcon ? `<span class="smelter-textfield__icon smelter-textfield__icon--leading">${leadingIcon}</span>` : ''}
        <input
          type="${type}"
          id="${id}"
          name="${id}"
          class="smelter-textfield__input focus-ring"
          value="${value}"
          placeholder="${placeholder}"
          ${disabled ? 'disabled' : ''}
        />
        ${trailingIcon ? `<span class="smelter-textfield__icon smelter-textfield__icon--trailing">${trailingIcon}</span>` : ''}
      </div>
      ${errorText ? `<span class="smelter-textfield__error">${errorText}</span>` : ''}
      ${helperText && !errorText ? `<span class="smelter-textfield__helper">${helperText}</span>` : ''}
    </div>
  `;
}

/**
 * Button Component (Primary, Secondary, Danger, Ghost variants)
 */
export function renderButton(props: ButtonProps): string {
  const {
    variant,
    children,
    leftIcon,
    rightIcon,
    loading = false,
    disabled = false,
    fullWidth = false
  } = props;

  const loadingSpinner = `<span class="smelter-button__spinner"></span>`;
  const widthClass = fullWidth ? 'smelter-button--full' : '';

  return `
    <button 
      class="smelter-button smelter-button--${variant} ${widthClass} focus-ring"
      ${disabled || loading ? 'disabled' : ''}
    >
      ${loading ? loadingSpinner : ''}
      ${leftIcon && !loading ? `<span class="smelter-button__icon">${leftIcon}</span>` : ''}
      <span class="smelter-button__text">${children}</span>
      ${rightIcon ? `<span class="smelter-button__icon">${rightIcon}</span>` : ''}
    </button>
  `;
}

/**
 * ToggleSwitch Component
 * ON state uses --smelter-research, OFF uses muted border
 */
export function renderToggleSwitch(props: ToggleSwitchProps): string {
  const { id, checked, label, statusText, disabled = false } = props;

  return `
    <div class="smelter-toggle ${disabled ? 'smelter-toggle--disabled' : ''}">
      <label class="smelter-toggle__wrapper" for="${id}">
        <input 
          type="checkbox" 
          id="${id}" 
          class="smelter-toggle__input"
          ${checked ? 'checked' : ''}
          ${disabled ? 'disabled' : ''}
        />
        <span class="smelter-toggle__track">
          <span class="smelter-toggle__thumb"></span>
        </span>
        <span class="smelter-toggle__label">${label}</span>
        ${statusText ? `<span class="smelter-toggle__status">${statusText}</span>` : ''}
      </label>
    </div>
  `;
}

/**
 * StatusPill Component
 * Color-coded status badges
 */
export function renderStatusPill(props: StatusPillProps): string {
  const { tone, text } = props;
  return `<span class="smelter-pill smelter-pill--${tone}">${text}</span>`;
}

/**
 * WaveformBar Component
 * Animated audio visualization for voice features
 */
export function renderWaveformBar(props: WaveformBarProps): string {
  const { mode, amplitude, colorVariant = 'core' } = props;
  const barCount = 12;
  
  const bars = Array.from({ length: barCount }, (_, i) => {
    const height = mode === 'idle' 
      ? 20 
      : Math.max(15, Math.min(100, amplitude * 100 * (0.5 + Math.random() * 0.5)));
    return `<span class="smelter-waveform__bar" style="height: ${height}%"></span>`;
  }).join('');

  return `
    <div class="smelter-waveform smelter-waveform--${mode} smelter-waveform--${colorVariant}">
      <div class="smelter-waveform__bars">${bars}</div>
      <span class="smelter-waveform__label">${mode === 'listening' ? 'Listening...' : mode === 'speaking' ? 'Speaking...' : 'Ready'}</span>
    </div>
  `;
}

/**
 * PanelCard Component
 * Metal plate style panel with circuit traces and edge glow
 */
export function renderPanelCard(props: PanelCardProps): string {
  const { title, icon, toolbarSlot, children, tone = 'default' } = props;

  return `
    <div class="smelter-panel smelter-panel--${tone}">
      <div class="smelter-panel__header">
        <div class="smelter-panel__title-row">
          ${icon ? `<span class="smelter-panel__icon">${icon}</span>` : ''}
          <h3 class="smelter-panel__title">${title}</h3>
        </div>
        ${toolbarSlot ? `<div class="smelter-panel__toolbar">${toolbarSlot}</div>` : ''}
      </div>
      <div class="smelter-panel__content">${children}</div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LoadBar Component
 * Horizontal progress indicator with glow
 */
export function renderLoadBar(percent: number, tone: 'research' | 'governance' | 'shielding' = 'research'): string {
  return `
    <div class="smelter-loadbar">
      <div class="smelter-loadbar__track">
        <div class="smelter-loadbar__fill smelter-loadbar__fill--${tone}" style="width: ${percent}%"></div>
      </div>
      <span class="smelter-loadbar__value">${percent}%</span>
    </div>
  `;
}

/**
 * Divider Component
 */
export function renderDivider(text?: string): string {
  if (text) {
    return `
      <div class="smelter-divider smelter-divider--text">
        <span class="smelter-divider__line"></span>
        <span class="smelter-divider__text">${text}</span>
        <span class="smelter-divider__line"></span>
      </div>
    `;
  }
  return `<div class="smelter-divider"></div>`;
}

/**
 * Checkbox Component
 */
export function renderCheckbox(id: string, label: string, checked: boolean = false): string {
  return `
    <label class="smelter-checkbox" for="${id}">
      <input type="checkbox" id="${id}" class="smelter-checkbox__input" ${checked ? 'checked' : ''} />
      <span class="smelter-checkbox__box"></span>
      <span class="smelter-checkbox__label">${label}</span>
    </label>
  `;
}

/**
 * Link Button Component
 */
export function renderLinkButton(text: string, href: string = '#'): string {
  return `<a href="${href}" class="smelter-link">${text}</a>`;
}

/**
 * Stepper Component
 */
export function renderStepper(steps: string[], currentStep: number): string {
  const stepItems = steps.map((step, i) => {
    const state = i < currentStep ? 'completed' : i === currentStep ? 'active' : 'pending';
    return `
      <div class="smelter-stepper__step smelter-stepper__step--${state}">
        <span class="smelter-stepper__number">${i + 1}</span>
        <span class="smelter-stepper__label">${step}</span>
      </div>
    `;
  }).join('<span class="smelter-stepper__connector"></span>');

  return `<div class="smelter-stepper">${stepItems}</div>`;
}

/**
 * OAuthButton Component
 */
export function renderOAuthButton(provider: 'github' | 'google'): string {
  const icons: Record<string, string> = {
    github: '⬡', // Placeholder - replace with SVG
    google: '◉'  // Placeholder - replace with SVG
  };
  
  const labels: Record<string, string> = {
    github: 'Continue with GitHub',
    google: 'Continue with Google'
  };

  return `
    <button class="smelter-oauth smelter-oauth--${provider} focus-ring">
      <span class="smelter-oauth__icon">${icons[provider]}</span>
      <span class="smelter-oauth__text">${labels[provider]}</span>
    </button>
  `;
}

/**
 * VoiceSignInButton Component
 */
export function renderVoiceSignInButton(mode: WaveformMode = 'idle'): string {
  return `
    <button class="smelter-voice-btn focus-ring">
      <span class="smelter-voice-btn__icon">🎤</span>
      <span class="smelter-voice-btn__text">Voice Sign In</span>
      <div class="smelter-voice-btn__waveform">
        ${renderWaveformBar({ mode, amplitude: 0.5, colorVariant: 'core' })}
      </div>
    </button>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT CSS EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function getComponentStyles(): string {
  return `
/* ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - COMPONENT STYLES
 * All colors via CSS variables - no hardcoded hex values
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
 * TextField
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-textfield {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.smelter-textfield__label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-1);
}

.smelter-textfield__wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.smelter-textfield__input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-sans);
  font-size: var(--text-md);
  color: var(--text-0);
  background-color: var(--bg-2);
  border: 1px solid var(--stroke-0);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.smelter-textfield__input::placeholder {
  color: var(--text-2);
}

.smelter-textfield__input:focus {
  border-color: var(--smelter-foundation);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--smelter-foundation) 25%, transparent);
}

.smelter-textfield--error .smelter-textfield__input {
  border-color: var(--smelter-shielding);
}

.smelter-textfield--error .smelter-textfield__input:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--smelter-shielding) 25%, transparent);
}

.smelter-textfield__icon {
  position: absolute;
  color: var(--text-2);
  font-size: var(--text-lg);
}

.smelter-textfield__icon--leading {
  left: var(--space-3);
}

.smelter-textfield__icon--trailing {
  right: var(--space-3);
}

.smelter-textfield__wrapper:has(.smelter-textfield__icon--leading) .smelter-textfield__input {
  padding-left: var(--space-10);
}

.smelter-textfield__wrapper:has(.smelter-textfield__icon--trailing) .smelter-textfield__input {
  padding-right: var(--space-10);
}

.smelter-textfield__helper {
  font-size: var(--text-xs);
  color: var(--text-2);
}

.smelter-textfield__error {
  font-size: var(--text-xs);
  color: var(--smelter-shielding);
}

.smelter-textfield--disabled .smelter-textfield__input {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Button
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.smelter-button--full {
  width: 100%;
}

.smelter-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Primary */
.smelter-button--primary {
  color: var(--bg-0);
  background: linear-gradient(135deg, var(--smelter-core), var(--smelter-foundation));
  box-shadow: var(--glow-core);
}

.smelter-button--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--smelter-foundation), var(--smelter-core));
  box-shadow: var(--glow-soft);
}

/* Secondary */
.smelter-button--secondary {
  color: var(--text-0);
  background-color: var(--bg-2);
  border: 1px solid var(--stroke-1);
}

.smelter-button--secondary:hover:not(:disabled) {
  background-color: var(--bg-3);
  border-color: var(--smelter-foundation);
}

/* Danger */
.smelter-button--danger {
  color: var(--text-0);
  background-color: var(--smelter-shielding);
  box-shadow: var(--glow-shielding);
}

.smelter-button--danger:hover:not(:disabled) {
  filter: brightness(1.1);
}

/* Ghost */
.smelter-button--ghost {
  color: var(--text-1);
  background-color: transparent;
}

.smelter-button--ghost:hover:not(:disabled) {
  color: var(--text-0);
  background-color: var(--bg-2);
}

.smelter-button__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Toggle Switch
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-toggle__wrapper {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
}

.smelter-toggle__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.smelter-toggle__track {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: var(--bg-2);
  border: 1px solid var(--stroke-0);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.smelter-toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background-color: var(--text-2);
  border-radius: 50%;
  transition: all var(--transition-fast);
}

.smelter-toggle__input:checked + .smelter-toggle__track {
  background-color: var(--smelter-research);
  border-color: var(--smelter-research);
  box-shadow: var(--glow-research);
}

.smelter-toggle__input:checked + .smelter-toggle__track .smelter-toggle__thumb {
  left: 22px;
  background-color: var(--text-0);
}

.smelter-toggle__label {
  font-size: var(--text-sm);
  color: var(--text-0);
}

.smelter-toggle__status {
  font-size: var(--text-xs);
  color: var(--text-2);
  margin-left: auto;
}

.smelter-toggle--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Status Pill
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-pill {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: 500;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.smelter-pill--available,
.smelter-pill--healthy,
.smelter-pill--published {
  color: var(--smelter-research);
  background-color: color-mix(in srgb, var(--smelter-research) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--smelter-research) 40%, transparent);
}

.smelter-pill--beta,
.smelter-pill--warning,
.smelter-pill--draft {
  color: var(--smelter-governance);
  background-color: color-mix(in srgb, var(--smelter-governance) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--smelter-governance) 40%, transparent);
}

.smelter-pill--critical {
  color: var(--smelter-shielding);
  background-color: color-mix(in srgb, var(--smelter-shielding) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--smelter-shielding) 40%, transparent);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Waveform Bar
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-waveform {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.smelter-waveform__bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  height: 32px;
}

.smelter-waveform__bar {
  width: 4px;
  min-height: 4px;
  border-radius: var(--radius-sm);
  transition: height 0.1s ease;
}

.smelter-waveform--core .smelter-waveform__bar {
  background-color: var(--smelter-core);
  box-shadow: 0 0 6px var(--smelter-core);
}

.smelter-waveform--compute .smelter-waveform__bar {
  background-color: var(--smelter-compute);
  box-shadow: 0 0 6px var(--smelter-compute);
}

.smelter-waveform--research .smelter-waveform__bar {
  background-color: var(--smelter-research);
  box-shadow: 0 0 6px var(--smelter-research);
}

.smelter-waveform--idle .smelter-waveform__bar {
  opacity: 0.3;
}

.smelter-waveform--listening .smelter-waveform__bar {
  animation: waveform-pulse 0.5s ease-in-out infinite alternate;
}

.smelter-waveform--speaking .smelter-waveform__bar {
  animation: waveform-speak 0.3s ease-in-out infinite alternate;
}

@keyframes waveform-pulse {
  0% { transform: scaleY(0.8); }
  100% { transform: scaleY(1.2); }
}

@keyframes waveform-speak {
  0% { transform: scaleY(0.6); opacity: 0.7; }
  100% { transform: scaleY(1.4); opacity: 1; }
}

.smelter-waveform__label {
  font-size: var(--text-xs);
  color: var(--text-2);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Panel Card
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-panel {
  background-color: var(--bg-1);
  border: 1px solid var(--stroke-0);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.smelter-panel--core {
  border-color: color-mix(in srgb, var(--smelter-core) 40%, var(--stroke-0));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--smelter-core) 10%, transparent);
}

.smelter-panel--compute {
  border-color: color-mix(in srgb, var(--smelter-compute) 40%, var(--stroke-0));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--smelter-compute) 10%, transparent);
}

.smelter-panel--research {
  border-color: color-mix(in srgb, var(--smelter-research) 40%, var(--stroke-0));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--smelter-research) 10%, transparent);
}

.smelter-panel--forge {
  border-color: color-mix(in srgb, var(--smelter-forge) 40%, var(--stroke-0));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--smelter-forge) 10%, transparent);
}

.smelter-panel--shielding {
  border-color: color-mix(in srgb, var(--smelter-shielding) 40%, var(--stroke-0));
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--smelter-shielding) 10%, transparent);
}

.smelter-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background-color: var(--bg-2);
  border-bottom: 1px solid var(--stroke-0);
}

.smelter-panel__title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.smelter-panel__icon {
  font-size: var(--text-lg);
  color: var(--text-1);
}

.smelter-panel__title {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--text-0);
}

.smelter-panel__content {
  padding: var(--space-4);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Load Bar
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-loadbar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.smelter-loadbar__track {
  flex: 1;
  height: 6px;
  background-color: var(--bg-2);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.smelter-loadbar__fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.smelter-loadbar__fill--research {
  background-color: var(--smelter-research);
  box-shadow: 0 0 8px var(--smelter-research);
}

.smelter-loadbar__fill--governance {
  background-color: var(--smelter-governance);
  box-shadow: 0 0 8px var(--smelter-governance);
}

.smelter-loadbar__fill--shielding {
  background-color: var(--smelter-shielding);
  box-shadow: 0 0 8px var(--smelter-shielding);
}

.smelter-loadbar__value {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-2);
  min-width: 36px;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Divider
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-divider {
  height: 1px;
  background-color: var(--stroke-0);
  margin: var(--space-4) 0;
}

.smelter-divider--text {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  height: auto;
  background: none;
}

.smelter-divider__line {
  flex: 1;
  height: 1px;
  background-color: var(--stroke-0);
}

.smelter-divider__text {
  font-size: var(--text-xs);
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Checkbox
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.smelter-checkbox__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.smelter-checkbox__box {
  width: 18px;
  height: 18px;
  background-color: var(--bg-2);
  border: 1px solid var(--stroke-1);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.smelter-checkbox__box::after {
  content: '';
  width: 10px;
  height: 10px;
  background-color: var(--smelter-research);
  border-radius: 2px;
  transform: scale(0);
  transition: transform var(--transition-fast);
}

.smelter-checkbox__input:checked + .smelter-checkbox__box {
  border-color: var(--smelter-research);
}

.smelter-checkbox__input:checked + .smelter-checkbox__box::after {
  transform: scale(1);
}

.smelter-checkbox__label {
  font-size: var(--text-sm);
  color: var(--text-1);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Link
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-link {
  color: var(--smelter-compute);
  font-size: var(--text-sm);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.smelter-link:hover {
  color: var(--smelter-foundation);
  text-decoration: underline;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Stepper
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-stepper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.smelter-stepper__step {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.smelter-stepper__number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: 600;
  border-radius: 50%;
  transition: all var(--transition-fast);
}

.smelter-stepper__step--pending .smelter-stepper__number {
  background-color: var(--bg-2);
  color: var(--text-2);
  border: 1px solid var(--stroke-0);
}

.smelter-stepper__step--active .smelter-stepper__number {
  background-color: var(--smelter-core);
  color: var(--bg-0);
  box-shadow: var(--glow-core);
}

.smelter-stepper__step--completed .smelter-stepper__number {
  background-color: var(--smelter-research);
  color: var(--bg-0);
}

.smelter-stepper__label {
  font-size: var(--text-sm);
  color: var(--text-1);
}

.smelter-stepper__step--active .smelter-stepper__label {
  color: var(--text-0);
  font-weight: 500;
}

.smelter-stepper__connector {
  width: 24px;
  height: 2px;
  background-color: var(--stroke-0);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * OAuth Button
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-oauth {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-0);
  background-color: var(--bg-2);
  border: 1px solid var(--stroke-1);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.smelter-oauth:hover {
  background-color: var(--bg-3);
  border-color: var(--smelter-foundation);
}

.smelter-oauth__icon {
  font-size: var(--text-lg);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Voice Sign In Button
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-voice-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-0);
  background: linear-gradient(135deg, var(--bg-2), var(--bg-3));
  border: 1px solid var(--smelter-core);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.smelter-voice-btn:hover {
  box-shadow: var(--glow-core);
}

.smelter-voice-btn__icon {
  font-size: var(--text-xl);
}

.smelter-voice-btn__waveform {
  margin-left: auto;
}
`;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - AUTH GATE SCREEN
 * Split Login/Registration entry with OAuth and Voice Sign-In
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  renderTextField,
  renderButton,
  renderCheckbox,
  renderLinkButton,
  renderDivider,
  renderOAuthButton,
  renderVoiceSignInButton,
  renderStepper,
  renderPanelCard
} from '../components';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegistrationFormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  currentStep: number;
}

export interface AuthGateConfig {
  mode: 'login' | 'register';
  loginState?: LoginFormState;
  registerState?: RegistrationFormState;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PANEL
// ─────────────────────────────────────────────────────────────────────────────

export function renderLoginPanel(state: LoginFormState, error?: string): string {
  return renderPanelCard({
    title: 'Enter the Foundry',
    icon: '🔥',
    tone: 'core',
    children: `
      <form class="smelter-auth-form" id="login-form">
        ${error ? `<div class="smelter-auth-form__error">${error}</div>` : ''}
        
        <div class="smelter-auth-form__fields">
          ${renderTextField({
            id: 'login-email',
            label: 'Email or Username',
            value: state.email,
            placeholder: 'forge@smelter.io',
            type: 'email',
            leadingIcon: '📧',
            onChange: () => {}
          })}
          
          ${renderTextField({
            id: 'login-password',
            label: 'Password',
            value: state.password,
            placeholder: '••••••••••',
            type: 'password',
            leadingIcon: '🔒',
            trailingIcon: '👁',
            onChange: () => {}
          })}
        </div>
        
        <div class="smelter-auth-form__options">
          ${renderCheckbox('remember-me', 'Remember me', state.rememberMe)}
          ${renderLinkButton('Forgot password?', '/auth/forgot')}
        </div>
        
        ${renderButton({
          variant: 'primary',
          children: 'Enter SmelterOS',
          fullWidth: true
        })}
        
        ${renderDivider('OR')}
        
        <div class="smelter-auth-form__oauth">
          ${renderOAuthButton('github')}
          ${renderOAuthButton('google')}
        </div>
        
        <div class="smelter-auth-form__voice">
          ${renderVoiceSignInButton('idle')}
        </div>
      </form>
    `
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION PANEL
// ─────────────────────────────────────────────────────────────────────────────

export function renderRegistrationPanel(state: RegistrationFormState): string {
  const steps = ['Basic Info', 'Security', 'Confirm'];
  
  const stepContent = getRegistrationStepContent(state);
  
  return renderPanelCard({
    title: 'Enter the Foundry',
    icon: '⚒️',
    tone: 'core',
    children: `
      <form class="smelter-auth-form" id="register-form">
        ${renderStepper(steps, state.currentStep)}
        
        <div class="smelter-auth-form__step-content">
          ${stepContent}
        </div>
        
        <div class="smelter-auth-form__step-actions">
          ${state.currentStep > 0 ? renderButton({
            variant: 'ghost',
            children: 'Back'
          }) : ''}
          ${renderButton({
            variant: 'primary',
            children: state.currentStep < 2 ? 'Next Step' : 'Complete Registration',
            fullWidth: state.currentStep === 0
          })}
        </div>
      </form>
    `
  });
}

function getRegistrationStepContent(state: RegistrationFormState): string {
  switch (state.currentStep) {
    case 0: // Basic Info
      return `
        ${renderTextField({
          id: 'register-name',
          label: 'Full Name',
          value: state.fullName,
          placeholder: 'Foundry Master',
          leadingIcon: '👤',
          onChange: () => {}
        })}
        ${renderTextField({
          id: 'register-email',
          label: 'Email Address',
          value: state.email,
          placeholder: 'forge@smelter.io',
          type: 'email',
          leadingIcon: '📧',
          onChange: () => {}
        })}
      `;
    
    case 1: // Security
      return `
        ${renderTextField({
          id: 'register-password',
          label: 'Password',
          value: state.password,
          placeholder: 'Create a strong password',
          type: 'password',
          leadingIcon: '🔒',
          helperText: 'At least 12 characters with uppercase, lowercase, and numbers',
          onChange: () => {}
        })}
        ${renderTextField({
          id: 'register-confirm',
          label: 'Confirm Password',
          value: state.confirmPassword,
          placeholder: 'Confirm your password',
          type: 'password',
          leadingIcon: '🔒',
          onChange: () => {}
        })}
      `;
    
    case 2: // Confirm
      return `
        <div class="smelter-auth-form__confirmation">
          <div class="smelter-auth-form__confirm-row">
            <span class="smelter-auth-form__confirm-label">Name</span>
            <span class="smelter-auth-form__confirm-value">${state.fullName}</span>
          </div>
          <div class="smelter-auth-form__confirm-row">
            <span class="smelter-auth-form__confirm-label">Email</span>
            <span class="smelter-auth-form__confirm-value">${state.email}</span>
          </div>
          <div class="smelter-auth-form__terms">
            ${renderCheckbox('terms', 'I agree to the Terms of Service and Privacy Policy')}
          </div>
        </div>
      `;
    
    default:
      return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL AUTH GATE SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export function renderSmelterAuthGate(config: AuthGateConfig): string {
  const defaultLoginState: LoginFormState = {
    email: '',
    password: '',
    rememberMe: false
  };
  
  const defaultRegisterState: RegistrationFormState = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    currentStep: 0
  };

  return `
    <div class="smelter-authgate smelter-circuit-bg">
      <div class="smelter-authgate__container">
        <!-- Left: Login -->
        <div class="smelter-authgate__panel smelter-authgate__panel--login">
          ${renderLoginPanel(config.loginState || defaultLoginState, config.error)}
        </div>
        
        <!-- Divider -->
        <div class="smelter-authgate__divider">
          <div class="smelter-authgate__divider-line"></div>
          <div class="smelter-authgate__divider-badge">
            <span class="smelter-authgate__divider-icon">⚡</span>
          </div>
          <div class="smelter-authgate__divider-line"></div>
        </div>
        
        <!-- Right: Registration -->
        <div class="smelter-authgate__panel smelter-authgate__panel--register">
          ${renderRegistrationPanel(config.registerState || defaultRegisterState)}
        </div>
      </div>
      
      <!-- Footer -->
      <footer class="smelter-authgate__footer">
        <span>Powered by SmelterOS (ACHIEVEMOR)</span>
      </footer>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH GATE STYLES
// ─────────────────────────────────────────────────────────────────────────────

export function getAuthGateStyles(): string {
  return `
/* ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - AUTH GATE STYLES
 * ═══════════════════════════════════════════════════════════════════════════ */

.smelter-authgate {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background-color: var(--bg-0);
}

.smelter-authgate__container {
  display: flex;
  align-items: stretch;
  gap: var(--space-8);
  max-width: 1000px;
  width: 100%;
}

.smelter-authgate__panel {
  flex: 1;
  max-width: 440px;
}

.smelter-authgate__divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.smelter-authgate__divider-line {
  flex: 1;
  width: 2px;
  background: linear-gradient(180deg, transparent, var(--smelter-core), transparent);
  min-height: 100px;
}

.smelter-authgate__divider-badge {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-2);
  border: 2px solid var(--smelter-core);
  border-radius: 50%;
  box-shadow: var(--glow-core);
}

.smelter-authgate__divider-icon {
  font-size: var(--text-xl);
}

.smelter-authgate__footer {
  margin-top: var(--space-8);
  font-size: var(--text-sm);
  color: var(--text-2);
}

/* Auth Form */
.smelter-auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.smelter-auth-form__error {
  padding: var(--space-3) var(--space-4);
  background-color: color-mix(in srgb, var(--smelter-shielding) 15%, transparent);
  border: 1px solid var(--smelter-shielding);
  border-radius: var(--radius-md);
  color: var(--smelter-shielding);
  font-size: var(--text-sm);
}

.smelter-auth-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.smelter-auth-form__options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.smelter-auth-form__oauth {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.smelter-auth-form__voice {
  margin-top: var(--space-2);
}

.smelter-auth-form__step-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5) 0;
}

.smelter-auth-form__step-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  justify-content: flex-end;
}

.smelter-auth-form__confirmation {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  background-color: var(--bg-2);
  border-radius: var(--radius-md);
}

.smelter-auth-form__confirm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.smelter-auth-form__confirm-label {
  font-size: var(--text-sm);
  color: var(--text-2);
}

.smelter-auth-form__confirm-value {
  font-size: var(--text-sm);
  color: var(--text-0);
  font-weight: 500;
}

.smelter-auth-form__terms {
  padding-top: var(--space-4);
  border-top: 1px solid var(--stroke-0);
}

/* Responsive */
@media (max-width: 768px) {
  .smelter-authgate__container {
    flex-direction: column;
  }
  
  .smelter-authgate__panel {
    max-width: 100%;
  }
  
  .smelter-authgate__divider {
    flex-direction: row;
    width: 100%;
  }
  
  .smelter-authgate__divider-line {
    width: auto;
    height: 2px;
    flex: 1;
    min-height: auto;
    background: linear-gradient(90deg, transparent, var(--smelter-core), transparent);
  }
}
`;
}

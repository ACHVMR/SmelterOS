/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - APP SHELL LAYOUT
 * Reusable layout component with TopBar, LeftNav, Main, RightRail regions
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { renderButton, renderTextField } from '../components';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: string | number;
  isActive?: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  variant: 'primary' | 'secondary' | 'ghost';
}

export interface UserMenuData {
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
}

export interface AppShellConfig {
  currentPath: string;
  user: UserMenuData;
  quickActions?: QuickAction[];
  rightRailContent?: string;
  showRightRail?: boolean;
  navCollapsed?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION ITEMS (SmelterOS Branding)
// ─────────────────────────────────────────────────────────────────────────────

export const SMELTER_NAV_ITEMS: NavItem[] = [
  { id: 'foundry-home', label: 'Foundry Home', icon: '🏠', href: '/' },
  { id: 'academy', label: 'Academy', icon: '📚', href: '/academy' },
  { id: 'forge', label: 'Forge', icon: '🔨', href: '/forge' },
  { id: 'guild', label: 'Guild', icon: '👥', href: '/guild' },
  { id: 'workbench', label: 'Workbench', icon: '🧪', href: '/workbench' },
  { id: 'circuitbox', label: 'CircuitBox', icon: '⚡', href: '/circuitbox' },
  { id: 'pricing', label: 'Pricing', icon: '💳', href: '/pricing' },
];

// ─────────────────────────────────────────────────────────────────────────────
// BRAND MARK
// ─────────────────────────────────────────────────────────────────────────────

export function renderBrandMark(): string {
  return `
    <div class="smelter-brand">
      <div class="smelter-brand__logo">
        <svg viewBox="0 0 32 32" class="smelter-brand__icon">
          <!-- Stylized furnace/smelter icon -->
          <path d="M16 2L4 10v12l12 8 12-8V10L16 2z" fill="none" stroke="var(--smelter-core)" stroke-width="2"/>
          <path d="M16 8L8 13v6l8 5 8-5v-6L16 8z" fill="var(--smelter-core)" opacity="0.3"/>
          <circle cx="16" cy="16" r="4" fill="var(--smelter-core)"/>
          <path d="M16 12v-4M12 14l-2-2M20 14l2-2M16 20v4" stroke="var(--smelter-foundation)" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="smelter-brand__wordmark">SmelterOS</span>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP BAR
// ─────────────────────────────────────────────────────────────────────────────

export function renderTopBar(config: AppShellConfig): string {
  const { user, quickActions = [] } = config;

  const quickActionButtons = quickActions.map(action => 
    renderButton({
      variant: action.variant,
      children: action.label,
      leftIcon: action.icon
    })
  ).join('');

  return `
    <header class="smelter-topbar">
      <!-- Brand -->
      <div class="smelter-topbar__brand">
        ${renderBrandMark()}
      </div>

      <!-- Global Search -->
      <div class="smelter-topbar__search">
        ${renderTextField({
          id: 'global-search',
          label: '',
          value: '',
          placeholder: 'Find tools, agents, repos...',
          type: 'search',
          leadingIcon: '🔍',
          onChange: () => {}
        })}
      </div>

      <!-- Quick Actions -->
      <div class="smelter-topbar__actions">
        ${quickActionButtons}
        
        <!-- User Menu -->
        <button class="smelter-topbar__user focus-ring">
          ${user.avatarUrl 
            ? `<img src="${user.avatarUrl}" alt="${user.name}" class="smelter-topbar__avatar" />`
            : `<span class="smelter-topbar__avatar smelter-topbar__avatar--initials">${user.initials}</span>`
          }
        </button>
      </div>
    </header>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEFT NAV
// ─────────────────────────────────────────────────────────────────────────────

export function renderLeftNav(config: AppShellConfig): string {
  const { currentPath, navCollapsed = false } = config;

  const navItems = SMELTER_NAV_ITEMS.map(item => {
    const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
    return `
      <a href="${item.href}" class="smelter-nav__item ${isActive ? 'smelter-nav__item--active' : ''}">
        <span class="smelter-nav__icon">${item.icon}</span>
        ${!navCollapsed ? `<span class="smelter-nav__label">${item.label}</span>` : ''}
        ${item.badge && !navCollapsed ? `<span class="smelter-nav__badge">${item.badge}</span>` : ''}
      </a>
    `;
  }).join('');

  return `
    <nav class="smelter-nav ${navCollapsed ? 'smelter-nav--collapsed' : ''}">
      <div class="smelter-nav__items">
        ${navItems}
      </div>
      
      <!-- ACHEEVY Concierge -->
      <div class="smelter-nav__concierge">
        <button class="smelter-acheevy-btn focus-ring">
          <span class="smelter-acheevy-btn__icon">🤖</span>
          ${!navCollapsed ? `<span class="smelter-acheevy-btn__text">Ask ACHEEVY</span>` : ''}
        </button>
      </div>
      
      <button class="smelter-nav__toggle focus-ring">
        ${navCollapsed ? '→' : '←'}
      </button>
    </nav>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// RIGHT RAIL
// ─────────────────────────────────────────────────────────────────────────────

export function renderRightRail(content: string): string {
  return `
    <aside class="smelter-rightrail">
      <div class="smelter-rightrail__header">
        <span class="smelter-rightrail__title">Live Feed</span>
        <button class="smelter-rightrail__close focus-ring">×</button>
      </div>
      <div class="smelter-rightrail__content">
        ${content}
      </div>
    </aside>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CONTENT WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

export function renderMain(content: string): string {
  return `
    <main class="smelter-main">
      ${content}
    </main>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL APP SHELL
// ─────────────────────────────────────────────────────────────────────────────

export function renderSmelterAppShell(config: AppShellConfig, mainContent: string): string {
  const { showRightRail = false, rightRailContent = '' } = config;

  return `
    <div class="smelter-shell smelter-circuit-bg">
      ${renderTopBar(config)}
      
      <div class="smelter-shell__body">
        ${renderLeftNav(config)}
        ${renderMain(mainContent)}
        ${showRightRail ? renderRightRail(rightRailContent) : ''}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL STYLES
// ─────────────────────────────────────────────────────────────────────────────

export function getAppShellStyles(): string {
  return `
/* ═══════════════════════════════════════════════════════════════════════════
 * SMELTER OS - APP SHELL STYLES
 * ═══════════════════════════════════════════════════════════════════════════ */

.smelter-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-0);
}

.smelter-shell__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Brand Mark
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.smelter-brand__logo {
  width: 36px;
  height: 36px;
}

.smelter-brand__icon {
  width: 100%;
  height: 100%;
}

.smelter-brand__wordmark {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-0);
  letter-spacing: -0.5px;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Top Bar
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-topbar {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-3) var(--space-6);
  background-color: var(--bg-1);
  border-bottom: 1px solid var(--stroke-0);
  height: 64px;
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.smelter-topbar__brand {
  flex-shrink: 0;
}

.smelter-topbar__search {
  flex: 1;
  max-width: 480px;
}

.smelter-topbar__search .smelter-textfield {
  gap: 0;
}

.smelter-topbar__search .smelter-textfield__label {
  display: none;
}

.smelter-topbar__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-left: auto;
}

.smelter-topbar__user {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--bg-2);
  border: 2px solid var(--stroke-1);
  cursor: pointer;
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.smelter-topbar__user:hover {
  border-color: var(--smelter-foundation);
}

.smelter-topbar__avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.smelter-topbar__avatar--initials {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-0);
  background: linear-gradient(135deg, var(--smelter-core), var(--smelter-foundation));
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Left Nav
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-nav {
  display: flex;
  flex-direction: column;
  width: 240px;
  background-color: var(--bg-1);
  border-right: 1px solid var(--stroke-0);
  padding: var(--space-4);
  transition: width var(--transition-normal);
}

.smelter-nav--collapsed {
  width: 72px;
}

.smelter-nav__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}

.smelter-nav__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  color: var(--text-1);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.smelter-nav__item:hover {
  color: var(--text-0);
  background-color: var(--bg-2);
}

.smelter-nav__item--active {
  color: var(--smelter-core);
  background-color: color-mix(in srgb, var(--smelter-core) 10%, transparent);
  border-left: 3px solid var(--smelter-core);
}

.smelter-nav__icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.smelter-nav__label {
  font-size: var(--text-sm);
  font-weight: 500;
}

.smelter-nav__badge {
  margin-left: auto;
  font-size: var(--text-xs);
  padding: 2px 6px;
  background-color: var(--smelter-core);
  color: var(--bg-0);
  border-radius: var(--radius-full);
}

.smelter-nav__concierge {
  padding-top: var(--space-4);
  border-top: 1px solid var(--stroke-0);
  margin-top: var(--space-4);
}

.smelter-acheevy-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, var(--bg-2), var(--bg-3));
  border: 1px solid var(--smelter-forge);
  border-radius: var(--radius-lg);
  color: var(--text-0);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.smelter-acheevy-btn:hover {
  box-shadow: var(--glow-forge);
}

.smelter-acheevy-btn__icon {
  font-size: var(--text-lg);
}

.smelter-nav__toggle {
  padding: var(--space-2);
  background-color: var(--bg-2);
  border: 1px solid var(--stroke-0);
  border-radius: var(--radius-md);
  color: var(--text-1);
  cursor: pointer;
  margin-top: var(--space-4);
  transition: all var(--transition-fast);
}

.smelter-nav__toggle:hover {
  color: var(--text-0);
  border-color: var(--smelter-foundation);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Content
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-main {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Right Rail
 * ───────────────────────────────────────────────────────────────────────────── */

.smelter-rightrail {
  width: 320px;
  background-color: var(--bg-1);
  border-left: 1px solid var(--stroke-0);
  display: flex;
  flex-direction: column;
}

.smelter-rightrail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--stroke-0);
}

.smelter-rightrail__title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-0);
}

.smelter-rightrail__close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-1);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.smelter-rightrail__close:hover {
  background-color: var(--bg-2);
  color: var(--text-0);
}

.smelter-rightrail__content {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
}
`;
}

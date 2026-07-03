/**
 * Glicose AI - Global Styles
 * Design tokens for premium health-tech aesthetic
 */

export const globalStyles = `
:root {
  /* Colors - Light Mode */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #f1f5f9;
  --color-border-subtle: #e2e8f0;
  --color-border-default: #cbd5e1;
  --color-border-focus: #3b82f6;

  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;

  --color-accent-primary: #3b82f6;
  --color-accent-positive: #22c55e;
  --color-accent-negative: #ef4444;

  --color-surface-primary: #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-surface-hover: #f1f5f9;
  --color-surface-selected: #eff6ff;

  --color-focus-ring: rgba(59, 130, 246, 0.4);

  /* Icon colors */
  --icon-color: currentColor;
  --icon-stroke: 1.75;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #0f172a;
    --color-bg-secondary: #1e293b;
    --color-bg-tertiary: #334155;
    --color-border-subtle: #334155;
    --color-border-default: #475569;
    --color-border-focus: #60a5fa;

    --color-text-primary: #f8fafc;
    --color-text-secondary: #cbd5e1;
    --color-text-muted: #64748b;

    --color-accent-primary: #60a5fa;
    --color-accent-positive: #4ade80;
    --color-accent-negative: #f87171;

    --color-surface-primary: #1e293b;
    --color-surface-secondary: #334155;
    --color-surface-hover: #475569;
    --color-surface-selected: #1e3a5f;

    --color-focus-ring: rgba(96, 165, 250, 0.4);
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ==========================================================================
   SIDEBAR NAVIGATION
   ========================================================================== */

.sidebar-nav {
  width: 260px;
  padding: var(--space-4) var(--space-3);
  background: var(--color-surface-primary);
  border-right: 1px solid var(--color-border-subtle);
  height: 100vh;
  overflow-y: auto;
}

.sidebar-nav__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar-nav__item {
  display: block;
}

.sidebar-nav__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.sidebar-nav__link:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.sidebar-nav__link--active {
  background: var(--color-surface-selected);
  color: var(--color-accent-primary);
}

.sidebar-nav__link:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

/* ==========================================================================
   KPI CARDS
   ========================================================================== */

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-5);
  padding: var(--space-4) 0;
}

.kpi-card {
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition: box-shadow 0.2s ease, transform 0.15s ease;
}

.kpi-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.kpi-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.kpi-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--color-surface-tertiary);
  color: var(--color-accent-primary);
}

.kpi-card__trend {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 0.75rem;
  font-weight: 600;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-surface-secondary);
}

.kpi-card__trend--up {
  color: var(--color-accent-positive);
}

.kpi-card__trend--down {
  color: var(--color-accent-negative);
}

.kpi-card__trend--neutral {
  color: var(--color-text-muted);
}

.kpi-card__title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.kpi-card__value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

.kpi-card__unit {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.kpi-card__description {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}

/* ==========================================================================
   ICON BUTTONS
   ========================================================================== */

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  outline-offset: 2px;
}

.icon-button:focus-visible {
  outline: 2px solid var(--color-focus-ring);
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-button--sm {
  padding: var(--space-2) var(--space-3);
  font-size: 0.75rem;
}

.icon-button--md {
  padding: var(--space-2) var(--space-4);
  font-size: 0.875rem;
}

.icon-button--lg {
  padding: var(--space-3) var(--space-5);
  font-size: 1rem;
}

.icon-button--primary {
  background: var(--color-accent-primary);
  color: #ffffff;
}

.icon-button--primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.icon-button--secondary {
  background: var(--color-surface-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
}

.icon-button--secondary:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.icon-button--ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.icon-button--ghost:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.icon-button--danger {
  background: var(--color-accent-negative);
  color: #ffffff;
}

.icon-button--danger:hover:not(:disabled) {
  filter: brightness(1.1);
}

.icon-button__spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==========================================================================
   GLUCOSE FORM
   ========================================================================== */

.glucose-form {
  max-width: 420px;
  padding: var(--space-6);
  background: var(--color-surface-primary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-subtle);
}

.glucose-form__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-5);
}

.glucose-form__field {
  margin-bottom: var(--space-4);
}

.glucose-form__label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.glucose-form__input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: 1rem;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  background: var(--color-surface-primary);
  color: var(--color-text-primary);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.glucose-form__input:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
  outline: none;
}

.glucose-form__fieldset {
  border: none;
  padding: 0;
  margin: 0 0 var(--space-5) 0;
}

.glucose-form__legend {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.glucose-form__radio {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  cursor: pointer;
}

.glucose-form__radio input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-accent-primary);
}

.glucose-form__actions {
  display: flex;
  gap: var(--space-3);
  padding-top: var(--space-4);
}
`

export default globalStyles
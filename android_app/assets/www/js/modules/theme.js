import { get, set, KEYS } from './storage.js';

function getTheme() {
  return get(KEYS.THEME) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  set(KEYS.THEME, theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0f172a' : '#f8fafc';
}

function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

function initTheme() {
  applyTheme(getTheme());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!get(KEYS.THEME)) applyTheme(e.matches ? 'dark' : 'light');
  });
}

export { getTheme, applyTheme, toggleTheme, initTheme };

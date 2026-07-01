import { initTheme, toggleTheme, getTheme } from './modules/theme.js';
import { initRouter, navigate, register } from './modules/router.js';

const PAGE_TITLES = {
  dashboard: 'Glicose AI',
  glucose: 'Glicose',
  food: 'Diário Alimentar',
  insulin: 'Calculadora',
  charts: 'Gráficos',
  calendar: 'Calendário',
  reminders: 'Lembretes',
  settings: 'Configurações',
  ai: 'Assistente IA'
};

async function loadPage(name) {
  const res = await fetch(`/pages/${name}.html`);
  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const section = doc.querySelector('section');
  if (section && !document.getElementById(section.id)) {
    document.getElementById('pages-container').appendChild(section);
  }
}

async function initPages() {
  const pages = ['dashboard', 'glucose', 'food', 'insulin', 'charts', 'calendar', 'reminders', 'settings', 'ai'];
  await Promise.all(pages.map(loadPage));
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;
  btn.setAttribute('aria-label', theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
  btn.innerHTML = theme === 'dark'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

async function init() {
  initTheme();
  updateThemeIcon(getTheme());

  document.getElementById('btn-theme')?.addEventListener('click', () => {
    const theme = toggleTheme();
    updateThemeIcon(theme);
  });

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.nav));
  });

  await initPages();

  const modules = {
    dashboard: () => import('./modules/dashboard.js'),
    glucose: () => import('./modules/glucose.js'),
    food: () => import('./modules/food.js'),
    insulin: () => import('./modules/insulin.js'),
    charts: () => import('./modules/charts.js'),
    calendar: () => import('./modules/calendar.js'),
    reminders: () => import('./modules/reminders.js'),
    settings: () => import('./modules/settings.js'),
    ai: () => import('./modules/ai.js')
  };

  const initialized = new Set();
  const refreshers = {};

  Object.entries(modules).forEach(([name, loader]) => {
    register(name, () => {
      const titleEl = document.getElementById('header-title');
      if (titleEl) titleEl.textContent = PAGE_TITLES[name] || 'Glicose AI';
      if (!initialized.has(name)) {
        initialized.add(name);
        loader().then(mod => {
          if (mod) {
            mod.init?.();
            if (mod.refresh) refreshers[name] = mod.refresh;
          }
        }).catch(console.error);
      } else if (refreshers[name]) {
        refreshers[name]();
      }
    });
  });

  initRouter('dashboard');

  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.classList.add('hidden');
      setTimeout(() => splash.remove(), 400);
    }
  }, 800);

  registerServiceWorker();
}

document.addEventListener('DOMContentLoaded', init);

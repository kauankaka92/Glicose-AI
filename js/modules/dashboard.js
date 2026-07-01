import { KEYS, getList, getSettings, addItem } from './storage.js';
import { getGlucoseStatus, formatTime, formatRelative, isSameDay, nowISO, generateId, showToast } from './utils.js';
import { navigate } from './router.js';

function glucoseIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`;
}

function trendArrow(records) {
  if (records.length < 2) return { icon: '', label: 'Sem tendência', cls: '' };
  const last = records[0].value;
  const prev = records[1].value;
  const diff = last - prev;
  if (diff > 15) return { icon: '↑', label: 'Subindo', cls: 'glucose-high' };
  if (diff > 5)  return { icon: '↗', label: 'Subindo levemente', cls: 'glucose-high' };
  if (diff < -15) return { icon: '↓', label: 'Caindo', cls: 'glucose-low' };
  if (diff < -5)  return { icon: '↘', label: 'Caindo levemente', cls: 'glucose-low' };
  return { icon: '→', label: 'Estável', cls: 'glucose-normal' };
}

function todayStats(records) {
  const today = records.filter(r => isSameDay(r.date, new Date()));
  if (!today.length) return null;
  const values = today.map(r => r.value);
  return {
    count: today.length,
    avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

// ── Insights inteligentes ─────────────────────────────────────────────────

function buildInsight(records, settings) {
  if (!records.length) return null;

  const last7 = records.slice(0, 7);
  const values = last7.map(r => r.value);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const inRange = last7.filter(r => getGlucoseStatus(r.value, settings).key === 'normal').length;
  const pct = Math.round((inRange / last7.length) * 100);

  const trend = trendArrow(records);
  const latest = records[0];
  const status = getGlucoseStatus(latest.value, settings);

  // Tendência de alta
  if (records.length >= 3) {
    const last3 = records.slice(0, 3).map(r => r.value);
    const allRising = last3[0] > last3[1] && last3[1] > last3[2];
    const allFalling = last3[0] < last3[1] && last3[1] < last3[2];

    if (allRising && latest.value > settings.targetMax) {
      return { type: 'rising', icon: '📈', text: `<strong>Tendência de alta</strong> nas últimas 3 medições. Média: ${avg} mg/dL.` };
    }
    if (allFalling && latest.value < settings.targetMin) {
      return { type: 'falling', icon: '📉', text: `<strong>Tendência de queda</strong> nas últimas 3 medições. Fique atento à hipoglicemia.` };
    }
  }

  // Alta porcentagem no alvo
  if (pct >= 80) {
    return { type: 'stable', icon: '✅', text: `<strong>${pct}% das medições</strong> no alvo nas últimas ${last7.length}. Ótimo controle!` };
  }

  // Glicose atual crítica
  if (status.key === 'very-low' || status.key === 'low') {
    return { type: 'falling', icon: '⚠️', text: `<strong>Glicose baixa agora (${latest.value} mg/dL).</strong> Considere ingerir carboidratos de rápida absorção.` };
  }

  if (status.key === 'very-high') {
    return { type: 'rising', icon: '🔴', text: `<strong>Glicose muito alta (${latest.value} mg/dL).</strong> Verifique necessidade de correção.` };
  }

  // Estável
  if (trend.label === 'Estável' && status.key === 'normal') {
    return { type: 'stable', icon: '🎯', text: `<strong>Estável nas últimas medições.</strong> Glicose dentro da meta.` };
  }

  return { type: 'info', icon: '💡', text: `Média das últimas ${last7.length} medições: <strong>${avg} mg/dL</strong>. ${pct}% no alvo.` };
}

// ── Render sections ───────────────────────────────────────────────────────

function renderGreeting(settings) {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const name = settings.name ? `, ${settings.name.split(' ')[0]}` : '';
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

  return `
    <div class="dash-greeting">
      <div>
        <div class="dash-greeting-text">${greeting}${name} 👋</div>
        <div class="dash-greeting-sub">Seu painel de saúde</div>
      </div>
      <span class="dash-date-badge">${today}</span>
    </div>`;
}

function renderInsight(records, settings) {
  const insight = buildInsight(records, settings);
  if (!insight) return '';
  return `
    <div class="dash-insight dash-insight--${insight.type}" role="status" aria-label="Insight de saúde">
      <div class="dash-insight-icon" aria-hidden="true">${insight.icon}</div>
      <p class="dash-insight-text">${insight.text}</p>
    </div>`;
}

function renderCurrentGlucose(records, settings) {
  if (!records.length) {
    return `
      <div class="dash-glucose-card card" id="dash-glucose-empty">
        <div class="dash-glucose-empty">
          <div class="dash-glucose-icon-wrap" aria-hidden="true">${glucoseIcon()}</div>
          <div>
            <p class="dash-no-reading">Nenhuma medição registrada</p>
            <p class="dash-no-reading-sub">Registre sua glicose agora</p>
          </div>
        </div>
        <button class="btn btn-primary btn-full mt-16" id="dash-btn-add-glucose" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Registrar Glicose
        </button>
      </div>`;
  }

  const latest = records[0];
  const status = getGlucoseStatus(latest.value, settings);
  const trend = trendArrow(records);
  const isToday = isSameDay(latest.date, new Date());
  const badgeClass = status.key === 'normal' ? 'success' : (status.key === 'high' || status.key === 'very-high') ? 'warning' : 'danger';

  return `
    <div class="dash-glucose-card card dash-glucose-card--${status.key}">
      <div class="dash-glucose-header">
        <span class="card-title">Glicose Atual</span>
        <span class="badge badge-${badgeClass}">${status.label}</span>
      </div>
      <div class="dash-glucose-body">
        <div class="dash-glucose-value-wrap">
          <span class="dash-glucose-value ${status.class}" aria-label="${latest.value} miligramas por decilitro">${latest.value}</span>
          <span class="dash-glucose-unit">${settings.unit || 'mg/dL'}</span>
          ${trend.icon ? `<span class="dash-trend ${trend.cls}" aria-label="${trend.label}" title="${trend.label}">${trend.icon}</span>` : ''}
        </div>
        <div class="dash-glucose-meta">
          <span class="dash-glucose-time">${isToday ? formatTime(latest.date) : formatRelative(latest.date)}</span>
          ${latest.period ? `<span class="dash-glucose-period">${latest.period}</span>` : ''}
        </div>
      </div>
      <div class="dash-range-bar" role="img" aria-label="Barra de faixa glicêmica">
        <div class="dash-range-track">
          <div class="dash-range-fill" style="--pct:${Math.min(100, Math.max(0, ((latest.value - 40) / (360 - 40)) * 100))}%"></div>
          <div class="dash-range-marker dash-range-low" style="left:${((settings.targetMin - 40) / 320) * 100}%" aria-hidden="true"></div>
          <div class="dash-range-marker dash-range-high" style="left:${((settings.targetMax - 40) / 320) * 100}%" aria-hidden="true"></div>
        </div>
        <div class="dash-range-labels" aria-hidden="true">
          <span>${settings.targetMin}</span>
          <span>Meta</span>
          <span>${settings.targetMax}</span>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm dash-btn-new" id="dash-btn-add-glucose" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nova Medição
      </button>
    </div>`;
}

function renderTodayStats(records, settings) {
  const stats = todayStats(records);
  if (!stats) return '';
  const avgStatus = getGlucoseStatus(stats.avg, settings);
  return `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Hoje</h2>
        <span class="text-sm text-muted">${stats.count} medição${stats.count !== 1 ? 'ões' : ''}</span>
      </div>
      <div class="dash-stats-grid">
        <div class="card dash-stat-card">
          <span class="dash-stat-label">Média</span>
          <span class="dash-stat-val ${avgStatus.class}">${stats.avg}<span class="dash-stat-unit">mg/dL</span></span>
        </div>
        <div class="card dash-stat-card">
          <span class="dash-stat-label">Mínima</span>
          <span class="dash-stat-val ${getGlucoseStatus(stats.min, settings).class}">${stats.min}<span class="dash-stat-unit">mg/dL</span></span>
        </div>
        <div class="card dash-stat-card">
          <span class="dash-stat-label">Máxima</span>
          <span class="dash-stat-val ${getGlucoseStatus(stats.max, settings).class}">${stats.max}<span class="dash-stat-unit">mg/dL</span></span>
        </div>
      </div>
    </div>`;
}

function renderRecentReadings(records, settings) {
  const recent = records.slice(0, 5);
  if (!recent.length) return '';
  return `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Últimas Medições</h2>
        <button class="section-link" data-nav-link="glucose" type="button">Ver todas</button>
      </div>
      <div class="card" style="padding:0 16px;">
        ${recent.map(r => {
          const s = getGlucoseStatus(r.value, settings);
          const iconBg = s.key === 'normal' ? 'bg-glucose-normal' : (s.key === 'high' || s.key === 'very-high') ? 'bg-glucose-high' : 'bg-glucose-low';
          return `
            <div class="list-item">
              <div class="list-item-icon ${iconBg}" aria-hidden="true">${glucoseIcon()}</div>
              <div class="list-item-content">
                <span class="list-item-title">${r.period || 'Medição'}</span>
                <span class="list-item-subtitle">${formatRelative(r.date)}</span>
              </div>
              <div class="list-item-value">
                <span class="${s.class}">${r.value}</span>
                <span class="text-xs text-muted"> mg/dL</span>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderShortcuts() {
  const shortcuts = [
    { nav: 'glucose', label: 'Glicose', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>` },
    { nav: 'food', label: 'Dieta', color: '#10d98a', bg: 'rgba(16,217,138,0.12)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>` },
    { nav: 'insulin', label: 'Insulina', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m18 2 4 4"/><path d="m17 7 1-5"/><path d="M3 22 17 8"/><path d="m15 4 5 5"/><path d="m6 18 3.5-3.5"/></svg>` },
    { nav: 'charts', label: 'Gráficos', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>` },
    { nav: 'calendar', label: 'Calendário', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
    { nav: 'reminders', label: 'Lembretes', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>` },
  ];
  return `
    <div class="section">
      <h2 class="section-title" style="margin-bottom:12px;">Atalhos</h2>
      <div class="dash-shortcuts">
        ${shortcuts.map(s => `
          <button class="dash-shortcut" data-nav-link="${s.nav}" type="button" aria-label="Ir para ${s.label}">
            <div class="dash-shortcut-icon" style="background:${s.bg};color:${s.color}" aria-hidden="true">${s.icon}</div>
            <span class="dash-shortcut-label">${s.label}</span>
          </button>`).join('')}
      </div>
    </div>`;
}

function renderQuickAddModal(settings) {
  const periods = ['Jejum', 'Pré-almoço', 'Pós-almoço', 'Tarde', 'Jantar', 'Madrugada'];
  const h = new Date().getHours();
  let defaultPeriod = 'Jejum';
  if (h >= 10 && h < 12) defaultPeriod = 'Pré-almoço';
  else if (h >= 12 && h < 14) defaultPeriod = 'Pós-almoço';
  else if (h >= 14 && h < 18) defaultPeriod = 'Tarde';
  else if (h >= 18 && h < 21) defaultPeriod = 'Jantar';
  else if (h >= 21 || h < 5) defaultPeriod = 'Madrugada';

  return `
    <div class="modal-overlay" id="dash-quick-modal" role="dialog" aria-modal="true" aria-labelledby="dash-quick-title">
      <div class="modal">
        <div class="modal-handle" aria-hidden="true"></div>
        <h2 class="modal-title" id="dash-quick-title">Registrar Glicose</h2>
        <form id="dash-quick-form" novalidate>
          <div class="form-group" id="fg-value">
            <label class="form-label" for="dash-quick-value">Glicose (${settings.unit || 'mg/dL'})</label>
            <input class="form-input" id="dash-quick-value" type="number" inputmode="numeric" min="20" max="600" placeholder="Ex: 120" autocomplete="off" required />
            <span class="form-error">Informe um valor entre 20 e 600</span>
          </div>
          <div class="form-group">
            <label class="form-label" for="dash-quick-period">Período</label>
            <select class="form-select" id="dash-quick-period">
              ${periods.map(p => `<option value="${p}"${p === defaultPeriod ? ' selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="dash-quick-notes">Observações <span class="text-muted">(opcional)</span></label>
            <textarea class="form-textarea" id="dash-quick-notes" placeholder="Ex: após exercício..." rows="2"></textarea>
          </div>
          <div style="display:flex;gap:10px;margin-top:4px;">
            <button type="button" class="btn btn-secondary" style="flex:1" id="dash-quick-cancel">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="flex:2">Salvar</button>
          </div>
        </form>
      </div>
    </div>`;
}

// ── Events ────────────────────────────────────────────────────────────────

function openQuickAdd() {
  const overlay = document.getElementById('dash-quick-modal');
  if (overlay) { overlay.classList.add('open'); document.getElementById('dash-quick-value')?.focus(); }
}

function closeQuickAdd() {
  const overlay = document.getElementById('dash-quick-modal');
  if (overlay) overlay.classList.remove('open');
}

function bindEvents() {
  document.getElementById('dash-btn-add-glucose')?.addEventListener('click', openQuickAdd);
  document.getElementById('dash-quick-cancel')?.addEventListener('click', closeQuickAdd);

  document.getElementById('dash-quick-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeQuickAdd();
  });

  document.getElementById('dash-quick-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('dash-quick-value');
    const fg = document.getElementById('fg-value');
    const val = parseInt(input.value, 10);
    if (!val || val < 20 || val > 600) {
      fg.classList.add('has-error');
      input.focus();
      return;
    }
    fg.classList.remove('has-error');
    const period = document.getElementById('dash-quick-period').value;
    const notes = document.getElementById('dash-quick-notes').value.trim();
    const record = { id: generateId(), value: val, date: nowISO(), period, notes };
    addItem(KEYS.GLUCOSE, record);
    closeQuickAdd();
    showToast(`Glicose ${val} mg/dL registrada`, 'success');
    render();
  });

  document.querySelectorAll('[data-nav-link]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.navLink));
  });
}

// ── Render ────────────────────────────────────────────────────────────────

function render() {
  const el = document.getElementById('dashboard-content');
  if (!el) return;
  const records = getList(KEYS.GLUCOSE);
  const settings = getSettings();

  el.innerHTML = `
    ${renderGreeting(settings)}
    ${renderCurrentGlucose(records, settings)}
    ${renderInsight(records, settings)}
    ${renderTodayStats(records, settings)}
    ${renderShortcuts()}
    ${renderRecentReadings(records, settings)}
    ${renderQuickAddModal(settings)}
  `;

  bindEvents();
}

function init() {
  render();
  // Atualiza dashboard quando glicose é registrada via IA
  window.addEventListener('glucose:registered', () => render());
}

function refresh() { render(); }

export { init, refresh };

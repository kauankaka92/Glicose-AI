import { KEYS, getList, getSettings } from './storage.js';
import { formatTime, getGlucoseStatus, isSameDay } from './utils.js';

const state = { year: 0, month: 0, selectedDate: null };

function init() {
  const now = new Date();
  state.year = now.getFullYear();
  state.month = now.getMonth();
  state.selectedDate = null;
  renderPage();
  bindEvents();
}

function refresh() { renderPage(); }

// ── helpers ──────────────────────────────────────────────────────────────────

function recordsForMonth(list, year, month) {
  return list.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

function avgGlucoseForDay(glucoseList, date) {
  const recs = glucoseList.filter(r => isSameDay(r.date, date));
  if (!recs.length) return null;
  return Math.round(recs.reduce((s, r) => s + r.value, 0) / recs.length);
}

function heatClass(avg, settings) {
  if (avg === null) return '';
  const s = getGlucoseStatus(avg, settings);
  return s.class;
}

function monthName(month, year) {
  return new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// ── render ────────────────────────────────────────────────────────────────────

function renderPage() {
  const el = document.getElementById('calendar-content');
  if (!el) return;

  const settings = getSettings();
  const glucose = getList(KEYS.GLUCOSE);
  const food = getList(KEYS.FOOD);
  const insulin = getList(KEYS.INSULIN);

  const { year, month } = state;
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // build day cells
  let cells = '';
  // empty leading cells
  for (let i = 0; i < firstDay; i++) cells += '<div class="cal-cell cal-cell--empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateISO = date.toISOString().slice(0, 10);
    const avg = avgGlucoseForDay(glucose, date);
    const heat = heatClass(avg, settings);
    const isToday = isSameDay(date, today);
    const isSelected = state.selectedDate === dateISO;
    const hasMeal = food.some(r => isSameDay(r.date, date));
    const hasInsulin = insulin.some(r => isSameDay(r.date, date));

    cells += `
      <button class="cal-cell${isToday ? ' cal-cell--today' : ''}${isSelected ? ' cal-cell--selected' : ''}"
        data-date="${dateISO}" aria-label="${d} ${monthName(month, year)}${isToday ? ', hoje' : ''}" type="button">
        <span class="cal-day-num">${d}</span>
        ${avg !== null ? `<span class="cal-avg ${heat}">${avg}</span>` : ''}
        <span class="cal-dots">
          ${hasMeal ? '<span class="cal-dot cal-dot--food" aria-hidden="true"></span>' : ''}
          ${hasInsulin ? '<span class="cal-dot cal-dot--insulin" aria-hidden="true"></span>' : ''}
        </span>
      </button>`;
  }

  const detail = state.selectedDate ? renderDetail(state.selectedDate, glucose, food, insulin, settings) : '';

  el.innerHTML = `
    <div class="cal-header">
      <button class="btn-icon" id="cal-prev" aria-label="Mês anterior" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="cal-month-label">${monthName(month, year)}</span>
      <button class="btn-icon" id="cal-next" aria-label="Próximo mês" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <div class="cal-weekdays" aria-hidden="true">
      ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => `<span>${d}</span>`).join('')}
    </div>

    <div class="cal-grid" role="grid" aria-label="Calendário ${monthName(month, year)}">
      ${cells}
    </div>

    <div class="cal-legend" aria-label="Legenda">
      <span class="cal-legend-item"><span class="cal-avg glucose-low">70</span> Baixo</span>
      <span class="cal-legend-item"><span class="cal-avg glucose-normal">120</span> Normal</span>
      <span class="cal-legend-item"><span class="cal-avg glucose-high">200</span> Alto</span>
      <span class="cal-legend-item"><span class="cal-dot cal-dot--food"></span> Refeição</span>
      <span class="cal-legend-item"><span class="cal-dot cal-dot--insulin"></span> Insulina</span>
    </div>

    ${detail}`;

  bindGridEvents();
  bindNavEvents();
}

function renderDetail(dateISO, glucose, food, insulin, settings) {
  const date = new Date(dateISO + 'T00:00:00');
  const label = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  const gRecs = glucose.filter(r => isSameDay(r.date, date));
  const fRecs = food.filter(r => isSameDay(r.date, date));
  const iRecs = insulin.filter(r => isSameDay(r.date, date));

  const glucoseRows = gRecs.length
    ? gRecs.map(r => {
        const s = getGlucoseStatus(r.value, settings);
        return `<div class="detail-row">
          <span class="badge ${s.class}">${r.value} mg/dL</span>
          <span class="detail-meta">${formatTime(r.datetime)}${r.notes ? ` · ${r.notes}` : ''}</span>
        </div>`;
      }).join('')
    : '<p class="detail-empty">Nenhum registro</p>';

  const foodRows = fRecs.length
    ? fRecs.map(r => `<div class="detail-row">
        <span class="detail-name">${r.name}</span>
        <span class="detail-meta">${r.calories ? r.calories + ' kcal' : ''}${r.carbs ? ' · ' + r.carbs + 'g carbs' : ''}</span>
      </div>`).join('')
    : '<p class="detail-empty">Nenhum registro</p>';

  const insulinRows = iRecs.length
    ? iRecs.map(r => `<div class="detail-row">
        <span class="detail-name">${r.total} U total</span>
        <span class="detail-meta">${formatTime(r.date)}${r.correction ? ` · Correção: ${r.correction}U` : ''}${r.meal ? ` · Refeição: ${r.meal}U` : ''}</span>
      </div>`).join('')
    : '<p class="detail-empty">Nenhum registro</p>';

  return `
    <div class="cal-detail" id="cal-detail">
      <div class="cal-detail-header">
        <span class="cal-detail-title">${label}</span>
        <button class="btn-icon" id="cal-detail-close" aria-label="Fechar detalhes" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="cal-detail-section">
        <span class="cal-detail-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          Glicose
        </span>
        ${glucoseRows}
      </div>
      <div class="cal-detail-section">
        <span class="cal-detail-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
          Alimentação
        </span>
        ${foodRows}
      </div>
      <div class="cal-detail-section">
        <span class="cal-detail-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2v4M14 2v4M12 6v6l4 2"/><circle cx="12" cy="14" r="8"/></svg>
          Insulina
        </span>
        ${insulinRows}
      </div>
    </div>`;
}

// ── events ────────────────────────────────────────────────────────────────────

function bindNavEvents() {
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    state.month--;
    if (state.month < 0) { state.month = 11; state.year--; }
    state.selectedDate = null;
    renderPage();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    state.month++;
    if (state.month > 11) { state.month = 0; state.year++; }
    state.selectedDate = null;
    renderPage();
  });
}

function bindGridEvents() {
  document.querySelector('.cal-grid')?.addEventListener('click', e => {
    const cell = e.target.closest('[data-date]');
    if (!cell) return;
    const date = cell.dataset.date;
    state.selectedDate = state.selectedDate === date ? null : date;
    renderPage();
  });
}

function bindEvents() {
  // detail close — delegated since detail is re-rendered
  document.getElementById('calendar-content')?.addEventListener('click', e => {
    if (e.target.closest('#cal-detail-close')) {
      state.selectedDate = null;
      renderPage();
    }
  });
}

export { init, refresh };

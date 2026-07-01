import { KEYS, getList, getSettings } from './storage.js';
import { createGlucoseEntry, updateGlucoseEntry, deleteGlucoseEntry } from './api.js';
import { getGlucoseStatus, formatDate, formatTime, isSameDay, nowISO, debounce, showToast } from './utils.js';

const PERIODS = ['Todos', 'Jejum', 'Pré-almoço', 'Pós-almoço', 'Tarde', 'Jantar', 'Madrugada'];
const SORT_OPTIONS = { newest: 'Mais recentes', oldest: 'Mais antigas', highest: 'Maior valor', lowest: 'Menor valor' };

let state = {
  search: '',
  period: 'Todos',
  sort: 'newest',
  editingId: null
};

/* ── helpers ── */
function autoDetectPeriod() {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'Jejum';
  if (h >= 10 && h < 12) return 'Pré-almoço';
  if (h >= 12 && h < 14) return 'Pós-almoço';
  if (h >= 14 && h < 18) return 'Tarde';
  if (h >= 18 && h < 21) return 'Jantar';
  return 'Madrugada';
}

function statusBadgeClass(key) {
  if (key === 'normal') return 'badge-success';
  if (key === 'high' || key === 'very-high') return 'badge-warning';
  return 'badge-danger';
}

function iconBgClass(key) {
  if (key === 'normal') return 'bg-glucose-normal';
  if (key === 'high' || key === 'very-high') return 'bg-glucose-high';
  return 'bg-glucose-low';
}

function filterAndSort(records) {
  let list = [...records];
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(r =>
      String(r.value).includes(q) ||
      (r.period || '').toLowerCase().includes(q) ||
      (r.notes || '').toLowerCase().includes(q)
    );
  }
  if (state.period !== 'Todos') {
    list = list.filter(r => r.period === state.period);
  }
  switch (state.sort) {
    case 'oldest':  list.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
    case 'highest': list.sort((a, b) => b.value - a.value); break;
    case 'lowest':  list.sort((a, b) => a.value - b.value); break;
    default:        list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  return list;
}

function groupByDate(records) {
  const groups = {};
  records.forEach(r => {
    const key = new Date(r.date).toDateString();
    if (!groups[key]) groups[key] = { label: formatDateLabel(r.date), items: [] };
    groups[key].items.push(r);
  });
  return Object.values(groups);
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return 'Hoje';
  if (isSameDay(d, yesterday)) return 'Ontem';
  return formatDate(dateStr);
}

/* ── SVG icons ── */
const ICON_DROP = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`;
const ICON_EDIT = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const ICON_DEL  = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const ICON_PLUS = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const ICON_SEARCH = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

/* ── render sections ── */
function renderToolbar() {
  return `
    <div class="glc-toolbar">
      <div class="search-wrapper glc-search">
        ${ICON_SEARCH}
        <input class="form-input search-input" id="glc-search" type="search"
          placeholder="Buscar por valor, período..." value="${state.search}"
          aria-label="Buscar registros de glicose" autocomplete="off" />
      </div>
      <div class="glc-toolbar-row">
        <div class="chip-group" id="glc-period-chips" role="group" aria-label="Filtrar por período">
          ${PERIODS.map(p => `
            <button class="chip${state.period === p ? ' active' : ''}" data-period="${p}" type="button">${p}</button>
          `).join('')}
        </div>
        <select class="form-select glc-sort" id="glc-sort" aria-label="Ordenar registros">
          ${Object.entries(SORT_OPTIONS).map(([v, l]) =>
            `<option value="${v}"${state.sort === v ? ' selected' : ''}>${l}</option>`
          ).join('')}
        </select>
      </div>
    </div>`;
}

function renderRecord(r, settings) {
  const s = getGlucoseStatus(r.value, settings);
  return `
    <div class="glc-record" data-id="${r.id}">
      <div class="list-item-icon ${iconBgClass(s.key)}" aria-hidden="true">${ICON_DROP}</div>
      <div class="list-item-content">
        <div class="glc-record-top">
          <span class="glc-record-value ${s.class}">${r.value} <span class="glc-record-unit">mg/dL</span></span>
          <span class="badge ${statusBadgeClass(s.key)}">${s.label}</span>
        </div>
        <div class="glc-record-meta">
          <span>${r.period || '—'}</span>
          <span class="glc-dot" aria-hidden="true">·</span>
          <span>${formatTime(r.date)}</span>
          ${r.notes ? `<span class="glc-dot" aria-hidden="true">·</span><span class="glc-notes-preview">${r.notes}</span>` : ''}
        </div>
      </div>
      <div class="glc-record-actions">
        <button class="btn-icon glc-btn-edit" data-id="${r.id}" aria-label="Editar registro ${r.value} mg/dL" type="button">${ICON_EDIT}</button>
        <button class="btn-icon glc-btn-del" data-id="${r.id}" aria-label="Excluir registro ${r.value} mg/dL" type="button">${ICON_DEL}</button>
      </div>
    </div>`;
}

function renderList(records, settings) {
  if (!records.length) {
    const isEmpty = !state.search && state.period === 'Todos';
    return `
      <div class="empty-state">
        ${ICON_DROP}
        <h3>${isEmpty ? 'Nenhum registro ainda' : 'Nenhum resultado encontrado'}</h3>
        <p>${isEmpty ? 'Toque no + para registrar sua primeira medição' : 'Tente outros filtros ou termos de busca'}</p>
      </div>`;
  }
  const groups = groupByDate(records);
  return groups.map(g => `
    <div class="glc-group">
      <div class="glc-group-header">
        <span class="glc-group-label">${g.label}</span>
        <span class="glc-group-count">${g.items.length} medição${g.items.length !== 1 ? 'ões' : ''}</span>
      </div>
      <div class="card" style="padding:0 16px;">
        ${g.items.map(r => renderRecord(r, settings)).join('')}
      </div>
    </div>`).join('');
}

function renderSummaryBar(records, settings) {
  if (!records.length) return '';
  const values = records.map(r => r.value);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const inRange = records.filter(r => {
    const s = getGlucoseStatus(r.value, settings);
    return s.key === 'normal';
  }).length;
  const pct = Math.round((inRange / records.length) * 100);
  return `
    <div class="glc-summary card">
      <div class="glc-summary-item">
        <span class="glc-summary-val">${records.length}</span>
        <span class="glc-summary-label">Registros</span>
      </div>
      <div class="glc-summary-divider" aria-hidden="true"></div>
      <div class="glc-summary-item">
        <span class="glc-summary-val ${getGlucoseStatus(avg, settings).class}">${avg}</span>
        <span class="glc-summary-label">Média mg/dL</span>
      </div>
      <div class="glc-summary-divider" aria-hidden="true"></div>
      <div class="glc-summary-item">
        <span class="glc-summary-val ${pct >= 70 ? 'glucose-normal' : pct >= 50 ? 'glucose-high' : 'glucose-low'}">${pct}%</span>
        <span class="glc-summary-label">Na meta</span>
      </div>
    </div>`;
}

/* ── modal ── */
function renderModal(record, settings) {
  const isEdit = !!record;
  const val   = isEdit ? record.value : '';
  const period = isEdit ? record.period : autoDetectPeriod();
  const notes  = isEdit ? (record.notes || '') : '';
  const dateVal = isEdit
    ? new Date(record.date).toISOString().slice(0, 16)
    : nowISO().slice(0, 16);

  return `
    <div class="modal-overlay" id="glc-modal" role="dialog" aria-modal="true" aria-labelledby="glc-modal-title">
      <div class="modal">
        <div class="modal-handle" aria-hidden="true"></div>
        <h2 class="modal-title" id="glc-modal-title">${isEdit ? 'Editar Medição' : 'Nova Medição'}</h2>
        <form id="glc-form" novalidate>
          <div class="form-group" id="glc-fg-value">
            <label class="form-label" for="glc-value">Glicose (${settings.unit || 'mg/dL'})</label>
            <input class="form-input" id="glc-value" type="number" inputmode="numeric"
              min="20" max="600" placeholder="Ex: 120" value="${val}" autocomplete="off" required />
            <span class="form-error">Informe um valor entre 20 e 600</span>
          </div>
          <div class="form-group" id="glc-fg-period">
            <label class="form-label" for="glc-period">Período do dia</label>
            <select class="form-select" id="glc-period">
              ${PERIODS.slice(1).map(p =>
                `<option value="${p}"${p === period ? ' selected' : ''}>${p}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="glc-date">Data e hora</label>
            <input class="form-input" id="glc-date" type="datetime-local" value="${dateVal}" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="glc-notes">Observações <span class="text-muted">(opcional)</span></label>
            <textarea class="form-textarea" id="glc-notes" placeholder="Ex: após exercício, em jejum de 12h..." rows="3">${notes}</textarea>
          </div>
          <div class="glc-modal-actions">
            <button type="button" class="btn btn-secondary" id="glc-modal-cancel">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="flex:2">${isEdit ? 'Salvar alterações' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>`;
}

/* ── confirm delete modal ── */
function renderConfirmModal(id, value) {
  return `
    <div class="modal-overlay" id="glc-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="glc-confirm-title">
      <div class="modal" style="max-height:auto;">
        <div class="modal-handle" aria-hidden="true"></div>
        <h2 class="modal-title" id="glc-confirm-title">Excluir registro?</h2>
        <p class="text-secondary" style="margin-bottom:24px;">O registro de <strong>${value} mg/dL</strong> será excluído permanentemente.</p>
        <div class="glc-modal-actions">
          <button type="button" class="btn btn-secondary" id="glc-confirm-cancel">Cancelar</button>
          <button type="button" class="btn btn-danger" id="glc-confirm-ok" data-id="${id}" style="flex:2">Excluir</button>
        </div>
      </div>
    </div>`;
}

/* ── open / close modals ── */
function openModal(record) {
  state.editingId = record ? record.id : null;
  const settings = getSettings();
  const existing = document.getElementById('glc-modal');
  if (existing) existing.remove();
  document.getElementById('glucose-content').insertAdjacentHTML('beforeend', renderModal(record, settings));
  requestAnimationFrame(() => {
    document.getElementById('glc-modal').classList.add('open');
    document.getElementById('glc-value').focus();
  });
  bindModalEvents();
}

function closeModal() {
  const m = document.getElementById('glc-modal');
  if (!m) return;
  m.classList.remove('open');
  setTimeout(() => m.remove(), 350);
  state.editingId = null;
}

function openConfirm(id, value) {
  const existing = document.getElementById('glc-confirm-modal');
  if (existing) existing.remove();
  document.getElementById('glucose-content').insertAdjacentHTML('beforeend', renderConfirmModal(id, value));
  requestAnimationFrame(() => document.getElementById('glc-confirm-modal').classList.add('open'));
  document.getElementById('glc-confirm-cancel').addEventListener('click', closeConfirm);
  document.getElementById('glc-confirm-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeConfirm();
  });
  document.getElementById('glc-confirm-ok').addEventListener('click', e => {
    deleteGlucoseEntry(e.currentTarget.dataset.id);
    closeConfirm();
    showToast('Registro excluído', 'success');
    renderPage();
  });
}

function closeConfirm() {
  const m = document.getElementById('glc-confirm-modal');
  if (!m) return;
  m.classList.remove('open');
  setTimeout(() => m.remove(), 350);
}

/* ── form submit ── */
function bindModalEvents() {
  document.getElementById('glc-modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('glc-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('glc-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const valInput = document.getElementById('glc-value');
    const fg = document.getElementById('glc-fg-value');
    const val = parseInt(valInput.value, 10);

    if (!val || val < 20 || val > 600) {
      fg.classList.add('has-error');
      valInput.focus();
      return;
    }
    fg.classList.remove('has-error');

    const period = document.getElementById('glc-period').value;
    const notes  = document.getElementById('glc-notes').value.trim();
    const dateRaw = document.getElementById('glc-date').value;
    const date   = dateRaw ? new Date(dateRaw).toISOString() : nowISO();

    if (state.editingId) {
      updateGlucoseEntry(state.editingId, { value: val, period, notes, date });
      showToast('Registro atualizado', 'success');
    } else {
      createGlucoseEntry({ value: val, period, notes, date });
      showToast(`Glicose ${val} mg/dL registrada`, 'success');
    }

    closeModal();
    renderPage();
  });

  /* live validation clear */
  document.getElementById('glc-value')?.addEventListener('input', () => {
    document.getElementById('glc-fg-value')?.classList.remove('has-error');
  });
}

/* ── bind page events ── */
function bindPageEvents() {
  /* search */
  const searchInput = document.getElementById('glc-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(e => {
      state.search = e.target.value.trim();
      renderList_update();
    }, 250));
  }

  /* period chips */
  document.getElementById('glc-period-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-period]');
    if (!chip) return;
    state.period = chip.dataset.period;
    document.querySelectorAll('#glc-period-chips .chip').forEach(c =>
      c.classList.toggle('active', c.dataset.period === state.period)
    );
    renderList_update();
  });

  /* sort */
  document.getElementById('glc-sort')?.addEventListener('change', e => {
    state.sort = e.target.value;
    renderList_update();
  });

  /* FAB */
  document.getElementById('glc-fab')?.addEventListener('click', () => openModal(null));

  /* edit / delete via delegation */
  document.getElementById('glc-list')?.addEventListener('click', e => {
    const editBtn = e.target.closest('.glc-btn-edit');
    const delBtn  = e.target.closest('.glc-btn-del');
    if (editBtn) {
      const id = editBtn.dataset.id;
      const record = getList(KEYS.GLUCOSE).find(r => r.id === id);
      if (record) openModal(record);
    }
    if (delBtn) {
      const id = delBtn.dataset.id;
      const record = getList(KEYS.GLUCOSE).find(r => r.id === id);
      if (record) openConfirm(id, record.value);
    }
  });
}

/* ── partial re-render ── */
function renderList_update() {
  const records  = filterAndSort(getList(KEYS.GLUCOSE));
  const settings = getSettings();
  const listEl   = document.getElementById('glc-list');
  const summEl   = document.getElementById('glc-summary-bar');
  if (listEl)  listEl.innerHTML  = renderList(records, settings);
  if (summEl)  summEl.innerHTML  = renderSummaryBar(records, settings);
}

/* ── full page render ── */
function renderPage() {
  const el = document.getElementById('glucose-content');
  if (!el) return;

  const allRecords = getList(KEYS.GLUCOSE);
  const settings   = getSettings();
  const filtered   = filterAndSort(allRecords);

  el.innerHTML = `
    ${renderToolbar()}
    <div id="glc-summary-bar">${renderSummaryBar(filtered, settings)}</div>
    <div id="glc-list">${renderList(filtered, settings)}</div>
    <button class="fab" id="glc-fab" type="button" aria-label="Adicionar nova medição de glicose">
      ${ICON_PLUS}
    </button>`;

  bindPageEvents();
}

function init()    { state = { search: '', period: 'Todos', sort: 'newest', editingId: null }; renderPage(); }
function refresh() { renderPage(); }

export { init, refresh };

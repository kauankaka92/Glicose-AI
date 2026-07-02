import { KEYS, getList, addItem, updateItem, deleteItem } from './storage.js';
import { formatDate, formatTime, isSameDay, nowISO, generateId, debounce, showToast } from './utils.js';

const CATEGORIES = ['Todas', 'Café da manhã', 'Almoço', 'Jantar', 'Lanche', 'Bebida', 'Outro'];

const CATEGORY_COLORS = {
  'Café da manhã': '#f59e0b',
  'Almoço':        '#22c55e',
  'Jantar':        '#6366f1',
  'Lanche':        '#ec4899',
  'Bebida':        '#3b82f6',
  'Outro':         '#94a3b8'
};

let state = {
  search: '',
  category: 'Todas',
  editingId: null
};

/* ── icons ── */
const ICON_FOOD   = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`;
const ICON_PLUS   = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const ICON_EDIT   = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const ICON_DEL    = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const ICON_SEARCH = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
const ICON_IMG    = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

/* ── helpers ── */
function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || '#94a3b8';
}

function autoCategory() {
  const h = new Date().getHours();
  if (h >= 5  && h < 10) return 'Café da manhã';
  if (h >= 11 && h < 14) return 'Almoço';
  if (h >= 18 && h < 21) return 'Jantar';
  if (h >= 14 && h < 18) return 'Lanche';
  return 'Lanche';
}

function filterRecords(records) {
  let list = [...records];
  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q) ||
      (r.notes || '').toLowerCase().includes(q)
    );
  }
  if (state.category !== 'Todas') {
    list = list.filter(r => r.category === state.category);
  }
  list.sort((a, b) => new Date(b.date) - new Date(a.date));
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

function todayTotals(records) {
  const today = records.filter(r => isSameDay(r.date, new Date()));
  if (!today.length) return null;
  return today.reduce((acc, r) => ({
    kcal:    acc.kcal    + (r.kcal    || 0),
    carbs:   acc.carbs   + (r.carbs   || 0),
    protein: acc.protein + (r.protein || 0),
    fat:     acc.fat     + (r.fat     || 0),
    count:   acc.count   + 1
  }), { kcal: 0, carbs: 0, protein: 0, fat: 0, count: 0 });
}

/* ── render ── */
function renderToolbar() {
  return `
    <div class="food-toolbar">
      <div class="search-wrapper">
        ${ICON_SEARCH}
        <input class="form-input search-input" id="food-search" type="search"
          placeholder="Buscar alimento, categoria..." value="${state.search}"
          aria-label="Buscar no diário alimentar" autocomplete="off" />
      </div>
      <div class="chip-group" id="food-cat-chips" role="group" aria-label="Filtrar por categoria">
        ${CATEGORIES.map(c => `
          <button class="chip${state.category === c ? ' active' : ''}" data-cat="${c}" type="button">${c}</button>
        `).join('')}
      </div>
    </div>`;
}

function renderTodaySummary(records) {
  const t = todayTotals(records);
  if (!t) return '';
  return `
    <div class="food-summary card">
      <div class="food-summary-header">
        <span class="card-title">Hoje</span>
        <span class="text-xs text-muted">${t.count} refeição${t.count !== 1 ? 'ões' : ''}</span>
      </div>
      <div class="food-summary-grid">
        <div class="food-macro-item food-macro-kcal">
          <span class="food-macro-val">${Math.round(t.kcal)}</span>
          <span class="food-macro-label">kcal</span>
        </div>
        <div class="food-macro-item food-macro-carb">
          <span class="food-macro-val">${Math.round(t.carbs)}g</span>
          <span class="food-macro-label">Carbs</span>
        </div>
        <div class="food-macro-item food-macro-prot">
          <span class="food-macro-val">${Math.round(t.protein)}g</span>
          <span class="food-macro-label">Proteína</span>
        </div>
        <div class="food-macro-item food-macro-fat">
          <span class="food-macro-val">${Math.round(t.fat)}g</span>
          <span class="food-macro-label">Gordura</span>
        </div>
      </div>
    </div>`;
}

function renderMacroBar(r) {
  const total = (r.carbs || 0) + (r.protein || 0) + (r.fat || 0);
  if (!total) return '';
  const cp = Math.round(((r.carbs   || 0) / total) * 100);
  const pp = Math.round(((r.protein || 0) / total) * 100);
  const fp = 100 - cp - pp;
  return `
    <div class="food-macro-bar" aria-label="Distribuição de macros" role="img">
      <div class="food-macro-bar-carb"  style="width:${cp}%" title="Carbs ${cp}%"></div>
      <div class="food-macro-bar-prot"  style="width:${pp}%" title="Proteína ${pp}%"></div>
      <div class="food-macro-bar-fat"   style="width:${fp}%" title="Gordura ${fp}%"></div>
    </div>`;
}

function renderRecord(r) {
  const color = categoryColor(r.category);
  const hasMacros = r.kcal || r.carbs || r.protein || r.fat;
  return `
    <div class="food-record" data-id="${r.id}">
      ${r.photo
        ? `<div class="food-record-photo" aria-hidden="true"><img src="${r.photo}" alt="${escapeAttr(r.name)}" loading="lazy" /></div>`
        : `<div class="food-record-icon" style="background:${color}20;color:${color}" aria-hidden="true">${ICON_FOOD}</div>`
      }
      <div class="list-item-content">
        <div class="food-record-top">
          <span class="food-record-name">${r.name}</span>
          <span class="food-cat-badge" style="background:${color}20;color:${color}">${r.category || 'Outro'}</span>
        </div>
        <div class="food-record-meta">
          ${r.kcal ? `<span class="food-kcal">${Math.round(r.kcal)} kcal</span>` : ''}
          ${r.kcal && (r.carbs || r.protein || r.fat) ? `<span class="glc-dot" aria-hidden="true">·</span>` : ''}
          ${r.carbs   ? `<span>C: ${Math.round(r.carbs)}g</span>`   : ''}
          ${r.protein ? `<span>P: ${Math.round(r.protein)}g</span>` : ''}
          ${r.fat     ? `<span>G: ${Math.round(r.fat)}g</span>`     : ''}
        </div>
        ${hasMacros ? renderMacroBar(r) : ''}
        <div class="food-record-time">
          ${formatTime(r.date)}
          ${r.notes ? `<span class="glc-dot" aria-hidden="true">·</span><span class="food-notes-preview">${r.notes}</span>` : ''}
        </div>
      </div>
      <div class="glc-record-actions">
        <button class="btn-icon glc-btn-edit" data-id="${r.id}" aria-label="Editar ${escapeAttr(r.name)}" type="button">${ICON_EDIT}</button>
        <button class="btn-icon glc-btn-del"  data-id="${r.id}" aria-label="Excluir ${escapeAttr(r.name)}" type="button">${ICON_DEL}</button>
      </div>
    </div>`;
}

function renderList(records) {
  if (!records.length) {
    const isEmpty = !state.search && state.category === 'Todas';
    return `
      <div class="empty-state">
        ${ICON_FOOD}
        <h3>${isEmpty ? 'Nenhum alimento registrado' : 'Nenhum resultado encontrado'}</h3>
        <p>${isEmpty ? 'Toque no + para registrar sua primeira refeição' : 'Tente outros filtros ou termos de busca'}</p>
      </div>`;
  }
  return groupByDate(records).map(g => `
    <div class="glc-group">
      <div class="glc-group-header">
        <span class="glc-group-label">${g.label}</span>
        <span class="glc-group-count">${g.items.length} item${g.items.length !== 1 ? 'ns' : ''}</span>
      </div>
      <div class="card" style="padding:0 16px;">
        ${g.items.map(renderRecord).join('')}
      </div>
    </div>`).join('');
}

/* ── modal ── */
function renderModal(record) {
  const isEdit    = !!record;
  const name      = isEdit ? escapeAttr(record.name) : '';
  const category  = isEdit ? record.category  : autoCategory();
  const kcal      = isEdit ? (record.kcal     || '') : '';
  const carbs     = isEdit ? (record.carbs    || '') : '';
  const protein   = isEdit ? (record.protein  || '') : '';
  const fat       = isEdit ? (record.fat      || '') : '';
  const notes     = isEdit ? (record.notes    || '') : '';
  const dateVal   = isEdit
    ? new Date(record.date).toISOString().slice(0, 16)
    : nowISO().slice(0, 16);
  const photo     = isEdit ? (record.photo    || '') : '';

  return `
    <div class="modal-overlay" id="food-modal" role="dialog" aria-modal="true" aria-labelledby="food-modal-title">
      <div class="modal">
        <div class="modal-handle" aria-hidden="true"></div>
        <h2 class="modal-title" id="food-modal-title">${isEdit ? 'Editar Refeição' : 'Nova Refeição'}</h2>
        <form id="food-form" novalidate>

          <div class="form-group" id="food-fg-name">
            <label class="form-label" for="food-name">Nome do alimento</label>
            <input class="form-input" id="food-name" type="text"
              placeholder="Ex: Arroz com feijão, Banana..." value="${name}" autocomplete="off" required />
            <span class="form-error">Informe o nome do alimento</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="food-category">Categoria</label>
            <select class="form-select" id="food-category">
              ${CATEGORIES.slice(1).map(c =>
                `<option value="${c}"${c === category ? ' selected' : ''}>${c}</option>`
              ).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="food-date">Data e hora</label>
            <input class="form-input" id="food-date" type="datetime-local" value="${dateVal}" />
          </div>

          <div class="food-macros-section">
            <p class="form-label" style="margin-bottom:10px;">Informações nutricionais <span class="text-muted">(opcional)</span></p>
            <div class="food-macros-grid">
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label food-macro-lbl food-macro-lbl--kcal" for="food-kcal">Calorias</label>
                <input class="form-input" id="food-kcal" type="number" inputmode="decimal"
                  min="0" max="9999" placeholder="kcal" value="${kcal}" />
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label food-macro-lbl food-macro-lbl--carb" for="food-carbs">Carboidratos</label>
                <input class="form-input" id="food-carbs" type="number" inputmode="decimal"
                  min="0" max="9999" placeholder="g" value="${carbs}" />
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label food-macro-lbl food-macro-lbl--prot" for="food-protein">Proteína</label>
                <input class="form-input" id="food-protein" type="number" inputmode="decimal"
                  min="0" max="9999" placeholder="g" value="${protein}" />
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label food-macro-lbl food-macro-lbl--fat" for="food-fat">Gordura</label>
                <input class="form-input" id="food-fat" type="number" inputmode="decimal"
                  min="0" max="9999" placeholder="g" value="${fat}" />
              </div>
            </div>
          </div>

          <div class="form-group" style="margin-top:16px;">
            <label class="form-label" for="food-notes">Observações <span class="text-muted">(opcional)</span></label>
            <textarea class="form-textarea" id="food-notes"
              placeholder="Ex: porção média, sem sal..." rows="2">${notes}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Foto <span class="text-muted">(opcional)</span></label>
            <div class="food-photo-area" id="food-photo-area">
              ${photo
                ? `<img src="${photo}" alt="Foto da refeição" class="food-photo-preview" id="food-photo-preview" />`
                : `<div class="food-photo-placeholder" id="food-photo-placeholder">${ICON_IMG}<span>Toque para adicionar foto</span></div>`
              }
              <input type="file" id="food-photo-input" accept="image/*" capture="environment" class="sr-only" aria-label="Selecionar foto da refeição" />
            </div>
            ${photo ? `<button type="button" class="btn btn-ghost btn-sm text-danger" id="food-photo-remove" style="margin-top:6px;">Remover foto</button>` : ''}
          </div>

          <div class="glc-modal-actions">
            <button type="button" class="btn btn-secondary" id="food-modal-cancel">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="flex:2">${isEdit ? 'Salvar alterações' : 'Registrar'}</button>
          </div>
        </form>
      </div>
    </div>`;
}

function renderConfirmModal(id, name) {
  return `
    <div class="modal-overlay" id="food-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="food-confirm-title">
      <div class="modal">
        <div class="modal-handle" aria-hidden="true"></div>
        <h2 class="modal-title" id="food-confirm-title">Excluir refeição?</h2>
        <p class="text-secondary" style="margin-bottom:24px;"><strong>${name}</strong> será excluído permanentemente.</p>
        <div class="glc-modal-actions">
          <button type="button" class="btn btn-secondary" id="food-confirm-cancel">Cancelar</button>
          <button type="button" class="btn btn-danger" id="food-confirm-ok" data-id="${id}" style="flex:2">Excluir</button>
        </div>
      </div>
    </div>`;
}

/* ── photo handling ── */
let pendingPhoto = null;

function bindPhotoEvents() {
  const area    = document.getElementById('food-photo-area');
  const input   = document.getElementById('food-photo-input');
  const removeBtn = document.getElementById('food-photo-remove');

  area?.addEventListener('click', () => input?.click());

  input?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Foto muito grande (máx 5MB)', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      pendingPhoto = ev.target.result;
      const placeholder = document.getElementById('food-photo-placeholder');
      const preview     = document.getElementById('food-photo-preview');
      if (placeholder) {
        placeholder.outerHTML = `<img src="${pendingPhoto}" alt="Foto da refeição" class="food-photo-preview" id="food-photo-preview" />`;
      } else if (preview) {
        preview.src = pendingPhoto;
      }
      if (!document.getElementById('food-photo-remove')) {
        area.insertAdjacentHTML('afterend', `<button type="button" class="btn btn-ghost btn-sm text-danger" id="food-photo-remove" style="margin-top:6px;">Remover foto</button>`);
        document.getElementById('food-photo-remove').addEventListener('click', removePhoto);
      }
    };
    reader.readAsDataURL(file);
  });

  removeBtn?.addEventListener('click', removePhoto);
}

function removePhoto() {
  pendingPhoto = null;
  const preview = document.getElementById('food-photo-preview');
  if (preview) preview.outerHTML = `<div class="food-photo-placeholder" id="food-photo-placeholder">${ICON_IMG}<span>Toque para adicionar foto</span></div>`;
  const removeBtn = document.getElementById('food-photo-remove');
  if (removeBtn) removeBtn.remove();
}

/* ── open / close ── */
function openModal(record) {
  state.editingId = record ? record.id : null;
  pendingPhoto    = record ? (record.photo || null) : null;
  const existing  = document.getElementById('food-modal');
  if (existing) existing.remove();
  document.getElementById('food-content').insertAdjacentHTML('beforeend', renderModal(record));
  requestAnimationFrame(() => {
    document.getElementById('food-modal').classList.add('open');
    document.getElementById('food-name').focus();
  });
  bindModalEvents();
  bindPhotoEvents();
}

function closeModal() {
  const m = document.getElementById('food-modal');
  if (!m) return;
  m.classList.remove('open');
  setTimeout(() => m.remove(), 350);
  state.editingId = null;
  pendingPhoto    = null;
}

function openConfirm(id, name) {
  const existing = document.getElementById('food-confirm-modal');
  if (existing) existing.remove();
  document.getElementById('food-content').insertAdjacentHTML('beforeend', renderConfirmModal(id, name));
  requestAnimationFrame(() => document.getElementById('food-confirm-modal').classList.add('open'));
  document.getElementById('food-confirm-cancel').addEventListener('click', closeConfirm);
  document.getElementById('food-confirm-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeConfirm();
  });
  document.getElementById('food-confirm-ok').addEventListener('click', e => {
    deleteItem(KEYS.FOOD, e.currentTarget.dataset.id);
    closeConfirm();
    showToast('Refeição excluída', 'success');
    renderPage();
  });
}

function closeConfirm() {
  const m = document.getElementById('food-confirm-modal');
  if (!m) return;
  m.classList.remove('open');
  setTimeout(() => m.remove(), 350);
}

/* ── form submit ── */
function bindModalEvents() {
  document.getElementById('food-modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('food-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('food-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const nameInput = document.getElementById('food-name');
    const fg        = document.getElementById('food-fg-name');
    const name      = nameInput.value.trim();

    if (!name) {
      fg.classList.add('has-error');
      nameInput.focus();
      return;
    }
    fg.classList.remove('has-error');

    const parseNum = id => {
      const v = parseFloat(document.getElementById(id)?.value);
      return isNaN(v) || v < 0 ? 0 : v;
    };

    const category = document.getElementById('food-category').value;
    const dateRaw  = document.getElementById('food-date').value;
    const date     = dateRaw ? new Date(dateRaw).toISOString() : nowISO();
    const notes    = document.getElementById('food-notes').value.trim();
    const kcal     = parseNum('food-kcal');
    const carbs    = parseNum('food-carbs');
    const protein  = parseNum('food-protein');
    const fat      = parseNum('food-fat');
    const photo    = pendingPhoto || (state.editingId
      ? (getList(KEYS.FOOD).find(r => r.id === state.editingId)?.photo || null)
      : null);

    const entry = { name, category, date, notes, kcal, carbs, protein, fat, photo };

    if (state.editingId) {
      updateItem(KEYS.FOOD, state.editingId, entry);
      showToast('Refeição atualizada', 'success');
    } else {
      addItem(KEYS.FOOD, { id: generateId(), ...entry });
      showToast(`${name} registrado`, 'success');
    }

    closeModal();
    renderPage();
  });

  document.getElementById('food-name')?.addEventListener('input', () => {
    document.getElementById('food-fg-name')?.classList.remove('has-error');
  });
}

/* ── page events ── */
function bindPageEvents() {
  document.getElementById('food-search')?.addEventListener('input', debounce(e => {
    state.search = e.target.value.trim();
    updateList();
  }, 250));

  document.getElementById('food-cat-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-cat]');
    if (!chip) return;
    state.category = chip.dataset.cat;
    document.querySelectorAll('#food-cat-chips .chip').forEach(c =>
      c.classList.toggle('active', c.dataset.cat === state.category)
    );
    updateList();
  });

  document.getElementById('food-fab')?.addEventListener('click', () => openModal(null));

  document.getElementById('food-list')?.addEventListener('click', e => {
    const editBtn = e.target.closest('.glc-btn-edit');
    const delBtn  = e.target.closest('.glc-btn-del');
    if (editBtn) {
      const record = getList(KEYS.FOOD).find(r => r.id === editBtn.dataset.id);
      if (record) openModal(record);
    }
    if (delBtn) {
      const record = getList(KEYS.FOOD).find(r => r.id === delBtn.dataset.id);
      if (record) openConfirm(record.id, record.name);
    }
  });
}

function updateList() {
  const records = filterRecords(getList(KEYS.FOOD));
  const listEl  = document.getElementById('food-list');
  const summEl  = document.getElementById('food-summary-bar');
  if (listEl) listEl.innerHTML = renderList(records);
  if (summEl) summEl.innerHTML = renderTodaySummary(getList(KEYS.FOOD));
}

function renderPage() {
  const el = document.getElementById('food-content');
  if (!el) return;
  const all      = getList(KEYS.FOOD);
  const filtered = filterRecords(all);

  el.innerHTML = `
    ${renderToolbar()}
    <div id="food-summary-bar">${renderTodaySummary(all)}</div>
    <div id="food-list">${renderList(filtered)}</div>
    <button class="fab" id="food-fab" type="button" aria-label="Adicionar nova refeição">
      ${ICON_PLUS}
    </button>`;

  bindPageEvents();
}

function init() {
  state = { search: '', category: 'Todas', editingId: null };
  renderPage();
  window.addEventListener('food:registered', () => {
    if (document.getElementById('food-content')) renderPage();
  });
}
function refresh() { renderPage(); }

export { init, refresh };

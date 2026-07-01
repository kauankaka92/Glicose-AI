import { KEYS, getList, addItem, updateItem, deleteItem } from './storage.js';
import { generateId, showToast } from './utils.js';

// ── scheduler ─────────────────────────────────────────────────────────────────

const timers = new Map(); // id → timeoutId

function notify(reminder) {
  const body = reminder.label || typeLabel(reminder.type);
  if (Notification.permission === 'granted') {
    new Notification('Glicose AI', { body, icon: '/app/icons/icon-192.svg', tag: reminder.id });
  } else {
    showToast(`🔔 ${body}`, 'info', 5000);
  }
}

function msUntilNext(timeStr, days) {
  // timeStr = "HH:MM", days = [0-6] array or [] for daily
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);

  if (days && days.length) {
    // find next matching weekday
    for (let offset = 0; offset <= 7; offset++) {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      d.setHours(h, m, 0, 0);
      if (d > now && days.includes(d.getDay())) return d - now;
    }
    return null;
  }

  // daily
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

function scheduleReminder(reminder) {
  if (!reminder.active) return;
  clearTimer(reminder.id);

  const ms = msUntilNext(reminder.time, reminder.days);
  if (ms === null) return;

  const tid = setTimeout(() => {
    notify(reminder);
    // reschedule for next occurrence
    scheduleReminder(reminder);
  }, ms);

  timers.set(reminder.id, tid);
}

function clearTimer(id) {
  if (timers.has(id)) { clearTimeout(timers.get(id)); timers.delete(id); }
}

function scheduleAll() {
  getList(KEYS.REMINDERS).filter(r => r.active).forEach(scheduleReminder);
}

// ── helpers ───────────────────────────────────────────────────────────────────

const TYPES = [
  { value: 'glucose',  label: 'Medir glicose',    icon: '🩸' },
  { value: 'meal',     label: 'Registrar refeição', icon: '🍽️' },
  { value: 'insulin',  label: 'Aplicar insulina',  icon: '💉' },
  { value: 'water',    label: 'Beber água',         icon: '💧' },
  { value: 'medicine', label: 'Tomar medicamento',  icon: '💊' },
  { value: 'custom',   label: 'Personalizado',      icon: '🔔' },
];

const DAYS_LABEL = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function typeLabel(type) {
  return TYPES.find(t => t.value === type)?.label || 'Lembrete';
}
function typeIcon(type) {
  return TYPES.find(t => t.value === type)?.icon || '🔔';
}
function daysLabel(days) {
  if (!days || !days.length) return 'Diário';
  if (days.length === 7) return 'Todos os dias';
  if (JSON.stringify(days) === JSON.stringify([1,2,3,4,5])) return 'Seg–Sex';
  if (JSON.stringify(days) === JSON.stringify([0,6])) return 'Fins de semana';
  return days.map(d => DAYS_LABEL[d]).join(', ');
}

// ── state ─────────────────────────────────────────────────────────────────────

const state = { editingId: null };

// ── render ────────────────────────────────────────────────────────────────────

function renderPage() {
  const el = document.getElementById('reminders-content');
  if (!el) return;

  const list = getList(KEYS.REMINDERS);
  const notifBlocked = Notification.permission === 'denied';

  el.innerHTML = `
    ${notifBlocked ? `<div class="reminder-notice">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Notificações bloqueadas no navegador. Os lembretes aparecerão como alertas na tela.
    </div>` : ''}

    <div class="reminders-toolbar">
      <span class="reminders-count">${list.length} lembrete${list.length !== 1 ? 's' : ''}</span>
      <button class="btn btn-primary btn-sm" id="btn-add-reminder" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Novo
      </button>
    </div>

    ${list.length === 0
      ? `<div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <h3>Nenhum lembrete</h3>
          <p>Crie lembretes para medições, refeições e eventos</p>
        </div>`
      : `<div class="reminders-list">${list.map(renderItem).join('')}</div>`
    }`;

  bindPageEvents();
}

function renderItem(r) {
  return `
    <div class="reminder-item${r.active ? '' : ' reminder-item--off'}" data-id="${r.id}">
      <span class="reminder-icon" aria-hidden="true">${typeIcon(r.type)}</span>
      <div class="reminder-info">
        <span class="reminder-label">${r.label || typeLabel(r.type)}</span>
        <span class="reminder-meta">${r.time} · ${daysLabel(r.days)}</span>
      </div>
      <label class="toggle" aria-label="${r.active ? 'Desativar' : 'Ativar'} lembrete">
        <input type="checkbox" class="toggle-input reminder-toggle" data-id="${r.id}" ${r.active ? 'checked' : ''}>
        <span class="toggle-track"><span class="toggle-thumb"></span></span>
      </label>
      <button class="btn-icon reminder-edit" data-id="${r.id}" aria-label="Editar lembrete" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="btn-icon reminder-delete" data-id="${r.id}" aria-label="Excluir lembrete" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </div>`;
}

// ── modal ─────────────────────────────────────────────────────────────────────

function openModal(reminder = null) {
  state.editingId = reminder?.id || null;
  const r = reminder || { type: 'glucose', label: '', time: '08:00', days: [], active: true };

  const typeOptions = TYPES.map(t =>
    `<option value="${t.value}"${r.type === t.value ? ' selected' : ''}>${t.icon} ${t.label}</option>`
  ).join('');

  const dayBtns = DAYS_LABEL.map((d, i) =>
    `<button type="button" class="chip day-chip${r.days.includes(i) ? ' chip--active' : ''}" data-day="${i}" aria-pressed="${r.days.includes(i)}">${d}</button>`
  ).join('');

  const html = `
    <div class="modal-overlay" id="reminder-modal-overlay" role="dialog" aria-modal="true" aria-label="${state.editingId ? 'Editar' : 'Novo'} lembrete">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">${state.editingId ? 'Editar' : 'Novo'} Lembrete</h2>
          <button class="btn-icon" id="reminder-modal-close" aria-label="Fechar" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="r-type">Tipo</label>
            <select class="form-select" id="r-type">${typeOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label" for="r-label">Descrição (opcional)</label>
            <input class="form-input" id="r-label" type="text" placeholder="Ex: Glicose pós-almoço" maxlength="60" value="${r.label || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="r-time">Horário</label>
            <input class="form-input" id="r-time" type="time" value="${r.time}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Repetição <span class="form-hint">(vazio = diário)</span></label>
            <div class="day-chips" role="group" aria-label="Dias da semana">${dayBtns}</div>
          </div>
        </div>
        <div class="modal-actions">
          ${state.editingId ? `<button class="btn btn-danger" id="reminder-modal-delete" type="button">Excluir</button>` : ''}
          <button class="btn btn-ghost" id="reminder-modal-cancel" type="button">Cancelar</button>
          <button class="btn btn-primary" id="reminder-modal-save" type="button">Salvar</button>
        </div>
      </div>
    </div>`;

  document.getElementById('reminders-content').insertAdjacentHTML('beforeend', html);
  bindModalEvents();
  document.getElementById('r-time').focus();
}

function closeModal() {
  document.getElementById('reminder-modal-overlay')?.remove();
}

function saveModal() {
  const time = document.getElementById('r-time').value;
  if (!time) { showToast('Informe o horário', 'error'); return; }

  const days = [...document.querySelectorAll('.day-chip.chip--active')].map(b => Number(b.dataset.day));

  const data = {
    type: document.getElementById('r-type').value,
    label: document.getElementById('r-label').value.trim(),
    time,
    days,
    active: true,
  };

  if (state.editingId) {
    updateItem(KEYS.REMINDERS, state.editingId, data);
    clearTimer(state.editingId);
    const updated = getList(KEYS.REMINDERS).find(r => r.id === state.editingId);
    if (updated) scheduleReminder(updated);
    showToast('Lembrete atualizado', 'success');
  } else {
    const item = { id: generateId(), ...data };
    addItem(KEYS.REMINDERS, item);
    scheduleReminder(item);
    showToast('Lembrete criado', 'success');
  }

  closeModal();
  renderPage();
}

// ── events ────────────────────────────────────────────────────────────────────

function bindModalEvents() {
  document.getElementById('reminder-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('reminder-modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('reminder-modal-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'reminder-modal-overlay') closeModal();
  });
  document.getElementById('reminder-modal-save')?.addEventListener('click', saveModal);
  document.getElementById('reminder-modal-delete')?.addEventListener('click', () => {
    deleteItem(KEYS.REMINDERS, state.editingId);
    clearTimer(state.editingId);
    closeModal();
    renderPage();
    showToast('Lembrete excluído', 'success');
  });

  document.querySelectorAll('.day-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const active = btn.classList.toggle('chip--active');
      btn.setAttribute('aria-pressed', active);
    });
  });
}

function bindPageEvents() {
  document.getElementById('btn-add-reminder')?.addEventListener('click', async () => {
    if (Notification.permission === 'default') await Notification.requestPermission();
    openModal();
  });

  document.querySelectorAll('.reminder-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = getList(KEYS.REMINDERS).find(x => x.id === btn.dataset.id);
      if (r) openModal(r);
    });
  });

  document.querySelectorAll('.reminder-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteItem(KEYS.REMINDERS, btn.dataset.id);
      clearTimer(btn.dataset.id);
      renderPage();
      showToast('Lembrete excluído', 'success');
    });
  });

  document.querySelectorAll('.reminder-toggle').forEach(chk => {
    chk.addEventListener('change', () => {
      const id = chk.dataset.id;
      const active = chk.checked;
      updateItem(KEYS.REMINDERS, id, { active });
      if (active) {
        const r = getList(KEYS.REMINDERS).find(x => x.id === id);
        if (r) scheduleReminder(r);
      } else {
        clearTimer(id);
      }
    });
  });
}

function init() {
  scheduleAll();
  renderPage();
}

function refresh() { renderPage(); }

export { init, refresh };

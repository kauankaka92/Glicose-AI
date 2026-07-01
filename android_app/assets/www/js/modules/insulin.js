import { KEYS, getList, getSettings, saveSettings, addItem, deleteItem } from './storage.js';
import { generateId, nowISO, formatDate, formatTime, showToast } from './utils.js';

/* ── fórmulas ──────────────────────────────────────────────────────────────
  Dose de correção  = (Glicose atual − Alvo) ÷ Fator de sensibilidade
  Dose de refeição  = Carboidratos (g) ÷ Relação insulina:carbo
  Dose total        = Correção + Refeição
  (valores negativos de correção são zerados — não se reduz insulina)
─────────────────────────────────────────────────────────────────────────── */

function calcInsulin({ glucose, carbs, sensitivity, carbRatio, target }) {
  const correction = (glucose - target) / sensitivity;
  const meal       = carbs > 0 ? carbs / carbRatio : 0;
  const total      = Math.max(0, correction) + meal;
  return {
    correction: Math.round(correction * 100) / 100,
    correctionClamped: Math.max(0, Math.round(correction * 100) / 100),
    meal:  Math.round(meal  * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

/* ── icons ── */
const ICON_SYRINGE = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 2 4 4"/><path d="m17 7 1-5"/><path d="M3 22 17 8"/><path d="m15 4 5 5"/><path d="m6 18 3.5-3.5"/></svg>`;
const ICON_WARN    = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const ICON_SETTINGS = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
const ICON_HISTORY = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const ICON_DEL     = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

/* ── helpers ── */
function hasParams(s) {
  return s.insulinSensitivity > 0 && s.carbRatio > 0 && s.correctionTarget > 0;
}

function latestGlucose() {
  const list = getList(KEYS.GLUCOSE);
  return list.length ? list[0].value : '';
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}

/* ── render: disclaimer ── */
function renderDisclaimer() {
  return `
    <div class="ins-disclaimer" role="alert" aria-live="polite">
      <span class="ins-disclaimer-icon" aria-hidden="true">${ICON_WARN}</span>
      <p>Este app <strong>apenas aplica a fórmula configurada por você</strong>. Os resultados não substituem orientação médica. Consulte sempre seu endocrinologista antes de ajustar doses de insulina.</p>
    </div>`;
}

/* ── render: no params warning ── */
function renderNoParams() {
  return `
    <div class="ins-no-params card">
      <div class="ins-no-params-icon" aria-hidden="true">${ICON_SYRINGE}</div>
      <h3>Parâmetros não configurados</h3>
      <p>Configure seu fator de sensibilidade, relação insulina:carbo e glicose alvo para usar o calculador.</p>
      <button class="btn btn-primary btn-full" id="ins-go-settings" type="button">
        ${ICON_SETTINGS} Configurar parâmetros
      </button>
    </div>`;
}

/* ── render: params summary ── */
function renderParamsSummary(s) {
  return `
    <div class="ins-params card">
      <div class="card-header">
        <span class="card-title">Parâmetros ativos</span>
        <button class="btn btn-ghost btn-sm" id="ins-edit-params" type="button" aria-label="Editar parâmetros">
          ${ICON_SETTINGS}
        </button>
      </div>
      <div class="ins-params-grid">
        <div class="ins-param-item">
          <span class="ins-param-val">${s.insulinSensitivity}</span>
          <span class="ins-param-label">Fator de sensibilidade<br><span class="ins-param-unit">mg/dL por unidade</span></span>
        </div>
        <div class="ins-param-item">
          <span class="ins-param-val">1:${s.carbRatio}</span>
          <span class="ins-param-label">Relação insulina:carbo<br><span class="ins-param-unit">1 UI por ${s.carbRatio}g carbo</span></span>
        </div>
        <div class="ins-param-item">
          <span class="ins-param-val">${s.correctionTarget}</span>
          <span class="ins-param-label">Glicose alvo<br><span class="ins-param-unit">mg/dL</span></span>
        </div>
      </div>
    </div>`;
}

/* ── render: calculator form ── */
function renderCalculator(s) {
  const lastGlucose = latestGlucose();
  return `
    <div class="ins-calc card">
      <div class="card-header">
        <span class="card-title">Calculador</span>
      </div>
      <form id="ins-form" novalidate>
        <div class="ins-form-row">
          <div class="form-group" id="ins-fg-glucose" style="flex:1">
            <label class="form-label" for="ins-glucose">Glicose atual (mg/dL)</label>
            <input class="form-input" id="ins-glucose" type="number" inputmode="numeric"
              min="20" max="600" placeholder="Ex: 180"
              value="${lastGlucose}" autocomplete="off" required />
            <span class="form-error">Informe um valor entre 20 e 600</span>
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label" for="ins-carbs">Carboidratos (g)</label>
            <input class="form-input" id="ins-carbs" type="number" inputmode="decimal"
              min="0" max="999" placeholder="0 se jejum" value="0" autocomplete="off" />
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-full">
          ${ICON_SYRINGE} Calcular dose
        </button>
      </form>
    </div>`;
}

/* ── render: result ── */
function renderResult(inputs, result, s) {
  const { glucose, carbs } = inputs;
  const { correction, correctionClamped, meal, total } = result;
  const corrNegative = correction < 0;

  return `
    <div class="ins-result card" id="ins-result-card" aria-live="polite" aria-atomic="true">
      <div class="card-header">
        <span class="card-title">Resultado do cálculo</span>
        <span class="badge badge-accent">${fmt(total)} UI</span>
      </div>

      <div class="ins-total-display">
        <span class="ins-total-val">${fmt(total)}</span>
        <span class="ins-total-unit">unidades</span>
      </div>

      <div class="ins-breakdown">
        <h3 class="ins-breakdown-title">Detalhamento completo</h3>

        <div class="ins-step">
          <div class="ins-step-header">
            <span class="ins-step-num">1</span>
            <span class="ins-step-label">Dose de correção</span>
            <span class="ins-step-val ${corrNegative ? 'text-success' : correctionClamped > 0 ? 'text-warning' : 'text-muted'}">${corrNegative ? '0' : fmt(correctionClamped)} UI</span>
          </div>
          <div class="ins-step-formula">
            <code>(Glicose − Alvo) ÷ Fator de sensibilidade</code>
          </div>
          <div class="ins-step-calc">
            <span>(<strong>${glucose}</strong> − <strong>${s.correctionTarget}</strong>) ÷ <strong>${s.insulinSensitivity}</strong> = <strong>${fmt(correction)} UI</strong></span>
            ${corrNegative ? `<span class="ins-step-note">Valor negativo → zerado (glicose abaixo do alvo, não aplicar correção)</span>` : ''}
          </div>
        </div>

        ${carbs > 0 ? `
        <div class="ins-step">
          <div class="ins-step-header">
            <span class="ins-step-num">2</span>
            <span class="ins-step-label">Dose de refeição</span>
            <span class="ins-step-val text-accent">${fmt(meal)} UI</span>
          </div>
          <div class="ins-step-formula">
            <code>Carboidratos ÷ Relação insulina:carbo</code>
          </div>
          <div class="ins-step-calc">
            <span><strong>${carbs}g</strong> ÷ <strong>${s.carbRatio}</strong> = <strong>${fmt(meal)} UI</strong></span>
          </div>
        </div>` : ''}

        <div class="ins-step ins-step--total">
          <div class="ins-step-header">
            <span class="ins-step-num">${carbs > 0 ? '3' : '2'}</span>
            <span class="ins-step-label">Dose total</span>
            <span class="ins-step-val text-accent">${fmt(total)} UI</span>
          </div>
          <div class="ins-step-formula">
            <code>Correção + Refeição</code>
          </div>
          <div class="ins-step-calc">
            <span><strong>${fmt(correctionClamped)}</strong> + <strong>${fmt(meal)}</strong> = <strong>${fmt(total)} UI</strong></span>
          </div>
        </div>
      </div>

      <div class="ins-result-actions">
        <button class="btn btn-secondary" id="ins-btn-recalc" type="button">Novo cálculo</button>
        <button class="btn btn-primary" id="ins-btn-save" type="button"
          data-glucose="${glucose}" data-carbs="${carbs}" data-total="${total}"
          data-correction="${correctionClamped}" data-meal="${meal}">
          Salvar registro
        </button>
      </div>

      ${renderDisclaimer()}
    </div>`;
}

/* ── render: history ── */
function renderHistory() {
  const records = getList(KEYS.INSULIN).slice(0, 20);
  if (!records.length) return '';
  return `
    <div class="section" id="ins-history-section">
      <div class="section-header">
        <h2 class="section-title">${ICON_HISTORY} Histórico</h2>
        <span class="text-xs text-muted">${records.length} registro${records.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="card" style="padding:0 16px;">
        ${records.map(r => `
          <div class="ins-history-item list-item" data-id="${r.id}">
            <div class="list-item-icon bg-glucose-normal" aria-hidden="true">${ICON_SYRINGE}</div>
            <div class="list-item-content">
              <div class="ins-history-top">
                <span class="ins-history-dose">${fmt(r.total)} UI</span>
                ${r.correction > 0 ? `<span class="ins-history-tag">Correção: ${fmt(r.correction)} UI</span>` : ''}
                ${r.meal > 0 ? `<span class="ins-history-tag">Refeição: ${fmt(r.meal)} UI</span>` : ''}
              </div>
              <div class="ins-history-meta">
                <span>Glicose: ${r.glucose} mg/dL</span>
                ${r.carbs > 0 ? `<span class="glc-dot" aria-hidden="true">·</span><span>Carbs: ${r.carbs}g</span>` : ''}
                <span class="glc-dot" aria-hidden="true">·</span>
                <span>${formatTime(r.date)}, ${formatDate(r.date)}</span>
              </div>
            </div>
            <button class="btn-icon glc-btn-del ins-del-btn" data-id="${r.id}"
              aria-label="Excluir registro de ${fmt(r.total)} UI" type="button">${ICON_DEL}</button>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ── render: params modal ── */
function renderParamsModal(s) {
  return `
    <div class="modal-overlay" id="ins-params-modal" role="dialog" aria-modal="true" aria-labelledby="ins-params-title">
      <div class="modal">
        <div class="modal-handle" aria-hidden="true"></div>
        <h2 class="modal-title" id="ins-params-title">Parâmetros de insulina</h2>
        <p class="text-secondary text-sm" style="margin-bottom:20px;">
          Estes valores devem ser definidos pelo seu médico. O app apenas aplica a fórmula que você configurar.
        </p>
        <form id="ins-params-form" novalidate>
          <div class="form-group" id="ins-pfg-sens">
            <label class="form-label" for="ins-p-sensitivity">
              Fator de sensibilidade (mg/dL por UI)
            </label>
            <input class="form-input" id="ins-p-sensitivity" type="number" inputmode="decimal"
              min="1" max="500" placeholder="Ex: 50" value="${s.insulinSensitivity}" required />
            <span class="form-hint">Quanto 1 unidade de insulina reduz sua glicose</span>
            <span class="form-error">Informe um valor entre 1 e 500</span>
          </div>
          <div class="form-group" id="ins-pfg-ratio">
            <label class="form-label" for="ins-p-carbratio">
              Relação insulina:carbo (g de carbo por UI)
            </label>
            <input class="form-input" id="ins-p-carbratio" type="number" inputmode="decimal"
              min="1" max="100" placeholder="Ex: 10" value="${s.carbRatio}" required />
            <span class="form-hint">Quantos gramas de carboidrato 1 unidade cobre</span>
            <span class="form-error">Informe um valor entre 1 e 100</span>
          </div>
          <div class="form-group" id="ins-pfg-target">
            <label class="form-label" for="ins-p-target">
              Glicose alvo (mg/dL)
            </label>
            <input class="form-input" id="ins-p-target" type="number" inputmode="numeric"
              min="60" max="300" placeholder="Ex: 120" value="${s.correctionTarget}" required />
            <span class="form-hint">Valor de glicose que você quer atingir com a correção</span>
            <span class="form-error">Informe um valor entre 60 e 300</span>
          </div>
          <div class="glc-modal-actions">
            <button type="button" class="btn btn-secondary" id="ins-params-cancel">Cancelar</button>
            <button type="submit" class="btn btn-primary" style="flex:2">Salvar parâmetros</button>
          </div>
        </form>
      </div>
    </div>`;
}

/* ── state ── */
let currentResult = null;
let currentInputs  = null;

/* ── open/close params modal ── */
function openParamsModal() {
  const s = getSettings();
  const existing = document.getElementById('ins-params-modal');
  if (existing) existing.remove();
  document.getElementById('insulin-content').insertAdjacentHTML('beforeend', renderParamsModal(s));
  requestAnimationFrame(() => {
    document.getElementById('ins-params-modal').classList.add('open');
    document.getElementById('ins-p-sensitivity').focus();
  });
  bindParamsModalEvents();
}

function closeParamsModal() {
  const m = document.getElementById('ins-params-modal');
  if (!m) return;
  m.classList.remove('open');
  setTimeout(() => m.remove(), 350);
}

function bindParamsModalEvents() {
  document.getElementById('ins-params-cancel')?.addEventListener('click', closeParamsModal);
  document.getElementById('ins-params-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeParamsModal();
  });

  document.getElementById('ins-params-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const sens   = parseFloat(document.getElementById('ins-p-sensitivity').value);
    const ratio  = parseFloat(document.getElementById('ins-p-carbratio').value);
    const target = parseFloat(document.getElementById('ins-p-target').value);

    let valid = true;
    const validate = (id, fgId, min, max, val) => {
      const fg = document.getElementById(fgId);
      if (isNaN(val) || val < min || val > max) { fg.classList.add('has-error'); valid = false; }
      else fg.classList.remove('has-error');
    };
    validate('ins-p-sensitivity', 'ins-pfg-sens',   1,   500, sens);
    validate('ins-p-carbratio',   'ins-pfg-ratio',   1,   100, ratio);
    validate('ins-p-target',      'ins-pfg-target',  60,  300, target);
    if (!valid) return;

    const s = getSettings();
    saveSettings({ ...s, insulinSensitivity: sens, carbRatio: ratio, correctionTarget: target });
    closeParamsModal();
    showToast('Parâmetros salvos', 'success');
    renderPage();
  });
}

/* ── bind page events ── */
function bindPageEvents() {
  document.getElementById('ins-go-settings')?.addEventListener('click', openParamsModal);
  document.getElementById('ins-edit-params')?.addEventListener('click', openParamsModal);

  document.getElementById('ins-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const glucoseInput = document.getElementById('ins-glucose');
    const fg           = document.getElementById('ins-fg-glucose');
    const glucose      = parseInt(glucoseInput.value, 10);

    if (!glucose || glucose < 20 || glucose > 600) {
      fg.classList.add('has-error');
      glucoseInput.focus();
      return;
    }
    fg.classList.remove('has-error');

    const carbs = Math.max(0, parseFloat(document.getElementById('ins-carbs').value) || 0);
    const s     = getSettings();

    currentInputs = { glucose, carbs };
    currentResult = calcInsulin({
      glucose,
      carbs,
      sensitivity: s.insulinSensitivity,
      carbRatio:   s.carbRatio,
      target:      s.correctionTarget
    });

    const resultContainer = document.getElementById('ins-result-container');
    if (resultContainer) {
      resultContainer.innerHTML = renderResult(currentInputs, currentResult, s);
      bindResultEvents();
      resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  document.getElementById('ins-glucose')?.addEventListener('input', () => {
    document.getElementById('ins-fg-glucose')?.classList.remove('has-error');
  });

  /* history delete */
  document.getElementById('ins-history-section')?.addEventListener('click', e => {
    const btn = e.target.closest('.ins-del-btn');
    if (!btn) return;
    deleteItem(KEYS.INSULIN, btn.dataset.id);
    showToast('Registro excluído', 'success');
    const histSection = document.getElementById('ins-history-section');
    if (histSection) { histSection.outerHTML = renderHistory() || ''; bindHistoryEvents(); }
  });
}

function bindResultEvents() {
  document.getElementById('ins-btn-recalc')?.addEventListener('click', () => {
    const container = document.getElementById('ins-result-container');
    if (container) container.innerHTML = '';
    currentResult = null;
    currentInputs = null;
    document.getElementById('ins-glucose')?.focus();
  });

  document.getElementById('ins-btn-save')?.addEventListener('click', e => {
    const btn = e.currentTarget;
    const record = {
      id:         generateId(),
      date:       nowISO(),
      glucose:    parseFloat(btn.dataset.glucose),
      carbs:      parseFloat(btn.dataset.carbs),
      total:      parseFloat(btn.dataset.total),
      correction: parseFloat(btn.dataset.correction),
      meal:       parseFloat(btn.dataset.meal)
    };
    addItem(KEYS.INSULIN, record);
    showToast(`${fmt(record.total)} UI registradas`, 'success');
    btn.disabled = true;
    btn.textContent = 'Salvo ✓';

    const histSection = document.getElementById('ins-history-section');
    if (histSection) {
      histSection.outerHTML = renderHistory();
      bindHistoryEvents();
    } else {
      const el = document.getElementById('insulin-content');
      el.insertAdjacentHTML('beforeend', renderHistory());
      bindHistoryEvents();
    }
  });
}

function bindHistoryEvents() {
  document.getElementById('ins-history-section')?.addEventListener('click', e => {
    const btn = e.target.closest('.ins-del-btn');
    if (!btn) return;
    deleteItem(KEYS.INSULIN, btn.dataset.id);
    showToast('Registro excluído', 'success');
    const histSection = document.getElementById('ins-history-section');
    if (histSection) { histSection.outerHTML = renderHistory() || ''; bindHistoryEvents(); }
  });
}

/* ── full page render ── */
function renderPage() {
  const el = document.getElementById('insulin-content');
  if (!el) return;
  const s = getSettings();

  el.innerHTML = `
    ${renderDisclaimer()}
    ${hasParams(s) ? renderParamsSummary(s) : renderNoParams()}
    ${hasParams(s) ? renderCalculator(s) : ''}
    <div id="ins-result-container"></div>
    ${renderHistory()}`;

  bindPageEvents();

  if (currentResult && currentInputs && hasParams(s)) {
    const container = document.getElementById('ins-result-container');
    if (container) {
      container.innerHTML = renderResult(currentInputs, currentResult, s);
      bindResultEvents();
    }
  }
}

function init()    { currentResult = null; currentInputs = null; renderPage(); }
function refresh() { renderPage(); }

export { init, refresh };

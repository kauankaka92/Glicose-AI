import { KEYS, getList, setList, getSettings, saveSettings } from './storage.js';
import { showToast, formatDateTime, getGlucoseStatus } from './utils.js';

function allData() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    glucose: getList(KEYS.GLUCOSE),
    food: getList(KEYS.FOOD),
    insulin: getList(KEYS.INSULIN),
    reminders: getList(KEYS.REMINDERS),
    settings: getSettings(),
  };
}

function dateTag() { return new Date().toISOString().slice(0, 10); }

function downloadBlob(content, filename, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportJSON() {
  downloadBlob(JSON.stringify(allData(), null, 2), `glicose-ai-backup-${dateTag()}.json`, 'application/json');
  showToast('Backup JSON exportado', 'success');
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.version) throw new Error();
      if (data.glucose)   setList(KEYS.GLUCOSE,   data.glucose);
      if (data.food)      setList(KEYS.FOOD,       data.food);
      if (data.insulin)   setList(KEYS.INSULIN,    data.insulin);
      if (data.reminders) setList(KEYS.REMINDERS,  data.reminders);
      if (data.settings)  saveSettings(data.settings);
      showToast('Dados restaurados com sucesso', 'success');
      renderPage();
    } catch { showToast('Arquivo inválido ou corrompido', 'error'); }
  };
  reader.readAsText(file);
}

function toCSV(rows, headers) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}

function exportCSV() {
  const settings = getSettings();
  const gCSV = toCSV(
    getList(KEYS.GLUCOSE).map(r => ({ datetime: formatDateTime(r.date || r.datetime), value: r.value, status: getGlucoseStatus(r.value, settings).label, notes: r.notes || '' })),
    ['datetime','value','status','notes']
  );
  const fCSV = toCSV(
    getList(KEYS.FOOD).map(r => ({ datetime: formatDateTime(r.date || r.datetime), name: r.name, calories: r.kcal || r.calories || '', carbs: r.carbs || '', protein: r.protein || '', fat: r.fat || '', category: r.category || '' })),
    ['datetime','name','calories','carbs','protein','fat','category']
  );
  const iCSV = toCSV(
    getList(KEYS.INSULIN).map(r => ({ datetime: formatDateTime(r.date || r.datetime), totalDose: r.total || r.totalDose, correctionDose: r.correction || r.correctionDose || '', mealDose: r.meal || r.mealDose || '', glucose: r.glucose || '' })),
    ['datetime','totalDose','correctionDose','mealDose','glucose']
  );
  downloadBlob(`=== GLICOSE ===\n${gCSV}\n\n=== ALIMENTAÇÃO ===\n${fCSV}\n\n=== INSULINA ===\n${iCSV}`, `glicose-ai-dados-${dateTag()}.csv`, 'text/csv;charset=utf-8;');
  showToast('CSV exportado', 'success');
}

function exportPDF() {
  const settings = getSettings();
  const glucose = getList(KEYS.GLUCOSE).slice(0, 100);
  const food    = getList(KEYS.FOOD).slice(0, 100);
  const insulin = getList(KEYS.INSULIN).slice(0, 100);

  const gRows = glucose.map(r => {
    const s = getGlucoseStatus(r.value, settings);
    return `<tr><td>${formatDateTime(r.date || r.datetime)}</td><td><b>${r.value} mg/dL</b></td><td>${s.label}</td><td>${r.notes||'—'}</td></tr>`;
  }).join('');
  const fRows = food.map(r =>
    `<tr><td>${formatDateTime(r.date||r.datetime)}</td><td>${r.name}</td><td>${r.kcal||r.calories||'—'}</td><td>${r.carbs||'—'}</td><td>${r.category||'—'}</td></tr>`
  ).join('');
  const iRows = insulin.map(r =>
    `<tr><td>${formatDateTime(r.date || r.datetime)}</td><td>${r.total || r.totalDose} U</td><td>${r.correction || r.correctionDose||'—'}</td><td>${r.meal || r.mealDose||'—'}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Glicose AI — Relatório ${dateTag()}</title>
  <style>body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:24px}h1{font-size:18px;margin-bottom:4px}h2{font-size:14px;margin:20px 0 6px;border-bottom:1px solid #ccc;padding-bottom:4px}p{margin:0 0 16px;color:#555;font-size:11px}table{width:100%;border-collapse:collapse}th{background:#f0f0f0;text-align:left;padding:5px 8px;font-size:11px}td{padding:4px 8px;border-bottom:1px solid #eee}@media print{body{padding:0}}</style>
  </head><body>
  <h1>Glicose AI — Relatório de Saúde</h1>
  <p>Gerado em ${formatDateTime(new Date().toISOString())}${settings.name ? ' · ' + settings.name : ''}</p>
  <h2>Glicose (${glucose.length} registros)</h2>
  <table><thead><tr><th>Data/Hora</th><th>Valor</th><th>Status</th><th>Notas</th></tr></thead><tbody>${gRows||'<tr><td colspan="4">Sem registros</td></tr>'}</tbody></table>
  <h2>Alimentação (${food.length} registros)</h2>
  <table><thead><tr><th>Data/Hora</th><th>Alimento</th><th>kcal</th><th>Carbs</th><th>Categoria</th></tr></thead><tbody>${fRows||'<tr><td colspan="5">Sem registros</td></tr>'}</tbody></table>
  <h2>Insulina (${insulin.length} registros)</h2>
  <table><thead><tr><th>Data/Hora</th><th>Total</th><th>Correção</th><th>Refeição</th></tr></thead><tbody>${iRows||'<tr><td colspan="4">Sem registros</td></tr>'}</tbody></table>
  </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.onload = () => win.print();
}

function renderPage() {
  const el = document.getElementById('settings-content');
  if (!el) return;
  const s = getSettings();
  const counts = { glucose: getList(KEYS.GLUCOSE).length, food: getList(KEYS.FOOD).length, insulin: getList(KEYS.INSULIN).length };

  el.innerHTML = `
    <div class="settings-section">
      <h2 class="settings-section-title">Perfil</h2>
      <div class="form-group">
        <label class="form-label" for="s-name">Nome</label>
        <input class="form-input" id="s-name" type="text" placeholder="Seu nome" maxlength="60" value="${s.name || ''}">
      </div>
    </div>

    <div class="settings-section">
      <h2 class="settings-section-title">Metas Clínicas</h2>
      <div class="settings-row">
        <div class="form-group">
          <label class="form-label" for="s-tmin">Glicose mínima (mg/dL)</label>
          <input class="form-input" id="s-tmin" type="number" min="40" max="200" value="${s.targetMin}">
        </div>
        <div class="form-group">
          <label class="form-label" for="s-tmax">Glicose máxima (mg/dL)</label>
          <input class="form-input" id="s-tmax" type="number" min="100" max="400" value="${s.targetMax}">
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h2 class="settings-section-title">Parâmetros de Insulina</h2>
      <div class="settings-row">
        <div class="form-group">
          <label class="form-label" for="s-isf">Sensibilidade (mg/dL por U)</label>
          <input class="form-input" id="s-isf" type="number" min="1" max="500" value="${s.insulinSensitivity}">
        </div>
        <div class="form-group">
          <label class="form-label" for="s-cr">Razão carb (g por U)</label>
          <input class="form-input" id="s-cr" type="number" min="1" max="100" value="${s.carbRatio}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="s-ct">Alvo de correção (mg/dL)</label>
        <input class="form-input" id="s-ct" type="number" min="60" max="200" value="${s.correctionTarget}">
      </div>
    </div>

    <button class="btn btn-primary btn-full" id="btn-save-settings" type="button">Salvar Configurações</button>

    <div class="settings-section">
      <h2 class="settings-section-title">Seus Dados</h2>
      <div class="settings-stats">
        <div class="settings-stat"><span class="settings-stat-val">${counts.glucose}</span><span class="settings-stat-label">Glicose</span></div>
        <div class="settings-stat"><span class="settings-stat-val">${counts.food}</span><span class="settings-stat-label">Refeições</span></div>
        <div class="settings-stat"><span class="settings-stat-val">${counts.insulin}</span><span class="settings-stat-label">Insulina</span></div>
      </div>
    </div>

    <div class="settings-section">
      <h2 class="settings-section-title">Exportar</h2>
      <div class="export-grid">
        <button class="export-btn" id="btn-export-json" type="button">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          <span>Backup JSON</span><small>Todos os dados</small>
        </button>
        <button class="export-btn" id="btn-export-csv" type="button">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          <span>Exportar CSV</span><small>Planilha</small>
        </button>
        <button class="export-btn" id="btn-export-pdf" type="button">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13h6M9 17h4"/></svg>
          <span>Relatório PDF</span><small>Imprimir / salvar</small>
        </button>
      </div>
    </div>

    <div class="settings-section">
      <h2 class="settings-section-title">Importar / Restaurar</h2>
      <p class="settings-hint">Selecione um backup JSON gerado pelo Glicose AI. Os dados existentes serão substituídos.</p>
      <label class="import-label" for="input-import-json" role="button" tabindex="0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Selecionar arquivo .json
        <input type="file" id="input-import-json" accept=".json" class="sr-only">
      </label>
    </div>

    <div class="settings-section settings-section--danger">
      <h2 class="settings-section-title settings-section-title--danger">Zona de Perigo</h2>
      <button class="btn btn-danger btn-full" id="btn-clear-data" type="button">Apagar todos os dados</button>
    </div>`;

  bindEvents();
}

function bindEvents() {
  document.getElementById('btn-save-settings')?.addEventListener('click', () => {
    saveSettings({
      ...getSettings(),
      name: document.getElementById('s-name').value.trim(),
      targetMin: Number(document.getElementById('s-tmin').value),
      targetMax: Number(document.getElementById('s-tmax').value),
      insulinSensitivity: Number(document.getElementById('s-isf').value),
      carbRatio: Number(document.getElementById('s-cr').value),
      correctionTarget: Number(document.getElementById('s-ct').value),
    });
    showToast('Configurações salvas', 'success');
  });

  document.getElementById('btn-export-json')?.addEventListener('click', exportJSON);
  document.getElementById('btn-export-csv')?.addEventListener('click', exportCSV);
  document.getElementById('btn-export-pdf')?.addEventListener('click', exportPDF);

  document.getElementById('input-import-json')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importJSON(file);
    e.target.value = '';
  });

  document.getElementById('btn-clear-data')?.addEventListener('click', () => {
    if (!confirm('Apagar TODOS os dados? Esta ação não pode ser desfeita.')) return;
    [KEYS.GLUCOSE, KEYS.FOOD, KEYS.INSULIN, KEYS.REMINDERS].forEach(k => setList(k, []));
    showToast('Todos os dados foram apagados', 'success');
    renderPage();
  });
}

function init() {
  renderPage();
  window.addEventListener('settings:updated', () => {
    if (document.getElementById('settings-content')) renderPage();
  });
}
function refresh() { renderPage(); }

export { init, refresh };

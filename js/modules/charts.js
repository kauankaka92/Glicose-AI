import { KEYS, getList, getSettings } from './storage.js';
import { getGlucoseStatus, formatDate, formatTime } from './utils.js';

/* ── period state ── */
let activePeriod = 'week';

/* ── data helpers ── */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getRecordsForPeriod(records, period) {
  const now = new Date();
  let cutoff;
  if (period === 'day')   cutoff = daysAgo(0);
  if (period === 'week')  cutoff = daysAgo(6);
  if (period === 'month') cutoff = daysAgo(29);
  return records
    .filter(r => new Date(r.date) >= cutoff)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function computeStats(records, settings) {
  if (!records.length) return null;
  const values = records.map(r => r.value);
  const avg    = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const min    = Math.min(...values);
  const max    = Math.max(...values);
  const inRange = records.filter(r => getGlucoseStatus(r.value, settings).key === 'normal').length;
  const tir    = Math.round((inRange / records.length) * 100);
  const low    = records.filter(r => { const k = getGlucoseStatus(r.value, settings).key; return k === 'low' || k === 'very-low'; }).length;
  const high   = records.filter(r => { const k = getGlucoseStatus(r.value, settings).key; return k === 'high' || k === 'very-high'; }).length;
  const std    = Math.round(Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length));
  return { avg, min, max, tir, low, high, std, count: records.length };
}

/* ── SVG line chart ── */
function buildLineChart(records, settings) {
  if (records.length < 2) return renderChartEmpty();

  const W = 440, H = 180, PL = 36, PR = 12, PT = 12, PB = 28;
  const cw = W - PL - PR;
  const ch = H - PT - PB;

  const values = records.map(r => r.value);
  const times  = records.map(r => new Date(r.date).getTime());
  const vMin   = Math.max(0,   Math.min(...values) - 20);
  const vMax   =              Math.max(...values) + 20;
  const tMin   = Math.min(...times);
  const tMax   = Math.max(...times);
  const tRange = tMax - tMin || 1;
  const vRange = vMax - vMin || 1;

  const px = t  => PL + ((t  - tMin) / tRange) * cw;
  const py = v  => PT + ch - ((v - vMin) / vRange) * ch;

  const { targetMin = 70, targetMax = 180 } = settings;
  const tyMin = py(targetMin);
  const tyMax = py(targetMax);

  /* path */
  const pts = records.map(r => `${px(new Date(r.date).getTime()).toFixed(1)},${py(r.value).toFixed(1)}`);
  const linePath = `M${pts.join('L')}`;

  /* area fill */
  const areaPath = `M${px(times[0]).toFixed(1)},${(PT + ch).toFixed(1)}L${pts.join('L')}L${px(times[times.length - 1]).toFixed(1)},${(PT + ch).toFixed(1)}Z`;

  /* y-axis labels */
  const yLabels = [vMin, Math.round((vMin + vMax) / 2), vMax].map(v => ({
    y: py(v), label: Math.round(v)
  }));

  /* x-axis labels — pick up to 5 evenly spaced */
  const step = Math.max(1, Math.floor(records.length / 4));
  const xLabels = records.filter((_, i) => i % step === 0 || i === records.length - 1).map(r => ({
    x: px(new Date(r.date).getTime()),
    label: formatXLabel(r.date, activePeriod)
  }));

  /* dots colored by status */
  const dots = records.map(r => {
    const s = getGlucoseStatus(r.value, settings);
    const cx = px(new Date(r.date).getTime());
    const cy = py(r.value);
    const fill = s.key === 'normal' ? 'var(--success)' : (s.key === 'high' || s.key === 'very-high') ? 'var(--warning)' : 'var(--danger)';
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.5" fill="${fill}" stroke="var(--bg-secondary)" stroke-width="1.5">
      <title>${r.value} mg/dL — ${formatTime(r.date)}</title>
    </circle>`;
  });

  return `
    <svg viewBox="0 0 ${W} ${H}" class="chrt-svg" role="img" aria-label="Gráfico de glicose"
      xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="chrt-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient>
        <clipPath id="chrt-clip">
          <rect x="${PL}" y="${PT}" width="${cw}" height="${ch}"/>
        </clipPath>
      </defs>

      <!-- target range band -->
      <rect x="${PL}" y="${Math.min(tyMin, tyMax).toFixed(1)}"
        width="${cw}" height="${Math.abs(tyMax - tyMin).toFixed(1)}"
        fill="var(--success)" opacity="0.08" clip-path="url(#chrt-clip)"/>

      <!-- target lines -->
      <line x1="${PL}" y1="${tyMin.toFixed(1)}" x2="${W - PR}" y2="${tyMin.toFixed(1)}"
        stroke="var(--success)" stroke-width="1" stroke-dasharray="4 3" opacity="0.5"/>
      <line x1="${PL}" y1="${tyMax.toFixed(1)}" x2="${W - PR}" y2="${tyMax.toFixed(1)}"
        stroke="var(--warning)" stroke-width="1" stroke-dasharray="4 3" opacity="0.5"/>

      <!-- area -->
      <path d="${areaPath}" fill="url(#chrt-grad)" clip-path="url(#chrt-clip)"/>

      <!-- line -->
      <path d="${linePath}" fill="none" stroke="var(--accent)" stroke-width="2"
        stroke-linejoin="round" stroke-linecap="round" clip-path="url(#chrt-clip)"/>

      <!-- dots -->
      <g clip-path="url(#chrt-clip)">${dots.join('')}</g>

      <!-- y-axis labels -->
      ${yLabels.map(l => `
        <text x="${PL - 4}" y="${l.y.toFixed(1)}" text-anchor="end" dominant-baseline="middle"
          font-size="9" fill="var(--text-muted)">${l.label}</text>`).join('')}

      <!-- x-axis labels -->
      ${xLabels.map(l => `
        <text x="${l.x.toFixed(1)}" y="${H - 4}" text-anchor="middle"
          font-size="9" fill="var(--text-muted)">${l.label}</text>`).join('')}

      <!-- axes -->
      <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT + ch}" stroke="var(--border)" stroke-width="1"/>
      <line x1="${PL}" y1="${PT + ch}" x2="${W - PR}" y2="${PT + ch}" stroke="var(--border)" stroke-width="1"/>
    </svg>`;
}

function formatXLabel(dateStr, period) {
  const d = new Date(dateStr);
  if (period === 'day')   return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (period === 'week')  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function renderChartEmpty() {
  return `
    <div class="chrt-empty">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
      <p>Dados insuficientes para o período</p>
    </div>`;
}

/* ── bar chart (by period of day) ── */
function buildBarChart(records, settings) {
  const periods = ['Jejum', 'Pré-almoço', 'Pós-almoço', 'Tarde', 'Jantar', 'Madrugada'];
  const groups  = {};
  periods.forEach(p => { groups[p] = []; });
  records.forEach(r => { if (groups[r.period]) groups[r.period].push(r.value); });

  const avgs = periods.map(p => {
    const vals = groups[p];
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  });

  const validAvgs = avgs.filter(v => v !== null);
  if (!validAvgs.length) return '';

  const W = 440, H = 140, PL = 36, PR = 12, PT = 10, PB = 36;
  const cw = W - PL - PR;
  const ch = H - PT - PB;
  const maxVal = Math.max(...validAvgs, settings.targetMax + 20);
  const barW   = Math.floor(cw / periods.length) - 6;

  const bars = periods.map((p, i) => {
    const avg = avgs[i];
    if (avg === null) return '';
    const s    = getGlucoseStatus(avg, settings);
    const fill = s.key === 'normal' ? 'var(--success)' : (s.key === 'high' || s.key === 'very-high') ? 'var(--warning)' : 'var(--danger)';
    const bh   = Math.max(2, (avg / maxVal) * ch);
    const bx   = PL + i * (cw / periods.length) + 3;
    const by   = PT + ch - bh;
    const lx   = bx + barW / 2;
    const shortLabel = p.split('-')[0].substring(0, 3);
    return `
      <rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW}" height="${bh.toFixed(1)}"
        fill="${fill}" rx="3" opacity="0.85">
        <title>${p}: ${avg} mg/dL</title>
      </rect>
      <text x="${lx.toFixed(1)}" y="${(PT + ch + 12).toFixed(1)}" text-anchor="middle"
        font-size="8" fill="var(--text-muted)">${shortLabel}</text>
      <text x="${lx.toFixed(1)}" y="${(by - 3).toFixed(1)}" text-anchor="middle"
        font-size="8" fill="var(--text-secondary)">${avg}</text>`;
  });

  return `
    <svg viewBox="0 0 ${W} ${H}" class="chrt-svg chrt-svg--bar" role="img"
      aria-label="Média por período do dia" xmlns="http://www.w3.org/2000/svg">
      <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT + ch}" stroke="var(--border)" stroke-width="1"/>
      <line x1="${PL}" y1="${PT + ch}" x2="${W - PR}" y2="${PT + ch}" stroke="var(--border)" stroke-width="1"/>
      ${bars.join('')}
    </svg>`;
}

/* ── TIR donut ── */
function buildTIRDonut(stats) {
  if (!stats) return '';
  const { tir, low, high, count } = stats;
  const lowPct  = Math.round((low  / count) * 100);
  const highPct = Math.round((high / count) * 100);
  const tirPct  = 100 - lowPct - highPct;

  const R = 42, CX = 60, CY = 60, STROKE = 12;
  const circ = 2 * Math.PI * R;

  function arc(pct, offset, color) {
    const len = (pct / 100) * circ;
    return `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none"
      stroke="${color}" stroke-width="${STROKE}"
      stroke-dasharray="${len.toFixed(2)} ${circ.toFixed(2)}"
      stroke-dashoffset="${(-offset * circ / 100).toFixed(2)}"
      transform="rotate(-90 ${CX} ${CY})"/>`;
  }

  const lowOffset  = 0;
  const tirOffset  = lowPct;
  const highOffset = lowPct + tirPct;

  return `
    <svg viewBox="0 0 120 120" class="chrt-donut" role="img" aria-label="Tempo no alvo ${tir}%">
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="none"
        stroke="var(--bg-tertiary)" stroke-width="${STROKE}"/>
      ${arc(lowPct,  lowOffset,  'var(--danger)')}
      ${arc(tirPct,  tirOffset,  'var(--success)')}
      ${arc(highPct, highOffset, 'var(--warning)')}
      <text x="${CX}" y="${CY - 6}" text-anchor="middle" font-size="16"
        font-weight="800" fill="var(--text-primary)">${tir}%</text>
      <text x="${CX}" y="${CY + 10}" text-anchor="middle" font-size="8"
        fill="var(--text-muted)">no alvo</text>
    </svg>`;
}

/* ── goal card ── */
function renderGoalCard(stats, settings) {
  if (!stats) return '';
  const { targetMin, targetMax } = settings;
  return `
    <div class="chrt-goal card">
      <div class="card-header">
        <span class="card-title">Tempo no alvo</span>
        <span class="text-xs text-muted">Meta: ${targetMin}–${targetMax} mg/dL</span>
      </div>
      <div class="chrt-goal-body">
        ${buildTIRDonut(stats)}
        <div class="chrt-goal-legend">
          <div class="chrt-legend-item">
            <span class="chrt-legend-dot" style="background:var(--success)"></span>
            <span class="chrt-legend-label">No alvo</span>
            <span class="chrt-legend-val glucose-normal">${stats.tir}%</span>
          </div>
          <div class="chrt-legend-item">
            <span class="chrt-legend-dot" style="background:var(--warning)"></span>
            <span class="chrt-legend-label">Alto</span>
            <span class="chrt-legend-val glucose-high">${Math.round((stats.high / stats.count) * 100)}%</span>
          </div>
          <div class="chrt-legend-item">
            <span class="chrt-legend-dot" style="background:var(--danger)"></span>
            <span class="chrt-legend-label">Baixo</span>
            <span class="chrt-legend-val glucose-low">${Math.round((stats.low / stats.count) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>`;
}

/* ── stats grid ── */
function renderStatsGrid(stats, settings) {
  if (!stats) return '';
  const avgStatus = getGlucoseStatus(stats.avg, settings);
  const items = [
    { label: 'Média',      val: stats.avg,   unit: 'mg/dL', cls: avgStatus.class },
    { label: 'Mínima',     val: stats.min,   unit: 'mg/dL', cls: getGlucoseStatus(stats.min, settings).class },
    { label: 'Máxima',     val: stats.max,   unit: 'mg/dL', cls: getGlucoseStatus(stats.max, settings).class },
    { label: 'Desvio',     val: stats.std,   unit: 'mg/dL', cls: '' },
    { label: 'Medições',   val: stats.count, unit: '',       cls: '' },
    { label: 'No alvo',    val: `${stats.tir}%`, unit: '',  cls: stats.tir >= 70 ? 'glucose-normal' : stats.tir >= 50 ? 'glucose-high' : 'glucose-low' },
  ];
  return `
    <div class="section">
      <h2 class="section-title">Estatísticas</h2>
      <div class="chrt-stats-grid">
        ${items.map(it => `
          <div class="card chrt-stat-card">
            <span class="chrt-stat-label">${it.label}</span>
            <span class="chrt-stat-val ${it.cls}">${it.val}<span class="chrt-stat-unit">${it.unit}</span></span>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ── history table ── */
function renderHistory(records, settings) {
  if (!records.length) return '';
  const recent = [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);
  return `
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Histórico</h2>
        <span class="text-xs text-muted">${recent.length} registros</span>
      </div>
      <div class="card" style="padding:0 16px;">
        ${recent.map(r => {
          const s = getGlucoseStatus(r.value, settings);
          return `
            <div class="list-item">
              <div class="list-item-icon ${s.key === 'normal' ? 'bg-glucose-normal' : (s.key === 'high' || s.key === 'very-high') ? 'bg-glucose-high' : 'bg-glucose-low'}" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              </div>
              <div class="list-item-content">
                <span class="list-item-title">${r.period || 'Medição'}</span>
                <span class="list-item-subtitle">${formatDate(r.date)} · ${formatTime(r.date)}</span>
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

/* ── full page render ── */
function renderPage() {
  const el = document.getElementById('charts-content');
  if (!el) return;

  const allRecords = getList(KEYS.GLUCOSE);
  const settings   = getSettings();
  const records    = getRecordsForPeriod(allRecords, activePeriod);
  const stats      = computeStats(records, settings);

  const periodLabels = { day: 'Hoje', week: '7 dias', month: '30 dias' };

  el.innerHTML = `
    <!-- Period selector -->
    <div class="chip-group chrt-period-chips" role="group" aria-label="Selecionar período">
      ${Object.entries(periodLabels).map(([k, v]) => `
        <button class="chip${activePeriod === k ? ' active' : ''}" data-period="${k}" type="button">${v}</button>
      `).join('')}
    </div>

    <!-- Line chart -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">Glicose — ${periodLabels[activePeriod]}</h2>
        ${stats ? `<span class="text-xs text-muted">${stats.count} medições</span>` : ''}
      </div>
      <div class="card chrt-card">
        ${records.length >= 2 ? buildLineChart(records, settings) : renderChartEmpty()}
      </div>
    </div>

    <!-- TIR goal -->
    ${stats ? renderGoalCard(stats, settings) : ''}

    <!-- Stats grid -->
    ${renderStatsGrid(stats, settings)}

    <!-- Bar chart by period -->
    ${records.length >= 3 ? `
    <div class="section">
      <h2 class="section-title">Média por período do dia</h2>
      <div class="card chrt-card">
        ${buildBarChart(records, settings)}
      </div>
    </div>` : ''}

    <!-- History -->
    ${renderHistory(records, settings)}

    ${!allRecords.length ? `
    <div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      <h3>Nenhum dado ainda</h3>
      <p>Registre medições de glicose para ver seus gráficos</p>
    </div>` : ''}
  `;

  bindEvents();
}

function bindEvents() {
  document.querySelector('.chrt-period-chips')?.addEventListener('click', e => {
    const chip = e.target.closest('[data-period]');
    if (!chip) return;
    activePeriod = chip.dataset.period;
    renderPage();
  });
}

function init()    { activePeriod = 'week'; renderPage(); }
function refresh() { renderPage(); }

export { init, refresh };

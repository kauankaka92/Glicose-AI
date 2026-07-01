import { getList, getSettings, KEYS } from './storage.js';
import { getGlucoseStatus, isSameDay, showToast } from './utils.js';
import { createGlucoseEntry, createFoodEntry, createInsulinEntry } from './api.js';
import { analyze } from './nlp.js';
import { getContext } from './contextManager.js';

const API_URL = '/api/chat';
const MODEL = 'meta/llama-3.1-8b-instruct';

let messages = [];
let isLoading = false;

// ── Cálculos clínicos ─────────────────────────────────────────────────────

function calcDose(glucose, carbs, settings) {
  const { insulinSensitivity: sens, carbRatio, correctionTarget: target } = settings;
  if (!sens || !carbRatio || !target) return null;
  const correction = Math.max(0, Math.round((glucose - target) / sens));
  const meal = Math.round(carbs / carbRatio);
  return { correction, meal, total: correction + meal };
}

function glucoseTrend(records) {
  if (records.length < 2) return 'sem dados suficientes';
  const diff = records[0].value - records[1].value;
  if (diff > 20) return `subindo (+${diff} mg/dL)`;
  if (diff > 8)  return `subindo levemente (+${diff} mg/dL)`;
  if (diff < -20) return `caindo (${diff} mg/dL)`;
  if (diff < -8)  return `caindo levemente (${diff} mg/dL)`;
  return `estável (${diff > 0 ? '+' : ''}${diff} mg/dL)`;
}

function todayStats(records, key) {
  return records.filter(r => isSameDay(r.date, new Date()));
}

// ── System Prompt (para perguntas abertas) ────────────────────────────────

function buildSystemPrompt() {
  const s = getSettings();
  const glucose = getList(KEYS.GLUCOSE);
  const food = getList(KEYS.FOOD);
  const insulin = getList(KEYS.INSULIN);
  const trend = glucoseTrend(glucose);

  const todayGlc = todayStats(glucose);
  const todayGlcStr = todayGlc.length
    ? `${todayGlc.length} medições hoje | Média: ${Math.round(todayGlc.reduce((a,r)=>a+r.value,0)/todayGlc.length)} mg/dL`
    : 'Sem medições hoje';

  const last3Glucose = glucose.slice(0, 3).map(r =>
    `${r.value} mg/dL (${r.period || ''})`
  ).join(', ') || 'nenhuma';

  return `Você é um assistente de saúde para diabéticos. Responda SEMPRE em português brasileiro.
Seja direto e objetivo. Máximo 6 linhas. Sem introduções ou despedidas.
NUNCA invente valores. Use apenas os dados fornecidos.

PARÂMETROS DO USUÁRIO:
Alvo: ${s.correctionTarget} mg/dL | Sensibilidade: ${s.insulinSensitivity} mg/dL/U | Carbo/UI: ${s.carbRatio}g/U
Meta: ${s.targetMin}–${s.targetMax} mg/dL

DADOS ATUAIS:
Tendência: ${trend}
${todayGlcStr}
Últimas medições: ${last3Glucose}
Últimas refeições: ${food.slice(0,3).map(r=>`${r.name} (${r.carbs}g carbs)`).join(', ') || 'nenhuma'}
Últimas doses: ${insulin.slice(0,3).map(r=>`${r.total}U`).join(', ') || 'nenhuma'}`;
}

// ── NLP Auto-Register ─────────────────────────────────────────────────────

async function tryAutoRegister(text) {
  const settings = getSettings();
  const result = analyze(text, settings);

  if (result.intent === 'unknown') return false;

  // Executar ações detectadas
  for (const action of result.actions) {
    if (action.type === 'create_glucose') {
      await createGlucoseEntry(action.data);
      window.dispatchEvent(new CustomEvent('glucose:registered', { detail: action.data }));
    } else if (action.type === 'create_food') {
      await createFoodEntry(action.data);
      window.dispatchEvent(new CustomEvent('food:registered', { detail: action.data }));
    } else if (action.type === 'create_insulin') {
      await createInsulinEntry(action.data);
      window.dispatchEvent(new CustomEvent('insulin:registered', { detail: action.data }));
    }
  }

  // Montar resposta compacta
  const html = buildNlpResponseHtml(result, settings);
  messages.push({ role: 'assistant', content: '', isNlpCard: true, html });

  const toastMap = {
    glucose: `Glicose ${result.glucose} mg/dL registrada`,
    meal: `Refeição registrada — ${result.meal?.totals?.carbs || 0}g carbs`,
    insulin: `${result.insulin} U registradas`
  };
  if (toastMap[result.intent]) showToast(toastMap[result.intent], 'success');

  return true;
}

function nlpIcon(type) {
  return `<span class="nlp-icon nlp-icon--${type}">${NLP_ICONS[type]}</span>`;
}

function buildNlpResponseHtml(result, settings) {
  const lines = [];

  if (result.intent === 'glucose') {
    const status = getGlucoseStatus(result.glucose, settings);
    lines.push(`<div class="nlp-row">${nlpIcon('glucose')}<span class="nlp-label">Glicose registrada</span></div>`);
    lines.push(`<div class="nlp-value nlp-value--glucose">${result.glucose} <small style="font-size:0.9rem;font-weight:600">mg/dL</small></div>`);
    lines.push(`<div class="nlp-meta">${result.period} · ${status.label}</div>`);
  }

  if (result.intent === 'meal') {
    const meal = result.meal;
    const foodNames = meal.foods.length
      ? meal.foods.map(f => f.name).join(', ')
      : 'Refeição';
    const ctx = getContext();
    const lastGlucose = ctx.lastGlucose?.value || getList(KEYS.GLUCOSE)[0]?.value;

    lines.push(`<div class="nlp-row">${nlpIcon('meal')}<span class="nlp-label">${meal.period} registrado</span></div>`);
    lines.push(`<div class="nlp-foods">${foodNames}</div>`);

    if (meal.unknown?.length) {
      lines.push(`<div class="nlp-unknown">${meal.unknown.join(', ')} — porção padrão estimada</div>`);
    }

    lines.push(`<div class="nlp-divider"></div>`);

    if (lastGlucose) {
      lines.push(`<div class="nlp-row nlp-row--sm">${nlpIcon('glucose')}<span>Glicose: <strong>${lastGlucose} mg/dL</strong></span></div>`);
    }

    lines.push(`<div class="nlp-row nlp-row--sm">${nlpIcon('carbs')}<span>Carbs: <strong>${meal.totals.carbs}g</strong> · porção padrão</span></div>`);

    if (lastGlucose && settings?.insulinSensitivity && settings?.carbRatio) {
      const dose = calcDose(lastGlucose, meal.totals.carbs, settings);
      if (dose) {
        lines.push(`
          <div class="nlp-dose-block">
            <div class="nlp-dose-label">Sugestão calculada</div>
            <div class="nlp-dose-value">${dose.total} U</div>
            <div class="nlp-dose-detail">Correção ${dose.correction}U + refeição ${dose.meal}U · baseado nas suas configurações</div>
          </div>`);
      }
    } else if (!lastGlucose) {
      lines.push(`<div class="nlp-unknown">Informe sua glicose para calcular a dose.</div>`);
    }

    lines.push(`<div class="nlp-saved">${nlpIcon('ok')} Salvo no diário</div>`);
  }

  if (result.intent === 'insulin') {
    const ctx = getContext();
    const lastGlucose = ctx.lastGlucose?.value;
    lines.push(`<div class="nlp-row">${nlpIcon('insulin')}<span class="nlp-label">Insulina registrada</span></div>`);
    lines.push(`<div class="nlp-value nlp-value--insulin">${result.insulin} <small style="font-size:0.9rem;font-weight:600">U</small></div>`);
    if (lastGlucose) lines.push(`<div class="nlp-meta">Glicose associada: ${lastGlucose} mg/dL</div>`);
    lines.push(`<div class="nlp-saved">${nlpIcon('ok')} Salvo no diário</div>`);
  }

  return `<div class="nlp-card">${lines.join('')}</div>`;
}

// ── Render ────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// Ícone de gota de sangue — identidade clínica
const AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`;

// SVGs clínicos para os chips de sugestão
const CHIP_ICONS = {
  glucose: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
  meal:    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`,
  insulin: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 2 4 4"/><path d="m17 7 1-1"/><path d="M3 21 12.5 11.5"/><path d="M9.5 14.5 11 13"/><path d="m14 6-8.5 8.5"/><path d="m6 14 4-4"/></svg>`,
  trend:   `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
};

// SVGs para os ícones dentro do NLP card
const NLP_ICONS = {
  glucose: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
  meal:    `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`,
  insulin: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 2 4 4"/><path d="m17 7 1-1"/><path d="M3 21 12.5 11.5"/><path d="M9.5 14.5 11 13"/><path d="m14 6-8.5 8.5"/><path d="m6 14 4-4"/></svg>`,
  carbs:   `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
  dose:    `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  ok:      `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
};

function chipHtml(type, label, example) {
  return `<button class="ai-chip" type="button" data-text="${example}">
    <div class="ai-chip-icon ai-chip-icon--${type}">${CHIP_ICONS[type]}</div>
    <div class="ai-chip-text">
      <span class="ai-chip-label">${label}</span>
      <span class="ai-chip-example">${example}</span>
    </div>
  </button>`;
}

function renderMessages() {
  const container = document.getElementById('ai-messages');
  if (!container) return;

  if (!messages.length) {
    container.innerHTML = `
      <div class="ai-welcome">
        <div class="ai-welcome-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        </div>
        <p class="ai-welcome-title">Assistente Clínico</p>
        <p class="ai-welcome-sub">Registre glicose, refeições e insulina em linguagem natural. Tudo salvo automaticamente.</p>
        <div class="ai-chips">
          <div class="ai-chip-group">
            ${chipHtml('glucose', 'Glicose', '180 antes do almoço')}
            ${chipHtml('meal', 'Refeição', 'Comi arroz, feijão e carne')}
          </div>
          <div class="ai-chip-group">
            ${chipHtml('insulin', 'Insulina', 'Tomei 8 unidades')}
            ${chipHtml('trend', 'Análise', 'Como está minha glicose hoje?')}
          </div>
        </div>
      </div>`;

    container.querySelectorAll('.ai-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('ai-input').value = btn.dataset.text;
        handleSend();
      });
    });
    return;
  }

  container.innerHTML = messages.map(m => {
    if (m.isNlpCard) {
      return `
        <div class="ai-msg ai-msg--assistant">
          <div class="ai-msg-avatar">${AVATAR_SVG}</div>
          <div class="ai-msg-bubble ai-msg-bubble--card">${m.html}</div>
        </div>`;
    }
    return `
      <div class="ai-msg ai-msg--${m.role}">
        ${m.role === 'assistant' ? `<div class="ai-msg-avatar">${AVATAR_SVG}</div>` : ''}
        <div class="ai-msg-bubble">${escapeHtml(m.content)}</div>
      </div>`;
  }).join('');

  if (isLoading) {
    container.innerHTML += `
      <div class="ai-msg ai-msg--assistant">
        <div class="ai-msg-avatar">${AVATAR_SVG}</div>
        <div class="ai-msg-bubble ai-typing"><span></span><span></span><span></span></div>
      </div>`;
  }

  container.scrollTop = container.scrollHeight;
}

function setInputState(disabled) {
  const btn = document.getElementById('ai-send');
  const input = document.getElementById('ai-input');
  if (btn) btn.disabled = disabled;
  if (input) { input.disabled = disabled; if (!disabled) input.focus(); }
}

// ── API call ──────────────────────────────────────────────────────────────

async function sendMessage(userText) {
  if (isLoading || !userText.trim()) return;

  // Tenta auto-registro NLP primeiro
  const registered = await tryAutoRegister(userText);
  if (registered) {
    renderMessages();
    return;
  }

  isLoading = true;
  messages.push({ role: 'user', content: userText });
  renderMessages();
  setInputState(true);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          ...messages.filter(m => !m.isNlpCard)
        ],
        temperature: 0.4,
        max_tokens: 1024
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('Resposta vazia');

    messages.push({ role: 'assistant', content: reply });
  } catch (err) {
    messages.push({
      role: 'assistant',
      content: '⚠️ Erro ao conectar com o assistente. Verifique sua conexão e tente novamente.'
    });
    showToast('Erro ao conectar com a IA', 'error');
  } finally {
    isLoading = false;
    renderMessages();
    setInputState(false);
  }
}

function handleSend() {
  const input = document.getElementById('ai-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  sendMessage(text);
}

// ── Init ──────────────────────────────────────────────────────────────────

function init() {
  renderMessages();

  document.getElementById('ai-form')?.addEventListener('submit', e => {
    e.preventDefault();
    handleSend();
  });

  document.getElementById('ai-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  document.getElementById('ai-clear')?.addEventListener('click', () => {
    messages = [];
    renderMessages();
  });
}

export { init };

import { getList, getSettings, KEYS } from './storage.js';
import { getGlucoseStatus, isSameDay, showToast } from './utils.js';
import {
  createGlucoseEntry, createFoodEntry, createInsulinEntry,
  updateAppSettings, deleteGlucoseEntry, deleteFoodEntry, deleteInsulinEntry
} from './api.js';
import { analyze } from './nlp.js';
import { getContext } from './contextManager.js';

const API_URL = '/api/chat';
const MODEL = 'meta/llama-3.1-8b-instruct';

let messages = [];
let isLoading = false;

function glucoseTrend(records) {
  if (records.length < 2) return 'sem dados suficientes';
  const diff = records[0].value - records[1].value;
  if (diff > 20) return `subindo (+${diff} mg/dL)`;
  if (diff > 8)  return `subindo levemente (+${diff} mg/dL)`;
  if (diff < -20) return `caindo (${diff} mg/dL)`;
  if (diff < -8)  return `caindo levemente (${diff} mg/dL)`;
  return `estável (${diff > 0 ? '+' : ''}${diff} mg/dL)`;
}

function todayStats(records) {
  return records.filter(r => isSameDay(r.date || r.datetime, new Date()));
}

// ── System Prompt (para perguntas abertas e estruturação de ações) ─────────

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
    `${r.value} mg/dL (${r.period || ''}) em ${r.date || r.datetime}`
  ).join(', ') || 'nenhuma';

  const last3Foods = food.slice(0, 3).map(r =>
    `${r.name} (${r.carbs}g carbs) em ${r.date || r.datetime}`
  ).join(', ') || 'nenhuma';

  const last3Insulin = insulin.slice(0, 3).map(r =>
    `${r.total}U em ${r.date || r.datetime}`
  ).join(', ') || 'nenhuma';

  return `Você é o assistente clínico de inteligência artificial do aplicativo Glicose AI.
Sua tarefa é ajudar o usuário a gerenciar o diabetes, responder dúvidas e, principalmente, processar comandos em linguagem natural para registrar, atualizar ou excluir dados do diário de saúde.

Você deve responder SEMPRE em formato JSON válido, respeitando o seguinte esquema:
{
  "reply": "Mensagem curta em português para o usuário. Máximo de 4 linhas. Seja amigável, direto, claro e incentive bons hábitos de controle.",
  "actions": [
    {
      "type": "create_glucose" | "create_food" | "create_insulin" | "update_settings" | "delete_entry",
      "data": { ... }
    }
  ]
}

Se nenhuma ação for necessária (por exemplo, se o usuário apenas fizer uma pergunta ou comentário), a lista "actions" deve ser vazia: [].
NUNCA adicione blocos markdown de código (como \`\`\`json) ou qualquer outro texto fora do JSON. Retorne APENAS o JSON puro e direto.

DETALHES DAS AÇÕES E DADOS PERMITIDOS:
1. "create_glucose":
   - data: { "value": número entre 20 e 600, "period": "Jejum"|"Pré-almoço"|"Pós-almoço"|"Tarde"|"Jantar"|"Madrugada", "notes": "texto opcional", "date": "ISO string se o usuário mencionar hora/data específica, senão omitir" }
2. "create_food":
   - data: { "name": "nome do alimento", "carbs": gramas de carboidrato (estime se não fornecido), "kcal": calorias (opcional), "protein": proteínas em gramas (opcional), "fat": gorduras em gramas (opcional), "period": "Jejum"|"Pré-almoço"|"Pós-almoço"|"Tarde"|"Jantar"|"Madrugada", "notes": "texto opcional", "date": "ISO string se o usuário mencionar hora/data específica, senão omitir" }
3. "create_insulin":
   - data: { "total": número de unidades, "correction": correção (opcional), "meal": dose para alimento (opcional), "glucose": glicose associada (opcional), "notes": "texto opcional", "date": "ISO string se o usuário mencionar hora/data específica, senão omitir" }
4. "update_settings":
   - data: { "name": "novo nome", "targetMin": número, "targetMax": número, "correctionTarget": número, "insulinSensitivity": número, "carbRatio": number }
   (inclua apenas os parâmetros a serem atualizados)
5. "delete_entry":
   - data: { "type": "glucose" | "food" | "insulin", "last": true }

PARÂMETROS CLÍNICOS DO USUÁRIO:
- Nome do Usuário: ${s.name || 'não informado'}
- Alvo de Glicose de Correção: ${s.correctionTarget} mg/dL
- Sensibilidade à Insulina: ${s.insulinSensitivity} mg/dL/U
- Relação Carbo/Insulina: ${s.carbRatio} g/U
- Faixa Meta: ${s.targetMin}–${s.targetMax} mg/dL

HISTÓRICO RECENTE:
- Tendência atual de glicose: ${trend}
- Estatísticas de hoje: ${todayGlcStr}
- Últimas medições de glicose: ${last3Glucose}
- Últimas refeições: ${last3Foods}
- Últimas doses de insulina: ${last3Insulin}
- Data/Hora atual do sistema (ISO): ${new Date().toISOString()}`;
}

// ── NLP Auto-Register ─────────────────────────────────────────────────────

async function tryAutoRegister(text) {
  const settings = getSettings();
  const result = analyze(text, settings);

  if (result.intent === 'unknown') return false;

  // Executar todas as ações detectadas
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

  const html = buildNlpResponseHtml(result, settings);
  messages.push({ role: 'assistant', content: '', isNlpCard: true, html });

  // Toast resumido
  const parts = [];
  if (result.glucose) parts.push(`Glicose ${result.glucose} mg/dL`);
  if (result.insulin) parts.push(`${result.insulin} U insulina`);
  if (result.meal) parts.push(`refeição registrada`);
  if (parts.length) showToast(parts.join(' · '), 'success');

  return true;
}

function nlpIcon(type) {
  return `<span class="nlp-icon nlp-icon--${type}">${NLP_ICONS[type]}</span>`;
}

function buildNlpResponseHtml(result, settings) {
  const lines = [];
  const ctx = getContext();

  // ── Glicose ──
  if (result.glucose) {
    const status = getGlucoseStatus(result.glucose, settings);
    lines.push(`<div class="nlp-row">${nlpIcon('glucose')}<span class="nlp-label">Glicose registrada</span></div>`);
    lines.push(`<div class="nlp-value nlp-value--glucose">${result.glucose} <small style="font-size:0.9rem;font-weight:600">mg/dL</small></div>`);
    lines.push(`<div class="nlp-meta">${result.period} · ${status.label}</div>`);
  }

  // ── Refeição ──
  if (result.meal) {
    const meal = result.meal;
    const foodNames = meal.foods.length ? meal.foods.map(f => f.name).join(', ') : 'Refeição';
    if (result.glucose) lines.push(`<div class="nlp-divider"></div>`);
    lines.push(`<div class="nlp-row">${nlpIcon('meal')}<span class="nlp-label">${meal.period} registrado</span></div>`);
    lines.push(`<div class="nlp-foods">${foodNames}</div>`);
    if (meal.unknown?.length) {
      lines.push(`<div class="nlp-unknown">${meal.unknown.join(', ')} — porção padrão estimada</div>`);
    }
    lines.push(`<div class="nlp-row nlp-row--sm">${nlpIcon('carbs')}<span>Carbs: <strong>${meal.totals.carbs}g</strong> · porção padrão</span></div>`);
  }

  // ── Insulina ──
  if (result.insulin) {
    if (result.glucose || result.meal) lines.push(`<div class="nlp-divider"></div>`);
    const d = result.insulinDetail;
    lines.push(`<div class="nlp-row">${nlpIcon('insulin')}<span class="nlp-label">Insulina registrada</span></div>`);
    lines.push(`<div class="nlp-value nlp-value--insulin">${result.insulin} <small style="font-size:0.9rem;font-weight:600">U</small></div>`);

    if (d && (d.correction > 0 || d.meal > 0)) {
      lines.push(`<div class="nlp-dose-detail" style="padding-left:2px">`);
      if (d.correction > 0) lines.push(`Correção: ${d.correction}U`);
      if (d.correction > 0 && d.meal > 0) lines.push(` &nbsp;+&nbsp; `);
      if (d.meal > 0) lines.push(`Alimento: ${d.meal}U`);
      lines.push(`</div>`);
    }

    const glucoseRef = result.glucose || ctx.lastGlucose?.value;
    if (glucoseRef) lines.push(`<div class="nlp-meta">Glicose associada: ${glucoseRef} mg/dL</div>`);
  }

  lines.push(`<div class="nlp-saved">${nlpIcon('ok')} ${result.actions.length} registro${result.actions.length > 1 ? 's salvos' : ' salvo'} no diário</div>`);

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
  meal:    `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>`,
  insulin: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 2 4 4"/><path d="m17 7 1-1"/><path d="M3 21 12.5 11.5"/><path d="M9.5 14.5 11 13"/><path d="m14 6-8.5 8.5"/><path d="m6 14 4-4"/></svg>`,
  carbs:   `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
  dose:    `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
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
        <p class="ai-welcome-title">Assistente Inteligente</p>
        <p class="ai-welcome-sub">Registre glicose, refeições, insulina ou gerencie suas configurações conversando.</p>
        <div class="ai-chips">
          <div class="ai-chip-group">
            ${chipHtml('glucose', 'Glicose', 'Glicose 140 antes do jantar')}
            ${chipHtml('meal', 'Refeição', 'Comi 2 fatias de pizza e coca zero')}
          </div>
          <div class="ai-chip-group">
            ${chipHtml('insulin', 'Insulina', 'Tomei 6U de correção e 4U de refeição')}
            ${chipHtml('trend', 'Ações', 'Mude meu nome para Carlos nas configurações')}
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

function buildActionsCardHtml(actions) {
  const lines = [];

  actions.forEach(action => {
    if (action.type === 'create_glucose') {
      const g = action.data;
      lines.push(`
        <div class="nlp-row">${nlpIcon('glucose')}<span class="nlp-label">Glicose registrada</span></div>
        <div class="nlp-value nlp-value--glucose">${g.value} <small style="font-size:0.9rem;font-weight:600">mg/dL</small></div>
        <div class="nlp-meta">${g.period || ''}${g.notes ? ' · ' + g.notes : ''}</div>
      `);
    } else if (action.type === 'create_food') {
      const f = action.data;
      lines.push(`
        ${lines.length ? '<div class="nlp-divider"></div>' : ''}
        <div class="nlp-row">${nlpIcon('meal')}<span class="nlp-label">Alimento registrado</span></div>
        <div class="nlp-foods">${f.name}</div>
        <div class="nlp-row nlp-row--sm" style="margin-top:4px;">${nlpIcon('carbs')}<span>Carbs: <strong>${f.carbs}g</strong>${f.kcal ? ` · ${f.kcal} kcal` : ''}</span></div>
      `);
    } else if (action.type === 'create_insulin') {
      const ins = action.data;
      lines.push(`
        ${lines.length ? '<div class="nlp-divider"></div>' : ''}
        <div class="nlp-row">${nlpIcon('insulin')}<span class="nlp-label">Insulina registrada</span></div>
        <div class="nlp-value nlp-value--insulin">${ins.total} <small style="font-size:0.9rem;font-weight:600">U</small></div>
        ${ins.correction > 0 || ins.meal > 0 ? `
          <div class="nlp-dose-detail" style="padding-left:2px">
            ${ins.correction > 0 ? `Correção: ${ins.correction}U` : ''}
            ${ins.correction > 0 && ins.meal > 0 ? ' &nbsp;+&nbsp; ' : ''}
            ${ins.meal > 0 ? `Alimento: ${ins.meal}U` : ''}
          </div>
        ` : ''}
      `);
    } else if (action.type === 'update_settings') {
      const s = action.data;
      const changes = [];
      if (s.name) changes.push(`Nome: <strong>${s.name}</strong>`);
      if (s.correctionTarget) changes.push(`Alvo de correção: <strong>${s.correctionTarget} mg/dL</strong>`);
      if (s.insulinSensitivity) changes.push(`Sensibilidade: <strong>${s.insulinSensitivity} mg/dL/U</strong>`);
      if (s.carbRatio) changes.push(`Carbo/UI: <strong>${s.carbRatio}g/U</strong>`);
      if (s.targetMin || s.targetMax) changes.push(`Faixa Meta: <strong>${s.targetMin || ''}–${s.targetMax || ''} mg/dL</strong>`);
      lines.push(`
        <div class="nlp-row">${nlpIcon('ok')}<span class="nlp-label">Configurações salvas</span></div>
        <div class="nlp-foods" style="padding-left:26px; line-height: 1.4">${changes.join('<br>')}</div>
      `);
    } else if (action.type === 'delete_entry') {
      const typeLabel = action.data.type === 'glucose' ? 'Glicose' : action.data.type === 'food' ? 'Alimento' : 'Insulina';
      lines.push(`
        <div class="nlp-row" style="color: var(--accent)">${nlpIcon('ok')}<span class="nlp-label" style="color: var(--accent)">Registro excluído</span></div>
        <div class="nlp-foods" style="padding-left:26px;">O último registro de <strong>${typeLabel.toLowerCase()}</strong> foi apagado do seu diário.</div>
      `);
    }
  });

  lines.push(`
    <div class="nlp-divider"></div>
    <div class="nlp-saved">${nlpIcon('ok')} Alterações salvas no diário</div>
  `);

  return `<div class="nlp-card">${lines.join('')}</div>`;
}

// ── API call ──────────────────────────────────────────────────────────────

async function sendMessage(userText) {
  if (isLoading || !userText.trim()) return;

  // 1. Tenta auto-registro local via regex (rápido, sem delay de rede)
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
          ...messages.filter(m => !m.isNlpCard).map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.1, // temperatura baixa para respostas estruturadas mais consistentes
        max_tokens: 1024
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('Resposta vazia');

    // Tentar decodificar JSON estruturado do LLM
    let parsedReply;
    try {
      let cleanJson = reply;
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      }
      parsedReply = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Falha ao decodificar JSON do LLM, tratando como texto corrido:', e);
      parsedReply = {
        reply: reply,
        actions: []
      };
    }

    // Executar ações indicadas pelo LLM
    if (parsedReply.actions && parsedReply.actions.length > 0) {
      for (const action of parsedReply.actions) {
        if (action.type === 'create_glucose') {
          await createGlucoseEntry(action.data);
          window.dispatchEvent(new CustomEvent('glucose:registered', { detail: action.data }));
        } else if (action.type === 'create_food') {
          await createFoodEntry(action.data);
          window.dispatchEvent(new CustomEvent('food:registered', { detail: action.data }));
        } else if (action.type === 'create_insulin') {
          await createInsulinEntry(action.data);
          window.dispatchEvent(new CustomEvent('insulin:registered', { detail: action.data }));
        } else if (action.type === 'update_settings') {
          await updateAppSettings(action.data);
          window.dispatchEvent(new CustomEvent('settings:updated', { detail: action.data }));
        } else if (action.type === 'delete_entry') {
          if (action.data.type === 'glucose') {
            const list = getList(KEYS.GLUCOSE);
            if (list.length > 0) {
              await deleteGlucoseEntry(list[0].id);
              window.dispatchEvent(new CustomEvent('glucose:registered'));
            }
          } else if (action.data.type === 'food') {
            const list = getList(KEYS.FOOD);
            if (list.length > 0) {
              await deleteFoodEntry(list[0].id);
              window.dispatchEvent(new CustomEvent('food:registered'));
            }
          } else if (action.data.type === 'insulin') {
            const list = getList(KEYS.INSULIN);
            if (list.length > 0) {
              await deleteInsulinEntry(list[0].id);
              window.dispatchEvent(new CustomEvent('insulin:registered'));
            }
          }
        }
      }

      // Renderiza a fala do assistente e depois o card de alterações
      messages.push({ role: 'assistant', content: parsedReply.reply });
      const html = buildActionsCardHtml(parsedReply.actions);
      messages.push({ role: 'assistant', content: '', isNlpCard: true, html });

      // Toast resumido
      showToast(`${parsedReply.actions.length} alterações salvas por comando de voz/texto`, 'success');
    } else {
      messages.push({ role: 'assistant', content: parsedReply.reply });
    }
  } catch (err) {
    console.error('Erro no processamento do assistente:', err);
    messages.push({
      role: 'assistant',
      content: '⚠️ Ocorreu um erro ao conectar com o assistente clínico. Verifique sua conexão e tente novamente.'
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

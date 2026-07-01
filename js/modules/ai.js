import { getList, getSettings, KEYS } from './storage.js';
import { getGlucoseStatus, formatDateTime, formatDate, formatTime, isSameDay, showToast } from './utils.js';

const API_URL = '/api/chat';
const MODEL = 'meta/llama-3.1-8b-instruct';

let messages = [];
let isLoading = false;

// ── Cálculos clínicos locais ──────────────────────────────────────────────

function calcInsulinDose(glucose, carbs, settings) {
  const { insulinSensitivity: sens, carbRatio, correctionTarget: target } = settings;
  if (!sens || !carbRatio || !target) return null;
  const correction = (glucose - target) / sens;
  const meal = carbs > 0 ? carbs / carbRatio : 0;
  const total = Math.max(0, correction) + meal;
  return {
    correction: Math.round(correction * 100) / 100,
    correctionApplied: Math.max(0, Math.round(correction * 100) / 100),
    meal: Math.round(meal * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

function glucoseTrend(records) {
  if (records.length < 2) return 'sem dados suficientes para tendência';
  const last = records[0].value;
  const prev = records[1].value;
  const diff = last - prev;
  const timeDiff = (new Date(records[0].date) - new Date(records[1].date)) / 60000; // minutos
  const rate = timeDiff > 0 ? (diff / timeDiff).toFixed(2) : 0;
  if (diff > 20) return `subindo rapidamente (+${diff} mg/dL, ~${rate} mg/dL/min)`;
  if (diff > 8)  return `subindo levemente (+${diff} mg/dL)`;
  if (diff < -20) return `caindo rapidamente (${diff} mg/dL, ~${rate} mg/dL/min)`;
  if (diff < -8)  return `caindo levemente (${diff} mg/dL)`;
  return `estável (variação de ${diff} mg/dL)`;
}

function todayGlucoseStats(records) {
  const today = records.filter(r => isSameDay(r.date, new Date()));
  if (!today.length) return null;
  const values = today.map(r => r.value);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const inRange = today.filter(r => getGlucoseStatus(r.value, getSettings()).key === 'normal').length;
  return {
    count: today.length,
    avg,
    min: Math.min(...values),
    max: Math.max(...values),
    inRangePct: Math.round((inRange / today.length) * 100)
  };
}

function todayFoodStats(records) {
  const today = records.filter(r => isSameDay(r.date, new Date()));
  if (!today.length) return null;
  return today.reduce((acc, r) => ({
    kcal:    Math.round(acc.kcal    + (r.kcal    || 0)),
    carbs:   Math.round(acc.carbs   + (r.carbs   || 0)),
    protein: Math.round(acc.protein + (r.protein || 0)),
    fat:     Math.round(acc.fat     + (r.fat     || 0)),
    count:   acc.count + 1
  }), { kcal: 0, carbs: 0, protein: 0, fat: 0, count: 0 });
}

// ── Contexto clínico completo ─────────────────────────────────────────────

function buildSystemPrompt() {
  const s = getSettings();
  const glucose = getList(KEYS.GLUCOSE);
  const food = getList(KEYS.FOOD);
  const insulin = getList(KEYS.INSULIN);

  const todayGlc = todayGlucoseStats(glucose);
  const todayFood = todayFoodStats(food);
  const trend = glucoseTrend(glucose);

  const last5Glucose = glucose.slice(0, 5).map(r => {
    const st = getGlucoseStatus(r.value, s);
    return `  • ${formatDateTime(r.date)} — ${r.value} mg/dL (${st.label}${r.period ? ', ' + r.period : ''})`;
  }).join('\n') || '  Nenhuma medição registrada.';

  const last5Food = food.slice(0, 5).map(r =>
    `  • ${formatDateTime(r.date)} — ${r.name} | ${r.kcal || '?'} kcal | Carbs: ${r.carbs || '?'}g | Prot: ${r.protein || '?'}g | Gord: ${r.fat || '?'}g`
  ).join('\n') || '  Nenhum alimento registrado.';

  const last5Insulin = insulin.slice(0, 5).map(r =>
    `  • ${formatDateTime(r.date)} — ${r.total} UI total (correção: ${r.correction} UI, refeição: ${r.meal} UI) | Glicose: ${r.glucose} mg/dL | Carbs: ${r.carbs}g`
  ).join('\n') || '  Nenhuma dose registrada.';

  const todayGlcStr = todayGlc
    ? `Hoje: ${todayGlc.count} medições | Média: ${todayGlc.avg} mg/dL | Min: ${todayGlc.min} | Max: ${todayGlc.max} | No alvo: ${todayGlc.inRangePct}%`
    : 'Sem medições hoje.';

  const todayFoodStr = todayFood
    ? `Hoje: ${todayFood.count} refeições | ${todayFood.kcal} kcal | Carbs: ${todayFood.carbs}g | Proteína: ${todayFood.protein}g | Gordura: ${todayFood.fat}g`
    : 'Sem refeições registradas hoje.';

  return `Você é um assistente direto e objetivo para diabéticos.
Responda SEMPRE em português brasileiro.
NUNCA faça perguntas desnecessárias. NUNCA peça confirmação. SEMPRE calcule e responda na hora com os dados disponíveis.
Se faltar algum dado, assuma zero e avise no final em uma linha só.

REGRAS DE RESPOSTA:
- Comece SEMPRE com a resposta principal em negrito: dose, valor, conclusão
- Depois mostre o cálculo em 2-3 linhas
- Se couber refeição, dê o total arredondado com e sem comida
- Máximo 6 linhas por resposta
- PROIBIDO: "Como posso ajudar?", "Qual é sua dúvida?", "Você pode me dizer...?"
- PROIBIDO: introduções, despedidas, perguntas de confirmação

FÓRMULA DO PACIENTE:
  Correção = arredondar((Glicose − 100) ÷ 40) → SEMPRE número inteiro
  Refeição = arredondar(Carboidratos ÷ ${s.carbRatio}) → SEMPRE número inteiro
  Total = Correção (mín. 0) + Refeição → SEMPRE número inteiro

REGRA ABSOLUTA: NUNCA use decimais. Sempre arredonde para o inteiro mais próximo.

EXEMPLOS DE RESPOSTA CORRETA:
  Usuário: "678"
  Resposta: "**Tome 14 UI agora.** Se for comer algo, tome 17-20 UI.
  (678 − 100) ÷ 40 = 14,45 → 14 UI"

  Usuário: "minha glicose tá 200"
  Resposta: "**Tome 3 UI de correção.**
  (200 − 100) ÷ 40 = 2,5 → 3 UI. Se for comer, some a dose de refeição."

DADOS DO PACIENTE:
${s.name ? `Nome: ${s.name}` : ''}
Meta: ${s.targetMin}–${s.targetMax} mg/dL | Alvo correção: ${s.correctionTarget} mg/dL | Sensibilidade: ${s.insulinSensitivity} | Carbo/UI: ${s.carbRatio}g
Tendência: ${trend}
${todayGlcStr}
Últimas medições: ${last5Glucose}
Hoje alimentação: ${todayFoodStr}
Últimas refeições: ${last5Food}
Últimas doses: ${last5Insulin}`;
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

function renderMessages() {
  const container = document.getElementById('ai-messages');
  if (!container) return;

  if (!messages.length) {
    container.innerHTML = `
      <div class="ai-welcome">
        <div class="ai-avatar" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="5" r="3" fill="currentColor" stroke="none"/></svg>
        </div>
        <p class="ai-welcome-title">Assistente Glicose AI</p>
        <p class="ai-welcome-sub">Analiso seus dados reais de glicose, dieta e insulina. Faço cálculos e explico tendências.</p>
        <div class="ai-suggestions">
          ${[
            'Calcule minha dose agora',
            'Como está minha glicose hoje?',
            'Vai subir ou baixar?',
            'Analise minha dieta de hoje',
            'Quantas calorias comi hoje?',
            'Explique minha tendência'
          ].map(s => `<button class="ai-suggestion" type="button">${s}</button>`).join('')}
        </div>
      </div>`;

    container.querySelectorAll('.ai-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('ai-input').value = btn.textContent;
        handleSend();
      });
    });
    return;
  }

  container.innerHTML = messages.map(m => `
    <div class="ai-msg ai-msg--${m.role}">
      ${m.role === 'assistant' ? `<div class="ai-msg-avatar" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="5" r="3" fill="currentColor" stroke="none"/></svg></div>` : ''}
      <div class="ai-msg-bubble">${escapeHtml(m.content)}</div>
    </div>`).join('');

  if (isLoading) {
    container.innerHTML += `
      <div class="ai-msg ai-msg--assistant">
        <div class="ai-msg-avatar" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="5" r="3" fill="currentColor" stroke="none"/></svg></div>
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
          ...messages
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

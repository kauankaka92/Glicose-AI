import { getList, getSettings, KEYS } from './storage.js';
import { getGlucoseStatus, formatDateTime, showToast } from './utils.js';

const API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini';

// A chave fica no front apenas para uso local/PWA — em produção use um proxy
const API_KEY = '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';

let messages = [];
let isLoading = false;

function buildContext() {
  const settings = getSettings();
  const glucose = getList(KEYS.GLUCOSE).slice(0, 20);
  const food = getList(KEYS.FOOD).slice(0, 10);
  const insulin = getList(KEYS.INSULIN).slice(0, 10);

  const glucoseSummary = glucose.length
    ? glucose.map(r => `${formatDateTime(r.date)}: ${r.value} mg/dL (${r.period || ''})`).join('\n')
    : 'Nenhuma medição registrada.';

  const foodSummary = food.length
    ? food.map(f => `${formatDateTime(f.date)}: ${f.name} — ${f.carbs ?? '?'}g carbs, ${f.calories ?? '?'} kcal`).join('\n')
    : 'Nenhum alimento registrado.';

  const insulinSummary = insulin.length
    ? insulin.map(i => `${formatDateTime(i.date)}: ${i.units}U ${i.type || ''}`).join('\n')
    : 'Nenhuma dose registrada.';

  return `Você é um assistente de saúde especializado em diabetes, integrado ao app Glicose AI.
Responda sempre em português brasileiro. Seja claro, empático e objetivo.
Nunca substitua orientação médica profissional — sempre recomende consultar o médico para decisões clínicas.

DADOS DO PACIENTE:
- Meta glicêmica: ${settings.targetMin}–${settings.targetMax} mg/dL
- Sensibilidade à insulina: ${settings.insulinSensitivity} mg/dL por unidade
- Relação carboidrato/insulina: 1U para cada ${settings.carbRatio}g
- Alvo de correção: ${settings.correctionTarget} mg/dL
${settings.name ? `- Nome: ${settings.name}` : ''}

ÚLTIMAS MEDIÇÕES DE GLICOSE:
${glucoseSummary}

ÚLTIMOS ALIMENTOS REGISTRADOS:
${foodSummary}

ÚLTIMAS DOSES DE INSULINA:
${insulinSummary}`;
}

async function sendMessage(userText) {
  if (isLoading || !userText.trim()) return;
  isLoading = true;

  messages.push({ role: 'user', content: userText });
  renderMessages();
  renderInput(true);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: buildContext() },
          ...messages
        ],
        temperature: 0.5,
        max_tokens: 800,
        stream: false
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
      content: '⚠️ Não consegui me conectar. Verifique sua conexão e tente novamente.'
    });
    showToast('Erro ao conectar com a IA', 'error');
  } finally {
    isLoading = false;
    renderMessages();
    renderInput(false);
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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
        <p class="ai-welcome-title">Olá! Sou seu assistente de saúde.</p>
        <p class="ai-welcome-sub">Posso analisar seus dados de glicose, alimentação e insulina. Como posso ajudar?</p>
        <div class="ai-suggestions">
          ${[
            'Como está minha glicose hoje?',
            'Analise minha dieta recente',
            'Dicas para controlar a glicemia',
            'Explique minha tendência glicêmica'
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

function renderInput(disabled) {
  const btn = document.getElementById('ai-send');
  const input = document.getElementById('ai-input');
  if (btn) btn.disabled = disabled;
  if (input) { input.disabled = disabled; if (!disabled) input.focus(); }
}

function handleSend() {
  const input = document.getElementById('ai-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  sendMessage(text);
}

function init() {
  renderMessages();

  const form = document.getElementById('ai-form');
  form?.addEventListener('submit', e => { e.preventDefault(); handleSend(); });

  document.getElementById('ai-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

  document.getElementById('ai-clear')?.addEventListener('click', () => {
    messages = [];
    renderMessages();
  });
}

export { init };

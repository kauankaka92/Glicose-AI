/**
 * NLP Engine — interpreta linguagem natural para registros de glicose.
 * Funciona 100% offline, sem dependência de API externa.
 */

// ── Mapeamentos ───────────────────────────────────────────────────────────

const PERIOD_MAP = [
  { keys: ['jejum', 'acordar', 'acordei', 'manhã', 'manha', 'cedo', 'levantei'], value: 'Jejum' },
  { keys: ['pré-almoço', 'pre-almoco', 'antes do almoço', 'antes almoço', 'antes almoco'], value: 'Pré-almoço' },
  { keys: ['pós-almoço', 'pos-almoco', 'depois do almoço', 'depois almoço', 'apos almoco', 'após almoço'], value: 'Pós-almoço' },
  { keys: ['tarde', 'lanche', 'meio da tarde'], value: 'Tarde' },
  { keys: ['jantar', 'janta', 'noite', 'antes do jantar', 'antes jantar', 'pré-jantar', 'pre-jantar'], value: 'Jantar' },
  { keys: ['pós-jantar', 'pos-jantar', 'depois do jantar', 'depois jantar', 'após jantar', 'apos jantar'], value: 'Jantar' },
  { keys: ['café', 'cafe', 'café da manhã', 'cafe da manha', 'antes do café', 'antes cafe', 'pós-café', 'pos-cafe', 'depois do café', 'depois cafe'], value: 'Jejum' },
  { keys: ['dormir', 'deitar', 'antes de dormir', 'antes dormir', 'hora de dormir'], value: 'Madrugada' },
  { keys: ['madrugada', 'noite tarde', 'meia noite', 'meia-noite'], value: 'Madrugada' },
  { keys: ['exercício', 'exercicio', 'treino', 'academia', 'corrida', 'caminhada'], value: 'Tarde' },
];

const BEFORE_AFTER_MAP = [
  { keys: ['antes', 'pré', 'pre', 'antes do', 'antes da', 'antes de'], prefix: 'Antes' },
  { keys: ['depois', 'após', 'apos', 'pós', 'pos', 'depois do', 'depois da', 'depois de'], prefix: 'Depois' },
];

const NOISE_WORDS = [
  'minha', 'meu', 'a', 'o', 'de', 'da', 'do', 'e', 'é', 'foi', 'tava', 'estava',
  'ficou', 'deu', 'deu', 'registrar', 'registra', 'anotar', 'anota', 'salvar',
  'glicose', 'glicemia', 'medição', 'medicao', 'medida', 'resultado', 'valor',
  'açúcar', 'acucar', 'sangue', 'mg', 'dl', 'mg/dl', 'mgdl',
];

// ── Extração de valor numérico ────────────────────────────────────────────

function extractValue(text) {
  // Padrão: número isolado ou com mg/dL
  const patterns = [
    /\b(\d{2,3})\s*(?:mg\/?dl|mgdl)?\b/gi,
    /glicose\s+(?:de\s+)?(\d{2,3})/i,
    /(?:tava|estava|ficou|deu|é|foi)\s+(?:em\s+)?(\d{2,3})/i,
    /(\d{2,3})\s+(?:mg|de glicose)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const num = parseInt(match[1] || match[0].replace(/\D/g, ''), 10);
      if (num >= 20 && num <= 600) return num;
    }
  }

  // Fallback: primeiro número no range válido
  const nums = text.match(/\b\d{2,3}\b/g);
  if (nums) {
    for (const n of nums) {
      const v = parseInt(n, 10);
      if (v >= 20 && v <= 600) return v;
    }
  }

  return null;
}

// ── Extração de período ───────────────────────────────────────────────────

function extractPeriod(text) {
  const lower = text.toLowerCase();

  // Detecta antes/depois
  let prefix = '';
  for (const { keys, prefix: p } of BEFORE_AFTER_MAP) {
    if (keys.some(k => lower.includes(k))) {
      prefix = p;
      break;
    }
  }

  // Detecta contexto de refeição/momento
  for (const { keys, value } of PERIOD_MAP) {
    if (keys.some(k => lower.includes(k))) {
      if (prefix && (value === 'Jejum' || value === 'Pré-almoço' || value === 'Jantar' || value === 'Tarde')) {
        return value;
      }
      return value;
    }
  }

  // Inferência por hora do dia
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'Jejum';
  if (h >= 10 && h < 12) return 'Pré-almoço';
  if (h >= 12 && h < 14) return 'Pós-almoço';
  if (h >= 14 && h < 18) return 'Tarde';
  if (h >= 18 && h < 21) return 'Jantar';
  return 'Madrugada';
}

// ── Extração de observações ───────────────────────────────────────────────

function extractNotes(text) {
  const lower = text.toLowerCase();
  const notePatterns = [
    /(?:obs|observação|observacao|nota|anotação|anotacao)[:\s]+(.+)/i,
    /(?:após|apos|depois de|depois do)\s+(?:exercício|exercicio|treino|academia|corrida|caminhada)/i,
    /(?:em jejum|jejum de \d+h?)/i,
    /(?:com sintoma|sintoma|sintomas)[:\s]+(.+)/i,
  ];

  const notes = [];
  for (const p of notePatterns) {
    const m = text.match(p);
    if (m) notes.push(m[1] || m[0]);
  }

  // Detecta contextos especiais
  if (lower.includes('exercício') || lower.includes('exercicio') || lower.includes('treino')) {
    notes.push('Após exercício');
  }
  if (lower.match(/jejum de (\d+)\s*h/)) {
    const m = lower.match(/jejum de (\d+)\s*h/);
    notes.push(`Jejum de ${m[1]}h`);
  }

  return notes.length ? notes.join(', ') : null;
}

// ── Validação e normalização ──────────────────────────────────────────────

function validateAndNormalize(parsed) {
  const errors = [];

  if (!parsed.value) {
    errors.push('Valor de glicose não encontrado');
  } else if (parsed.value < 20) {
    errors.push('Valor muito baixo (mínimo 20 mg/dL)');
  } else if (parsed.value > 600) {
    errors.push('Valor muito alto (máximo 600 mg/dL)');
  }

  return { valid: errors.length === 0, errors };
}

// ── Detecção de intenção ──────────────────────────────────────────────────

function detectIntent(text) {
  const lower = text.toLowerCase().trim();

  // Intenção de registrar glicose
  const glucoseIntent = [
    /\b\d{2,3}\b/,
    /glicose|glicemia|açúcar|acucar|medição|medicao/i,
    /tava|estava|ficou|deu|é|foi/i,
  ];

  const hasNumber = /\b\d{2,3}\b/.test(lower);
  const hasGlucoseContext = /glicose|glicemia|açúcar|acucar|medição|medicao|mg|dl/i.test(lower);
  const hasTimeContext = PERIOD_MAP.some(({ keys }) => keys.some(k => lower.includes(k)));

  if (hasNumber && (hasGlucoseContext || hasTimeContext)) {
    return 'register_glucose';
  }

  // Apenas número — provavelmente glicose
  if (hasNumber && lower.replace(/\s/g, '').length <= 5) {
    return 'register_glucose';
  }

  return 'chat';
}

// ── Parser principal ──────────────────────────────────────────────────────

function parseGlucoseText(text) {
  const value = extractValue(text);
  const period = extractPeriod(text);
  const notes = extractNotes(text);
  const { valid, errors } = validateAndNormalize({ value });

  return {
    intent: detectIntent(text),
    value,
    period,
    date: new Date().toISOString(),
    notes,
    valid,
    errors,
    raw: text.trim()
  };
}

// ── Formatação de confirmação ─────────────────────────────────────────────

function formatConfirmation(parsed) {
  const statusMap = {
    'Jejum': '🌅',
    'Pré-almoço': '🍽️',
    'Pós-almoço': '🍽️',
    'Tarde': '☀️',
    'Jantar': '🌙',
    'Madrugada': '🌙',
  };

  const icon = statusMap[parsed.period] || '💉';
  let msg = `${icon} Glicose registrada: **${parsed.value} mg/dL** — ${parsed.period}`;
  if (parsed.notes) msg += `\n📝 ${parsed.notes}`;
  return msg;
}

export { parseGlucoseText, detectIntent, formatConfirmation };

/**
 * NLP Engine inteligente para saúde.
 */

import { parseFoodList } from './foodDatabase.js';
import { getList, KEYS } from './storage.js';
import { nowISO } from './utils.js';
import { getContext, setLastGlucose, setLastFood, setLastInsulin } from './contextManager.js';

// ── Padrões de detecção ───────────────────────────────────────────────────

const GLUCOSE_PATTERNS = [
  /(?:glicose|glicemia|medi[cç][aã]o|medida|a[IÍ]car|acucar)[:\s]*(\d{2,3})/i,
  /(?:tava|estava|está|esta|deu|foi|marca|marcou)[:\s]*(\d{2,3})/i,
  /(\d{2,3})\s*(?:mg\/?dl|mgdl)?\s*(?:de\s+)?glicose/i,
  /(?:glicose|glicemia)[:\s]*(\d{2,3})/i,
];

const MEAL_TRIGGERS = [
  'comi', 'almocei', 'jantei', 'jantar', 'almoço', 'almoco', 'lanche', 'café', 'cafe',
  'ceia', 'café da manhã', 'cafe da manha', 'sobremesa', 'churrasco', 'pizzada'
];

const PERIOD_MAP = {
  'jejum': 'Jejum', 'acordar': 'Jejum', 'acordei': 'Jejum', 'manhã': 'Jejum', 'manha': 'Jejum',
  'pré-almoço': 'Pré-almoço', 'pre-almoco': 'Pré-almoço', 'antes do almoço': 'Pré-almoço',
  'pós-almoço': 'Pós-almoço', 'apos almoco': 'Pós-almoço', 'depois do almoço': 'Pós-almoço',
  'almoço': 'Pós-almoço', 'almoco': 'Pós-almoço',
  'tarde': 'Tarde', 'lanche da tarde': 'Tarde',
  'jantar': 'Jantar', 'jantei': 'Jantar', 'noite': 'Jantar',
  'madrugada': 'Madrugada', 'dormir': 'Madrugada', 'deitar': 'Madrugada',
};

// ── Extração de valor de glicose ───────────────────────────────────────────

function extractGlucoseValue(text) {
  for (const pattern of GLUCOSE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val >= 20 && val <= 600) return val;
    }
  }

  // Apenas número sozinho (contexto de glicose)
  const soloNum = text.match(/^(\d{2,3})$/);
  if (soloNum) {
    const val = parseInt(soloNum[1], 10);
    if (val >= 20 && val <= 600) return val;
  }

  return null;
}

// ── Extração de dose de insulina (simples e composta) ────────────────────

// Retorna { correction, meal, total } ou null
function extractInsulinDoses(text) {
  const lower = text.toLowerCase();

  // Padrão composto: "10 de correção e 5 de alimento/refeição"
  const compostoPatterns = [
    /(?:tomei|apliquei|usei)?\s*(\d{1,2})\s*(?:u|unidades?)?\s*(?:de\s+)?corre[çc][aã]o\s+e\s+(\d{1,2})\s*(?:u|unidades?)?\s*(?:de\s+)?(?:alimento|refei[çc][aã]o|comida|jantar|almo[çc]o|lanche)/i,
    /(?:tomei|apliquei|usei)?\s*(\d{1,2})\s*(?:u|unidades?)?\s*(?:de\s+)?(?:alimento|refei[çc][aã]o|comida)\s+e\s+(\d{1,2})\s*(?:u|unidades?)?\s*(?:de\s+)?corre[çc][aã]o/i,
    /corre[çc][aã]o[:\s]+(\d{1,2})\s*(?:u|unidades?)?.*?(?:alimento|refei[çc][aã]o)[:\s]+(\d{1,2})/i,
    /(?:tomei|apliquei)\s*(\d{1,2})\s*(?:u|unidades?)?\s*(?:de\s+)?corre[çc][aã]o\s*\+?\s*(\d{1,2})\s*(?:u|unidades?)?\s*(?:de\s+)?(?:alimento|refei[çc][aã]o)/i,
    // "10 + 5", "10 e 5 unidades"
    /(?:tomei|apliquei|usei)\s*(\d{1,2})\s*\+\s*(\d{1,2})\s*(?:u|unidades?)?/i,
  ];

  for (const p of compostoPatterns) {
    const m = lower.match(p);
    if (m) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      if (a >= 1 && a <= 100 && b >= 1 && b <= 100) {
        // Determinar qual é correção e qual é refeição
        const isFirstCorrection = /corre[çc][aã]o/.test(lower.slice(0, lower.indexOf(String(a)) + 5));
        const correction = isFirstCorrection ? a : b;
        const meal = isFirstCorrection ? b : a;
        return { correction, meal, total: correction + meal };
      }
    }
  }

  // Padrão simples: um único valor
  const simplePatterns = [
    /(?:tomei|apliquei|usei|coloquei)[:\s]*(\d{1,2})\s*(?:u|unidade|unidades)?/i,
    /(\d{1,2})\s*(?:u|unidade|unidades)(?:\s+de\s+insulina)?/i,
    /insulina[:\s]*(\d{1,2})/i,
  ];

  for (const p of simplePatterns) {
    const m = text.match(p);
    if (m) {
      const val = parseInt(m[1], 10);
      if (val >= 1 && val <= 100) return { correction: 0, meal: 0, total: val };
    }
  }

  return null;
}

// ── Detecção de refeição ───────────────────────────────────────────────────

function detectMeal(text) {
  const lower = text.toLowerCase();
  const hasTrigger = MEAL_TRIGGERS.some(t => lower.includes(t));

  if (!hasTrigger) return null;

  const parsed = parseFoodList(text);

  if (parsed.foods.length === 0 && !hasTrigger) return null;

  // Calcular totais
  let totalCarbs = 0, totalKcal = 0, totalProtein = 0, totalFat = 0;

  parsed.foods.forEach(f => {
    totalCarbs += f.carbs;
    totalKcal += f.kcal;
    totalProtein += f.protein;
    totalFat += f.fat;
  });

  // Detectar período
  let period = inferPeriod();
  for (const [key, value] of Object.entries(PERIOD_MAP)) {
    if (lower.includes(key)) {
      period = value;
      break;
    }
  }

  return {
    type: 'meal',
    foods: parsed.foods,
    unknown: parsed.unknown,
    totals: { carbs: totalCarbs, kcal: totalKcal, protein: totalProtein, fat: totalFat },
    period
  };
}

// ── Detecção de contexto temporal ───────────────────────────────────────────

function inferPeriod() {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'Jejum';
  if (h >= 10 && h < 12) return 'Pré-almoço';
  if (h >= 12 && h < 14) return 'Pós-almoço';
  if (h >= 14 && h < 18) return 'Tarde';
  if (h >= 18 && h < 21) return 'Jantar';
  return 'Madrugada';
}

// ── Análise principal — multi-intent ──────────────────────────────────────

function analyze(text, settings) {
  const result = {
    intent: 'unknown',
    glucose: null,
    insulin: null,
    insulinDetail: null, // { correction, meal, total }
    meal: null,
    period: null,
    actions: []
  };

  const lower = text.toLowerCase();

  // Detectar período da mensagem inteira
  let period = inferPeriod();
  for (const [key, value] of Object.entries(PERIOD_MAP)) {
    if (lower.includes(key)) { period = value; break; }
  }
  result.period = period;

  // 1. Detectar glicose
  const glucoseVal = extractGlucoseValue(text);
  if (glucoseVal) {
    result.glucose = glucoseVal;
    setLastGlucose(glucoseVal, period);
    result.actions.push({
      type: 'create_glucose',
      data: { value: glucoseVal, period, date: nowISO() }
    });
  }

  // 2. Detectar insulina (simples ou composta)
  const insulinDoses = extractInsulinDoses(text);
  if (insulinDoses) {
    result.insulin = insulinDoses.total;
    result.insulinDetail = insulinDoses;
    const ctx = getContext();
    const glucoseForInsulin = glucoseVal || ctx.lastGlucose?.value;
    setLastInsulin(insulinDoses.total, glucoseForInsulin, ctx.lastFood?.carbs);
    result.actions.push({
      type: 'create_insulin',
      data: {
        dose: insulinDoses.total,
        total: insulinDoses.total,
        correction: insulinDoses.correction,
        meal: insulinDoses.meal,
        glucose: glucoseForInsulin,
        date: nowISO()
      }
    });
  }

  // 3. Detectar refeição
  const mealData = detectMeal(text);
  if (mealData) {
    result.meal = mealData;
    setLastFood(mealData.foods, mealData.totals);
    result.actions.push({
      type: 'create_food',
      data: {
        name: mealData.foods.map(f => f.name).join(', ') || 'Refeição',
        carbs: mealData.totals.carbs,
        kcal: mealData.totals.kcal,
        protein: mealData.totals.protein,
        fat: mealData.totals.fat,
        period: mealData.period,
        date: nowISO()
      }
    });
  }

  // Definir intent principal
  if (result.glucose && result.insulin) result.intent = 'glucose_insulin';
  else if (result.glucose && result.meal) result.intent = 'glucose_meal';
  else if (result.glucose) result.intent = 'glucose';
  else if (result.insulin && result.meal) result.intent = 'insulin_meal';
  else if (result.insulin) result.intent = 'insulin';
  else if (result.meal) result.intent = 'meal';

  return result;
}

export { analyze, extractGlucoseValue, extractInsulinDoses, detectMeal, inferPeriod };

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

const INSULIN_PATTERNS = [
  /(?:tomei|apliquei|usei|coloquei)[:\s]*(\d{1,2})\s*(?:u|unidade|unidades)?/i,
  /(\d{1,2})\s*(?:u|unidade|unidades)(?:\s+de\s+insulina)?/i,
  /insulina[:\s]*(\d{1,2})/i,
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

// ── Extração de dose de insulina ───────────────────────────────────────────

function extractInsulinDose(text) {
  for (const pattern of INSULIN_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val >= 1 && val <= 100) return val;
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

// ── Análise principal ──────────────────────────────────────────────────────

function analyze(text, settings) {
  const result = {
    intent: 'unknown',
    glucose: null,
    insulin: null,
    meal: null,
    period: null,
    response: null,
    actions: []
  };

  // 1. Detectar glicose
  const glucoseVal = extractGlucoseValue(text);
  if (glucoseVal) {
    result.glucose = glucoseVal;
    result.intent = 'glucose';
    result.period = inferPeriod();

    setLastGlucose(glucoseVal, result.period);
    result.actions.push({
      type: 'create_glucose',
      data: { value: glucoseVal, period: result.period, date: nowISO() }
    });

    return result;
  }

  // 2. Detectar insulina
  const insulinVal = extractInsulinDose(text);
  if (insulinVal) {
    result.insulin = insulinVal;
    result.intent = 'insulin';

    const ctx = getContext();
    setLastInsulin(insulinVal, ctx.lastGlucose?.value, ctx.lastFood?.carbs);
    result.actions.push({
      type: 'create_insulin',
      data: { dose: insulinVal, glucose: ctx.lastGlucose?.value, date: nowISO() }
    });

    return result;
  }

  // 3. Detectar refeição
  const meal = detectMeal(text);
  if (meal) {
    result.meal = meal;
    result.intent = 'meal';
    result.period = meal.period;

    setLastFood(meal.foods, meal.totals);

    // Buscar última glicose do contexto ou do storage
    const ctx = getContext();
    let lastGlucose = ctx.lastGlucose?.value;
    if (!lastGlucose) {
      const glucoseRecords = getList(KEYS.GLUCOSE);
      if (glucoseRecords.length) lastGlucose = glucoseRecords[0].value;
    }

    result.actions.push({
      type: 'create_food',
      data: {
        name: meal.foods.map(f => f.name).join(', '),
        carbs: meal.totals.carbs,
        kcal: meal.totals.kcal,
        protein: meal.totals.protein,
        fat: meal.totals.fat,
        date: nowISO()
      }
    });
  }

  return result;
}

export { analyze, extractGlucoseValue, extractInsulinDose, detectMeal, inferPeriod };

import { AIInterpretation, GlucoseContext, MealType } from './types'

const FOOD_DATABASE: Record<string, { synonyms: string[]; avgCarbs: number }> = {
  arroz: { synonyms: ['arroz branco', 'arroz integral', 'arroz cozido'], avgCarbs: 28 },
  feijao: { synonyms: ['feijão preto', 'feijão carioca', 'feijão cozido'], avgCarbs: 14 },
  macarrao: { synonyms: ['macarrão', 'espaguete', 'parafuso', 'penne'], avgCarbs: 25 },
  batata: { synonyms: ['batata inglesa', 'batata cozida', 'batata assada'], avgCarbs: 17 },
  batata_doce: { synonyms: ['batata doce', 'batata-doce assada'], avgCarbs: 20 },
  feijao_tropeiro: { synonyms: ['feijão tropeiro'], avgCarbs: 8 },
  pao: { synonyms: ['pão francês', 'pão de forma', 'pão', 'paozinho'], avgCarbs: 26 },
  tapioca: { synonyms: ['tapioca', 'goma de tapioca'], avgCarbs: 35 },
  mandioca: { synonyms: ['mandioca', 'aipim', 'macaxeira'], avgCarbs: 27 },
  carne: { synonyms: ['carne', 'bife', 'filé', 'frango', 'porco'], avgCarbs: 0 },
  peixe: { synonyms: ['peixe', 'tilápia', 'salmão', 'atum'], avgCarbs: 0 },
  ovo: { synonyms: ['ovo', 'ovos'], avgCarbs: 1 },
  queijo: { synonyms: ['queijo', 'queijo minas', 'prato', 'mussarela'], avgCarbs: 1 },
  presunto: { synonyms: ['presunto', 'peito de peru'], avgCarbs: 2 },
  iogurte: { synonyms: ['iogurte', 'iorgute', 'yogurt'], avgCarbs: 10 },
  leite: { synonyms: ['leite', 'leite integral', 'leite desnatado'], avgCarbs: 5 },
  banana: { synonyms: ['banana', 'banana prata', 'banana nanica'], avgCarbs: 23 },
  maca: { synonyms: ['maçã', 'maca'], avgCarbs: 14 },
  laranja: { synonyms: ['laranja', 'suco de laranja'], avgCarbs: 12 },
  uva: { synonyms: ['uva', 'uvas'], avgCarbs: 17 },
  melancia: { synonyms: ['melancia'], avgCarbs: 8 },
  melao: { synonyms: ['melão'], avgCarbs: 9 },
  manga: { synonyms: ['manga'], avgCarbs: 15 },
  abacate: { synonyms: ['abacate', 'avocado'], avgCarbs: 2 },
 bolo: { synonyms: ['bolo', 'torta doce'], avgCarbs: 45 },
  chocolate: { synonyms: ['chocolate', 'barra de chocolate'], avgCarbs: 50 },
  sorvete: { synonyms: ['sorvete'], avgCarbs: 20 },
  refrigerante: { synonyms: ['refrigerante', 'refri', 'coca', 'guaraná'], avgCarbs: 10 },
  suco: { synonyms: ['suco', 'suco natural'], avgCarbs: 12 },
  cafe: { synonyms: ['café', 'cafezinho', 'expresso'], avgCarbs: 0 },
  chá: { synonyms: ['chá', 'cha', 'tea'], avgCarbs: 0 },
  agua: { synonyms: ['água', 'agua'], avgCarbs: 0 },
  cerveja: { synonyms: ['cerveja'], avgCarbs: 4 },
  vinho: { synonyms: ['vinho'], avgCarbs: 3 },
  pizza: { synonyms: ['pizza', 'fatia de pizza'], avgCarbs: 33 },
  lanche: { synonyms: ['lanche', 'hambúrguer', 'burger', 'x-tudo', 'x-salada'], avgCarbs: 40 },
  coxinha: { synonyms: ['coxinha'], avgCarbs: 20 },
  pastel: { synonyms: ['pastel'], avgCarbs: 25 },
  empada: { synonyms: ['empada', 'empadão'], avgCarbs: 20 },
  salgado: { synonyms: ['salgado', 'fritura'], avgCarbs: 20 },
  salada: { synonyms: ['salada', 'alface', 'tomate', 'rúcula', 'agrião'], avgCarbs: 3 },
  legumes: { synonyms: ['legumes', 'verduras', 'brócolis', 'couve-flor', 'cenoura'], avgCarbs: 5 },
}

const CONTEXT_KEYWORDS: Record<string, GlucoseContext | MealType> = {
  jejum: 'fasting',
  'em jejum': 'fasting',
  'antes do almoço': 'before_meal',
  'antes do jantar': 'before_meal',
  'depois do almoço': 'after_meal',
  'depois do jantar': 'after_meal',
  'após almoço': 'after_meal',
  'após jantar': 'after_meal',
  'antes de comer': 'before_meal',
  'depois de comer': 'after_meal',
  'na cama': 'bedtime',
  'dormir': 'bedtime',
  'noite': 'night',
  'madrugada': 'night',
  'manhã': 'fasting',
  'tarde': 'after_meal',
  almoço: 'lunch',
  jantar: 'dinner',
  café: 'breakfast',
  café_da_manhã: 'breakfast',
  'cafe da manha': 'breakfast',
  lanche: 'afternoon_snack',
  'lanche da tarde': 'afternoon_snack',
  'lanche da manhã': 'morning_snack',
  'lanche da manha': 'morning_snack',
  ceia: 'night_snack',
  exercício: 'exercise',
  exercicio: 'exercise',
  'antes de malhar': 'before_meal',
  'depois de malhar': 'after_meal',
  treino: 'exercise',
  academia: 'exercise',
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function extractGlucoseValue(text: string): number | null {
  const patterns = [
    /(\d{2,3})\s*(?:mg|glicose)?/,
    /glicose\s*(?:de|em)?\s*(\d{2,3})/,
    /medi(?:\s+|do)?\s*(\d{2,3})/,
    /deu\s*(\d{2,3})/,
    /marcando\s*(\d{2,3})/,
    /(\d{2,3})\s*(?:de\s+)?(?:glicose)?/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const value = parseInt(match[1], 10)
      if (value >= 40 && value <= 600) {
        return value
      }
    }
  }
  return null
}

function extractFoods(text: string): string[] {
  const normalized = normalizeText(text)
  const found: string[] = []

  for (const [food, data] of Object.entries(FOOD_DATABASE)) {
    if (normalized.includes(food)) {
      found.push(food)
    } else {
      for (const synonym of data.synonyms) {
        if (normalized.includes(synonym)) {
          found.push(food)
          break
        }
      }
    }
  }

  return found
}

function extractContext(text: string): GlucoseContext | MealType | undefined {
  const normalized = normalizeText(text)

  for (const [keyword, context] of Object.entries(CONTEXT_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      return context
    }
  }

  return undefined
}

function extractCarbs(text: string): number | null {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:g\s+de\s+)?(?:carboidratos?|carbos?|cho)/,
    /carboidratos?\s*(?:de|em)?\s*(\d+(?:\.\d+)?)/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return parseFloat(match[1])
    }
  }
  return null
}

function estimateCarbs(foods: string[]): number {
  if (foods.length === 0) return 0

  let total = 0
  for (const food of foods) {
    const entry = FOOD_DATABASE[food]
    if (entry) {
      total += entry.avgCarbs
    }
  }

  return total
}

function isQuery(text: string): boolean {
  const queryKeywords = [
    'como',
    'quanto',
    'qual',
    'por que',
    'porque',
    'explique',
    'mostre',
    'lista',
    'média',
    'media',
    'historico',
    'histórico',
    'tendencia',
    'tendência',
    'status',
    'está',
    'esta',
  ]

  const normalized = normalizeText(text)
  return queryKeywords.some((kw) => normalized.includes(kw))
}

function generateSummary(interpretation: AIInterpretation): string {
  if (interpretation.type === 'query') {
    return 'Consulte o dashboard para ver suas informações.'
  }

  const parts: string[] = []

  if (interpretation.glucose) {
    parts.push(`Glicose ${interpretation.glucose} mg/dL`)
  }

  if (interpretation.meal && interpretation.meal.length > 0) {
    parts.push(`refeição: ${interpretation.meal.join(', ')}`)
  }

  if (interpretation.carbs) {
    parts.push(`${interpretation.carbs}g de carboidratos`)
  }

  if (parts.length === 0) {
    return 'Nenhuma informação específica detectada.'
  }

  return `Registrado. ${parts.join(', ')}.`
}

export function interpretNaturalLanguage(input: string): AIInterpretation {
  const text = normalizeText(input)

  if (isQuery(text)) {
    return {
      type: 'query',
      action: 'read',
      summary: generateSummary({ type: 'query', action: 'read', summary: '' }),
    }
  }

  const glucose = extractGlucoseValue(text)
  const foods = extractFoods(text)
  const context = extractContext(text)
  const explicitCarbs = extractCarbs(text)
  const estimatedCarbs = foods.length > 0 ? estimateCarbs(foods) : undefined

  return {
    type: 'event',
    glucose: glucose || undefined,
    meal: foods.length > 0 ? foods : undefined,
    carbs: explicitCarbs || estimatedCarbs,
    context,
    action: 'save',
    summary: '',
  }
}

export function getFoodDatabase(): typeof FOOD_DATABASE {
  return FOOD_DATABASE
}

export function searchFood(query: string): Array<{ name: string; carbs: number }> {
  const normalized = normalizeText(query)
  const results: Array<{ name: string; carbs: number }> = []

  for (const [food, data] of Object.entries(FOOD_DATABASE)) {
    if (food.includes(normalized) || data.synonyms.some((s) => s.includes(normalized))) {
      results.push({ name: food, carbs: data.avgCarbs })
    }
  }

  return results
}
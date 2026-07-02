import { GlucoseEntry, GlucoseStats, TrendData, UserSettings, FoodEntry, InsulinEntry } from './types'
import { getGlucoseEntries, getSettings, getFoodEntries, getInsulinEntries } from './storage'

export function calculateGlucoseStats(entries: GlucoseEntry[]): GlucoseStats {
  if (entries.length === 0) {
    return {
      current: null,
      average: 0,
      min: 0,
      max: 0,
      readings: 0,
      inRange: 0,
      low: 0,
      high: 0,
    }
  }

  const values = entries.map((e) => e.value).sort((a, b) => a - b)
  const sortedEntries = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const current = sortedEntries.length > 0 ? sortedEntries[0].value : null
  const min = values[0]
  const max = values[values.length - 1]
  const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length)

  let inRange = 0
  let low = 0
  let high = 0

  for (const value of values) {
    if (value < 70) low++
    else if (value <= 180) inRange++
    else high++
  }

  return {
    current,
    average,
    min,
    max,
    readings: entries.length,
    inRange,
    low,
    high,
  }
}

export function calculateTrend(entries: GlucoseEntry[]): TrendData {
  if (entries.length < 2) {
    return { direction: 'stable', value: 0, label: 'Estável' }
  }

  const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const recent = sorted.slice(0, Math.min(5, sorted.length))

  if (recent.length < 2) {
    return { direction: 'stable', value: 0, label: 'Estável' }
  }

  const first = recent[recent.length - 1].value
  const last = recent[0].value
  const change = last - first

  if (change > 20) {
    return { direction: 'up', value: change, label: `Subindo ${change}` }
  } else if (change < -20) {
    return { direction: 'down', value: change, label: `Descendo ${Math.abs(change)}` }
  }

  return { direction: 'stable', value: change, label: 'Estável' }
}

export function calculateInsulinDose(glucose: number, settings: UserSettings): {
  correction: number
  suggestion: string
} {
  const { targetGlucose, correctionFactor } = settings

  if (glucose <= targetGlucose) {
    return {
      correction: 0,
      suggestion: 'Glicose no alvo. Sem correção necessária.',
    }
  }

  const correction = Math.round((glucose - targetGlucose) / correctionFactor * 10) / 10

  return {
    correction,
    suggestion: `Sugestão: ${correction}U de insulina para correção.`,
  }
}

export function calculateCarbInsulin(carbs: number, settings: UserSettings): {
  mealInsulin: number
  suggestion: string
} {
  const { carbRatio } = settings

  const mealInsulin = Math.round(carbs / carbRatio * 10) / 10

  return {
    mealInsulin,
    suggestion: `Para ${carbs}g de carboidratos: ${mealInsulin}U de insulina.`,
  }
}

export function calculateTotalInsulin(
  glucose: number,
  carbs: number,
  settings: UserSettings
): {
  correction: number
  meal: number
  total: number
  suggestion: string
} {
  const { correction } = calculateInsulinDose(glucose, settings)
  const { mealInsulin } = calculateCarbInsulin(carbs, settings)
  const total = Math.round((correction + mealInsulin) * 10) / 10

  return {
    correction,
    meal: mealInsulin,
    total,
    suggestion: `Dose total sugerida: ${total}U (${correction}U correção + ${mealInsulin}U refeição).`,
  }
}

export function getDailyStats(entries: GlucoseEntry[], date: string = new Date().toISOString().split('T')[0]): GlucoseStats {
  const dayEntries = entries.filter((e) => e.timestamp.startsWith(date))
  return calculateGlucoseStats(dayEntries)
}

export function getWeeklyAverage(entries: GlucoseEntry[]): number {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const weekEntries = entries.filter((e) => new Date(e.timestamp) >= weekAgo)

  if (weekEntries.length === 0) return 0

  const sum = weekEntries.reduce((acc, e) => acc + e.value, 0)
  return Math.round(sum / weekEntries.length)
}

export function getGlucoseDistribution(entries: GlucoseEntry[]): {
  inRangePercent: number
  lowPercent: number
  highPercent: number
} {
  if (entries.length === 0) {
    return { inRangePercent: 0, lowPercent: 0, highPercent: 0 }
  }

  let inRange = 0
  let low = 0
  let high = 0

  for (const entry of entries) {
    if (entry.value < 70) low++
    else if (entry.value <= 180) inRange++
    else high++
  }

  const total = entries.length

  return {
    inRangePercent: Math.round((inRange / total) * 100),
    lowPercent: Math.round((low / total) * 100),
    highPercent: Math.round((high / total) * 100),
  }
}

export function generateInsightText(stats: GlucoseStats, trend: TrendData): string {
  const insights: string[] = []

  if (stats.current !== null) {
    if (stats.current < 70) {
      insights.push('Atenção: glicose baixa detectada.')
    } else if (stats.current > 300) {
      insights.push('Alerta: glicose crítica. Considere ação.')
    } else if (stats.current > 180) {
      insights.push('Glicose acima do alvo.')
    }
  }

  if (trend.direction === 'up' && trend.value > 50) {
    insights.push('Tendência de alta significativa.')
  } else if (trend.direction === 'down' && trend.value < -50) {
    insights.push('Tendência de baixa significativa.')
  }

  if (stats.average > 180) {
    insights.push('Média semanal acima do recomendado.')
  } else if (stats.average < 70) {
    insights.push('Média semanal abaixo do recomendado.')
  }

  if (insights.length === 0) {
    return 'Seus indicadores estão dentro da normalidade.'
  }

  return insights.join(' ')
}

export function getPercentageInTarget(entries: GlucoseEntry[], targetMin: number = 70, targetMax: number = 180): number {
  if (entries.length === 0) return 0

  const inTarget = entries.filter((e) => e.value >= targetMin && e.value <= targetMax).length
  return Math.round((inTarget / entries.length) * 100)
}

// ============================================
// ANÁLISE NUTRICIONAL AVANÇADA
// ============================================

export interface NutritionAnalysis {
  totalCarbs: number
  totalProtein: number
  totalFat: number
  totalCalories: number
  mealsCount: number
  avgCarbsPerMeal: number
  healthScore: number  // 0-100
  recommendations: string[]
}

export function analyzeNutrition(foodEntries: FoodEntry[], days: number = 7): NutritionAnalysis {
  const now = new Date()
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const recentFoods = foodEntries.filter(f => new Date(f.timestamp) >= cutoff)

  let totalCarbs = 0
  let totalProtein = 0
  let totalFat = 0
  let totalCalories = 0

  for (const food of recentFoods) {
    totalCarbs += food.totalCarbs
    // Estimativa baseada em carbs (simplificado)
    totalProtein += food.totalCarbs * 0.15
    totalFat += food.totalCarbs * 0.08
    totalCalories += food.totalCarbs * 4.5
  }

  const mealsCount = recentFoods.length
  const avgCarbsPerMeal = mealsCount > 0 ? Math.round(totalCarbs / mealsCount) : 0

  // Health Score calculation
  let healthScore = 70
  const recommendations: string[] = []

  // Analisar consistência de refeições
  if (mealsCount < days * 2) {
    healthScore -= 10
    recommendations.push('Registre mais refeições para melhor acompanhamento')
  }

  // Analisar média de carbs
  if (avgCarbsPerMeal > 60) {
    healthScore -= 15
    recommendations.push('Média de carboidratos elevada. Considere reduzir para 30-45g por refeição')
  } else if (avgCarbsPerMeal < 20) {
    healthScore -= 10
    recommendations.push('Média de carboidratos baixa. Mantenha alimentação balanceada')
  } else {
    healthScore += 10
  }

  // Analisar variedade (simplificado)
  const uniqueFoods = new Set(recentFoods.flatMap(f => f.items.map(i => i.name.toLowerCase())))
  if (uniqueFoods.size < 10) {
    healthScore -= 5
    recommendations.push('Aumente a variedade de alimentos na dieta')
  } else {
    healthScore += 5
  }

  // Analisar distribuição de macros (simplificado)
  const carbPercent = totalCalories > 0 ? (totalCarbs * 4 / totalCalories) * 100 : 0
  if (carbPercent > 60) {
    healthScore -= 5
    recommendations.push('Proporção de carboidratos alta. Considere balancear com proteínas e gorduras')
  } else if (carbPercent >= 45) {
    healthScore += 5
  }

  healthScore = Math.max(0, Math.min(100, healthScore))

  if (recommendations.length === 0) {
    recommendations.push('Parabéns! Seus padrões alimentares estão saudáveis')
  }

  return {
    totalCarbs: Math.round(totalCarbs),
    totalProtein: Math.round(totalProtein),
    totalFat: Math.round(totalFat),
    totalCalories: Math.round(totalCalories),
    mealsCount,
    avgCarbsPerMeal,
    healthScore,
    recommendations
  }
}

export interface GlucoseVariability {
  cv: number  // Coefficient of Variation
  sd: number  // Standard Deviation
  mean: number
  stability: 'excelente' | 'boa' | 'moderada' | 'instável'
  score: number  // 0-100
}

export function analyzeGlucoseVariability(entries: GlucoseEntry[]): GlucoseVariability {
  if (entries.length < 3) {
    return { cv: 0, sd: 0, mean: 0, stability: 'estável', score: 50 }
  }

  const values = entries.map(e => e.value)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length
  const sd = Math.sqrt(variance)
  const cv = mean > 0 ? (sd / mean) * 100 : 0

  // Classificar estabilidade
  let stability: 'excelente' | 'boa' | 'moderada' | 'instável'
  let score: number

  if (cv < 20) {
    stability = 'excelente'
    score = 95
  } else if (cv < 30) {
    stability = 'boa'
    score = 75
  } else if (cv < 40) {
    stability = 'moderada'
    score = 55
  } else {
    stability = 'instável'
    score = 35
  }

  return { cv: Math.round(cv * 10) / 10, sd: Math.round(sd), mean: Math.round(mean), stability, score }
}

export interface DailyPattern {
  date: string
  readings: number
  avgGlucose: number
  timeInRange: number
  mealsCount: number
  insulinTotal: number
}

export function getDailyPatterns(days: number = 7): DailyPattern[] {
  const glucose = getGlucoseEntries()
  const food = getFoodEntries()
  const insulin = getInsulinEntries()

  const patterns: DailyPattern[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    const dayStart = new Date(dateStr + 'T00:00:00')
    const dayEnd = new Date(dateStr + 'T23:59:59')

    const dayGlucose = glucose.filter(e => {
      const t = new Date(e.timestamp)
      return t >= dayStart && t <= dayEnd
    })

    const dayFood = food.filter(e => {
      const t = new Date(e.timestamp)
      return t >= dayStart && t <= dayEnd
    })

    const dayInsulin = insulin.filter(e => {
      const t = new Date(e.timestamp)
      return t >= dayStart && t <= dayEnd
    })

    const avgGlucose = dayGlucose.length > 0
      ? Math.round(dayGlucose.reduce((acc, e) => acc + e.value, 0) / dayGlucose.length)
      : 0

    const inRange = dayGlucose.filter(e => e.value >= 70 && e.value <= 180).length
    const timeInRange = dayGlucose.length > 0
      ? Math.round((inRange / dayGlucose.length) * 100)
      : 0

    const insulinTotal = dayInsulin.reduce((acc, e) => acc + e.total, 0)

    patterns.push({
      date: dateStr,
      readings: dayGlucose.length,
      avgGlucose,
      timeInRange,
      mealsCount: dayFood.length,
      insulinTotal: Math.round(insulinTotal * 10) / 10
    })
  }

  return patterns
}

export function getEatingQualityScore(foodEntries: FoodEntry[], glucoseEntries: GlucoseEntry[]): {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  factors: { name: string; impact: number }[]
} {
  const analysis = analyzeNutrition(foodEntries)
  const variability = analyzeGlucoseVariability(glucoseEntries)
  const distribution = getGlucoseDistribution(glucoseEntries)

  const factors: { name: string; impact: number }[] = []

  // Base score da análise nutricional
  let score = analysis.healthScore
  factors.push({ name: 'Qualidade Nutricional', impact: Math.round((analysis.healthScore - 70) * 0.3) })

  // Fator variabilidade glicêmica
  score += (variability.score - 70) * 0.4
  factors.push({ name: 'Estabilidade Glicêmica', impact: Math.round((variability.score - 70) * 0.4) })

  // Fator Time in Range
  score += (distribution.inRangePercent - 70) * 0.3
  factors.push({ name: 'Tempo na Faixa', impact: Math.round((distribution.inRangePercent - 70) * 0.3) })

  score = Math.max(0, Math.min(100, score))

  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  if (score >= 85) grade = 'A'
  else if (score >= 70) grade = 'B'
  else if (score >= 55) grade = 'C'
  else if (score >= 40) grade = 'D'
  else grade = 'F'

  return { score: Math.round(score), grade, factors }
}
import { GlucoseEntry, GlucoseStats, TrendData, UserSettings } from './types'
import { getGlucoseEntries, getSettings } from './storage'

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
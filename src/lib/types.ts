// Tipos fundamentais do Glicose AI

export interface GlucoseEntry {
  id: string
  value: number
  timestamp: string
  context?: GlucoseContext
  note?: string
}

export type GlucoseContext =
  | 'fasting'
  | 'before_meal'
  | 'after_meal'
  | 'bedtime'
  | 'night'
  | 'exercise'
  | 'other'

export interface FoodEntry {
  id: string
  items: FoodItem[]
  totalCarbs: number
  timestamp: string
  mealType?: MealType
  note?: string
}

export interface FoodItem {
  name: string
  carbs: number
  portion?: string
}

export type MealType =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner'
  | 'night_snack'

export interface InsulinEntry {
  id: string
  correction: number
  meal?: number
  total: number
  timestamp: string
  glucoseValue?: number
  note?: string
}

export interface UserSettings {
  targetGlucose: number
  correctionFactor: number
  carbRatio: number
  activeInsulinTime: number
}

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  meta?: Record<string, unknown>
  error?: string | null
}

export interface AIInterpretation {
  type: 'event' | 'query' | 'config'
  glucose?: number
  meal?: string[]
  carbs?: number
  insulin?: number
  context?: GlucoseContext | MealType
  action: 'save' | 'read' | 'update' | 'delete'
  summary: string
}

export interface GlucoseStats {
  current: number | null
  average: number
  min: number
  max: number
  readings: number
  inRange: number
  low: number
  high: number
}

export interface TrendData {
  direction: 'up' | 'down' | 'stable'
  value: number
  label: string
}

export const GLUCOSE_STATUS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

export type GlucoseStatus = typeof GLUCOSE_STATUS[keyof typeof GLUCOSE_STATUS]

export function getGlucoseStatus(value: number): GlucoseStatus {
  if (value < 70) return GLUCOSE_STATUS.LOW
  if (value <= 180) return GLUCOSE_STATUS.NORMAL
  if (value <= 300) return GLUCOSE_STATUS.HIGH
  return GLUCOSE_STATUS.CRITICAL
}

export function getGlucoseStatusLabel(value: number): string {
  const status = getGlucoseStatus(value)
  const labels: Record<GlucoseStatus, string> = {
    low: 'Baixo',
    normal: 'Normal',
    high: 'Alto',
    critical: 'Crítico',
  }
  return labels[status]
}
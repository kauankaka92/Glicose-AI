// Tipos fundamentais do Glicose AI

export interface EventMetadata {
  version?: string        // versao do schema do evento (ex: "1.0.0")
  source?: 'client' | 'server' | 'import'  // origem do evento
  refs?: Record<string, string>  // referências para outros eventos (ex: glucoseRef)
}

export interface GlucoseEntry extends EventMetadata {
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

export interface FoodEntry extends EventMetadata {
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

export interface InsulinEntry extends EventMetadata {
  id: string
  correction: number
  meal?: number
  total: number
  timestamp: string
  glucoseValue?: number
  carbsValue?: number
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

// Chat types
export interface ChatAction {
  type: 'save_glucose' | 'save_insulin' | 'save_food' | 'save_note' | 'read_data' | 'none'
  data?: Record<string, any>
  confirmed?: boolean
  label?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actions?: ChatAction[]
}

export interface ChatConversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// System event para auditoria e logging
export type SystemEventType =
  | 'data_change'
  | 'settings_update'
  | 'import_export'
  | 'bulk_operation'
  | 'error'
  | 'warning'

export interface SystemEvent extends EventMetadata {
  id: string
  type: SystemEventType
  timestamp: string
  details: Record<string, unknown>
  severity: 'info' | 'warning' | 'error'
  note?: string
}
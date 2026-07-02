import { GlucoseEntry, FoodEntry, InsulinEntry, UserSettings, EventMetadata, SystemEvent, SystemEventType } from './types'

const STORAGE_KEYS = {
  GLUCOSE: 'glicose_ai_glucose',
  FOOD: 'glicose_ai_food',
  INSULIN: 'glicose_ai_insulin',
  SETTINGS: 'glicose_ai_settings',
  SYSTEM: 'glicose_ai_system',
}

const EVENT_VERSION = '1.0.0'

function createEventMetadata(source: 'client' | 'server' | 'import', refs?: Record<string, string>): EventMetadata {
  return {
    version: EVENT_VERSION,
    source,
    refs: refs || {},
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

const DEFAULT_SETTINGS: UserSettings = {
  targetGlucose: 100,
  correctionFactor: 50,
  carbRatio: 10,
  activeInsulinTime: 4,
}

// SSR guard - localStorage não existe no servidor
function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

// ============================================
// TRANSACAO SIMULADA - EVITAR RACE CONDITIONS
// ============================================
// Locks em memória para operações read-modify-write
const transactionLocks: Record<string, boolean> = {}

async function acquireLock(key: string, timeout = 5000): Promise<boolean> {
  const startTime = Date.now()
  while (transactionLocks[key]) {
    if (Date.now() - startTime > timeout) {
      console.warn('[storage.ts] Lock timeout expired for key:', key)
      return false
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  transactionLocks[key] = true
  return true
}

function releaseLock(key: string) {
  delete transactionLocks[key]
}

async function withTransaction<T>(key: string, operation: () => T): Promise<T> {
  const acquired = await acquireLock(key)
  if (!acquired) {
    throw new Error(`[storage.ts] Failed to acquire lock for ${key}`)
  }
  try {
    return operation()
  } finally {
    releaseLock(key)
  }
}

export async function saveGlucose(entry: Omit<GlucoseEntry, 'id'>): Promise<GlucoseEntry> {
  return withTransaction(STORAGE_KEYS.GLUCOSE, () => {
    const newEntry: GlucoseEntry = {
      ...entry,
      id: generateId(),
      ...createEventMetadata('client', entry.refs),
    }
    const entries = getGlucoseEntries()
    entries.push(newEntry)
    const storage = getLocalStorage()
    if (storage) {
      storage.setItem(STORAGE_KEYS.GLUCOSE, JSON.stringify(entries))
      console.log('[storage.ts] Glucose saved:', newEntry, 'Total entries:', entries.length)
    } else {
      console.warn('[storage.ts] localStorage not available')
    }
    return newEntry
  })
}

export function getGlucoseEntries(): GlucoseEntry[] {
  const storage = getLocalStorage()
  if (!storage) return []
  const data = storage.getItem(STORAGE_KEYS.GLUCOSE)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function deleteGlucoseEntry(id: string): boolean {
  const entries = getGlucoseEntries()
  const filtered = entries.filter((e) => e.id !== id)
  if (filtered.length === entries.length) return false
  const storage = getLocalStorage()
  if (storage) storage.setItem(STORAGE_KEYS.GLUCOSE, JSON.stringify(filtered))
  return true
}

export async function saveFood(entry: Omit<FoodEntry, 'id'>): Promise<FoodEntry> {
  return withTransaction(STORAGE_KEYS.FOOD, () => {
    const newEntry: FoodEntry = {
      ...entry,
      id: generateId(),
      ...createEventMetadata('client', entry.refs),
    }
    const entries = getFoodEntries()
    entries.push(newEntry)
    const storage = getLocalStorage()
    if (storage) {
      storage.setItem(STORAGE_KEYS.FOOD, JSON.stringify(entries))
      console.log('[storage.ts] Food saved:', newEntry, 'Total entries:', entries.length)
    } else {
      console.warn('[storage.ts] localStorage not available')
    }
    return newEntry
  })
}

export function getFoodEntries(): FoodEntry[] {
  const storage = getLocalStorage()
  if (!storage) return []
  const data = storage.getItem(STORAGE_KEYS.FOOD)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function deleteFoodEntry(id: string): boolean {
  const entries = getFoodEntries()
  const filtered = entries.filter((e) => e.id !== id)
  if (filtered.length === entries.length) return false
  const storage = getLocalStorage()
  if (storage) storage.setItem(STORAGE_KEYS.FOOD, JSON.stringify(filtered))
  return true
}

export async function saveInsulin(entry: Omit<InsulinEntry, 'id'>): Promise<InsulinEntry> {
  return withTransaction(STORAGE_KEYS.INSULIN, () => {
    const newEntry: InsulinEntry = {
      ...entry,
      id: generateId(),
      ...createEventMetadata('client', entry.refs),
    }
    const entries = getInsulinEntries()
    entries.push(newEntry)
    const storage = getLocalStorage()
    if (storage) {
      storage.setItem(STORAGE_KEYS.INSULIN, JSON.stringify(entries))
      console.log('[storage.ts] Insulin saved:', newEntry, 'Total entries:', entries.length)
    } else {
      console.warn('[storage.ts] localStorage not available')
    }
    return newEntry
  })
}

export function getInsulinEntries(): InsulinEntry[] {
  const storage = getLocalStorage()
  if (!storage) return []
  const data = storage.getItem(STORAGE_KEYS.INSULIN)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function deleteInsulinEntry(id: string): boolean {
  const entries = getInsulinEntries()
  const filtered = entries.filter((e) => e.id !== id)
  if (filtered.length === entries.length) return false
  const storage = getLocalStorage()
  if (storage) storage.setItem(STORAGE_KEYS.INSULIN, JSON.stringify(filtered))
  return true
}

export function getSettings(): UserSettings {
  const storage = getLocalStorage()
  if (!storage) return DEFAULT_SETTINGS
  const data = storage.getItem(STORAGE_KEYS.SETTINGS)
  if (!data) return DEFAULT_SETTINGS
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Partial<UserSettings>): UserSettings {
  const current = getSettings()
  const updated = { ...current, ...settings }
  const storage = getLocalStorage()
  if (storage) {
    storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated))
    console.log('[storage.ts] Settings saved:', updated)
    return updated
  }
  console.warn('[storage.ts] localStorage not available for settings')
  return current
}

export function clearAllData(): void {
  const storage = getLocalStorage()
  if (!storage) return
  Object.values(STORAGE_KEYS).forEach((key) => storage.removeItem(key))
}

export function exportData(): string {
  const data = {
    glucose: getGlucoseEntries(),
    food: getFoodEntries(),
    insulin: getInsulinEntries(),
    system: getSystemEvents(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json)
    if (data.glucose) localStorage.setItem(STORAGE_KEYS.GLUCOSE, JSON.stringify(data.glucose))
    if (data.food) localStorage.setItem(STORAGE_KEYS.FOOD, JSON.stringify(data.food))
    if (data.insulin) localStorage.setItem(STORAGE_KEYS.INSULIN, JSON.stringify(data.insulin))
    if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings))
    if (data.system) localStorage.setItem(STORAGE_KEYS.SYSTEM, JSON.stringify(data.system))
    return true
  } catch {
    return false
  }
}

// System Event functions para auditoria
export function saveSystemEvent(event: Omit<SystemEvent, 'id'>): SystemEvent {
  const newEvent: SystemEvent = {
    ...event,
    id: generateId(),
  }
  const events = getSystemEvents()
  events.push(newEvent)
  const storage = getLocalStorage()
  if (storage) {
    storage.setItem(STORAGE_KEYS.SYSTEM, JSON.stringify(events))
    console.log('[storage.ts] System event saved:', newEvent.type, newEvent.severity)
  }
  return newEvent
}

export function getSystemEvents(limit = 100): SystemEvent[] {
  const storage = getLocalStorage()
  if (!storage) return []
  const data = storage.getItem(STORAGE_KEYS.SYSTEM)
  if (!data) return []
  try {
    const events = JSON.parse(data)
    return events.reverse().slice(0, limit)
  } catch {
    return []
  }
}
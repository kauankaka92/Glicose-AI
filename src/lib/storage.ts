import { GlucoseEntry, FoodEntry, InsulinEntry, UserSettings } from './types'

const STORAGE_KEYS = {
  GLUCOSE: 'glicose_ai_glucose',
  FOOD: 'glicose_ai_food',
  INSULIN: 'glicose_ai_insulin',
  SETTINGS: 'glicose_ai_settings',
}

const DEFAULT_SETTINGS: UserSettings = {
  targetGlucose: 100,
  correctionFactor: 50,
  carbRatio: 10,
  activeInsulinTime: 4,
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function saveGlucose(entry: Omit<GlucoseEntry, 'id'>): GlucoseEntry {
  const newEntry: GlucoseEntry = {
    ...entry,
    id: generateId(),
  }
  const entries = getGlucoseEntries()
  entries.push(newEntry)
  localStorage.setItem(STORAGE_KEYS.GLUCOSE, JSON.stringify(entries))
  return newEntry
}

export function getGlucoseEntries(): GlucoseEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.GLUCOSE)
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
  localStorage.setItem(STORAGE_KEYS.GLUCOSE, JSON.stringify(filtered))
  return true
}

export function saveFood(entry: Omit<FoodEntry, 'id'>): FoodEntry {
  const newEntry: FoodEntry = {
    ...entry,
    id: generateId(),
  }
  const entries = getFoodEntries()
  entries.push(newEntry)
  localStorage.setItem(STORAGE_KEYS.FOOD, JSON.stringify(entries))
  return newEntry
}

export function getFoodEntries(): FoodEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.FOOD)
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
  localStorage.setItem(STORAGE_KEYS.FOOD, JSON.stringify(filtered))
  return true
}

export function saveInsulin(entry: Omit<InsulinEntry, 'id'>): InsulinEntry {
  const newEntry: InsulinEntry = {
    ...entry,
    id: generateId(),
  }
  const entries = getInsulinEntries()
  entries.push(newEntry)
  localStorage.setItem(STORAGE_KEYS.INSULIN, JSON.stringify(entries))
  return newEntry
}

export function getInsulinEntries(): InsulinEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.INSULIN)
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
  localStorage.setItem(STORAGE_KEYS.INSULIN, JSON.stringify(filtered))
  return true
}

export function getSettings(): UserSettings {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
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
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated))
  return updated
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
}

export function exportData(): string {
  const data = {
    glucose: getGlucoseEntries(),
    food: getFoodEntries(),
    insulin: getInsulinEntries(),
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
    return true
  } catch {
    return false
  }
}
/**
 * API Layer — abstração sobre LocalStorage, preparada para migração a backend real.
 * Troque o adapter `localAdapter` por um `httpAdapter` quando o backend estiver pronto.
 */

import { KEYS, getList, addItem, updateItem, deleteItem, getSettings, saveSettings } from './storage.js';
import { generateId, nowISO } from './utils.js';

// ── Local Adapter ─────────────────────────────────────────────────────────

const localAdapter = {
  async list(key) {
    return getList(key);
  },
  async create(key, data) {
    const item = { id: generateId(), date: nowISO(), ...data };
    addItem(key, item);
    return item;
  },
  async update(key, id, data) {
    updateItem(key, id, data);
    return { id, ...data };
  },
  async remove(key, id) {
    deleteItem(key, id);
    return { id };
  }
};

// ── Active Adapter (swap here for backend) ────────────────────────────────

const adapter = localAdapter;

// ── Glucose API ───────────────────────────────────────────────────────────

async function createGlucoseEntry(data) {
  return adapter.create(KEYS.GLUCOSE, data);
}

async function getGlucoseHistory() {
  return adapter.list(KEYS.GLUCOSE);
}

async function updateGlucoseEntry(id, data) {
  return adapter.update(KEYS.GLUCOSE, id, data);
}

async function deleteGlucoseEntry(id) {
  return adapter.remove(KEYS.GLUCOSE, id);
}

// ── Food API ──────────────────────────────────────────────────────────────

async function createFoodEntry(data) {
  return adapter.create(KEYS.FOOD, data);
}

async function getFoodHistory() {
  return adapter.list(KEYS.FOOD);
}

async function updateFoodEntry(id, data) {
  return adapter.update(KEYS.FOOD, id, data);
}

async function deleteFoodEntry(id) {
  return adapter.remove(KEYS.FOOD, id);
}

// ── Insulin API ───────────────────────────────────────────────────────────

async function createInsulinEntry(data) {
  return adapter.create(KEYS.INSULIN, data);
}

async function getInsulinHistory() {
  return adapter.list(KEYS.INSULIN);
}

async function deleteInsulinEntry(id) {
  return adapter.remove(KEYS.INSULIN, id);
}

// ── Settings API ──────────────────────────────────────────────────────────

async function getAppSettings() {
  return getSettings();
}

async function updateAppSettings(data) {
  const current = getSettings();
  saveSettings({ ...current, ...data });
  return { ...current, ...data };
}

export {
  createGlucoseEntry, getGlucoseHistory, updateGlucoseEntry, deleteGlucoseEntry,
  createFoodEntry, getFoodHistory, updateFoodEntry, deleteFoodEntry,
  createInsulinEntry, getInsulinHistory, deleteInsulinEntry,
  getAppSettings, updateAppSettings
};

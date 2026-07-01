const KEYS = {
  GLUCOSE: 'glicose_ai_glucose',
  FOOD: 'glicose_ai_food',
  INSULIN: 'glicose_ai_insulin',
  REMINDERS: 'glicose_ai_reminders',
  SETTINGS: 'glicose_ai_settings',
  THEME: 'glicose_ai_theme'
};

function get(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch { return false; }
}

function getList(key) {
  return get(key) || [];
}

function setList(key, list) {
  return set(key, list);
}

function addItem(key, item) {
  const list = getList(key);
  list.unshift(item);
  return setList(key, list);
}

function updateItem(key, id, updates) {
  const list = getList(key);
  const idx = list.findIndex(i => i.id === id);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], ...updates };
  return setList(key, list);
}

function deleteItem(key, id) {
  const list = getList(key);
  const filtered = list.filter(i => i.id !== id);
  return setList(key, filtered);
}

function getSettings() {
  return get(KEYS.SETTINGS) || {
    targetMin: 70,
    targetMax: 180,
    unit: 'mg/dL',
    insulinSensitivity: 50,
    carbRatio: 10,
    correctionTarget: 120,
    name: '',
    notifications: true
  };
}

function saveSettings(settings) {
  return set(KEYS.SETTINGS, settings);
}

export { KEYS, get, set, getList, setList, addItem, updateItem, deleteItem, getSettings, saveSettings };

/**
 * Context Manager - Mantém contexto da conversa para relacionar glicose, refeição e insulina.
 */

let context = {
  lastGlucose: null,
  lastFood: null,
  lastInsulin: null,
  pendingAction: null,
  lastIntent: null,
  createdAt: null
};

function initContext() {
  context = {
    lastGlucose: null,
    lastFood: null,
    lastInsulin: null,
    pendingAction: null,
    lastIntent: null,
    createdAt: new Date().toISOString()
  };
}

function setContext(key, value) {
  context[key] = value;
  context.updatedAt = new Date().toISOString();
}

function getContext() {
  return { ...context };
}

function getLastGlucose() { return context.lastGlucose; }

function setLastGlucose(value, period, date) {
  context.lastGlucose = { value, period, date: date || new Date().toISOString() };
}

function getLastFood() { return context.lastFood; }

function setLastFood(foods, totals) {
  context.lastFood = {
    foods,
    carbs: totals.carbs,
    kcal: totals.kcal,
    protein: totals.protein,
    fat: totals.fat,
    date: new Date().toISOString()
  };
}

function getLastInsulin() { return context.lastInsulin; }

function setLastInsulin(dose, glucose, carbs) {
  context.lastInsulin = { dose, glucose, carbs, date: new Date().toISOString() };
}

function clearPendingAction() { context.pendingAction = null; }
function reset() { initContext(); }

export {
  initContext, getContext, setContext,
  getLastGlucose, setLastGlucose,
  getLastFood, setLastFood,
  getLastInsulin, setLastInsulin,
  clearPendingAction, reset
};

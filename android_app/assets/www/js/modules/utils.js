function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateStr) {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

function formatRelative(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days === 1) return 'ontem';
  if (days < 7) return `${days} dias atrás`;
  return formatDate(dateStr);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nowISO() {
  return new Date().toISOString();
}

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function getGlucoseStatus(value, settings) {
  const { targetMin = 70, targetMax = 180 } = settings || {};
  if (value < 54) return { label: 'Hipoglicemia Grave', class: 'glucose-low', key: 'very-low' };
  if (value < targetMin) return { label: 'Baixo', class: 'glucose-low', key: 'low' };
  if (value <= targetMax) return { label: 'Normal', class: 'glucose-normal', key: 'normal' };
  if (value <= 250) return { label: 'Alto', class: 'glucose-high', key: 'high' };
  return { label: 'Muito Alto', class: 'glucose-very-high', key: 'very-high' };
}

function getMealPeriod(dateStr) {
  const h = new Date(dateStr).getHours();
  if (h >= 5 && h < 10) return 'Jejum';
  if (h >= 10 && h < 12) return 'Pré-almoço';
  if (h >= 12 && h < 14) return 'Pós-almoço';
  if (h >= 14 && h < 18) return 'Tarde';
  if (h >= 18 && h < 21) return 'Jantar';
  return 'Madrugada';
}

function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

export {
  generateId, formatDate, formatTime, formatDateTime, formatRelative,
  todayISO, nowISO, isSameDay, getGlucoseStatus, getMealPeriod,
  debounce, clamp, average, showToast
};

// Utility helpers for formatting and date logic

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CR', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateEN(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function isToday(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

export function isThisWeek(dateStr) {
  const today = new Date();
  const target = new Date(dateStr + 'T12:00:00');
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

export function isOverdue(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
}

export function getDaysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

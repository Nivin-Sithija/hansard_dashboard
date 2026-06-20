export function formatNumber(value) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

export function rgb(color) {
  if (!Array.isArray(color)) return 'rgb(148, 163, 184)';
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

export function compactList(items, limit = 3) {
  if (!items?.length) return '—';
  return items.slice(0, limit).join(' · ');
}

export function formatDateLabel({ publishedAt, year, date, dateRange } = {}) {
  if (publishedAt) return publishedAt;
  if (date) return date;
  if (dateRange) return dateRange;
  if (year) return String(year);
  return '—';
}

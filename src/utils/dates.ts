export function dateValue(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const value = new Date(date + 'T00:00:00Z');
  return Number.isFinite(+value) && value.toISOString().startsWith(date) ? value : null;
}

export function timeValue(time: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function dateLabel(date: string, options: Intl.DateTimeFormatOptions = {}) {
  const value = dateValue(date);
  return value ? new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    ...options, timeZone: 'UTC',
  }).format(value) : '';
}

export function timeLabel(time: string) {
  if (!timeValue(time)) return '';
  const [hour, minute] = time.split(':').map(Number);
  return (hour % 12 || 12) + ':' + String(minute).padStart(2, '0') + (hour < 12 ? ' AM' : ' PM');
}

export function shiftDate(date: string, days: number) {
  const value = dateValue(date);
  if (!value) return '';
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

// Convert a wall clock time to an instant without relying on the guest's timezone.
export function zonedTime(date: string, time: string, zone: string): Date | null {
  if (!dateValue(date) || !timeValue(time)) return null;
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  const localAsUtc = Date.parse(date + 'T' + time + ':00Z');
  let instant = localAsUtc;
  for (let attempt = 0; attempt < 4; attempt++) {
    const local = formatter.format(new Date(instant)).replace(' ', 'T');
    const difference = localAsUtc - Date.parse(local + 'Z');
    if (difference === 0) return new Date(instant);
    instant += difference;
  }
  return null;
}

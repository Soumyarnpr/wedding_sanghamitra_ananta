import { config, coupleName, directions, venueLocation, eventVenue } from '../config/wedding';
import { dateLabel, dateValue, shiftDate, timeLabel, zonedTime } from './dates';

function utcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function allDay(date: string) {
  return date.replace(/-/g, '');
}

function escapeText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

// RFC 5545 line folding counts UTF-8 octets, not JavaScript characters.
function foldLine(value: string) {
  const encoder = new TextEncoder();
  let bytes = 0;
  let line = '';
  for (const character of value) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) {
      line += '\r\n ';
      bytes = 1;
    }
    line += character;
    bytes += size;
  }
  return line;
}

function calendarDetails() {
  const { wedding, calendar } = config;
  if (!calendar.enabled || !dateValue(wedding.date)) return null;
  const start = zonedTime(wedding.date, wedding.startTime, wedding.timezone);
  const end = zonedTime(wedding.date, wedding.endTime, wedding.timezone);
  const timed = start && end && end > start ? { start, end } : null;
  const title = calendar.title || coupleName + ' | Wedding';
  const schedule = config.events.map((event) => [
    event.name, dateLabel(event.date), timeLabel(event.startTime), eventVenue(event),
  ].filter(Boolean).join(' · '));
  const description = [calendar.description, ...schedule, directions].filter(Boolean).join('\n');
  const startValue = timed ? utcStamp(timed.start) : allDay(wedding.date);
  const endValue = timed ? utcStamp(timed.end) : allDay(shiftDate(wedding.date, 1));
  return { title, description, startValue, endValue, valueType: timed ? '' : ';VALUE=DATE' };
}

export function googleCalendar() {
  const event = calendarDetails();
  if (!event) return '';
  return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action: 'TEMPLATE', text: event.title, dates: event.startValue + '/' + event.endValue,
    details: event.description, location: venueLocation, ctz: config.wedding.timezone,
  });
}

function calendarReminders() {
  const { wedding, calendar } = config;
  if (!calendar.enabled || !dateValue(wedding.date)) return [];
  return calendar.reminders.flatMap(({ daysBefore, time }) => {
    if (!Number.isInteger(daysBefore) || daysBefore < 0) return [];
    const alarm = zonedTime(shiftDate(wedding.date, -daysBefore), time, wedding.timezone);
    return alarm ? [alarm] : [];
  });
}

export function calendarReminderCount() {
  return calendarReminders().length;
}

export function calendarFile() {
  const event = calendarDetails();
  if (!event) return '';
  const reminders = calendarReminders().flatMap((alarm) => [
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER;VALUE=DATE-TIME:' + utcStamp(alarm),
    'DESCRIPTION:' + escapeText(event.title), 'END:VALARM',
  ]);
  const identity = coupleName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation//Calendar//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', 'UID:' + identity + '-' + config.wedding.date + '@invitation.local', 'DTSTAMP:' + utcStamp(new Date()),
    'DTSTART' + event.valueType + ':' + event.startValue,
    'DTEND' + event.valueType + ':' + event.endValue,
    'SUMMARY:' + escapeText(event.title), 'DESCRIPTION:' + escapeText(event.description),
    'LOCATION:' + escapeText(venueLocation), ...reminders, 'END:VEVENT', 'END:VCALENDAR',
  ].map(foldLine).join('\r\n') + '\r\n';
}

export function downloadCalendar() {
  const content = calendarFile();
  if (!content) return;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'wedding.ics';
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

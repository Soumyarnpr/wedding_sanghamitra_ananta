import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

// These dates and names are isolated test data, never production invitation copy.
const context = vm.createContext({ window: {}, TextEncoder, URL, Date });
vm.runInContext(await readFile(new URL('../calendar.js', import.meta.url), 'utf8'), context);
vm.runInContext(await readFile(new URL('../content.js', import.meta.url), 'utf8'), context);
const calendar = context.window.WeddingCalendar;
const couple = { partnerOne: '[TEST PARTNER ONE]', partnerTwo: '[TEST PARTNER TWO]' };
const event = {
  id: 'test-ceremony', name: '[TEST EVENT]', venue: '[TEST VENUE]',
  address: '[TEST ADDRESS]', notes: '[TEST NOTES]', timeZone: '[TEST TIME ZONE]',
  calendar: { start: '2027-02-28T23:30:00+05:30', end: '2027-03-01T01:00:00+05:30' }
};
const unfold = content => content.replace(/\r\n[ \t]/g, '');
const withDates = (start, end = '2027-03-01T01:00:00+05:30') => ({ ...event, calendar: { start, end } });

test('offset conversion preserves an event spanning local midnight', () => {
  const result = calendar.createICS(event, couple);
  assert.equal(result.ok, true);
  assert.match(result.content, /DTSTART:20270228T180000Z\r\n/);
  assert.match(result.content, /DTEND:20270228T193000Z\r\n/);
  assert.match(result.content, /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/);
  assert.ok(result.content.endsWith('END:VCALENDAR\r\n'));
});

test('UTC and negative offsets are converted without using the viewer time zone', () => {
  const result = calendar.createICS(withDates('2027-02-28T23:30:00-04:00', '2027-03-01T05:00:00Z'), couple);
  assert.equal(result.ok, true);
  assert.match(result.content, /DTSTART:20270301T033000Z\r\n/);
  assert.match(result.content, /DTEND:20270301T050000Z\r\n/);
});

test('missing configuration explains the problem without producing an ICS file', () => {
  for (const item of [null, {}, { calendar: {} }, { calendar: { start: event.calendar.start } }]) {
    const result = calendar.createICS(item, couple);
    assert.equal(result.ok, false);
    assert.equal(result.content, '');
    assert.ok(result.error.length > 10);
  }
});

test('invalid dates, times, offsets, and ambiguous local timestamps are rejected', () => {
  for (const start of [
    '2027-02-29T23:30:00+05:30', '2027-04-31T23:30:00Z',
    '2027-13-01T23:30:00Z', '2027-00-28T23:30:00Z',
    '2027-02-00T23:30:00Z', '0000-02-28T23:30:00Z',
    '2027-02-28T24:30:00Z', '2027-02-28T23:60:00Z',
    '2027-02-28T23:30:60Z', '2027-02-28T23:30:00+14:30',
    '2027-02-28T23:30:00+15:00', '2027-02-28T23:30:00+05:60',
    '2027-02-28T23:30:00', '2027-02-28', '[EVENT DATE]', ''
  ]) {
    const result = calendar.createICS(withDates(start), couple);
    assert.equal(result.ok, false, `Unexpectedly accepted ${start}`);
    assert.equal(result.content, '');
  }
  assert.equal(calendar.createICS(withDates(event.calendar.start, '[END TIME]'), couple).ok, false);
});

test('leap years follow Gregorian rules', () => {
  assert.equal(calendar.createICS(withDates('2028-02-29T10:00:00Z', '2028-02-29T11:00:00Z'), couple).ok, true);
  assert.equal(calendar.createICS(withDates('2100-02-29T10:00:00Z', '2100-03-01T11:00:00Z'), couple).ok, false);
  assert.equal(calendar.createICS(withDates('2000-02-29T10:00:00Z', '2000-02-29T11:00:00Z'), couple).ok, true);
});

test('end time must be strictly later in absolute time, including offset changes', () => {
  assert.equal(calendar.createICS(withDates('2027-02-28T10:00:00Z', '2027-02-28T10:00:00Z'), couple).ok, false);
  assert.equal(calendar.createICS(withDates('2027-02-28T11:00:00Z', '2027-02-28T10:00:00Z'), couple).ok, false);
  assert.equal(calendar.createICS(withDates('2027-02-28T10:00:00-04:00', '2027-02-28T14:30:00+01:00'), couple).ok, false);
});

test('text is escaped and cannot inject additional calendar properties', () => {
  const result = calendar.createICS({ ...event, name: 'A, B; C\\D\r\nEND:VEVENT', address: 'First\r\nSecond\rThird\nFourth' }, couple);
  const output = unfold(result.content);
  assert.equal(result.ok, true);
  assert.ok(output.includes('SUMMARY:A\\, B\\; C\\\\D\\nEND:VEVENT'));
  assert.ok(output.includes('First\\nSecond\\nThird\\nFourth'));
  assert.equal((output.match(/\r\nEND:VEVENT\r\n/g) || []).length, 1);
});

test('long UTF-8 content folds at 75 octets without splitting characters', () => {
  const notes = 'A long botanical note: 🌿 é 心 '.repeat(30);
  const result = calendar.createICS({ ...event, notes }, couple);
  assert.equal(result.ok, true);
  for (const line of result.content.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  assert.ok(result.content.includes('\r\n '));
  assert.ok(unfold(result.content).includes(notes));
  assert.ok(!result.content.includes('\uFFFD'));
});

test('event UID remains stable across downloads and schedule edits', () => {
  const first = calendar.createICS(event, couple).content;
  const second = calendar.createICS(withDates('2027-03-01T23:30:00+05:30', '2027-03-02T01:00:00+05:30'), couple).content;
  const different = calendar.createICS({ ...event, id: 'test-reception' }, couple).content;
  assert.equal(first.match(/UID:(.*)/)[1], second.match(/UID:(.*)/)[1]);
  assert.notEqual(first.match(/UID:(.*)/)[1], different.match(/UID:(.*)/)[1]);
});

test('directions accept HTTPS destinations and reject unsafe or malformed URLs', () => {
  assert.equal(calendar.directionsUrl('https://www.google.com/maps/dir/?api=1&destination=Test'), 'https://www.google.com/maps/dir/?api=1&destination=Test');
  for (const value of ['', 'not a URL', '//maps.example.test/path', 'http://maps.example.test/path', 'javascript:alert(1)', 'data:text/html,unsafe', 'https://user:secret@maps.example.test/path']) {
    assert.equal(calendar.directionsUrl(value), '', `Unexpectedly accepted ${value}`);
  }
});

test('the shipped invitation keeps real calendar dates unconfigured', () => {
  for (const item of context.window.WEDDING_CONFIG.events) {
    assert.equal(item.calendar.start, '');
    assert.equal(item.calendar.end, '');
    assert.equal(calendar.createICS(item, context.window.WEDDING_CONFIG.couple).ok, false);
  }
});

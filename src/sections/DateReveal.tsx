import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { CalendarDays, Download, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { config } from '../config/wedding';
import { DateConfetti } from '../components/DateConfetti';
import { SectionTitle, Motif } from '../components/ornaments';
import { dateLabel, timeLabel, zonedTime } from '../utils/dates';
import { calendarReminderCount, downloadCalendar, googleCalendar } from '../utils/calendar';

const width = 720;
const height = 342;
const brush = 33;
const columns = 36;
const rows = 18;

function timezoneLabel(instant: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-IN', { timeZone: timezone, timeZoneName: 'short' })
    .formatToParts(instant).find((part) => part.type === 'timeZoneName')?.value ?? timezone;
}

function revealTimeLabel() {
  const { wedding, events } = config;
  const ceremony = zonedTime(wedding.date, wedding.startTime, wedding.timezone);
  if (ceremony) return timeLabel(wedding.startTime) + ' · ' + timezoneLabel(ceremony, wedding.timezone);

  const reception = events.find((event) => event.id === 'reception' && event.date === wedding.date);
  if (!reception) return '';
  const receptionStart = zonedTime(reception.date, reception.startTime, wedding.timezone);
  if (!receptionStart) return '';
  const end = timeLabel(reception.endTime);
  const schedule = timeLabel(reception.startTime) + (end ? ' – ' + end : ' onwards');
  return reception.name + ' · ' + schedule + ' (' + timezoneLabel(receptionStart, wedding.timezone) + ')';
}

function ScratchCard({ onReveal, revealed, focusOnReveal, time }: {
  onReveal: () => void; revealed: boolean; focusOnReveal: boolean; time: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const covered = useRef(new Set<number>());
  useLayoutEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    ['#ac7049', '#ebcc91', '#b88450', '#f4dfaa', '#bd8c53'].forEach((color, index) => gradient.addColorStop(index / 4, color));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#613a2740';
    ctx.lineWidth = 1;
    for (let x = -height; x < width; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }
    ctx.strokeStyle = '#66374b';
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.strokeRect(27, 27, width - 54, height - 54);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3c1422';
    ctx.font = '42px Georgia, serif';
    ctx.fillText('The Wedding Date', width / 2, 170);
    ctx.font = '500 22px system-ui';
    ctx.fillText('Scratch here', width / 2, 219);
    ctx.fillStyle = '#66374b';
    for (const y of [90, 260]) {
      ctx.beginPath();
      ctx.moveTo(width / 2, y - 10);
      ctx.lineTo(width / 2 + 10, y);
      ctx.lineTo(width / 2, y + 10);
      ctx.lineTo(width / 2 - 10, y);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = brush * 2;
    ctx.lineCap = 'round';
  }, []);

  useLayoutEffect(() => {
    if (revealed && focusOnReveal) result.current?.focus({ preventScroll: true });
  }, [revealed, focusOnReveal]);

  function scratch(event: PointerEvent<HTMLCanvasElement>) {
    const surface = event.currentTarget;
    const ctx = surface.getContext('2d');
    if (!ctx) return;
    const bounds = surface.getBoundingClientRect();
    const point = { x: (event.clientX - bounds.left) / bounds.width * width, y: (event.clientY - bounds.top) / bounds.height * height };
    const from = last.current ?? point;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(point.x + 0.01, point.y);
    ctx.stroke();
    const steps = Math.max(1, Math.ceil(Math.hypot(point.x - from.x, point.y - from.y) / 15));
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    for (let step = 0; step <= steps; step++) {
      const x = from.x + (point.x - from.x) * step / steps;
      const y = from.y + (point.y - from.y) * step / steps;
      for (let row = Math.max(0, Math.floor((y - brush) / cellHeight)); row < Math.min(rows, Math.ceil((y + brush) / cellHeight)); row++) {
        for (let col = Math.max(0, Math.floor((x - brush) / cellWidth)); col < Math.min(columns, Math.ceil((x + brush) / cellWidth)); col++) {
          if (Math.hypot((col + 0.5) * cellWidth - x, (row + 0.5) * cellHeight - y) <= brush) {
            covered.current.add(row * columns + col);
          }
        }
      }
    }
    last.current = point;
    if (covered.current.size >= columns * rows * 0.40) onReveal();
  }

  const date = config.wedding.date;
  return <div className={'scratch-card' + (revealed ? ' is-revealed' : '')}>
    <div className="scratch-result" ref={result} role="group" tabIndex={-1} aria-hidden={!revealed}
      aria-label={dateLabel(date)} aria-describedby={time ? 'revealed-wedding-time' : undefined}>
      <Motif />
      <span className="kicker">{dateLabel(date, { day: undefined, month: undefined, year: undefined })}</span>
      <strong>{dateLabel(date, { weekday: undefined })}</strong>
      {time && <span id="revealed-wedding-time">{time}</span>}
    </div>
    {!revealed && <canvas ref={canvas} width={width} height={height} aria-hidden="true"
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        scratch(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) scratch(event);
      }}
      onLostPointerCapture={() => { last.current = null; }} />}
  </div>;
}

export function Countdown({ compact = false }: { compact?: boolean }) {
  const { wedding } = config;
  const clock = wedding.countdown.time || wedding.startTime || '00:00';
  const { timestamp, zone } = useMemo(() => {
    const target = zonedTime(wedding.date, clock, wedding.timezone);
    return target
      ? { timestamp: target.getTime(), zone: timezoneLabel(target, wedding.timezone) }
      : { timestamp: null, zone: '' };
  }, [wedding.date, clock, wedding.timezone]);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!wedding.countdown.enabled || timestamp === null || Date.now() >= timestamp) return;
    const timer = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= timestamp) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timestamp, wedding.countdown.enabled]);
  if (!wedding.countdown.enabled || timestamp === null) return null;
  const remaining = Math.max(0, Math.ceil((timestamp - now) / 1000));
  if (!remaining) return <p className="countdown-ended">{wedding.countdown.expiredText}</p>;
  const parts = [
    [Math.floor(remaining / 86400), 'Days'], [Math.floor(remaining / 3600) % 24, 'Hours'],
    [Math.floor(remaining / 60) % 60, 'Minutes'], [remaining % 60, 'Seconds'],
  ] as const;
  return <div className={'countdown' + (compact ? ' compact' : '')}>
    <p className="kicker">{wedding.countdown.time || wedding.startTime ? 'The celebration begins in' : 'Until the wedding day · ' + zone}</p>
    <div className="countdown-grid" role="timer" aria-live="off">
      {parts.map(([value, label]) => <div key={label}><strong>{String(value).padStart(2, '0')}</strong><span>{label}</span></div>)}
    </div>
  </div>;
}

export function DateReveal({ motion, revealed, setRevealed }: { motion: boolean; revealed: boolean; setRevealed: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const [focusOnReveal, setFocusOnReveal] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const endCelebration = useCallback(() => setCelebrating(false), []);
  const time = revealTimeLabel();
  const calendarUrl = googleCalendar();
  const reminderCount = calendarUrl ? calendarReminderCount() : 0;
  useEffect(() => {
    if (!motion) endCelebration();
  }, [motion, endCelebration]);

  function reveal() {
    if (motion) setCelebrating(true);
    setRevealed();
  }

  useLayoutEffect(() => {
    if (!motion || !revealed || !stage.current) return;
    const context = gsap.context(() => {
      gsap.from('.scratch-result > *', { y: 13, opacity: 0, duration: 0.56, stagger: 0.1 });
      gsap.from('.date-details', { opacity: 0, y: 15, duration: 0.6 });
    }, stage);
    return () => context.revert();
  }, [revealed, motion]);

  return <section id="date" className="section date-section" aria-label="Wedding date">
    <div className="date-ornament date-ornament-left" aria-hidden="true"><Motif /></div>
    <div className="date-ornament date-ornament-right" aria-hidden="true"><Motif /></div>
    <SectionTitle label="01 · THE WEDDING DAY" title="Save the date"
      description={revealed ? 'Join us for the wedding celebrations.'
        : config.wedding.date ? 'Scratch the gilded card to uncover the day.' : 'The date will be shared here when it is confirmed.'} />
    <p className="sr-only" role="status">
      {revealed && !focusOnReveal && ('Wedding date revealed. ' + dateLabel(config.wedding.date) + '.' + (time ? ' ' + time + '.' : ''))}
    </p>
    {config.wedding.date && <div className="date-stage" ref={stage}>
      <ScratchCard onReveal={reveal} revealed={revealed} focusOnReveal={focusOnReveal} time={time} />
      {celebrating && motion && <DateConfetti onComplete={endCelebration} />}
      {!revealed && <button type="button" className="button button-wine reveal-button" onClick={(event) => {
        if (event.detail === 0) setFocusOnReveal(true);
        reveal();
      }}>
        <Sparkles size={16} /> Reveal Wedding Date
      </button>}
      {revealed && <div className="date-details">
        <Countdown />
        {calendarUrl && <>
          <div className="action-row">
            <a className="button button-wine" href={calendarUrl} target="_blank" rel="noreferrer"><CalendarDays size={17} /> Add to Google Calendar</a>
            <button className="button button-outline" type="button" onClick={downloadCalendar}><Download size={16} /> Download .ics</button>
          </div>
          <p className="calendar-note">
            Set alerts manually when adding the event directly in Google Calendar.
            {reminderCount > 0 && (' The .ics file includes ' + reminderCount + (reminderCount === 1 ? ' reminder.' : ' reminders.') + ' Check your alerts after importing.')}
          </p>
        </>}
      </div>}
    </div>}
  </section>;
}

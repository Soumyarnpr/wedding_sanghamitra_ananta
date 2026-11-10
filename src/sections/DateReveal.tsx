import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { CalendarDays, Download, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { config } from '../config/wedding';
import { SectionTitle, Motif } from '../components/ornaments';
import { dateLabel, timeLabel, zonedTime } from '../utils/dates';
import { downloadCalendar, googleCalendar } from '../utils/calendar';

const width = 720;
const height = 342;
const brush = 33;
const columns = 36;
const rows = 18;

function ScratchCard({ onReveal, revealed }: { onReveal: () => void; revealed: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
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
    <div className="scratch-result" aria-hidden={!revealed}>
      <Motif />
      <span className="kicker">{dateLabel(date, { day: undefined, month: undefined, year: undefined })}</span>
      <strong>{dateLabel(date, { weekday: undefined })}</strong>
      {config.wedding.startTime && <span>{timeLabel(config.wedding.startTime)} · {config.wedding.timezone}</span>}
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
  const target = zonedTime(wedding.date, clock, wedding.timezone);
  const timestamp = target?.getTime() ?? 0;
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!wedding.countdown.enabled || !timestamp || Date.now() >= timestamp) return;
    const timer = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= timestamp) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timestamp, wedding.countdown.enabled]);
  if (!wedding.countdown.enabled || !timestamp) return null;
  const remaining = Math.max(0, Math.ceil((timestamp - now) / 1000));
  if (!remaining) return <p className="countdown-ended">{wedding.countdown.expiredText}</p>;
  const parts = [
    [Math.floor(remaining / 86400), 'Days'], [Math.floor(remaining / 3600) % 24, 'Hours'],
    [Math.floor(remaining / 60) % 60, 'Minutes'], [remaining % 60, 'Seconds'],
  ] as const;
  return <div className={'countdown' + (compact ? ' compact' : '')}>
    <p className="kicker">{wedding.countdown.time || wedding.startTime ? 'The celebration begins in' : 'Until the wedding day in India'}</p>
    <div className="countdown-grid" role="timer" aria-live="off">
      {parts.map(([value, label]) => <div key={label}><strong>{String(value).padStart(2, '0')}</strong><span>{label}</span></div>)}
    </div>
  </div>;
}

export function DateReveal({ motion, revealed, setRevealed }: { motion: boolean; revealed: boolean; setRevealed: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const calendarUrl = googleCalendar();
  useLayoutEffect(() => {
    if (!motion || !revealed || !stage.current) return;
    const context = gsap.context(() => {
      gsap.from('.scratch-result > *', { y: 13, opacity: 0, duration: 0.56, stagger: 0.1 });
      gsap.fromTo('.date-burst i', { x: 0, y: 0, opacity: 1 }, {
        x: (index) => (index < 8 ? 1 : -1) * (35 + (index % 8) * 21),
        y: (index) => -115 + (index % 8) * 28, rotate: 360, opacity: 0,
        duration: 1.2, ease: 'power2.out', stagger: 0.02,
      });
      gsap.from('.date-details', { opacity: 0, y: 15, duration: 0.6 });
    }, stage);
    return () => context.revert();
  }, [revealed, motion]);

  return <section id="date" className="section date-section" aria-label="Wedding date">
    <div className="date-ornament date-ornament-left" aria-hidden="true"><Motif /></div>
    <div className="date-ornament date-ornament-right" aria-hidden="true"><Motif /></div>
    <SectionTitle label="01 · THE WEDDING DAY" title="Save the date"
      description={config.wedding.date ? 'Scratch the gilded card to uncover the day.' : 'The date will be shared here when it is confirmed.'} />
    {config.wedding.date && <div className="date-stage" ref={stage}>
      <ScratchCard onReveal={setRevealed} revealed={revealed} />
      <div className="date-burst" aria-hidden="true">{revealed && motion && Array.from({ length: 16 }, (_, index) => <i key={index}/>)}</div>
      {!revealed && <button type="button" className="button button-wine reveal-button" onClick={setRevealed}>
        <Sparkles size={16} /> Reveal Wedding Date
      </button>}
      {revealed && <div className="date-details">
        <p className="sr-only" role="status">Wedding date revealed. {dateLabel(config.wedding.date)}.</p>
        <Countdown />
        {calendarUrl && <>
          <div className="action-row">
            <a className="button button-wine" href={calendarUrl} target="_blank" rel="noreferrer"><CalendarDays size={17} /> Add to Google Calendar</a>
            <button className="button button-outline" type="button" onClick={downloadCalendar}><Download size={16} /> Download .ics</button>
          </div>
          <p className="calendar-note">The .ics file includes both reminders. Check your calendar’s alerts after importing.</p>
        </>}
      </div>}
    </div>}
  </section>;
}

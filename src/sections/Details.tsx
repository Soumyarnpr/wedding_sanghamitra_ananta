import { ArrowUpRight, CalendarDays, Clock3, MapPin } from 'lucide-react';
import { config, coupleName, directions, eventVenue, venue } from '../config/wedding';
import { Picture } from '../components/media';
import { Flourish, Motif, SectionTitle } from '../components/ornaments';
import { dateLabel, timeLabel } from '../utils/dates';
import { Countdown } from './DateReveal';

function Directions({ light = false }: { light?: boolean }) {
  if (!directions) return null;
  return <a className={'button ' + (light ? 'button-outline' : 'button-wine')} href={directions} target="_blank" rel="noreferrer">
    <MapPin size={16} /> Get directions <ArrowUpRight size={15} />
  </a>;
}

export function Venue() {
  return <section id="venue" className="section venue-section" aria-label="Wedding venue">
    <SectionTitle label="03 · WHERE WE GATHER" title="The wedding venue" />
    <div className="venue-card content-width" data-enter>
      <div className="venue-photo">
        <Picture src={venue.image} alt={venue.imageAlt || venue.name} fallback={config.artwork.venue}/>
        {!venue.image && <span className="venue-art-label">Decorative illustration</span>}
      </div>
      <div className="venue-copy">
        <p className="kicker"><MapPin size={16} /> THE VENUE</p>
        <h3>{venue.name || 'Venue to be announced'}</h3>
        {venue.address && <address>{venue.address}</address>}
        {venue.travel && <p>{venue.travel}</p>}
        <Directions />
      </div>
    </div>
  </section>;
}

function eventTime(event: (typeof config.events)[number]) {
  const start = timeLabel(event.startTime);
  const end = timeLabel(event.endTime);
  return start ? start + (end ? ' – ' + end : ' onwards') : '';
}

export function Ceremonies() {
  return <section id="events" className="section ceremonies-section" aria-label="Wedding ceremonies">
    <SectionTitle label="04 · THE CELEBRATIONS" title="Golden moments" description="The ceremonies and reception, as listed on the invitation." />
    <div className="event-grid content-width">
      {config.events.map((event, index) => <article className={'event-card event-' + event.theme} key={event.id} data-enter>
        <div className="event-wash" aria-hidden="true"/>
        <header className="event-emblem">
          <span className="kicker">{String(index + 1).padStart(2, '0')}</span>
          <div className="event-symbol"><Motif kind={event.illustration}/></div>
        </header>
        <div className="event-copy">
          <p className="kicker">{event.subtitle}</p>
          <h3>{event.name}</h3>
          <ul className="event-meta">
            <li><CalendarDays size={16}/><time dateTime={event.date}>{dateLabel(event.date)}</time></li>
            {eventTime(event) && <li><Clock3 size={16}/><span>{eventTime(event)}</span></li>}
            {eventVenue(event) && <li><MapPin size={16}/><span>{eventVenue(event)}</span></li>}
          </ul>
          <p>{event.description}</p>
        </div>
        {event.significance && <aside className="ritual-note">
          <Motif />
          <p className="kicker">THE RITUAL</p>
          <p>{event.significance}</p>
        </aside>}
      </article>)}
    </div>
  </section>;
}

export function Summary() {
  const { wedding, events, welcome } = config;
  return <section id="invitation" className="section summary-section dark" aria-label="Complete wedding invitation">
    <div className="summary-card" data-enter>
      <Motif className="summary-lotus" />
      <p className="kicker">05 · THE INVITATION AT A GLANCE</p>
      <h2>{coupleName}</h2>
      <p className="summary-date">{dateLabel(wedding.date)}</p>
      <Flourish />
      <p className="summary-note">{welcome.message}</p>
      <dl className="summary-schedule">
        {events.map((event) => <div key={event.id}>
          <dt>{event.name}</dt>
          <dd>{dateLabel(event.date, { weekday: 'short', month: 'short', year: undefined })}{eventTime(event) && ' · ' + eventTime(event)}</dd>
        </div>)}
      </dl>
      {venue.name && <p className="summary-location"><strong>{venue.name}</strong><br />{venue.address}</p>}
      <Directions light />
      <Countdown compact />
    </div>
  </section>;
}

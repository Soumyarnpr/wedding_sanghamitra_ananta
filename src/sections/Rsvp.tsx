import { useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, Phone, Send, Sheet } from 'lucide-react';
import { config, secureUrl } from '../config/wedding';
import { SectionTitle } from '../components/ornaments';

function ResponseForm({ endpoint }: { endpoint: string }) {
  const [attendance, setAttendance] = useState('yes');
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const previous = useRef({ body: '', id: '' });
  const inFlight = useRef(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get('name') || '').trim();
    if (!name) {
      setState('error');
      return;
    }
    const body = JSON.stringify({
      name, attendance, guests: attendance === 'yes' ? Number(fields.get('guests')) : 0,
    });
    if (previous.current.body !== body) previous.current = { body, id: crypto.randomUUID() };
    inFlight.current = true;
    setState('sending');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ ...JSON.parse(body), submissionId: previous.current.id }),
        signal: AbortSignal.timeout(12000),
      });
      const result = await response.json();
      setState(response.ok && result?.ok === true ? 'success' : 'error');
    } catch {
      setState('error');
    } finally {
      inFlight.current = false;
    }
  }

  if (state === 'success') return <p className="rsvp-result" role="status"><Check size={20}/> Your RSVP was received. Thank you!</p>;
  return <form className="rsvp-form" onSubmit={send}>
    <label>Your name<input name="name" autoComplete="name" required maxLength={120} /></label>
    <label>Will you attend?
      <select value={attendance} onChange={(event) => setAttendance(event.target.value)}>
        <option value="yes">Joyfully accepts</option><option value="no">Regretfully declines</option>
      </select>
    </label>
    {attendance === 'yes' && <label>Guests attending, including you
      <input type="number" name="guests" defaultValue={1} min={1} max={config.rsvp.maxGuests} required />
    </label>}
    <button className="button button-wine" type="submit" disabled={state === 'sending'}><Send size={16} />{state === 'sending' ? 'Sending…' : 'Send RSVP'}</button>
    {state === 'error' && <p role="alert">We couldn’t confirm your RSVP. Check your details and try again, or call the family below.</p>}
  </form>;
}

export function Rsvp() {
  const { rsvp } = config;
  if (!rsvp.enabled) return null;
  const endpoint = secureUrl(rsvp.endpoint);
  const formUrl = secureUrl(rsvp.formUrl);
  const responseUrl = formUrl || secureUrl(rsvp.sheetUrl);
  const contacts = rsvp.contacts.filter(({ phone }) => /^\+?[\d ()-]{7,20}$/.test(phone));
  return <section id="rsvp" className="section rsvp-section" aria-label="RSVP">
    <div className="rsvp-card" data-enter>
      <SectionTitle label="06 · RSVP" title="Will you join us?" description={rsvp.message}/>
      {endpoint && <ResponseForm endpoint={endpoint}/>}
      {!endpoint && (responseUrl
        ? <a className="button button-wine" href={responseUrl} target="_blank" rel="noreferrer">
          {formUrl ? 'Open RSVP form' : 'Open RSVP Google Sheet'} <ArrowUpRight size={16}/>
        </a>
        : <div className="rsvp-placeholder">
          <Sheet size={20} aria-hidden="true"/>
          <div><strong>Google Sheets RSVP</strong><small>Link coming soon</small></div>
        </div>)}
      {contacts.length > 0 && <>
        <p className="kicker contact-label">{endpoint || responseUrl ? 'OR CONTACT THE FAMILY' : 'RSVP BY PHONE'}</p>
        <div className="contacts">
          {contacts.map(({ name, phone }) => <a className="contact-link" key={phone} href={'tel:' + phone.replace(/[\s()-]/g, '')}>
            <Phone size={17}/><span><strong>{name}</strong><small>{phone.startsWith('+91') ? '+91 ' + phone.slice(3) : phone}</small></span>
          </a>)}
        </div>
      </>}
    </div>
  </section>;
}

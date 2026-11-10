import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUp, ArrowUpRight, Menu, X } from 'lucide-react';
import { config, coupleName, errors, initials, secureUrl } from './config/wedding';
import { Loader, MusicControls, Picture } from './components/media';
import { Flourish, Motif } from './components/ornaments';
import { useInvitationMotion, useMotion } from './components/motion';
import { Welcome } from './sections/Welcome';
import { DateReveal } from './sections/DateReveal';
import { Story } from './sections/Story';
import { Venue, Ceremonies, Summary } from './sections/Details';
import { Rsvp } from './sections/Rsvp';

const links = [
  ['welcome', 'Welcome'], ['date', 'The Date'], ['story', 'Our Story'],
  ['venue', 'The Venue'], ['events', 'Events'], ['invitation', 'Invitation'],
];

function Navigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return <header className="site-header" onKeyDown={(event) => {
    if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); }
  }}>
    <div className="nav-shell">
      <a className="nav-brand" href="#welcome" onClick={() => setOpen(false)} aria-label={coupleName + ', welcome'}>
        <span className="nav-mark"><Motif /></span><span>{initials}</span>
      </a>
      <button className="menu-toggle icon-button" ref={toggle} type="button" onClick={() => setOpen(!open)}
        aria-expanded={open} aria-controls="main-nav" aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X /> : <Menu />}</button>
      <nav id="main-nav" className={open ? 'nav-links is-open' : 'nav-links'} aria-label="Invitation">
        {links.map(([id, label]) => <a key={id} href={'#' + id} onClick={() => setOpen(false)}>{label}</a>)}
      </nav>
      {config.rsvp.enabled && <a className="nav-rsvp" href="#rsvp" onClick={() => setOpen(false)}>RSVP <ArrowUpRight size={14}/></a>}
    </div>
  </header>;
}

function Footer() {
  const { footer, branding } = config;
  const portfolio = secureUrl(branding.portfolioUrl);
  const instagram = secureUrl(branding.instagramUrl);
  return <footer className="closing dark">
    <div className="closing-inner">
      <Flourish />
      <p className="kicker">{footer.thanks}</p>
      <p className="closing-names">{coupleName}</p>
      <p>{footer.message}</p>
      {footer.compliments && <p className="compliments">{footer.compliments}</p>}
      {(branding.advertisementImage || portfolio || instagram) && <div className="branding">
        {branding.advertisementImage && <Picture src={branding.advertisementImage} alt={branding.advertisementAlt}/>}
        <div className="action-row">
          {portfolio && <a href={portfolio} target="_blank" rel="noreferrer">Portfolio <ArrowUpRight size={15}/></a>}
          {instagram && <a href={instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={15}/></a>}
        </div>
      </div>}
      <a className="back-top" href="#welcome">Back to the top <ArrowUp size={16} /></a>
    </div>
  </footer>;
}

export function App() {
  const [loaded, setLoaded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const onReady = useCallback(() => setLoaded(true), []);
  const revealDate = useCallback(() => setRevealed(true), []);
  const root = useRef<HTMLDivElement>(null);
  const motion = useMotion();
  useInvitationMotion(root, loaded && motion);

  useEffect(() => {
    if (!loaded || !location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: 'instant' });
  }, [loaded]);

  if (errors.length) return <main className="section config-error">
    <h1>Invitation setup</h1><ul>{errors.map((message, index) => <li key={index}>{message}</li>)}</ul>
  </main>;

  return <>
    {!loaded && <Loader onReady={onReady} />}
    <div ref={root} inert={!loaded} className={motion ? 'invitation has-motion' : 'invitation'}
      style={{ '--botanical-art': 'url("' + config.artwork.botanical + '")', '--hero-art': 'url("' + config.artwork.hero + '")' } as CSSProperties}>
      <a className="skip-link" href="#main">Skip to invitation</a>
      <Navigation />
      <main id="main">
        <Welcome motion={motion} />
        <DateReveal motion={motion} revealed={revealed} setRevealed={revealDate} />
        <Story motion={motion} />
        <Venue />
        <Ceremonies />
        <Summary revealed={revealed} />
        <Rsvp />
      </main>
      <Footer />
      {loaded && <MusicControls />}
    </div>
  </>;
}


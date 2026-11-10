import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUp, ArrowUpRight, Instagram } from 'lucide-react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config, coupleName, errors, secureUrl } from './config/wedding';
import { Loader, MusicControls, Picture } from './components/media';
import { Flourish, Motif } from './components/ornaments';
import { useInvitationMotion, useMotion } from './components/motion';
import { Welcome } from './sections/Welcome';
import { DateReveal } from './sections/DateReveal';
import { Story } from './sections/Story';
import { Venue, Ceremonies, Summary } from './sections/Details';
import { Rsvp } from './sections/Rsvp';

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
      <a className="back-top" href="#welcome">Back to the top <ArrowUp size={16} /></a>
      {(branding.advertisementImage || branding.designerName || portfolio || instagram) &&
        <section className="branding" aria-labelledby="designer-credit">
          {branding.advertisementImage && <div className="branding-art">
            <Picture src={branding.advertisementImage} alt={branding.advertisementAlt}/>
          </div>}
          <div className="branding-copy">
            <Motif className="branding-motif" />
            <h2 id="designer-credit" className="kicker">{branding.heading}</h2>
            {branding.designerName && <p className="branding-name">{branding.designerName}</p>}
            {(portfolio || instagram) && <>
              <p className="branding-message">{branding.message}</p>
              <div className="action-row">
                {portfolio && <a className="button button-gold" href={portfolio} target="_blank" rel="noreferrer">View portfolio <ArrowUpRight size={16}/></a>}
                {instagram && <a className="button button-outline" href={instagram} target="_blank" rel="noreferrer"><Instagram size={16}/> Instagram <ArrowUpRight size={16}/></a>}
              </div>
            </>}
          </div>
        </section>}
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
    if (loaded && motion) ScrollTrigger.refresh(true);
  }, [loaded, motion, revealed]);

  useEffect(() => {
    if (!loaded || !location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: 'instant' });
  }, [loaded]);

  if (errors.length) return <main className="section config-error">
    <h1>Invitation setup</h1><ul>{errors.map((message, index) => <li key={index}>{message}</li>)}</ul>
  </main>;

  return <>
    {!loaded && <Loader onReady={onReady} motion={motion} />}
    <div ref={root} inert={!loaded} className={motion ? 'invitation has-motion' : 'invitation'}
      style={{ '--botanical-art': 'url("' + config.artwork.botanical + '")', '--hero-art': 'url("' + config.artwork.hero + '")' } as CSSProperties}>
      <a className="skip-link" href="#main">Skip to invitation</a>
      <main id="main" tabIndex={-1}>
        <Welcome motion={motion} />
        <DateReveal motion={motion} revealed={revealed} setRevealed={revealDate} />
        <Story motion={motion} />
        <Venue />
        <Ceremonies />
        <Summary />
        <Rsvp />
      </main>
      <Footer />
      {loaded && <MusicControls />}
    </div>
  </>;
}


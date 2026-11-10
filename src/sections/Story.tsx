import { useLayoutEffect, useRef, useState, type PointerEvent, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config/wedding';
import { Picture } from '../components/media';
import { Flourish, SectionTitle } from '../components/ornaments';

export function Story({ motion }: { motion: boolean }) {
  const { story, gallery } = config;
  const photos = gallery.length ? gallery : story.illustrations;
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scroll = useRef<ScrollTrigger | null>(null);
  const touchStart = useRef(0);
  const last = photos.length - 1;

  useLayoutEffect(() => {
    if (!motion || last < 1 || !track.current || !window.matchMedia('(min-height: 591px)').matches) return;
    const trigger = ScrollTrigger.create({
      trigger: track.current, start: 'top 86px', end: 'bottom bottom',
      onUpdate: ({ progress }) => setActive(Math.round(progress * last)),
    });
    scroll.current = trigger;
    return () => { trigger.kill(); scroll.current = null; };
  }, [motion, last]);

  useLayoutEffect(() => {
    if (!motion || !stage.current) return;
    const card = stage.current.querySelector('.album-card.is-top');
    if (!card) return;
    const animation = gsap.fromTo(card, { x: 88, y: -32, rotate: 20, opacity: 0.18 }, {
      x: 0, y: 0, rotate: 0, opacity: 1, duration: 0.54, ease: 'power3.out', clearProps: 'transform,opacity',
    });
    return () => { animation.revert(); };
  }, [active, motion]);

  function turn(index: number) {
    const next = Math.max(0, Math.min(last, index));
    const trigger = scroll.current;
    if (trigger?.isActive) window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * next / last, behavior: 'instant' });
    setActive(next);
  }

  function swipe(event: PointerEvent) {
    if (event.pointerType !== 'touch') return;
    const difference = event.clientX - touchStart.current;
    if (Math.abs(difference) > 48) turn(active + (difference < 0 ? 1 : -1));
  }

  return <section id="story" className="story-section section" aria-label="Couple story and album">
    <div className="story-intro">
      <SectionTitle label="02 · THE COUPLE" title={story.title} description={story.text || story.intro} />
    </div>
    {photos.length > 0 && <div className={'album-track' + (motion && last > 0 ? ' has-scroll' : '')} ref={track}
      style={motion && last > 0 ? { '--album-runway': last * 205 + 'px' } as CSSProperties : undefined}>
      <div className="album-spread content-width">
        <div className="album-copy">
          <p className="kicker">{gallery.length ? 'MEMORIES IN PRINT' : story.illustrationNote}</p>
          <h3>{story.albumTitle}</h3>
          <Flourish />
          <p>{last > 0 ? 'Turn the cards to see the collection.' : 'A keepsake for the occasion.'}</p>
          <div className="album-controls">
            <button type="button" className="icon-button" onClick={() => turn(active - 1)} disabled={!active} aria-label="Previous album card"><ArrowLeft size={19}/></button>
            <span aria-live="polite" className="album-index">{String(active + 1).padStart(2, '0')} <i>/</i> {String(photos.length).padStart(2, '0')}</span>
            <button type="button" className="icon-button" onClick={() => turn(active + 1)} disabled={active === last} aria-label="Next album card"><ArrowRight size={19}/></button>
          </div>
        </div>
        <div className="album-stage" ref={stage} onPointerDown={(event) => { touchStart.current = event.clientX; }} onPointerUp={swipe}>
          {photos.map((photo, index) => {
            const depth = active - index;
            return <figure key={photo.src + index} className={'album-card ' + (depth === 0 ? 'is-top' : 'is-under')}
              hidden={depth < 0 || depth > 3} aria-hidden={depth !== 0}
              style={{ zIndex: index + 1, translate: depth ? (depth * 7) + 'px ' + (depth * -5) + 'px' : undefined, rotate: depth ? (depth % 2 ? 1 : -1) * (6 + depth) + 'deg' : undefined }}>
              <Picture src={photo.src} alt={photo.alt} />
              <figcaption>{photo.caption}</figcaption>
            </figure>;
          })}
        </div>
      </div>
    </div>}
  </section>;
}


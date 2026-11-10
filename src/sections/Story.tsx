import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config/wedding';
import { Picture } from '../components/media';
import { Flourish, SectionTitle } from '../components/ornaments';

export function Story({ motion }: { motion: boolean }) {
  const { story, gallery, couple: { bride, groom } } = config;
  const photos = gallery.length ? gallery : story.illustrations;
  const names: Record<string, string> = {
    bride: bride.name,
    groom: groom.name,
    brideNickname: bride.nickname || bride.name,
    groomNickname: groom.nickname || groom.name,
  };
  const introduction = story.text.trim() || story.intro.replace(/\{(bride|groom|brideNickname|groomNickname)\}/g, (_, key: string) => names[key]);
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scroll = useRef<ScrollTrigger | null>(null);
  const touchStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const last = photos.length - 1;
  const runway = Math.max(0, last * 205);

  useLayoutEffect(() => {
    if (!motion || !runway || !track.current) return;
    const media = gsap.matchMedia();
    media.add('(min-height: 591px)', () => {
      scroll.current = ScrollTrigger.create({
        trigger: track.current, start: 'top 14px', end: '+=' + runway,
        onUpdate: ({ progress }) => setActive(Math.round(progress * last)),
      });
      return () => { scroll.current = null; };
    });
    return () => media.revert();
  }, [motion, last, runway]);

  useLayoutEffect(() => {
    if (!motion || !stage.current) return;
    const area = stage.current;
    const card = area.querySelector('.album-card.is-top');
    if (!card) return;
    const animation = gsap.fromTo(card, {
      x: Math.min(88, area.clientWidth * 0.14), y: -24, rotate: area.clientWidth < 400 ? 12 : 20, opacity: 0.18,
    }, {
      x: 0, y: 0, rotate: 0, opacity: 1, duration: 0.54, ease: 'power3.out', clearProps: 'transform,opacity',
    });
    return () => { animation.revert(); };
  }, [active, motion]);

  function turn(index: number) {
    const next = Math.max(0, Math.min(last, index));
    if (next === active) return;
    const trigger = scroll.current;
    if (trigger && window.scrollY >= trigger.start - 1 && window.scrollY <= trigger.end + 1) {
      window.scrollTo({ top: trigger.start + runway * next / last, behavior: 'instant' });
    }
    setActive(next);
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    if (last < 1 || event.pointerType !== 'touch' || !event.isPrimary) return;
    touchStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = touchStart.current;
    if (start?.id !== event.pointerId) return;
    touchStart.current = null;
    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    if (Math.abs(x) >= 48 && Math.abs(x) > Math.abs(y)) turn(active + (x < 0 ? 1 : -1));
  }

  function cancelSwipe(event: PointerEvent<HTMLDivElement>) {
    if (touchStart.current?.id === event.pointerId) touchStart.current = null;
  }

  function onAlbumKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || last < 1) return;
    switch (event.key) {
      case 'ArrowLeft': turn(active - 1); break;
      case 'ArrowRight': turn(active + 1); break;
      case 'Home': turn(0); break;
      case 'End': turn(last); break;
      default: return;
    }
    event.preventDefault();
  }

  return <section id="story" className="story-section section" aria-label="Couple story and album">
    <div className="story-intro">
      <SectionTitle label="02 · THE COUPLE" title={story.title} description={introduction} />
    </div>
    {photos.length > 0 && <div className={'album-track' + (motion && runway ? ' has-scroll' : '')} ref={track}
      style={motion && runway ? { '--album-runway': runway + 'px' } as CSSProperties : undefined}>
      <div className="album-spread content-width" onKeyDown={onAlbumKeyDown}>
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
        <div className="album-stage" ref={stage} role="group" aria-label="Wedding album cards" tabIndex={last > 0 ? 0 : undefined}
          onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={cancelSwipe} onLostPointerCapture={cancelSwipe}>
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


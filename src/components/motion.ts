import { useLayoutEffect, useState, useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { config } from '../config/wedding';

gsap.registerPlugin(ScrollTrigger);

export function useMotion() {
  const [allowed, setAllowed] = useState(() => config.animation.enabled && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setAllowed(config.animation.enabled && !query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return allowed;
}

export function useInvitationMotion(root: RefObject<HTMLElement | null>, enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled || !root.current) return;
    const context = gsap.context(() => {
      gsap.from('[data-opening]', { y: 17, opacity: 0, duration: 0.78, stagger: 0.09, ease: 'power2.out', clearProps: 'opacity,transform' });
      gsap.to('.ganesha-medallion', { y: -5, duration: 2.7, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.utils.toArray<HTMLElement>('[data-enter]').forEach((node) => {
        gsap.from(node, { y: 25, opacity: 0, duration: 0.8, ease: 'power2.out', clearProps: 'opacity,transform',
          scrollTrigger: { trigger: node, start: 'top 91%', once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>('.event-card').forEach((node) => {
        gsap.fromTo(node, { '--event-wash': 0.35 }, { '--event-wash': 1, duration: 1,
          scrollTrigger: { trigger: node, start: 'top 85%', once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>('.petal-field i').forEach((petal, index) => {
        gsap.fromTo(petal, { y: -40, x: 0, opacity: 0, rotate: 20 }, {
          y: () => (root.current?.querySelector('.hero')?.clientHeight ?? 780) + 50,
          x: index % 2 ? 100 : -75, opacity: 0.67, rotate: 320,
          duration: 5.2 + (index % 8) * 0.44, delay: (index % 14) * 0.29,
          ease: 'none', onComplete: () => { petal.style.opacity = '0'; },
        });
      });
    }, root);
    return () => context.revert();
  }, [enabled, root]);
}

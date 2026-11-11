import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';

const corners = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
];
const colors = ['#db9b29', '#f2c454', '#a42d51', '#ed5982', '#be362e', '#ef8c4b'];

function between(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function DateConfetti({ onComplete }: { onComplete: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      onComplete();
      return;
    }

    let width = 0;
    let height = 0;
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(5_000_000 / Math.max(1, width * height)));
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const piecesPerCorner = width < 620 ? 30 : 44;
    const pieces = corners.flatMap((corner) => Array.from({ length: piecesPerCorner }, (_, index) => {
      const angle = between(0.29, 1.28);
      const speed = between(1.5, 2.85);
      return {
        corner,
        vx: Math.cos(angle) * speed * (corner.x === 0 ? 1 : -1),
        vy: Math.sin(angle) * speed * (corner.y === 0 ? 1 : -1),
        delay: between(0, 0.14),
        life: between(1.65, 2.55),
        size: between(4, width < 620 ? 9 : 12),
        angle: between(0, Math.PI * 2),
        spin: between(-12, 12),
        color: colors[index % colors.length],
        shape: index % 5,
      };
    }));

    const clock = { time: 0 };
    const burst = gsap.to(clock, {
      time: 2.75,
      duration: 2.75,
      ease: 'none',
      onUpdate() {
        context.clearRect(0, 0, width, height);
        for (const piece of pieces) {
          const age = clock.time - piece.delay;
          if (age < 0 || age >= piece.life) continue;
          // Fast launch, then air resistance and gravity in viewport units.
          const travel = (1 - Math.exp(-2.5 * age)) / 2.5;
          const x = (piece.corner.x + piece.vx * travel) * width;
          const y = (piece.corner.y + piece.vy * travel + 0.23 * age * age) * height;
          context.save();
          context.translate(x, y);
          context.rotate(piece.angle + age * piece.spin);
          context.globalAlpha = Math.min(1, (1 - age / piece.life) * 3);
          context.fillStyle = piece.color;
          if (piece.shape === 0) {
            context.beginPath();
            context.arc(0, 0, piece.size * 0.32, 0, Math.PI * 2);
            context.fill();
          } else {
            const length = piece.size * (piece.shape === 1 ? 2.5 : 1.2);
            const flutter = 0.25 + Math.abs(Math.cos(age * 11 + piece.angle)) * 0.75;
            context.scale(flutter, 1);
            context.fillRect(-piece.size / 2, -length / 2, piece.size, length);
          }
          context.restore();
        }
      },
      onComplete,
    });

    return () => {
      burst.kill();
      window.removeEventListener('resize', resize);
    };
  }, [onComplete]);

  return createPortal(<canvas ref={ref} className="date-confetti" aria-hidden="true" />, document.body);
}

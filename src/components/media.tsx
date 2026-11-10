import { useEffect, useRef, useState } from 'react';
import { Music2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { config, initials } from '../config/wedding';
import { Motif } from './ornaments';

export function Picture({ src, alt, fallback = '', eager = false }: { src: string; alt: string; fallback?: string; eager?: boolean }) {
  const [failed, setFailed] = useState('');
  const display = failed === src ? fallback : src || fallback;
  const [failedFallback, setFailedFallback] = useState('');
  return display && display !== failedFallback
    ? <img src={display} alt={display === src ? alt : ''} loading={eager ? 'eager' : 'lazy'} decoding="async"
      onError={() => display === src ? setFailed(src) : setFailedFallback(display)} />
    : <div className="picture-fallback" aria-hidden="true"><Motif /></div>;
}

export function Loader({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    let active = true;
    const files = [config.artwork.hero, config.artwork.ganesha].filter(Boolean);
    const images = files.map((file) => {
      const image = new Image();
      image.src = file;
      return image;
    });
    const start = performance.now();
    let transition = 0;
    const finish = () => {
      if (!active) return;
      active = false;
      transition = window.setTimeout(onReady, Math.max(0, 380 - (performance.now() - start)));
    };
    const timer = window.setTimeout(finish, config.animation.loaderMaxMs);
    Promise.allSettled(images.map((image) => image.decode())).then(finish);
    return () => { active = false; clearTimeout(timer); clearTimeout(transition); };
  }, [onReady]);

  return <div className="loader" role="status">
    <div className="loader-seal"><Motif /></div>
    <div className="loader-monogram">{initials}</div>
    <span>Opening the invitation</span>
    <div className="loading-line" aria-hidden="true" />
  </div>;
}

export function MusicControls() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');
  const { music } = config;

  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    player.volume = Math.max(0, Math.min(1, music.volume));
    if (music.autoplay) void player.play().catch(() => {});
    return () => player.pause();
  }, [music.autoplay, music.volume]);

  if (!music.enabled || !music.src) return null;
  const toggle = async () => {
    const player = audio.current;
    if (!player) return;
    if (!player.paused) return player.pause();
    setError('');
    try {
      await player.play();
    } catch {
      setError('Music could not play. Tap to try again.');
    }
  };

  return <div className="music-dock" aria-label="Background music controls">
    <audio ref={audio} src={music.src} loop preload="none" onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)} onVolumeChange={() => setMuted(audio.current?.muted ?? false)}
      onError={() => { setPlaying(false); setError('Music is unavailable.'); }} />
    <button type="button" className="music-main" onClick={toggle} aria-label={playing ? 'Pause music' : 'Play music'}>
      <Music2 size={15}/><span>{playing ? 'Music on' : 'Play music'}</span>{playing ? <Pause size={13}/> : <Play size={13}/>}
    </button>
    <button type="button" className="music-volume" aria-label={muted ? 'Unmute music' : 'Mute music'}
      onClick={() => { if (audio.current) audio.current.muted = !audio.current.muted; }}>
      {muted ? <VolumeX size={17}/> : <Volume2 size={17}/>}
    </button>
    {error && <p role="status" className="music-message">{error}</p>}
  </div>;
}

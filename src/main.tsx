import { createRoot } from 'react-dom/client';
import { App } from './App';
import { config, secureUrl } from './config/wedding';
import './styles.css';

const root = document.documentElement;
for (const [name, value] of Object.entries(config.theme)) root.style.setProperty('--' + name, value);
for (const [name, value] of Object.entries(config.fonts)) {
  if (name !== 'stylesheet') root.style.setProperty('--font-' + name, value);
}

const fontUrl = secureUrl(config.fonts.stylesheet);
if (fontUrl) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fontUrl;
  document.head.append(link);
}
createRoot(document.getElementById('root')!).render(<App />);

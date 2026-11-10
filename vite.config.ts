import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import wedding from './src/config/wedding.config.json';

export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: 'invitation-metadata',
      transformIndexHtml() {
        const title = wedding.couple.bride.name + ' & ' + wedding.couple.groom.name + ' | Wedding Invitation';
        return [
          { tag: 'title', children: title.replaceAll('&', '&amp;').replaceAll('<', '&lt;'), injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'theme-color', content: wedding.theme.maroon } },
          { tag: 'meta', attrs: { name: 'description', content: wedding.welcome.message } },
          { tag: 'meta', attrs: { property: 'og:title', content: title } },
          { tag: 'meta', attrs: { property: 'og:description', content: wedding.welcome.message } },
          { tag: 'link', attrs: { rel: 'icon', href: wedding.artwork.lotus, type: 'image/svg+xml' } },
          ...(wedding.artwork.hero ? [{ tag: 'link', attrs: { rel: 'preload', as: 'image', href: wedding.artwork.hero } }] : []),
        ];
      },
    },
  ],
});

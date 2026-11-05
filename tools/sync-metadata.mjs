import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const escapeHTML = value => String(value || '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export async function syncMetadata() {
  const content = await readFile(path.join(root, 'content.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(content, context, { filename: 'content.js', timeout: 1000 });
  const config = context.window.WEDDING_CONFIG;
  if (!config?.meta) throw new Error('content.js must define WEDDING_CONFIG.meta.');
  const { title, description, siteUrl, previewImage } = config.meta;
  let html = await readFile(path.join(root, 'index.html'), 'utf8');
  if (!/<\/head>/i.test(html)) throw new Error('index.html needs a closing head element.');
  const titleTag = `<title>${escapeHTML(title)}</title>`;
  html = /<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, () => titleTag)
    : html.replace(/<\/head>/i, `  ${titleTag}\n</head>`);

  function meta(key, value, property = false) {
    const attr = property ? 'property' : 'name';
    const tag = `<meta ${attr}="${key}" content="${escapeHTML(value)}">`;
    let found = false;
    html = html.replace(/<meta\b[^>]*>/gi, existing => {
      const pattern = new RegExp(`\\b${attr}\\s*=\\s*(["'])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'i');
      if (!pattern.test(existing)) return existing;
      found = true;
      return tag;
    });
    if (!found) html = html.replace(/<\/head>/i, `  ${tag}\n</head>`);
  }

  let image = previewImage || '';
  if (image && siteUrl) {
    try {
      const resolved = new URL(image, `${siteUrl.replace(/\/$/, '')}/`);
      image = ['https:', 'http:'].includes(resolved.protocol) ? resolved.href : '';
    } catch { throw new Error('meta.siteUrl or meta.previewImage is not a valid URL.'); }
  }
  meta('description', description);
  meta('og:title', title, true);
  meta('og:description', description, true);
  meta('og:type', 'website', true);
  meta('og:image', image, true);
  meta('og:image:alt', `${config.couple.partnerOne} & ${config.couple.partnerTwo} — Wedding invitation`, true);
  meta('og:url', siteUrl || '', true);
  meta('twitter:card', 'summary_large_image');
  meta('twitter:title', title);
  meta('twitter:description', description);
  meta('twitter:image', image);
  if (siteUrl) {
    const canonical = `<link rel="canonical" href="${escapeHTML(siteUrl)}">`;
    html = /<link\b[^>]*\brel=["']canonical["'][^>]*>/i.test(html)
      ? html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i, () => canonical)
      : html.replace(/<\/head>/i, `  ${canonical}\n</head>`);
  }
  await writeFile(path.join(root, 'index.html'), html);
  return { title, siteUrl: siteUrl || '', previewImage: image };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await syncMetadata();
  console.log('Updated HTML metadata from content.js.');
}

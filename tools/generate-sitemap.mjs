import { writeFileSync } from 'node:fs';

const SITE = 'https://marvispace.com';
const TODAY = new Date().toISOString().slice(0, 10);

const pages = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.5' },
  { loc: '/terms', changefreq: 'monthly', priority: '0.4' },
  { loc: '/privacy', changefreq: 'monthly', priority: '0.4' },
  { loc: '/accessibility', changefreq: 'monthly', priority: '0.4' },
  { loc: '/order-status', changefreq: 'monthly', priority: '0.5' },
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${SITE}${p.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync(new URL('./sitemap.xml', import.meta.url), xml, 'utf8');
console.log(`sitemap.xml updated — ${pages.length} URLs`);

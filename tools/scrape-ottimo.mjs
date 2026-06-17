import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'https://www.ottimoleather.com';
const OUT_DIR = 'assets/images/products';

function decodeHtml(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parsePrice(raw) {
  const n = raw.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.');
  const tl = parseFloat(n) || 0;
  return Math.round(tl / 34);
}

function inferCategory(name) {
  const n = name.toLowerCase();
  if (/gömlek|gomlek|shirt/i.test(n)) return 'shirts';
  if (/pantolon|şort|short|etek|elbise/i.test(n)) return 'bottoms';
  if (/yelek|vest/i.test(n)) return 'accessories';
  if (/kaban|pardösü|pardosu|kürk|kurk|mont|trenç|trench|şişme|sisme/i.test(n)) return 'coats';
  return 'jackets';
}

function slugify(s) {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

function parseProducts(html, pageGender = null) {
  const products = new Map();
  const re = /productSeoLink=([^"&]+)[\s\S]*?src="(\/Assets\/images\/product\/medium\/[^"]+)"[\s\S]*?class="pc__title"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="money price">([^<]+)</g;
  let m;
  while ((m = re.exec(html))) {
    const seoLink = m[1];
    if (products.has(seoLink)) continue;
    const name = decodeHtml(m[3]);
    products.set(seoLink, {
      seoLink,
      name,
      price: parsePrice(m[4]),
      imagePath: m[2],
      gender: pageGender || (seoLink.includes('A10_') || /mila|maya|rhea|scarlet/i.test(name) ? 'womens' : 'mens'),
      category: inferCategory(name),
    });
  }
  return products;
}

function collectListUrls(html) {
  const urls = new Set([`${BASE}/Products/ProductList`, `${BASE}/`]);
  const re = /href="(\/Products\/ProductList\?[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    urls.add(`${BASE}${decodeHtml(m[1])}`);
  }
  return [...urls];
}

function galleryFromDetail(html) {
  return [...html.matchAll(/\/Assets\/images\/product\/big\/([^"']+\.jpg)/gi)]
    .map(x => `/Assets/images/product/big/${x[1]}`)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 6);
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarvispaceImporter/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function downloadImage(url, dest) {
  if (existsSync(dest)) return;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarvispaceImporter/1.0)' },
  });
  if (!res.ok) throw new Error(`Image ${res.status}: ${url}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const home = await fetchText(`${BASE}/`);
  const listUrls = collectListUrls(home);
  const all = new Map();

  for (const url of listUrls) {
    const gender = url.includes('kadin') ? 'womens' : url.includes('erkek') ? 'mens' : null;
    try {
      const html = await fetchText(url);
      for (const [k, v] of parseProducts(html, gender)) {
        if (!all.has(k)) all.set(k, { ...v, gender: gender || v.gender });
      }
    } catch (e) {
      console.warn('Skip', url, e.message);
    }
  }

  console.log(`Found ${all.size} unique products across ${listUrls.length} pages`);
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const catalog = [];
  let i = 0;

  for (const p of all.values()) {
    i += 1;
    const base = slugify(p.seoLink);
    const localImages = [];

    try {
      const detail = await fetchText(`${BASE}/products/productDetails?productSeoLink=${p.seoLink}`);
      const gallery = galleryFromDetail(detail);
      const sources = gallery.length ? gallery : [p.imagePath.replace('/medium/', '/big/').replace('_01_00', '_01').replace('_00.jpg', '.jpg')];

      let idx = 0;
      for (const src of sources) {
        idx += 1;
        const fileName = `${base}_${String(idx).padStart(2, '0')}.jpg`;
        const dest = join(OUT_DIR, fileName);
        const imageUrl = src.startsWith('http') ? src : `${BASE}${src}`;
        try {
          await downloadImage(imageUrl, dest);
          localImages.push(`/${OUT_DIR}/${fileName}`.replace(/\\/g, '/'));
        } catch {
          if (idx === 1) {
            const medName = `${base}.jpg`;
            await downloadImage(`${BASE}${p.imagePath}`, join(OUT_DIR, medName));
            localImages.push(`/${OUT_DIR}/${medName}`.replace(/\\/g, '/'));
          }
        }
      }

      if (!localImages.length) throw new Error('no images');

      catalog.push({
        id: `ottimo_${base}`,
        label: p.name,
        image: localImages[0],
        images: localImages,
        galleryCount: localImages.length,
        price: p.price,
        category: p.category,
        gender: p.gender,
        inStock: true,
        stock: 12,
      });
      console.log(`[${i}/${all.size}] OK ${p.name} (${localImages.length} imgs)`);
    } catch (e) {
      console.warn(`[${i}/${all.size}] FAIL ${p.name}: ${e.message}`);
    }

    await new Promise(r => setTimeout(r, 120));
  }

  writeFileSync('assets/js/data/products.js', `export const products = ${JSON.stringify(catalog, null, 2)};\n`, 'utf8');
  console.log(`\nWrote assets/js/data/products.js with ${catalog.length} products`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

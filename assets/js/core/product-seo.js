/**
 * Product URL slugs — keep in sync with api/lib/product-seo.php
 */
import { getLang, homePath } from './i18n.js';

export function slugify(value) {
  let slug = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length > 80) slug = slug.slice(0, 80).replace(/-+$/g, '');
  return slug;
}

export function buildSlugMap(products) {
  const sorted = [...products].sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
  const used = new Set();
  const map = {};

  for (const product of sorted) {
    const id = String(product.id || '');
    if (!id) continue;

    let base = slugify(product.label) || slugify(id) || 'product';
    let slug = base;
    if (used.has(slug)) {
      const idPart = slugify(id);
      slug = idPart ? `${base}-${idPart}` : `${base}-2`;
      let n = 2;
      while (used.has(slug)) {
        slug = `${base}-${n}`;
        n += 1;
      }
    }
    used.add(slug);
    map[id] = slug;
  }

  return map;
}

export function productPath(product, slugMap) {
  const slug = slugMap?.[product.id] || slugify(product.label) || slugify(product.id);
  return `/${getLang()}/product/${slug}`;
}

export function productUrl(product, slugMap, origin = '') {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${productPath(product, slugMap)}`;
}

export { homePath };

/**
 * Responsive product image URLs (server resize + WebP).
 * @project MARVISPACE
 */

export const GRID_WIDTHS = [320, 480, 640];
export const PREVIEW_WIDTHS = [560, 960, 1280];
export const CART_WIDTHS = [160, 200];

export const GRID_SIZES = '(max-width: 480px) 45vw, (max-width: 1024px) 30vw, 280px';
export const PREVIEW_SIZES = '(max-width: 767px) 100vw, min(560px, 50vw)';
export const CART_SIZES = '96px';

const prefetched = new Set();

function useResizeEndpoint() {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1';
}

export function isOptimizableImage(src) {
  return typeof src === 'string' && src.startsWith('/assets/images/') && useResizeEndpoint();
}

export function resizeUrl(src, width, format = 'webp', quality = 85) {
  if (!src) return '';
  if (!isOptimizableImage(src)) return src;
  const params = new URLSearchParams({
    src,
    w: String(width),
    f: format,
    q: String(quality),
  });
  return `/api/v1/images/resize?${params}`;
}

export function buildSrcset(src, widths, format = 'webp', quality = 85) {
  if (!isOptimizableImage(src)) return '';
  return widths.map(w => `${resizeUrl(src, w, format, quality)} ${w}w`).join(', ');
}

export function bindImageReveal(img, fallbackSrc = '') {
  let revealed = false;

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    img.classList.add('is-loaded');
  };

  const fallBackToOriginal = () => {
    if (!fallbackSrc || img.dataset.fallbackApplied === '1') {
      reveal();
      return;
    }
    img.dataset.fallbackApplied = '1';
    const picture = img.closest('picture');
    picture?.querySelectorAll('source').forEach(el => el.remove());
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    try {
      const next = new URL(fallbackSrc, window.location.href).href;
      if (img.src !== next) img.src = fallbackSrc;
    } catch {
      img.src = fallbackSrc;
    }
    if (img.complete && img.naturalWidth > 0) reveal();
  };

  img.addEventListener('load', reveal);
  img.addEventListener('error', fallBackToOriginal);

  // Cached / already decoded — show immediately.
  if (img.complete && img.naturalWidth > 0) {
    reveal();
    return;
  }

  // Native loading="lazy" often reports complete=true with 0×0 *before*
  // the fetch starts. Treating that as an error leaves the card blank
  // (opacity: 0, no load event) until a full cache-busting reload.
  window.setTimeout(() => {
    if (revealed) return;
    if (img.naturalWidth > 0) reveal();
    else fallBackToOriginal();
  }, 4000);
}

export function prefetchOptimizedImage(src, width = PREVIEW_WIDTHS[1]) {
  if (!isOptimizableImage(src)) return;
  const url = resizeUrl(src, width, 'webp');
  if (prefetched.has(url)) return;
  prefetched.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

export function prefetchGalleryImages(urls, centerIdx = 0) {
  if (!Array.isArray(urls) || !urls.length) return;
  const len = urls.length;
  [0, 1, -1, 2].forEach((delta) => {
    const idx = (centerIdx + delta + len) % len;
    prefetchOptimizedImage(urls[idx], PREVIEW_WIDTHS[1]);
  });
}

/**
 * Build <picture> with WebP sources + JPEG fallback for catalog images.
 */
export function appendOptimizedPicture(picture, {
  src,
  fallbackSrc = '',
  alt = '',
  className = '',
  eager = false,
  priority = false,
  widths = GRID_WIDTHS,
  sizes = GRID_SIZES,
  quality = 85,
}) {
  const img = document.createElement('img');
  img.decoding = 'async';
  img.loading = eager ? 'eager' : 'lazy';
  if (priority) img.fetchPriority = 'high';
  img.alt = alt;
  if (className) img.className = className;
  img.draggable = false;
  const original = fallbackSrc || src;

  if (!isOptimizableImage(src)) {
    img.src = src;
    picture.append(img);
    bindImageReveal(img, original);
    return img;
  }

  const webp = document.createElement('source');
  webp.type = 'image/webp';
  webp.srcset = buildSrcset(src, widths, 'webp', quality);
  webp.sizes = sizes;

  const jpeg = document.createElement('source');
  jpeg.type = 'image/jpeg';
  jpeg.srcset = buildSrcset(src, widths, 'jpeg', quality);
  jpeg.sizes = sizes;

  const fallbackW = widths[widths.length - 1] || widths[0];
  img.sizes = sizes;

  picture.append(webp, jpeg, img);
  img.srcset = buildSrcset(src, widths, 'jpeg', quality);
  img.src = resizeUrl(src, fallbackW, 'jpeg', quality);
  bindImageReveal(img, original);
  return img;
}

export function cartImageUrl(src, width = 200) {
  return isOptimizableImage(src) ? resizeUrl(src, width, 'webp') : src;
}

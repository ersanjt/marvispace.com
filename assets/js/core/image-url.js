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

export function bindImageReveal(img) {
  const reveal = () => img.classList.add('is-loaded');
  img.addEventListener('load', reveal, { once: true });
  img.addEventListener('error', reveal, { once: true });
  if (img.complete) reveal();
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
  alt = '',
  className = '',
  eager = false,
  widths = GRID_WIDTHS,
  sizes = GRID_SIZES,
  quality = 85,
}) {
  const img = document.createElement('img');
  img.decoding = 'async';
  img.loading = eager ? 'eager' : 'lazy';
  if (eager) img.fetchPriority = 'high';
  img.alt = alt;
  if (className) img.className = className;
  img.draggable = false;

  if (!isOptimizableImage(src)) {
    img.src = src;
    bindImageReveal(img);
    picture.append(img);
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
  img.src = resizeUrl(src, fallbackW, 'jpeg', quality);
  img.srcset = buildSrcset(src, widths, 'jpeg', quality);
  img.sizes = sizes;

  bindImageReveal(img);
  picture.append(webp, jpeg, img);
  return img;
}

export function cartImageUrl(src, width = 200) {
  return isOptimizableImage(src) ? resizeUrl(src, width, 'webp') : src;
}

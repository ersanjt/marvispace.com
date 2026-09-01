import { fetchSiteSettings, submitContact } from '../core/api-client.js';
import { initI18n, initLangSwitch, t } from '../core/i18n.js?v=20260901-lookbook2';
import { mountContactAtelier } from '../core/legal-page.js?v=20260901-lookbook2';
import { loadProducts } from '../core/storage.js';
import { buildSlugMap, productPath } from '../core/product-seo.js';
import {
  appendOptimizedPicture,
  prefetchOptimizedImage,
  PREVIEW_WIDTHS,
} from '../core/image-url.js?v=20260901-img';

await initI18n();
initLangSwitch();
mountContactAtelier();

const still = document.querySelector('.contact-still img');
if (still) still.alt = t('contactStillAlt');

mountContactLookbook();

const atelier = document.querySelector('.atelier-line');
if (atelier) atelier.setAttribute('aria-label', t('locationsAria'));

const form = document.getElementById('contactForm');
const status = document.getElementById('contactFormStatus');
const submitBtn = document.getElementById('contactSubmitBtn');
const nameInput = document.getElementById('contactName');
const emailInput = document.getElementById('contactEmail');
const messageInput = document.getElementById('contactMessage');
const fields = [nameInput, emailInput, messageInput].filter(Boolean);

function setStatus(text, isError = false) {
  if (!status) return;
  status.hidden = false;
  status.textContent = text;
  status.classList.toggle('is-error', isError);
  status.classList.toggle('is-success', !isError && Boolean(text) && text !== t('contactSending'));
}

function clearFieldErrors() {
  fields.forEach((el) => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  });
}

function markInvalid(el) {
  if (!el) return;
  el.setAttribute('aria-invalid', 'true');
  if (status?.id) el.setAttribute('aria-describedby', status.id);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const message = String(data.get('message') || '').trim();
  const website = String(data.get('website') || '').trim();

  clearFieldErrors();
  form.classList.remove('is-sent');

  if (!name || name.length < 2) {
    setStatus(t('contactRequired'), true);
    markInvalid(nameInput);
    nameInput?.focus();
    return;
  }
  if (!email || !isValidEmail(email)) {
    setStatus(t('contactEmailInvalid'), true);
    markInvalid(emailInput);
    emailInput?.focus();
    return;
  }
  if (!message || message.length < 5) {
    setStatus(t('contactMessageShort'), true);
    markInvalid(messageInput);
    messageInput?.focus();
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
  }
  setStatus(t('contactSending'));

  try {
    await submitContact({ name, email, message, website });
    form.reset();
    form.classList.add('is-sent');
    setStatus(t('contactThanks'));
    status?.focus?.();
    status?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  } catch (err) {
    setStatus(err.message || t('contactError'), true);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
    }
  }
});

try {
  const settings = await fetchSiteSettings();
  const wa = settings?.whatsapp;
  const row = document.getElementById('contactWhatsApp');
  const link = document.getElementById('contactWhatsAppLink');
  if (wa?.enabled && wa?.url && row && link) {
    link.href = wa.url;
    link.setAttribute('aria-label', t('whatsappAria'));
    row.hidden = false;
  }
} catch {
  /* ignore */
}

const LOOKBOOK_LIMIT = 12;
const LOOKBOOK_MS = 5200;
const LOOKBOOK_FADE_MS = 900;
const LOOKBOOK_SIZES = '(max-width: 720px) 92vw, (max-width: 1024px) 92vw, 380px';
const LOOKBOOK_WIDTHS = [480, 720, 960];

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function lookbookSrc(product) {
  const images = Array.isArray(product.images) && product.images.length
    ? product.images.filter(Boolean)
    : [product.image].filter(Boolean);
  const stillShot = images.find((src) => /_0?2\.(jpe?g|webp|png)$/i.test(src));
  return stillShot || images[1] || images[0] || product.image || '';
}

function pickLookbookSlides(products) {
  const seen = new Set();
  const slides = [];
  for (const product of products) {
    if (product.inStock === false) continue;
    const src = lookbookSrc(product);
    if (!src || seen.has(src)) continue;
    seen.add(src);
    slides.push({ product, src });
  }
  return shuffle(slides).slice(0, LOOKBOOK_LIMIT);
}

async function fetchSeedProducts() {
  try {
    const res = await fetch('/install/products.json', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function makeLookbookPicture(slide, eager = false) {
  const pic = document.createElement('picture');
  pic.className = 'contact-still__pic';
  appendOptimizedPicture(pic, {
    src: slide.src,
    fallbackSrc: slide.src,
    alt: slide.product.label || t('contactStillAlt'),
    className: 'contact-still__img',
    eager,
    priority: eager,
    widths: LOOKBOOK_WIDTHS,
    sizes: LOOKBOOK_SIZES,
    quality: 88,
  });
  return pic;
}

function mountContactLookbook() {
  const root = document.querySelector('[data-contact-lookbook]');
  const link = root?.querySelector('[data-lookbook-link]');
  const meta = root?.querySelector('[data-lookbook-meta]');
  const nameEl = root?.querySelector('[data-lookbook-name]');
  const ticksEl = root?.querySelector('[data-lookbook-ticks]');
  const prevBtn = root?.querySelector('[data-lookbook-prev]');
  const nextBtn = root?.querySelector('[data-lookbook-next]');
  const toggleBtn = root?.querySelector('[data-lookbook-toggle]');
  const controls = root?.querySelector('[data-lookbook-controls]');
  if (!root || !link) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let slides = [];
  let slugMap = {};
  let index = 0;
  let timer = null;
  let paused = reduceMotion;
  let pointerX = 0;
  let swiped = false;
  let busyUntil = 0;

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    if (paused || reduceMotion || slides.length < 2) return;
    if (root.matches(':hover') || root.contains(document.activeElement)) return;
    timer = window.setInterval(() => go(index + 1, { auto: true }), LOOKBOOK_MS);
  }

  function syncToggle() {
    if (!toggleBtn) return;
    const key = paused ? 'contactLookbookPlay' : 'contactLookbookPause';
    toggleBtn.setAttribute('aria-label', t(key));
    toggleBtn.setAttribute('aria-pressed', String(paused));
    toggleBtn.textContent = t(key);
  }

  function syncTicks() {
    if (!ticksEl) return;
    ticksEl.querySelectorAll('button').forEach((btn, i) => {
      btn.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
  }

  function syncMeta() {
    const slide = slides[index];
    if (!slide) return;
    const href = productPath(slide.product, slugMap);
    link.href = href;
    link.setAttribute('aria-label', slide.product.label || t('contactStillAlt'));
    if (nameEl) nameEl.textContent = slide.product.label || '';
    syncTicks();
    prefetchOptimizedImage(slides[(index + 1) % slides.length].src, PREVIEW_WIDTHS[0]);
  }

  function show(nextIndex, { auto = false } = {}) {
    const slide = slides[nextIndex];
    if (!slide) return;
    const incoming = makeLookbookPicture(slide, !auto);
    [...link.querySelectorAll(':scope > .contact-still__pic:not(.is-active), :scope > .contact-still__img:not(.is-active)')]
      .forEach((el) => el.remove());
    const outgoing = [...link.querySelectorAll(':scope > .contact-still__pic, :scope > .contact-still__img')];
    incoming.classList.add('is-incoming');
    link.append(incoming);

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      incoming.classList.add('is-active');
      incoming.classList.remove('is-incoming');
      outgoing.forEach((el) => el.classList.remove('is-active'));
      window.setTimeout(() => {
        outgoing.forEach((el) => {
          if (!el.classList.contains('is-active')) el.remove();
        });
      }, reduceMotion ? 0 : LOOKBOOK_FADE_MS);
    };

    const img = incoming.querySelector('img');
    window.setTimeout(reveal, 1400);
    if (!img) {
      reveal();
      return;
    }
    img.addEventListener('load', reveal, { once: true });
    img.addEventListener('error', reveal, { once: true });
    if (img.complete && img.naturalWidth > 0) reveal();
    else if (img.decode) img.decode().then(reveal).catch(() => {});
  }

  function go(next, opts = {}) {
    if (slides.length < 2) return;
    const now = Date.now();
    if (!opts.auto && now < busyUntil) return;
    const wrapped = (next + slides.length) % slides.length;
    if (wrapped === index) return;
    index = wrapped;
    busyUntil = now + (reduceMotion ? 0 : 420);
    show(index, opts);
    syncMeta();
    if (!opts.auto) start();
  }

  function bindTicks() {
    if (!ticksEl) return;
    ticksEl.replaceChildren();
    slides.forEach((slide, i) => {
      const item = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', slide.product.label || `${i + 1}`);
      btn.addEventListener('click', () => go(i));
      item.append(btn);
      ticksEl.append(item);
    });
    ticksEl.hidden = slides.length < 2;
  }

  prevBtn?.addEventListener('click', () => go(index - 1));
  nextBtn?.addEventListener('click', () => go(index + 1));
  toggleBtn?.addEventListener('click', () => {
    paused = !paused;
    syncToggle();
    if (paused) stop();
    else start();
  });

  root.addEventListener('mouseenter', () => {
    if (!reduceMotion) stop();
  });
  root.addEventListener('mouseleave', () => {
    if (!paused) start();
  });
  root.addEventListener('focusin', () => stop());
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget) && !paused) start();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!paused) start();
  });

  link.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    pointerX = e.clientX;
    swiped = false;
  });
  link.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return;
    const dx = e.clientX - pointerX;
    if (Math.abs(dx) < 48) return;
    swiped = true;
    go(index + (dx < 0 ? 1 : -1));
  });
  link.addEventListener('click', (e) => {
    if (!swiped) return;
    e.preventDefault();
    swiped = false;
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index - 1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(index + 1);
    }
  });

  (async () => {
    try {
      const products = await loadProducts(await fetchSeedProducts());
      slugMap = buildSlugMap(products);
      slides = pickLookbookSlides(products);
    } catch {
      slides = [];
    }

    if (!slides.length) return;

    index = 0;
    if (meta) meta.hidden = false;
    if (controls) controls.hidden = slides.length < 2;
    if (toggleBtn) toggleBtn.hidden = reduceMotion;
    bindTicks();
    syncToggle();
    syncMeta();

    const currentSrc = link.querySelector('img')?.getAttribute('src') || '';
    if (slides[0].src !== currentSrc) {
      show(0, { auto: false });
    }

    if (slides.length > 1) start();
  })();
}

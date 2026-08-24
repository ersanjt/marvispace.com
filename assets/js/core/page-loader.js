/**
 * @file page-loader.js — branded splash while the storefront boots
 */
import { SITE } from '../config/site.js';

const LOADER_ID = 'pageLoader';
const MIN_MS = 700;
const MAX_MS = 2800;

function createLoader() {
  if (document.getElementById(LOADER_ID)) return null;

  const el = document.createElement('div');
  el.id = LOADER_ID;
  el.className = 'page-loader';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-label', `${SITE.name} loading`);
  el.innerHTML = `
    <div class="page-loader__inner">
      <img
        class="page-loader__mark"
        src="${SITE.brand.mark}"
        width="72"
        height="72"
        alt=""
        decoding="async"
      />
      <p class="page-loader__name">${SITE.name}</p>
      <span class="page-loader__bar" aria-hidden="true"></span>
    </div>
  `;
  document.body.prepend(el);
  document.documentElement.classList.add('is-booting');
  return el;
}

function dismiss(el) {
  if (!el || el.classList.contains('is-done')) return;
  el.classList.add('is-done');
  document.documentElement.classList.remove('is-booting');
  window.setTimeout(() => el.remove(), 520);
}

export function initPageLoader() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (sessionStorage.getItem('ms_booted') === '1') return;

  const started = performance.now();
  const el = createLoader();
  if (!el) return;

  const finish = () => {
    const elapsed = performance.now() - started;
    const wait = Math.max(0, MIN_MS - elapsed);
    window.setTimeout(() => {
      dismiss(el);
      try {
        sessionStorage.setItem('ms_booted', '1');
      } catch {
        /* ignore */
      }
    }, wait);
  };

  const failSafe = window.setTimeout(finish, MAX_MS);

  if (document.readyState === 'complete') {
    window.clearTimeout(failSafe);
    finish();
    return;
  }

  window.addEventListener(
    'load',
    () => {
      window.clearTimeout(failSafe);
      finish();
    },
    { once: true },
  );
}

initPageLoader();

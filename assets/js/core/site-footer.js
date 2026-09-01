/**
 * @file site-footer.js — shared footer navigation + newsletter popup
 * @author Ersan JT <https://github.com/ersanjt>
 */

import { subscribeNewsletter } from './api-client.js';
import { SITE, SOCIAL } from '../config/site.js';
import { MERCHANT_PHONE, MERCHANT_PHONE_HREF } from '../config/legal.js';
import { t, getLang, initLangSwitch, contactPath, privacyPath, accessibilityPath, cookiesPath, termsPath, returnsPath, kvkkPath, distancePath, preinfoPath } from './i18n.js?v=20260901-workshop';
import { hasCookieDecision } from './cookie-consent.js';

const NEWSLETTER_DISMISS_KEY = 'marvispace_newsletter_dismissed';

const SOCIAL_LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  x: 'X',
  pinterest: 'Pinterest',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
};

function socialNavHtml() {
  const links = Object.entries(SOCIAL)
    .filter(([, url]) => Boolean(url))
    .map(([key, url]) => {
      const label = SOCIAL_LABELS[key] || key;
      return `<li><a href="${url}" class="nav-item" target="_blank" rel="noopener noreferrer me">${label}</a></li>`;
    });

  if (!links.length) return '';
  return `
    <details class="footer-col">
      <summary class="footer-col__title">${t('social')}</summary>
      <ul class="footer-nav">
        ${links.join('')}
      </ul>
    </details>
  `;
}

function legalNavHtml() {
  const lang = getLang();
  if (lang === 'tr') {
    return `
      <details class="footer-col">
        <summary class="footer-col__title">${t('legal')}</summary>
        <ul class="footer-nav">
          <li><a href="${kvkkPath()}" class="nav-item">KVKK</a></li>
          <li><a href="${termsPath()}" class="nav-item">${t('terms')}</a></li>
          <li><a href="${privacyPath()}" class="nav-item">${t('privacy')}</a></li>
          <li><a href="${distancePath()}" class="nav-item">${t('legalDistanceSales')}</a></li>
          <li><a href="${preinfoPath()}" class="nav-item">${t('legalPreInfo')}</a></li>
          <li><a href="${returnsPath()}" class="nav-item">${t('returns')}</a></li>
        </ul>
      </details>
    `;
  }
  return `
    <details class="footer-col">
      <summary class="footer-col__title">${t('legal')}</summary>
      <ul class="footer-nav">
        <li><a href="${termsPath()}" class="nav-item">${t('terms')}</a></li>
        <li><a href="${privacyPath()}" class="nav-item">${t('privacy')}</a></li>
        <li><a href="${distancePath()}" class="nav-item">${t('legalDistanceSales')}</a></li>
        <li><a href="${preinfoPath()}" class="nav-item">${t('legalPreInfo')}</a></li>
        <li><a href="${returnsPath()}" class="nav-item">${t('returns')}</a></li>
        <li><a href="${kvkkPath()}" class="nav-item">KVKK</a></li>
      </ul>
    </details>
  `;
}

function footerInnerHtml() {
  const lang = getLang();
  return `
  <div class="footer-inner">
    <div class="footer-brand-block">
      <a class="footer-brand" href="/${lang}/" aria-label="${SITE.name} ${t('homeAria')}">
        <img src="${SITE.brand.mark}" width="36" height="36" alt="" decoding="async" />
        <span>${SITE.name}</span>
      </a>
      <p class="footer-tagline">${t('tagline')}</p>
      <a class="footer-cta" href="${contactPath()}">${t('contactSupport')}</a>
    </div>

    <div class="footer-columns">
      ${legalNavHtml()}

      <details class="footer-col">
        <summary class="footer-col__title">${t('help')}</summary>
        <ul class="footer-nav">
          <li><a href="${contactPath()}" class="nav-item">${t('contact')}</a></li>
          <li><a href="/order-status" class="nav-item">${t('orderStatus')}</a></li>
          <li><a href="${privacyPath()}" class="nav-item">${t('privacy')}</a></li>
          <li><a href="${accessibilityPath()}" class="nav-item">${t('accessibility')}</a></li>
          <li><a href="${cookiesPath()}" class="nav-item">${t('cookies')}</a></li>
        </ul>
      </details>

      ${socialNavHtml()}
    </div>

    <div class="footer-meta">
      <p class="footer-trust">${t('trust')}</p>
      <p class="footer-places">${t('places')} · <a href="${MERCHANT_PHONE_HREF}">${MERCHANT_PHONE}</a> · <a href="mailto:${SITE.supportEmail}">${SITE.supportEmail}</a></p>
      <p class="footer-etbis"><a href="https://etbis.ticaret.gov.tr/" rel="noopener noreferrer" target="_blank">${t('etbis')}</a> · <a href="${returnsPath()}">${t('returns')}</a></p>
      <p class="footer-lang" aria-label="Language">
        <button type="button" class="footer-lang__btn${lang === 'tr' ? ' is-active' : ''}" data-lang-switch="tr">${t('langTr')}</button>
        <span aria-hidden="true">/</span>
        <button type="button" class="footer-lang__btn${lang === 'en' ? ' is-active' : ''}" data-lang-switch="en">${t('langEn')}</button>
      </p>
    </div>
  </div>
`;
}

function newsletterHtml() {
  return `
  <div class="newsletter-card" role="dialog" aria-label="${t('newsletterAria')}">
    <button type="button" class="newsletter-close" data-newsletter-close aria-label="${t('newsletterClose')}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <line x1="6" y1="6" x2="18" y2="18"/>
        <line x1="18" y1="6" x2="6" y2="18"/>
      </svg>
    </button>
    <h2 class="newsletter-title">${t('newsletterTitle')}</h2>
    <form class="newsletter-form" data-newsletter-form novalidate>
      <input
        type="email"
        name="email"
        class="newsletter-input"
        placeholder="${t('newsletterPlaceholder')}"
        autocomplete="email"
        aria-label="${t('newsletterEmail')}"
        required
      />
      <p class="newsletter-consent">
        ${t('newsletterConsent')}
        <a href="${getLang() === 'tr' ? kvkkPath() : privacyPath()}">${t('newsletterPrivacy')}</a>
      </p>
      <button type="submit" class="newsletter-btn">${t('subscribe')}</button>
      <p class="newsletter-msg" data-newsletter-msg hidden></p>
    </form>
  </div>
`;
}

export function mountSiteFooter(root = document) {
  root.querySelectorAll('[data-site-footer], .site-footer').forEach(footer => {
    footer.classList.add('site-footer');
    footer.innerHTML = footerInnerHtml();
    initLangSwitch(footer);
    syncFooterAccordions(footer);
  });

  mountNewsletterPopup();
}

function syncFooterAccordions(footer) {
  const cols = [...footer.querySelectorAll('details.footer-col')];
  if (!cols.length) return;

  const mq = window.matchMedia('(max-width: 768px)');
  const apply = () => {
    cols.forEach((col, i) => {
      col.open = mq.matches ? i === 0 : true;
    });
  };

  apply();
  mq.addEventListener('change', apply);

  cols.forEach(col => {
    col.addEventListener('toggle', () => {
      if (!mq.matches || !col.open) return;
      cols.forEach(other => {
        if (other !== col) other.open = false;
      });
    });
  });
}

function isNewsletterDismissed() {
  try {
    return localStorage.getItem(NEWSLETTER_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function dismissNewsletter(popup) {
  try {
    localStorage.setItem(NEWSLETTER_DISMISS_KEY, '1');
  } catch {
    /* ignore */
  }
  popup.classList.remove('is-visible');
  setTimeout(() => popup.remove(), 300);
}

export function mountNewsletterPopup() {
  if (isNewsletterDismissed()) return;
  if (document.querySelector('.newsletter-popup')) return;

  const open = () => {
    if (isNewsletterDismissed()) return;
    if (document.querySelector('.newsletter-popup')) return;

    const popup = document.createElement('aside');
    popup.className = 'newsletter-popup';
    popup.innerHTML = newsletterHtml();
    document.body.append(popup);

    requestAnimationFrame(() => popup.classList.add('is-visible'));

    popup.querySelector('[data-newsletter-close]')?.addEventListener('click', () => {
      dismissNewsletter(popup);
    });

    const form = popup.querySelector('[data-newsletter-form]');
    const input = popup.querySelector('.newsletter-input');
    const button = popup.querySelector('.newsletter-btn');
    const msg = popup.querySelector('[data-newsletter-msg]');

    const showMessage = (text, ok) => {
      if (!msg) return;
      msg.hidden = false;
      msg.textContent = text;
      msg.classList.toggle('is-error', !ok);
    };

    form?.addEventListener('submit', async e => {
      e.preventDefault();
      const email = (input?.value || '').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage(t('newsletterInvalid'), false);
        input?.focus();
        return;
      }

      if (button) button.disabled = true;
      try {
        await subscribeNewsletter(email);
        form.reset();
        showMessage(t('newsletterThanks'), true);
        setTimeout(() => dismissNewsletter(popup), 1600);
      } catch (err) {
        showMessage(err.message || t('newsletterError'), false);
      } finally {
        if (button) button.disabled = false;
      }
    });
  };

  if (hasCookieDecision()) {
    setTimeout(open, 600);
    return;
  }

  window.addEventListener('marvispace:cookie-decision', () => {
    setTimeout(open, 600);
  }, { once: true });
}

if (document.currentScript?.type === 'module') {
  mountSiteFooter();
}

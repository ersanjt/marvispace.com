/**
 * @file site-footer.js — shared footer navigation + newsletter popup
 * @author Ersan JT <https://github.com/ersanjt>
 */

import { subscribeNewsletter } from './api-client.js';

const NEWSLETTER_DISMISS_KEY = 'marvispace_newsletter_dismissed';

const FOOTER_INNER_HTML = `
  <div class="footer-inner">
    <ul class="footer-nav">
      <li><a href="/contact" class="nav-item">Contact</a></li>
      <li><a href="/terms" class="nav-item">Terms</a></li>
      <li><a href="/privacy" class="nav-item">Privacy</a></li>
      <li><a href="/accessibility" class="nav-item">Accessibility</a></li>
      <li><a href="/privacy-right-center" class="nav-item">DNSMPI</a></li>
      <li><button type="button" class="nav-item" data-cookies-btn>Cookies</button></li>
      <li><a href="/order-status" class="nav-item">Order Status</a></li>
    </ul>
  </div>
`;

const NEWSLETTER_HTML = `
  <div class="newsletter-card" role="dialog" aria-label="Receive website updates">
    <button type="button" class="newsletter-close" data-newsletter-close aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <line x1="6" y1="6" x2="18" y2="18"/>
        <line x1="18" y1="6" x2="6" y2="18"/>
      </svg>
    </button>
    <h2 class="newsletter-title">Receive website updates</h2>
    <form class="newsletter-form" data-newsletter-form novalidate>
      <input
        type="email"
        name="email"
        class="newsletter-input"
        placeholder="Email Address"
        autocomplete="email"
        aria-label="Email address"
        required
      />
      <p class="newsletter-consent">
        I consent to receive MARVISPACE email marketing. Consent is not required for purchase.
        Read our <a href="/privacy">privacy policy</a> to learn about your rights and our use of your personal information.
      </p>
      <button type="submit" class="newsletter-btn">Subscribe</button>
      <p class="newsletter-msg" data-newsletter-msg hidden></p>
    </form>
  </div>
`;

function bindCookiesButton(footer) {
  footer.querySelector('[data-cookies-btn]')?.addEventListener('click', () => {
    window.location.href = '/privacy#cookies';
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

  const popup = document.createElement('aside');
  popup.className = 'newsletter-popup';
  popup.innerHTML = NEWSLETTER_HTML;
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
      showMessage('Please enter a valid email address.', false);
      input?.focus();
      return;
    }

    if (button) button.disabled = true;
    try {
      await subscribeNewsletter(email);
      form.reset();
      showMessage('Thanks — you are subscribed.', true);
      setTimeout(() => dismissNewsletter(popup), 1600);
    } catch (err) {
      showMessage(err.message || 'Could not subscribe. Please try again.', false);
    } finally {
      if (button) button.disabled = false;
    }
  });
}

export function mountSiteFooter(root = document) {
  root.querySelectorAll('[data-site-footer], .site-footer').forEach(footer => {
    if (!footer.querySelector('.footer-inner')) {
      footer.classList.add('site-footer');
      footer.innerHTML = FOOTER_INNER_HTML;
    }
    bindCookiesButton(footer);
  });

  mountNewsletterPopup();
}

if (document.currentScript?.type === 'module') {
  mountSiteFooter();
}

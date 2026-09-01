/**
 * @file credits.js — developer attribution
 * @author Ersan JT <https://github.com/ersanjt>
 */

import { DEVELOPER } from '../config/site.js';
import { mountSiteFooter } from './site-footer.js?v=20260901-wa';
import { initCookieConsent } from './cookie-consent.js';
import { initWhatsAppSupport } from './whatsapp-support.js?v=20260901-wa';
import { initI18n, applyDomI18n, t } from './i18n.js?v=20260901-wa';

export function createDeveloperCreditElement() {
  const credit = document.createElement('aside');
  credit.className = 'dev-credit';
  credit.setAttribute('data-developer-credit', '');
  credit.setAttribute('aria-label', 'Site credit');

  const link = document.createElement('a');
  link.className = 'dev-credit__link';
  link.href = DEVELOPER.url;
  link.rel = 'author noopener noreferrer';
  link.target = '_blank';

  const name = document.createElement('span');
  name.className = 'dev-credit__name';
  name.textContent = DEVELOPER.name;

  const meta = document.createElement('span');
  meta.className = 'dev-credit__meta';
  meta.textContent = DEVELOPER.tagline || 'Design & development';

  link.append(name, meta);
  credit.append(link);
  return credit;
}

function mountCheckoutCredit(root) {
  const shell = root.querySelector('.checkout-shell');
  if (!shell || shell.querySelector('[data-developer-credit]')) return false;

  const foot = document.createElement('footer');
  foot.className = 'checkout-foot';
  foot.append(createDeveloperCreditElement());
  shell.append(foot);
  return true;
}

function mountFooterCredit(root) {
  const footer = root.querySelector('.site-footer[data-site-footer], .site-footer');
  if (!footer || footer.querySelector('[data-developer-credit]')) return false;

  footer.append(createDeveloperCreditElement());
  return true;
}

function mountPageCredit(root) {
  const page = root.querySelector('.site-page');
  if (!page || page.querySelector('[data-developer-credit]')) return false;

  page.append(createDeveloperCreditElement());
  return true;
}

export async function mountDeveloperCredit(root = document) {
  await initI18n();
  applyDomI18n(root);
  mountSiteFooter(root);
  initCookieConsent();
  initWhatsAppSupport({ message: t('whatsappHello') });

  if (root.querySelector('[data-developer-credit]')) return;

  if (mountCheckoutCredit(root)) return;
  if (mountFooterCredit(root)) return;
  mountPageCredit(root);
}

if ([...document.querySelectorAll('script[type="module"]')].some((script) =>
  (script.getAttribute('src') || '').includes('/assets/js/core/credits.js')
)) {
  void mountDeveloperCredit();
}

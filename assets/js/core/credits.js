/**
 * @file credits.js — developer attribution
 * @author Ersan JT <https://github.com/ersanjt>
 */

import { DEVELOPER } from '../config/site.js';

export function mountDeveloperCredit(root = document) {
  if (root.querySelector('[data-developer-credit]')) return;

  const anchor = root.querySelector('.site-footer, .site-page, main.checkout-page, #adminApp');
  if (!anchor) return;

  const credit = document.createElement('p');
  credit.className = 'site-credit';
  credit.setAttribute('data-developer-credit', '');
  credit.innerHTML = `Developed by <a href="${DEVELOPER.url}" rel="author noopener noreferrer" target="_blank">${DEVELOPER.name}</a>`;

  if (anchor.classList.contains('site-footer')) {
    anchor.append(credit);
    return;
  }

  anchor.append(credit);
}

if (document.currentScript?.type === 'module') {
  mountDeveloperCredit();
}

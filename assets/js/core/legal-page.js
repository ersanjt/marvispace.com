/**
 * Shared merchant legal block for Turkish compliance pages.
 */
import { MERCHANT, LOCATIONS, MERCHANT_PHONE_HREF } from '../config/legal.js?v=20260901-contact';
import { contactPath, cookiesPath, distancePath, getLang, kvkkPath, preinfoPath, privacyPath, returnsPath, t, termsPath } from './i18n.js';

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isPresent(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  return !/^0+$/.test(text.replace(/\s/g, ''));
}

function mapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function merchantRowsHtml() {
  const m = MERCHANT;
  const rows = [
    [t('merchantTrade'), m.legalName],
    [t('merchantBrand'), m.brand],
    [t('merchantAddress'), m.address],
    [t('merchantPhone'), m.phone, MERCHANT_PHONE_HREF],
    [t('merchantEmail'), m.email, `mailto:${m.email}`],
    isPresent(m.taxOffice) && isPresent(m.taxNumber) ? [t('merchantTax'), `${m.taxOffice} — ${m.taxNumber}`] : null,
    isPresent(m.mersis) ? [t('merchantMersis'), m.mersis] : null,
    isPresent(m.tradeRegistry) ? [t('merchantRegistry'), m.tradeRegistry] : null,
    isPresent(m.kep) ? [t('merchantKep'), m.kep] : null,
    isPresent(m.authorizedPerson) ? [t('merchantAuthorized'), m.authorizedPerson] : null,
    ['ETBİS', 'etbis.ticaret.gov.tr', m.etbisUrl],
  ].filter(Boolean);

  return rows.map(([label, value, href]) => {
    const body = href
      ? `<a href="${esc(href)}"${String(href).startsWith('http') ? ' rel="noopener noreferrer" target="_blank"' : ''}>${esc(value)}</a>`
      : esc(value);
    return `<div><dt>${esc(label)}</dt><dd>${body}</dd></div>`;
  }).join('');
}

export function locationsHtml() {
  const tr = getLang() === 'tr';
  return `
    <section class="store-locations" aria-label="${esc(t('locationsAria'))}">
      <h2 class="section-label">${esc(t('locationsTitle'))}</h2>
      <p class="store-locations__lead">${esc(t('locationsLead'))}</p>
      <div class="store-locations__grid">
        ${LOCATIONS.map(place => `
          <article class="store-location">
            <h3>${esc(tr ? place.nameTr : place.nameEn)}</h3>
            <p class="store-location__blurb">${esc(tr ? place.blurbTr : place.blurbEn)}</p>
            <p class="store-location__address">${esc(place.address)}</p>
            ${place.phone ? `<p><a href="${MERCHANT_PHONE_HREF}">${esc(place.phone)}</a></p>` : ''}
            <p><a href="${esc(mapsUrl(place.address))}" rel="noopener noreferrer" target="_blank">${esc(t('locationMap'))}</a></p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

export function merchantInfoHtml() {
  return `
    <section class="merchant-info" aria-label="${esc(t('merchantAria'))}">
      <h2 class="section-label">${esc(t('merchantTitle'))}</h2>
      <dl class="order-meta">
        ${merchantRowsHtml()}
      </dl>
    </section>
  `;
}

export function mountMerchantInfo(root = document) {
  root.querySelectorAll('[data-merchant-info]').forEach(el => {
    el.innerHTML = merchantInfoHtml();
  });
}

export function mountStoreLocations(root = document) {
  root.querySelectorAll('[data-store-locations]').forEach(el => {
    el.innerHTML = locationsHtml();
  });
}

export function mountLegalNav(root = document) {
  const here = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  root.querySelectorAll('[data-legal-nav]').forEach(el => {
    const links = [
      [kvkkPath(), 'KVKK'],
      [termsPath(), t('terms')],
      [privacyPath(), t('privacy')],
      [cookiesPath(), t('cookiePolicy')],
      [distancePath(), t('legalDistanceSales')],
      [preinfoPath(), t('legalPreInfo')],
      [returnsPath(), t('returns')],
      [contactPath(), t('contact')],
    ];
    el.innerHTML = `
      <nav class="legal-nav" aria-label="${esc(t('legalNavAria'))}">
        ${links.map(([href, label]) => {
          const current = href.replace(/\/+$/, '') === here;
          return `<a href="${esc(href)}"${current ? ' aria-current="page"' : ''}>${esc(label)}</a>`;
        }).join('')}
      </nav>
    `;
  });
}

export function mountLegalPage(root = document) {
  mountMerchantInfo(root);
  mountStoreLocations(root);
  mountLegalNav(root);
}

mountLegalPage();

/**
 * Shared merchant legal block for Turkish compliance pages.
 */
import { MERCHANT, LEGAL_LINKS, LOCATIONS, MERCHANT_PHONE_HREF } from '../config/legal.js';

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
    ['Ticari Unvan', m.legalName],
    ['Marka', m.brand],
    ['Adres', m.address],
    ['Telefon', m.phone, MERCHANT_PHONE_HREF],
    ['E-posta', m.email, `mailto:${m.email}`],
    isPresent(m.taxOffice) && isPresent(m.taxNumber) ? ['Vergi Dairesi / No', `${m.taxOffice} — ${m.taxNumber}`] : null,
    isPresent(m.mersis) ? ['MERSİS', m.mersis] : null,
    isPresent(m.tradeRegistry) ? ['Ticaret Sicil No', m.tradeRegistry] : null,
    isPresent(m.kep) ? ['KEP', m.kep] : null,
    isPresent(m.authorizedPerson) ? ['Yetkili', m.authorizedPerson] : null,
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
  return `
    <section class="store-locations" aria-label="MARVISPACE locations">
      <h2 class="section-label">Atölye ve mağazalar / Workshop &amp; stores</h2>
      <p class="store-locations__lead">MARVISPACE online satıştır. Deri İstanbul Kağıthane atölyesinde üretilir; Alanya ve Antalya’da showroom’da görebilirsiniz.</p>
      <div class="store-locations__grid">
        ${LOCATIONS.map(place => `
          <article class="store-location">
            <h3>${esc(place.nameTr)} <span>/ ${esc(place.nameEn)}</span></h3>
            <p class="store-location__blurb">${esc(place.blurbTr)}</p>
            <p class="store-location__address">${esc(place.address)}</p>
            ${place.phone ? `<p><a href="${MERCHANT_PHONE_HREF}">${esc(place.phone)}</a></p>` : ''}
            <p><a href="${esc(mapsUrl(place.address))}" rel="noopener noreferrer" target="_blank">Harita / Map</a></p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

export function merchantInfoHtml() {
  return `
    <section class="merchant-info" aria-label="Satıcı bilgileri">
      <h2 class="section-label">Satıcı / Veri Sorumlusu Bilgileri</h2>
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
  root.querySelectorAll('[data-legal-nav]').forEach(el => {
    el.innerHTML = `
      <nav class="legal-nav" aria-label="Yasal metinler">
        <a href="${LEGAL_LINKS.kvkk}">KVKK</a>
        <a href="${LEGAL_LINKS.mesafeliSatis}">Mesafeli Satış</a>
        <a href="${LEGAL_LINKS.onBilgilendirme}">Ön Bilgilendirme</a>
        <a href="${LEGAL_LINKS.iadeIptal}">İade & Cayma</a>
        <a href="${LEGAL_LINKS.contact}">İletişim</a>
      </nav>
    `;
  });
}

mountMerchantInfo();
mountStoreLocations();
mountLegalNav();

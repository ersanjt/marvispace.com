/**
 * Shared merchant legal block for Turkish compliance pages.
 */
import { MERCHANT, LEGAL_LINKS } from '../config/legal.js';

export function merchantInfoHtml() {
  const m = MERCHANT;
  return `
    <section class="merchant-info" aria-label="Satıcı bilgileri">
      <h2 class="section-label">Satıcı / Veri Sorumlusu Bilgileri</h2>
      <dl class="order-meta">
        <div><dt>Ticari Unvan</dt><dd>${m.legalName}</dd></div>
        <div><dt>Marka</dt><dd>${m.brand}</dd></div>
        <div><dt>Adres</dt><dd>${m.address}</dd></div>
        <div><dt>Telefon</dt><dd><a href="tel:${m.phone.replace(/\s/g, '')}">${m.phone}</a></dd></div>
        <div><dt>E-posta</dt><dd><a href="mailto:${m.email}">${m.email}</a></dd></div>
        <div><dt>Vergi Dairesi / No</dt><dd>${m.taxOffice} — ${m.taxNumber}</dd></div>
        <div><dt>MERSİS</dt><dd>${m.mersis}</dd></div>
        <div><dt>Ticaret Sicil No</dt><dd>${m.tradeRegistry}</dd></div>
        <div><dt>KEP</dt><dd>${m.kep}</dd></div>
        <div><dt>Yetkili</dt><dd>${m.authorizedPerson}</dd></div>
        <div><dt>ETBİS</dt><dd><a href="${m.etbisUrl}" rel="noopener noreferrer" target="_blank">etbis.ticaret.gov.tr</a></dd></div>
      </dl>
    </section>
  `;
}

export function mountMerchantInfo(root = document) {
  root.querySelectorAll('[data-merchant-info]').forEach(el => {
    el.innerHTML = merchantInfoHtml();
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

if (document.currentScript?.type === 'module') {
  mountMerchantInfo();
  mountLegalNav();
}

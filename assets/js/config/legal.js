/**
 * Turkish merchant / legal identity — update before payment gateway review.
 * @project MARVISPACE
 */
import { SITE } from './site.js';

export const MERCHANT = {
  brand: SITE.name,
  legalName: 'MARVISPACE TİCARET LİMİTED ŞİRKETİ', // TODO: şirket unvanınız
  address: 'Antalya, Türkiye', // TODO: açık adres (mahalle, ilçe, il, posta kodu)
  phone: '+90 850 000 00 00', // TODO: müşteri hattı
  email: SITE.supportEmail,
  taxOffice: 'Antalya', // TODO: vergi dairesi
  taxNumber: '0000000000', // TODO: vergi numarası
  mersis: '0000000000000000', // TODO: MERSİS no
  tradeRegistry: '000000', // TODO: ticaret sicil no
  kep: 'destek@hs01.kep.tr', // TODO: KEP adresi
  etbisUrl: 'https://etbis.ticaret.gov.tr/',
  authorizedPerson: 'Yetkili Kişi', // TODO: ad soyad
  deliveryDays: '3–7 iş günü',
  cargoCompany: 'Anlaşmalı kargo firması',
  currency: 'TRY',
  vatIncluded: true,
  vatRate: 10,
};

export const LEGAL_LINKS = {
  kvkk: '/kvkk',
  mesafeliSatis: '/mesafeli-satis-sozlesmesi',
  onBilgilendirme: '/on-bilgilendirme',
  iadeIptal: '/iade-ve-iptal',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
};

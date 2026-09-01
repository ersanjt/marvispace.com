/**
 * Turkish merchant / legal identity — MARVISPACE online store.
 * Leather is produced at the Istanbul workshop.
 * @project MARVISPACE
 */
import { SITE } from './site.js';

export const MERCHANT_PHONE = '+90 212 294 90 00';
export const MERCHANT_PHONE_HREF = 'tel:+902122949000';

export const LOCATIONS = [
  {
    id: 'istanbul',
    cityTr: 'İstanbul',
    cityEn: 'Istanbul',
    kind: 'factory',
    listed: true,
    nameTr: 'İstanbul Fabrika',
    nameEn: 'Istanbul Workshop',
    blurbTr: 'MARVISPACE deri ürünlerinin üretildiği atölye.',
    blurbEn: 'The workshop where MARVISPACE leather is made.',
    address: 'Hamidiye Mahallesi Söyler Caddesi No: 2, Kağıthane / İstanbul',
    phone: MERCHANT_PHONE,
    email: SITE.supportEmail,
  },
  {
    id: 'alanya',
    cityTr: 'Alanya',
    cityEn: 'Alanya',
    kind: 'store',
    listed: false,
    nameTr: 'Alanya Mağaza',
    nameEn: 'Alanya Store',
    blurbTr: 'Akdeniz showroom’u — deri ceketleri yerinde görün.',
    blurbEn: 'Mediterranean showroom — see jackets in person.',
    address: 'Konaklı, D-400 Karayolu Timo Hotel, 07491 Alanya / Antalya',
    email: SITE.supportEmail,
  },
  {
    id: 'antalya',
    cityTr: 'Antalya',
    cityEn: 'Antalya',
    kind: 'store',
    listed: false,
    nameTr: 'Antalya Mağaza',
    nameEn: 'Antalya Store',
    blurbTr: 'Kepez showroom’u — deriyi yerinde deneyin.',
    blurbEn: 'Kepez showroom — try the leather in person.',
    address: 'Altınovasinan Mahallesi Serik Caddesi No: 367, Kepez / Antalya',
    email: SITE.supportEmail,
  },
];

export function publicLocations() {
  return LOCATIONS.filter((place) => place.listed !== false);
}

export const MERCHANT = {
  brand: SITE.name,
  legalName: 'MARVISPACE',
  address: LOCATIONS[0].address,
  phone: MERCHANT_PHONE,
  email: SITE.supportEmail,
  taxOffice: '',
  taxNumber: '',
  mersis: '',
  tradeRegistry: '',
  kep: '',
  etbisUrl: 'https://etbis.ticaret.gov.tr/',
  authorizedPerson: '',
  deliveryDays: '3–7 iş günü',
  cargoCompany: 'Türkiye içi kargo',
  currency: 'TRY',
  vatIncluded: true,
  vatRate: 10,
  locations: LOCATIONS,
};

export const LEGAL_LINKS = {
  kvkk: '/tr/kvkk',
  mesafeliSatis: '/tr/mesafeli-satis-sozlesmesi',
  onBilgilendirme: '/tr/on-bilgilendirme',
  iadeIptal: '/tr/iade-ve-iptal',
  contact: '/en/contact',
  privacy: '/en/privacy',
  terms: '/en/terms',
};

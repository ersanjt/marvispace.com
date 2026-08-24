/**
 * @file site.js
 * @project MARVISPACE — marvispace.com
 * @author Ersan JT <https://github.com/ersanjt>
 * @copyright © 2026 MARVISPACE. All rights reserved.
 */

export const SITE = {
  name: 'MARVISPACE',
  tagline: 'Premium Leather Apparel',
  description:
    'Shop premium leather jackets, coats, shirts and accessories at MARVISPACE. Curated mens and womens collections — secure checkout at marvispace.com.',
  domain: 'marvispace.com',
  url: 'https://marvispace.com',
  supportEmail: 'support@marvispace.com',
  locale: 'en_US',
  themeColor: '#0a0a0a',
  brand: {
    mark: '/assets/images/brand/mark.svg',
    markPng: '/assets/images/brand/mark.png',
    logo: '/assets/images/brand/logo.svg',
    logoLight: '/assets/images/brand/logo-light.svg',
    favicon: '/favicon.svg',
    appleTouchIcon: '/apple-touch-icon.png',
    icon180: '/assets/images/brand/icon-180.png',
    ogImage: '/assets/images/brand/og.jpg',
  },
  /** Absolute OG image for crawlers */
  ogImage: 'https://marvispace.com/assets/images/brand/og.jpg',
};

/**
 * Social profiles — leave empty until accounts are live.
 * Empty values are omitted from footer / schema.
 */
export const SOCIAL = {
  instagram: '',
  facebook: '',
  tiktok: '',
  x: '',
  pinterest: '',
  youtube: '',
  linkedin: '',
};

export const SOCIAL_SAME_AS = Object.values(SOCIAL).filter(Boolean);

export const DEVELOPER = {
  name: 'Ersan JT',
  handle: 'ersanjt',
  url: 'https://github.com/ersanjt',
  repository: 'https://github.com/ersanjt/marvispace.com',
  tagline: 'Design & development',
};

export const BUILD = {
  version: '1.1.0',
  builtBy: DEVELOPER.name,
};

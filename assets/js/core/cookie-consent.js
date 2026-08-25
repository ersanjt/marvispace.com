/**
 * KVKK cookie consent — analytics loads only after acceptance.
 */
const CONSENT_KEY = 'marvispace_cookie_consent_v1';

function getConsentValue() {
  try {
    return localStorage.getItem(CONSENT_KEY) || '';
  } catch {
    return '';
  }
}

/** True when user already chose accept or essential-only. */
export function hasCookieDecision() {
  const value = getConsentValue();
  return value === 'accepted' || value === 'essential';
}

export function hasCookieConsent() {
  return getConsentValue() === 'accepted';
}

export function acceptCookieConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, 'accepted');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('marvispace:cookie-consent'));
}

function loadAnalytics() {
  if (document.querySelector('script[data-analytics-loader]')) return;
  const script = document.createElement('script');
  script.src = '/assets/js/core/analytics.js';
  script.dataset.analyticsLoader = '1';
  document.head.appendChild(script);
}

function renderBanner() {
  if (document.querySelector('.cookie-consent')) return;

  const banner = document.createElement('aside');
  banner.className = 'cookie-consent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Çerez bildirimi');
  banner.innerHTML = `
    <div class="cookie-consent__inner">
      <p class="cookie-consent__text">
        Bu site, hizmet kalitesi ve trafik analizi için çerezler kullanır.
        Detaylar için <a href="/kvkk">KVKK Aydınlatma Metni</a> ve
        <a href="/privacy#cookies">Çerez Politikası</a>.
      </p>
      <div class="cookie-consent__actions">
        <button type="button" class="cookie-consent__btn cookie-consent__btn--accept" data-cookie-accept>Kabul Et</button>
        <button type="button" class="cookie-consent__btn cookie-consent__btn--reject" data-cookie-reject>Sadece Zorunlu</button>
      </div>
    </div>
  `;
  document.body.append(banner);

  banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => {
    acceptCookieConsent();
    loadAnalytics();
    banner.remove();
  });

  banner.querySelector('[data-cookie-reject]')?.addEventListener('click', () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'essential');
    } catch {
      /* ignore */
    }
    banner.remove();
  });
}

export function initCookieConsent() {
  if (hasCookieConsent()) {
    loadAnalytics();
    return;
  }
  if (hasCookieDecision()) return;
  renderBanner();
}

if (document.currentScript?.type === 'module') {
  initCookieConsent();
}

import { fetchSiteSettings, submitContact } from '../core/api-client.js';
import { initI18n, initLangSwitch, t } from '../core/i18n.js?v=20260901-atelier';
import { mountContactAtelier } from '../core/legal-page.js?v=20260901-atelier';

await initI18n();
initLangSwitch();
mountContactAtelier();

const still = document.querySelector('.contact-still img');
if (still) still.alt = t('contactStillAlt');

const atelier = document.querySelector('.atelier-line');
if (atelier) atelier.setAttribute('aria-label', t('locationsAria'));

const form = document.getElementById('contactForm');
const status = document.getElementById('contactFormStatus');
const submitBtn = document.getElementById('contactSubmitBtn');
const nameInput = document.getElementById('contactName');
const emailInput = document.getElementById('contactEmail');
const messageInput = document.getElementById('contactMessage');
const fields = [nameInput, emailInput, messageInput].filter(Boolean);

function setStatus(text, isError = false) {
  if (!status) return;
  status.hidden = false;
  status.textContent = text;
  status.classList.toggle('is-error', isError);
  status.classList.toggle('is-success', !isError && Boolean(text) && text !== t('contactSending'));
}

function clearFieldErrors() {
  fields.forEach((el) => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  });
}

function markInvalid(el) {
  if (!el) return;
  el.setAttribute('aria-invalid', 'true');
  if (status?.id) el.setAttribute('aria-describedby', status.id);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const message = String(data.get('message') || '').trim();
  const website = String(data.get('website') || '').trim();

  clearFieldErrors();
  form.classList.remove('is-sent');

  if (!name || name.length < 2) {
    setStatus(t('contactRequired'), true);
    markInvalid(nameInput);
    nameInput?.focus();
    return;
  }
  if (!email || !isValidEmail(email)) {
    setStatus(t('contactEmailInvalid'), true);
    markInvalid(emailInput);
    emailInput?.focus();
    return;
  }
  if (!message || message.length < 5) {
    setStatus(t('contactMessageShort'), true);
    markInvalid(messageInput);
    messageInput?.focus();
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
  }
  setStatus(t('contactSending'));

  try {
    await submitContact({ name, email, message, website });
    form.reset();
    form.classList.add('is-sent');
    setStatus(t('contactThanks'));
    status?.focus?.();
    status?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  } catch (err) {
    setStatus(err.message || t('contactError'), true);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.removeAttribute('aria-busy');
    }
  }
});

try {
  const settings = await fetchSiteSettings();
  const wa = settings?.whatsapp;
  const row = document.getElementById('contactWhatsApp');
  const link = document.getElementById('contactWhatsAppLink');
  if (wa?.enabled && wa?.url && row && link) {
    link.href = wa.url;
    link.setAttribute('aria-label', t('whatsappAria'));
    row.hidden = false;
  }
} catch {
  /* ignore */
}

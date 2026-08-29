import { fetchSiteSettings, submitContact } from '../core/api-client.js';
import { initI18n, t } from '../core/i18n.js';
import { mountLegalPage } from '../core/legal-page.js?v=20260829-store';

await initI18n();
mountLegalPage();

const form = document.getElementById('contactForm');
const status = document.getElementById('contactFormStatus');
const submitBtn = document.getElementById('contactSubmitBtn');

function setStatus(text, isError = false) {
  if (!status) return;
  status.hidden = false;
  status.textContent = text;
  status.classList.toggle('is-error', isError);
}

form?.addEventListener('submit', async e => {
  e.preventDefault();
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const message = String(data.get('message') || '').trim();
  const website = String(data.get('website') || '').trim();

  if (!name || !email || !message) {
    setStatus(t('contactRequired'), true);
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  setStatus(t('contactSending'));

  try {
    await submitContact({ name, email, message, website });
    form.reset();
    setStatus(t('contactThanks'));
  } catch (err) {
    setStatus(err.message || t('contactError'), true);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

try {
  const settings = await fetchSiteSettings();
  const wa = settings?.whatsapp;
  const block = document.getElementById('contactWhatsApp');
  const link = document.getElementById('contactWhatsAppLink');
  if (wa?.enabled && wa?.url && block && link) {
    link.href = wa.url;
    block.hidden = false;
  }
} catch {
  /* ignore */
}

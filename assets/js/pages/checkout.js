import { COUNTRIES } from '../data/countries.js';
import {
  clearCart,
  isProductionHost,
  loadCart,
  loadProducts,
  loadSiteSettings,
  placeOrder,
  resetApiHealthCache,
  saveCart,
  setOrderConfirmContext,
  startPaynetPayment,
  startZiraatPayment,
} from '../core/storage.js';
import { buildCartLineItem, renderTotalsBlock, setStoreCurrency, fmtMoney } from '../modules/cart-ui.js?v=20260829-store';
import { initWhatsAppSupport } from '../core/whatsapp-support.js?v=20260901-wa';
import { mountDeveloperCredit } from '../core/credits.js?v=20260901-wa';
import { initI18n, applyDomI18n, t, homePath } from '../core/i18n.js?v=20260901-wa';
import { trackBeginCheckout } from '../core/analytics-events.js?v=20260829-store';

const checkoutPage = document.getElementById('checkoutPage');
const checkoutLoadingMsg = document.getElementById('checkoutLoadingMsg');
const summaryItems = document.getElementById('summaryItems');
const summaryItemsMobile = document.getElementById('summaryItemsMobile');
const summaryTotals = document.getElementById('summaryTotals');
const summaryTotalsMobile = document.getElementById('summaryTotalsMobile');
const summaryMobile = document.getElementById('summaryMobile');
const summaryMobileTotal = document.getElementById('summaryMobileTotal');
const summaryMobileCount = document.getElementById('summaryMobileCount');
const checkoutForm = document.getElementById('checkoutForm');
const paymentPlaceholder = document.getElementById('paymentPlaceholder');
const paymentOptions = document.getElementById('paymentOptions');
const paymentMethodInput = document.getElementById('paymentMethod');
const checkoutActions = document.getElementById('checkoutActions');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const countryEl = document.getElementById('country');
const stateEl = document.getElementById('state');
const stateField = document.getElementById('stateField');
const taxFields = document.getElementById('taxFields');
const checkoutCartCount = document.getElementById('checkoutCartCount');
const phoneCodeEl = document.getElementById('phoneCode');
const phoneCodeLabel = document.getElementById('phoneCodeLabel');
const phoneCodeBtn = document.getElementById('phoneCodeBtn');
const phoneEl = document.getElementById('phone');
const cardForm = document.getElementById('cardForm');
const cardHolder = document.getElementById('cardHolder');
const cardPan = document.getElementById('cardPan');
const cardMonth = document.getElementById('cardMonth');
const cardYear = document.getElementById('cardYear');
const cardCvc = document.getElementById('cardCvc');
const paynet3dsHost = document.getElementById('paynet3dsHost');
const paymentBlock = document.getElementById('paymentBlock');
const cardGatewayLabel = document.getElementById('cardGatewayLabel');
const paymentUnavailable = document.getElementById('paymentUnavailable');

const STATE_REQUIRED_COUNTRIES = new Set(['US', 'CA', 'AU']);

let cartItems = [];
let products = [];
let selectedPayment = '';
let cardGateway = '';
let cardPaymentsEnabled = false;
let paymentAlertEl = null;

function persistCart() {
  void saveCart(cartItems).catch(() => {});
}

function cartQtyTotal() {
  return cartItems.reduce((sum, item) => sum + item.qty, 0);
}

function subtotal() {
  return cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function setCheckoutReady(ready) {
  document.body.classList.toggle('checkout-loading', !ready);
  if (checkoutPage) checkoutPage.hidden = !ready;
  if (checkoutLoadingMsg) checkoutLoadingMsg.hidden = ready;
}

function populateCountries() {
  countryEl.innerHTML = COUNTRIES.map(([code, name]) =>
    `<option value="${code}">${name.toUpperCase()}</option>`,
  ).join('');
  countryEl.value = 'TR';
}

function changeQty(index, delta) {
  const item = cartItems[index];
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cartItems.splice(index, 1);
  if (!cartItems.length) {
    window.location.replace(homePath());
    return;
  }
  persistCart();
  renderSummary();
}

function fillSummaryList(container) {
  container.innerHTML = '';
  cartItems.forEach((item, index) => {
    container.append(buildCartLineItem(item, index, changeQty, { checkout: true }));
  });
}

function renderSummary() {
  const empty = !cartItems.length;
  const totals = { subtotal: subtotal(), taxes: 0 };

  checkoutCartCount.textContent = String(cartQtyTotal());
  summaryTotals.hidden = empty;
  summaryTotalsMobile.hidden = empty;
  if (summaryMobile) summaryMobile.hidden = empty;

  const total = subtotal();
  if (summaryMobileTotal) {
    summaryMobileTotal.textContent = fmtMoney(total);
  }
  if (summaryMobileCount) {
    const n = cartQtyTotal();
    summaryMobileCount.textContent = n === 1 ? t('checkoutItemOne') : t('checkoutItems').replace('{n}', String(n));
  }

  if (empty) {
    summaryItems.innerHTML = '';
    summaryItemsMobile.innerHTML = '';
    return;
  }

  fillSummaryList(summaryItems);
  fillSummaryList(summaryItemsMobile);
  renderTotalsBlock(summaryTotals, totals);
  renderTotalsBlock(summaryTotalsMobile, totals);
}

function showPaymentAlert(message, isError = false) {
  if (!paymentBlock) return;
  if (!paymentAlertEl) {
    paymentAlertEl = document.createElement('p');
    paymentAlertEl.className = 'payment-alert';
    paymentBlock.insertBefore(paymentAlertEl, paymentPlaceholder);
  }
  paymentAlertEl.textContent = message;
  paymentAlertEl.classList.toggle('payment-alert--error', isError);
  paymentAlertEl.hidden = !message;
}

function clearPaymentSelection() {
  selectedPayment = '';
  paymentMethodInput.value = '';
  paymentOptions.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.classList.remove('is-selected');
  });
  if (cardForm) cardForm.hidden = true;
  updatePlaceOrderLabel();
}

function selectPayment(method) {
  selectedPayment = method;
  paymentMethodInput.value = method;
  paymentOptions.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.classList.toggle('is-selected', btn.dataset.payment === method);
  });
  if (cardForm) {
    cardForm.hidden = !(method === 'card' && cardPaymentsEnabled);
  }
  updatePlaceOrderLabel();
}

function updatePlaceOrderLabel() {
  if (!placeOrderBtn) return;
  if (isProductionHost() && !cardPaymentsEnabled) {
    placeOrderBtn.textContent = t('checkoutPayUnavailable');
    return;
  }
  if (!selectedPayment) {
    placeOrderBtn.textContent = t('checkoutCompleteDetails');
  } else if (selectedPayment === 'card' && cardPaymentsEnabled && !cardDetailsValid()) {
    placeOrderBtn.textContent = t('checkoutEnterCard');
  } else {
    placeOrderBtn.textContent = t('checkoutPlace');
  }
}

function cardDetailsValid() {
  if (!cardPaymentsEnabled || selectedPayment !== 'card') return true;
  const holder = cardHolder?.value.trim() || '';
  const pan = (cardPan?.value || '').replace(/\D+/g, '');
  const month = Number(cardMonth?.value || 0);
  const year = Number(cardYear?.value || 0);
  const cvc = cardCvc?.value.trim() || '';
  const yearFull = year < 100 ? 2000 + year : year;
  const now = new Date();
  const notExpired = yearFull > now.getFullYear()
    || (yearFull === now.getFullYear() && month >= now.getMonth() + 1);
  return holder.length > 1
    && pan.length >= 12
    && month >= 1
    && month <= 12
    && notExpired
    && cvc.length >= 3;
}

function phoneValid() {
  const digits = (phoneEl?.value || '').replace(/\D/g, '');
  return digits.length >= 6;
}

function legalConsentValid() {
  return Boolean(
    document.getElementById('acceptOnBilgilendirme')?.checked
    && document.getElementById('acceptMesafeliSatis')?.checked
    && document.getElementById('acceptKvkk')?.checked
  );
}

function formReady() {
  if (!checkoutForm?.checkValidity()) return false;
  if (!legalConsentValid()) return false;
  if (!phoneValid()) return false;
  if (STATE_REQUIRED_COUNTRIES.has(countryEl.value) && !stateEl?.value.trim()) return false;
  return true;
}

function updateStateRequired() {
  const required = STATE_REQUIRED_COUNTRIES.has(countryEl.value);
  if (stateEl) {
    stateEl.required = required;
    stateEl.setAttribute('aria-required', String(required));
  }
  if (stateField) stateField.hidden = !required;
  const stateZipRow = stateField?.closest('.field-row');
  if (stateZipRow) stateZipRow.classList.toggle('field-row--single', !required);
}

function updateTaxNote() {
  if (taxFields) taxFields.hidden = countryEl.value !== 'TR';
}

function updatePaymentState() {
  updateStateRequired();
  updateTaxNote();
  const ready = formReady();
  const cardBtn = paymentOptions?.querySelector('[data-payment="card"]');
  const gatewayOff = isProductionHost() && !cardPaymentsEnabled;

  if (paymentUnavailable) paymentUnavailable.hidden = !gatewayOff;
  if (paymentOptions) paymentOptions.hidden = gatewayOff;
  if (paymentPlaceholder) paymentPlaceholder.hidden = gatewayOff || ready;
  if (cardForm) cardForm.hidden = gatewayOff || !ready || selectedPayment !== 'card' || !cardPaymentsEnabled;

  if (paymentOptions && !gatewayOff) {
    paymentOptions.classList.toggle('payment-methods--locked', !ready);
  }

  if (cardBtn && !gatewayOff) {
    cardBtn.disabled = !ready;
    cardBtn.classList.toggle('is-selected', ready && selectedPayment === 'card');
  }

  if (gatewayOff) {
    clearPaymentSelection();
    if (placeOrderBtn) {
      placeOrderBtn.disabled = true;
      placeOrderBtn.textContent = t('checkoutPayUnavailable');
    }
    return;
  }

  if (!ready) {
    clearPaymentSelection();
  } else if (cardPaymentsEnabled && !selectedPayment) {
    selectPayment('card');
  } else if (!cardPaymentsEnabled && !isProductionHost() && !selectedPayment) {
    selectPayment('manual');
  }

  if (placeOrderBtn) {
    placeOrderBtn.disabled = !ready
      || !selectedPayment
      || (selectedPayment === 'card' && cardPaymentsEnabled && !cardDetailsValid());
  }

  updatePlaceOrderLabel();
}

function syncPhoneCodeLabel() {
  phoneCodeLabel.textContent = phoneCodeEl.value;
  phoneCodeBtn?.setAttribute('aria-expanded', 'false');
}

function openPhoneCodePicker() {
  if (typeof phoneCodeEl.showPicker === 'function') {
    phoneCodeEl.showPicker();
  } else {
    phoneCodeEl.focus();
    phoneCodeEl.click();
  }
  phoneCodeBtn?.setAttribute('aria-expanded', 'true');
}

function formatCardPan(value) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function buildOrderPayload(formData) {
  return {
    items: cartItems.map(item => ({ ...item })),
    total: subtotal(),
    customer: {
      email: formData.get('email'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      address: formData.get('address'),
      address2: formData.get('address2') || '',
      city: formData.get('city'),
      country: formData.get('country'),
      state: formData.get('state') || '',
      zip: formData.get('zip'),
      phone: `${formData.get('phoneCode')}${String(formData.get('phone')).replace(/\D/g, '')}`,
      taxId: formData.get('taxId') || '',
      subscribe: formData.get('subscribe') === 'on',
      payment: formData.get('payment'),
      billingSame: formData.get('billingSame') === 'on',
    },
  };
}

function launchGatewayForm(postUrl, fields) {
  if (!paynet3dsHost) return;
  paynet3dsHost.hidden = false;
  paynet3dsHost.innerHTML = '';

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = postUrl;
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value ?? '');
    form.appendChild(input);
  });
  paynet3dsHost.appendChild(form);
  form.submit();
}

function launchPaynet3ds(htmlContent, postUrl) {
  if (!paynet3dsHost) return;
  paynet3dsHost.hidden = false;
  paynet3dsHost.innerHTML = '';

  if (htmlContent) {
    const parsed = new DOMParser().parseFromString(htmlContent, 'text/html');
    const form = parsed.querySelector('form');
    if (form) {
      const fields = {};
      form.querySelectorAll('input[name]').forEach((input) => {
        fields[input.name] = input.value;
      });
      const action = form.getAttribute('action') || postUrl;
      if (action) {
        launchGatewayForm(action, fields);
        return;
      }
    }
  }

  if (postUrl) {
    window.location.href = postUrl;
  }
}

phoneCodeEl.addEventListener('change', syncPhoneCodeLabel);
phoneCodeBtn.addEventListener('click', openPhoneCodePicker);
phoneCodeEl.addEventListener('blur', () => phoneCodeBtn?.setAttribute('aria-expanded', 'false'));

cardPan?.addEventListener('input', () => {
  const formatted = formatCardPan(cardPan.value);
  if (cardPan.value !== formatted) cardPan.value = formatted;
  updatePaymentState();
});

[cardHolder, cardMonth, cardYear, cardCvc].forEach(el => {
  el?.addEventListener('input', updatePaymentState);
});

phoneEl?.addEventListener('input', updatePaymentState);

paymentOptions.querySelectorAll('.payment-method-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled || btn.hidden || paymentOptions.classList.contains('payment-methods--locked')) return;
    selectPayment(btn.dataset.payment);
    updatePaymentState();
  });
});

document.querySelectorAll('[data-discount-toggle]').forEach(btn => {
  btn.addEventListener('click', () => {
    const form = btn.nextElementSibling;
    if (!form?.hasAttribute('data-discount-form')) return;
    const open = form.hidden;
    form.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  });
});

document.querySelectorAll('[data-discount-form] button').forEach(btn => {
  btn.addEventListener('click', () => {
    showPaymentAlert('Discount codes are not available yet.', false);
  });
});

checkoutForm.addEventListener('input', updatePaymentState);
checkoutForm.addEventListener('change', updatePaymentState);
countryEl.addEventListener('change', updatePaymentState);

checkoutForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!cartItems.length || !selectedPayment || !formReady()) return;

  if (selectedPayment === 'card' && cardPaymentsEnabled && !cardDetailsValid()) {
    showPaymentAlert(t('checkoutCardInvalid'), true);
    return;
  }

  if (selectedPayment === 'card' && isProductionHost() && !cardPaymentsEnabled) {
    showPaymentAlert('Card payments are temporarily unavailable. Please try again later.', true);
    return;
  }

  if (!legalConsentValid()) {
    showPaymentAlert(t('checkoutLegalNeeded'), true);
    return;
  }

  const formData = new FormData(checkoutForm);
  const order = buildOrderPayload(formData);

  placeOrderBtn.disabled = true;
  showPaymentAlert('');

  try {
    if (selectedPayment === 'card' && cardGateway === 'ziraat') {
      showPaymentAlert('Redirecting to Ziraat 3D Secure…');
      const result = await startZiraatPayment({
        order,
        card: {
          holder: cardHolder.value.trim(),
          pan: cardPan.value.replace(/\D+/g, ''),
          month: Number(cardMonth.value),
          year: Number(cardYear.value),
          cvc: cardCvc.value.trim(),
        },
      });
      setOrderConfirmContext(result.orderId, result.email || order.customer.email || '');
      launchGatewayForm(result.postUrl, result.fields);
      return;
    }

    if (selectedPayment === 'card' && cardGateway === 'paynet') {
      showPaymentAlert('Redirecting to 3D Secure verification…');
      const result = await startPaynetPayment({
        order,
        card: {
          holder: cardHolder.value.trim(),
          pan: cardPan.value.replace(/\D+/g, ''),
          month: Number(cardMonth.value),
          year: Number(cardYear.value),
          cvc: cardCvc.value.trim(),
        },
      });
      setOrderConfirmContext(result.orderId, result.email || order.customer.email || '');
      launchPaynet3ds(result.htmlContent, result.postUrl);
      return;
    }

    const created = await placeOrder(order);
    await clearCart();
    cartItems = [];
    setOrderConfirmContext(created.id, order.customer.email || '');
    window.location.href = `/order-confirmation?id=${encodeURIComponent(created.id)}`;
  } catch (err) {
    placeOrderBtn.disabled = false;
    updatePaymentState();
    showPaymentAlert(err.message || 'Could not place order. Please try again.', true);
  }
});

(async () => {
  await initI18n();
  applyDomI18n(document);
  await mountDeveloperCredit();
  initWhatsAppSupport({ message: t('whatsappHello') });
  setCheckoutReady(false);

  const params = new URLSearchParams(window.location.search);
  let pendingAlert = null;
  if (params.get('payment') === 'failed') {
    pendingAlert = {
      message: t('checkoutPaymentFailed'),
      isError: true,
    };
  }

  try {
    cartItems = await loadCart();
  } catch (err) {
    if (checkoutLoadingMsg) {
      checkoutLoadingMsg.textContent = err.message || t('checkoutCartError');
    }
    setTimeout(() => window.location.replace(homePath()), 1800);
    return;
  }

  if (!cartItems.length) {
    window.location.replace(homePath());
    return;
  }

  try {
    try {
      const settings = await loadSiteSettings();
      cardGateway = settings?.cardGateway
        || (settings?.ziraat?.enabled ? 'ziraat' : (settings?.paynet?.enabled ? 'paynet' : ''));
      cardPaymentsEnabled = cardGateway !== '';
      setStoreCurrency(settings?.currency || 'USD');
      if (cardGatewayLabel) {
        cardGatewayLabel.textContent = cardGateway === 'ziraat'
          ? 'Ziraat Bank — 3D Secure'
          : 'iyzico Paynet — 3D Secure';
      }
    } catch {
      cardGateway = '';
      cardPaymentsEnabled = false;
    }

    products = await loadProducts([]);
    populateCountries();
    renderSummary();
    syncPhoneCodeLabel();
    setCheckoutReady(true);
    updatePaymentState();
    trackBeginCheckout(cartItems, subtotal());

    if (pendingAlert) {
      showPaymentAlert(pendingAlert.message, pendingAlert.isError);
    }
  } catch (err) {
    resetApiHealthCache();
    try {
      products = await loadProducts([]);
      populateCountries();
      renderSummary();
      syncPhoneCodeLabel();
      setCheckoutReady(true);
      updatePaymentState();
      trackBeginCheckout(cartItems, subtotal());
      if (pendingAlert) {
        showPaymentAlert(pendingAlert.message, pendingAlert.isError);
      }
      return;
    } catch {
      /* fall through */
    }
    if (checkoutLoadingMsg) {
      checkoutLoadingMsg.textContent = err.message || t('checkoutLoadError');
    }
    setTimeout(() => window.location.replace(homePath()), 2500);
  }
})();

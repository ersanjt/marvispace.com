import { COUNTRIES } from '../data/countries.js';
import {
  clearCart,
  loadCart,
  loadProducts,
  loadSiteSettings,
  placeOrder,
  saveCart,
  setOrderConfirmContext,
  startPaynetPayment,
} from '../core/storage.js';
import { buildCartLineItem, renderTotalsBlock, setStoreCurrency } from '../modules/cart-ui.js';
import { mountDeveloperCredit } from '../core/credits.js';

const summaryItems = document.getElementById('summaryItems');
const summaryItemsMobile = document.getElementById('summaryItemsMobile');
const summaryEmpty = document.getElementById('summaryEmpty');
const summaryEmptyMobile = document.getElementById('summaryEmptyMobile');
const summaryTotals = document.getElementById('summaryTotals');
const summaryTotalsMobile = document.getElementById('summaryTotalsMobile');
const summaryMobile = document.getElementById('summaryMobile');
const checkoutForm = document.getElementById('checkoutForm');
const paymentPlaceholder = document.getElementById('paymentPlaceholder');
const paymentOptions = document.getElementById('paymentOptions');
const paymentMethodInput = document.getElementById('paymentMethod');
const checkoutActions = document.getElementById('checkoutActions');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const countryEl = document.getElementById('country');
const taxNote = document.getElementById('taxNote');
const checkoutCartCount = document.getElementById('checkoutCartCount');
const phoneCodeEl = document.getElementById('phoneCode');
const phoneCodeLabel = document.getElementById('phoneCodeLabel');
const phoneCodeBtn = document.getElementById('phoneCodeBtn');
const cardForm = document.getElementById('cardForm');
const cardHolder = document.getElementById('cardHolder');
const cardPan = document.getElementById('cardPan');
const cardMonth = document.getElementById('cardMonth');
const cardYear = document.getElementById('cardYear');
const cardCvc = document.getElementById('cardCvc');
const paynet3dsHost = document.getElementById('paynet3dsHost');
const paymentBlock = document.getElementById('paymentBlock');

let cartItems = [];
let products = [];
let selectedPayment = '';
let paynetEnabled = false;
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
    window.location.replace('/');
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
  summaryEmpty.hidden = !empty;
  summaryEmptyMobile.hidden = !empty;
  summaryTotals.hidden = empty;
  summaryTotalsMobile.hidden = empty;
  summaryMobile.hidden = empty;

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
    paymentBlock.insertBefore(paymentAlertEl, paymentBlock.firstChild.nextSibling);
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
  checkoutActions.hidden = true;
  if (cardForm) cardForm.hidden = true;
}

function selectPayment(method) {
  selectedPayment = method;
  paymentMethodInput.value = method;
  paymentOptions.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.classList.toggle('is-selected', btn.dataset.payment === method);
  });
  checkoutActions.hidden = false;
  if (cardForm) {
    cardForm.hidden = !(method === 'card' && paynetEnabled);
  }
}

function cardDetailsValid() {
  if (!paynetEnabled || selectedPayment !== 'card') return true;
  const holder = cardHolder?.value.trim() || '';
  const pan = (cardPan?.value || '').replace(/\D+/g, '');
  const month = Number(cardMonth?.value || 0);
  const year = Number(cardYear?.value || 0);
  const cvc = cardCvc?.value.trim() || '';
  return holder.length > 1 && pan.length >= 12 && month >= 1 && month <= 12 && year >= 1 && cvc.length >= 3;
}

function updatePaymentState() {
  const ready = checkoutForm.checkValidity();
  paymentPlaceholder.hidden = ready;
  paymentOptions.classList.toggle('payment-methods--locked', !ready);
  paymentOptions.hidden = false;

  paymentOptions.querySelectorAll('.payment-method-btn').forEach(btn => {
    const isCard = btn.dataset.payment === 'card';
    btn.disabled = !ready || !isCard;
  });

  if (!ready) clearPaymentSelection();
  if (placeOrderBtn) {
    placeOrderBtn.disabled = !ready || !selectedPayment || (selectedPayment === 'card' && paynetEnabled && !cardDetailsValid());
  }
}

function updateTaxNote() {
  taxNote.hidden = countryEl.value !== 'TR';
}

function syncPhoneCodeLabel() {
  phoneCodeLabel.textContent = phoneCodeEl.value;
}

function buildOrderPayload(formData) {
  return {
    id: `ord_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    items: cartItems.map(item => ({ ...item })),
    total: subtotal(),
    customer: {
      email: formData.get('email'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      address: formData.get('address'),
      address2: formData.get('address2'),
      city: formData.get('city'),
      country: formData.get('country'),
      state: formData.get('state'),
      zip: formData.get('zip'),
      phone: `${formData.get('phoneCode')}${formData.get('phone')}`,
      taxId: formData.get('taxId'),
      subscribe: formData.get('subscribe') === 'on',
      payment: formData.get('payment'),
      billingSame: formData.get('billingSame') === 'on',
    },
  };
}

function launchPaynet3ds(htmlContent, postUrl) {
  if (!paynet3dsHost) return;
  paynet3dsHost.hidden = false;
  paynet3dsHost.innerHTML = '';

  if (htmlContent) {
    paynet3dsHost.innerHTML = htmlContent;
    const form = paynet3dsHost.querySelector('form');
    if (form) form.submit();
    return;
  }

  if (postUrl) {
    window.location.href = postUrl;
  }
}

phoneCodeEl.addEventListener('change', syncPhoneCodeLabel);
phoneCodeBtn.addEventListener('click', () => phoneCodeEl.focus());

[cardHolder, cardPan, cardMonth, cardYear, cardCvc].forEach(el => {
  el?.addEventListener('input', updatePaymentState);
});

paymentOptions.querySelectorAll('.payment-method-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled || paymentOptions.classList.contains('payment-methods--locked')) return;
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

checkoutForm.addEventListener('input', updatePaymentState);
checkoutForm.addEventListener('change', updatePaymentState);
countryEl.addEventListener('change', updateTaxNote);

checkoutForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!cartItems.length || !selectedPayment) return;
  if (selectedPayment === 'card' && paynetEnabled && !cardDetailsValid()) {
    showPaymentAlert('Enter valid card details to continue.', true);
    return;
  }

  const formData = new FormData(checkoutForm);
  const order = buildOrderPayload(formData);

  placeOrderBtn.disabled = true;
  showPaymentAlert('');

  try {
    if (selectedPayment === 'card' && paynetEnabled) {
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
    showPaymentAlert(err.message || 'Could not place order. Please try again.', true);
  }
});

(async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'failed') {
    showPaymentAlert('Payment was not completed. Please review your card details and try again.', true);
  }

  try {
    cartItems = await loadCart();
  } catch (err) {
    alert(err.message || 'Could not load cart. Please try again.');
    window.location.replace('/');
    return;
  }
  if (!cartItems.length) {
    window.location.replace('/');
    return;
  }

  try {
    const settings = await loadSiteSettings();
    paynetEnabled = !!settings?.paynet?.enabled;
    setStoreCurrency(settings?.currency || 'TRY');
  } catch {
    paynetEnabled = false;
  }

  products = await loadProducts([]);
  populateCountries();
  renderSummary();
  updatePaymentState();
  updateTaxNote();
  syncPhoneCodeLabel();
})();

mountDeveloperCredit();

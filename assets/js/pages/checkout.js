import { products as seedProducts } from '../data/products.js';
import {
  addOrder,
  clearCart,
  getCart,
  getProducts,
  saveCart,
  saveProducts,
} from '../core/storage.js';
import { buildCartLineItem, renderTotalsBlock } from '../modules/cart-ui.js';
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
const placeOrderBtn = document.getElementById('placeOrderBtn');
const countryEl = document.getElementById('country');
const taxNote = document.getElementById('taxNote');

let cartItems = getCart();
let products = getProducts(seedProducts);

if (!cartItems.length) {
  window.location.replace('/');
}

function subtotal() {
  return cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
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
  saveCart(cartItems);
  renderSummary();
}

function fillSummaryList(container) {
  container.innerHTML = '';
  cartItems.forEach((item, index) => {
    container.append(buildCartLineItem(item, index, changeQty));
  });
}

function renderSummary() {
  const empty = !cartItems.length;
  const totals = { subtotal: subtotal(), taxes: 0 };

  summaryEmpty.hidden = !empty;
  summaryEmptyMobile.hidden = !empty;
  summaryTotals.hidden = empty;
  summaryTotalsMobile.hidden = empty;
  summaryMobile.hidden = empty;
  placeOrderBtn.disabled = empty;

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

function updatePaymentState() {
  const ready = checkoutForm.checkValidity();
  paymentPlaceholder.hidden = ready;
  paymentOptions.hidden = !ready;
}

function updateTaxNote() {
  taxNote.hidden = countryEl.value !== 'TR';
}

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
countryEl.addEventListener('change', updateTaxNote);

checkoutForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!cartItems.length) return;

  const formData = new FormData(checkoutForm);
  const order = {
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

  cartItems.forEach(ci => {
    const product = products.find(p => p.id === ci.id);
    if (!product) return;
    product.stock = Math.max(0, (product.stock || 0) - ci.qty);
    if (product.stock <= 0) product.inStock = false;
  });

  saveProducts(products);
  addOrder(order);
  clearCart();
  cartItems = [];
  window.location.href = '/?ordered=1';
});

renderSummary();
updatePaymentState();
updateTaxNote();
mountDeveloperCredit();

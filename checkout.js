import { products as seedProducts } from './products.js';
import {
  addOrder,
  clearCart,
  getCart,
  getProducts,
  saveCart,
  saveProducts,
} from './storage.js';

const CDN = 'https://yeezy.com/cdn-cgi/image';
const CDN_PARAMS = 'quality=100,compression=fast,slow-connection-quality=80,fit=pad,gravity=center,background=transparent';

const summaryItems = document.getElementById('summaryItems');
const summaryEmpty = document.getElementById('summaryEmpty');
const summaryTotals = document.getElementById('summaryTotals');
const summarySubtotal = document.getElementById('summarySubtotal');
const summaryTaxes = document.getElementById('summaryTaxes');
const summaryTotal = document.getElementById('summaryTotal');
const checkoutForm = document.getElementById('checkoutForm');
const paymentPlaceholder = document.getElementById('paymentPlaceholder');
const paymentOptions = document.getElementById('paymentOptions');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const countryEl = document.getElementById('country');
const taxNote = document.getElementById('taxNote');

let cartItems = getCart();
let products = getProducts(seedProducts);

if (!cartItems.length) {
  window.location.replace('index.html');
}

function cdnUrl(src, w = 128) {
  return `${CDN}/width=${w},height=${w},${CDN_PARAMS}/${src}`;
}

function fmtMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

function subtotal() {
  return cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function changeQty(index, delta) {
  const item = cartItems[index];
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cartItems.splice(index, 1);
  saveCart(cartItems);
  renderSummary();
}

function renderSummary() {
  summaryItems.innerHTML = '';

  if (!cartItems.length) {
    summaryEmpty.hidden = false;
    summaryTotals.hidden = true;
    placeOrderBtn.disabled = true;
    return;
  }

  summaryEmpty.hidden = true;
  summaryTotals.hidden = false;
  placeOrderBtn.disabled = false;

  cartItems.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'summary-item';

    const img = document.createElement('img');
    img.src = cdnUrl(item.image, 128);
    img.alt = item.label;

    const main = document.createElement('div');
    main.className = 'summary-item-main';

    const top = document.createElement('div');
    top.className = 'summary-item-top';
    top.innerHTML = `
      <span>${item.label}</span>
      <span>${fmtMoney(item.price * item.qty)}</span>
    `;

    const meta = document.createElement('div');
    meta.className = 'summary-item-meta';
    meta.innerHTML = `<span>SIZE: ${item.size}</span>`;

    const qtyRow = document.createElement('div');
    qtyRow.className = 'summary-qty';

    const qtyLabel = document.createElement('span');
    qtyLabel.textContent = 'QTY:';

    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.addEventListener('click', () => changeQty(index, -1));

    const qtyVal = document.createElement('span');
    qtyVal.textContent = String(item.qty);

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.addEventListener('click', () => changeQty(index, 1));

    qtyRow.append(qtyLabel, minus, qtyVal, plus);
    meta.append(qtyRow);
    main.append(top, meta);
    row.append(img, main);
    summaryItems.append(row);
  });

  const total = subtotal();
  summarySubtotal.textContent = fmtMoney(total);
  summaryTaxes.textContent = fmtMoney(0);
  summaryTotal.textContent = fmtMoney(total);
}

function updatePaymentState() {
  const ready = checkoutForm.checkValidity();
  paymentPlaceholder.hidden = ready;
  paymentOptions.hidden = !ready;
}

function updateTaxNote() {
  taxNote.hidden = countryEl.value !== 'TR';
}

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
  window.location.href = 'index.html?ordered=1';
});

renderSummary();
updatePaymentState();
updateTaxNote();

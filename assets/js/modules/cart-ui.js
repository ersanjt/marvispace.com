/**
 * @file cart-ui.js
 * @project MARVISPACE
 * @author Ersan JT <https://github.com/ersanjt>
 */
import { cartImageUrl, bindImageReveal, CART_SIZES, CART_WIDTHS, buildSrcset } from '../core/image-url.js?v=20260901-img';
import { t } from '../core/i18n.js';

export { cartImageUrl } from '../core/image-url.js?v=20260901-img';

let storeCurrency = 'USD';

export function setStoreCurrency(code) {
  if (code) storeCurrency = String(code).toUpperCase();
}

export function getStoreCurrency() {
  return storeCurrency;
}

export function fmtMoney(value) {
  const n = Number(value).toFixed(2);
  if (storeCurrency === 'TRY') return `₺${n}`;
  if (storeCurrency === 'EUR') return `€${n}`;
  if (storeCurrency === 'GBP') return `£${n}`;
  return `$${n}`;
}

function qtyBtn(symbol, label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cart-qty-btn';
  btn.innerHTML = symbol === '+'
    ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M14 7H9V2H7v5H2v2h5v5h2V9h5z"/></svg>'
    : '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 7h12v2H2z"/></svg>';
  btn.setAttribute('aria-label', label);
  return btn;
}

function lineRow(label, valueEl) {
  const row = document.createElement('div');
  row.className = 'cart-line-row';
  const lbl = document.createElement('span');
  lbl.className = 'cart-line-label';
  lbl.textContent = label;
  row.append(lbl, valueEl);
  return row;
}

/**
 * Yeezy-style cart line item:
 * [thumb] | name — price / SIZE — value / QTY — + n −
 */
export function buildCartLineItem(item, index, onChangeQty, { checkout = false } = {}) {
  const line = document.createElement('article');
  line.className = 'cart-line';

  const inner = document.createElement('div');
  inner.className = 'cart-line-inner';

  const thumb = document.createElement('div');
  thumb.className = 'cart-line-thumb';
  const img = document.createElement('img');
  img.src = cartImageUrl(item.image, 200);
  img.srcset = buildSrcset(item.image, CART_WIDTHS, 'webp');
  img.sizes = CART_SIZES;
  img.alt = item.label;
  img.loading = 'lazy';
  img.decoding = 'async';
  bindImageReveal(img, item.image);
  thumb.append(img);

  const body = document.createElement('div');
  body.className = 'cart-line-body';

  const nameRow = document.createElement('div');
  nameRow.className = 'cart-line-row cart-line-row--name';
  const name = document.createElement('span');
  name.className = 'cart-line-name';
  name.textContent = item.label;
  const price = document.createElement('span');
  price.className = 'cart-line-price';
  price.textContent = fmtMoney(checkout ? item.price * item.qty : item.price);
  nameRow.append(name, price);

  const sizeVal = document.createElement('span');
  sizeVal.className = 'cart-line-value';
  sizeVal.textContent = item.size ? String(item.size).toUpperCase() : '—';

  const qtyControls = document.createElement('div');
  qtyControls.className = 'cart-qty-controls';

  const plus = qtyBtn('+', `${t('qty')} + ${item.label}`);
  plus.addEventListener('click', () => onChangeQty(index, 1));

  const qtyVal = document.createElement('span');
  qtyVal.className = 'cart-qty-val';
  qtyVal.textContent = String(item.qty);

  const minus = qtyBtn('−', `${t('qty')} − ${item.label}`);
  minus.addEventListener('click', () => onChangeQty(index, -1));

  qtyControls.append(plus, qtyVal, minus);

  body.append(
    nameRow,
    lineRow(t('size'), sizeVal),
    lineRow(t('qty'), qtyControls),
  );

  inner.append(thumb, body);
  line.append(inner);
  return line;
}

export function renderTotalsBlock(container, { subtotal, taxes = 0, shippingLabel = t('shippingPromise') }) {
  const total = subtotal + taxes;
  const taxDisplay = taxes > 0 ? fmtMoney(taxes) : t('vatIncluded');
  container.innerHTML = `
    <div class="cart-totals-block">
      <div class="cart-totals-row"><span>${t('shipping')}</span><span class="cart-totals-muted">${shippingLabel}</span></div>
      <div class="cart-totals-row"><span>${t('subtotal')}</span><span>${fmtMoney(subtotal)}</span></div>
      <div class="cart-totals-row"><span>${t('taxes')}</span><span class="cart-totals-muted">${taxDisplay}</span></div>
    </div>
    <div class="cart-totals-grand"><span>${t('total')}</span><span>${fmtMoney(total)}</span></div>
  `;
}

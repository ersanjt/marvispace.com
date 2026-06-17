/**
 * @file cart-ui.js
 * @project MARVISPACE
 * @author Ersan JT <https://github.com/ersanjt>
 */
const CDN = 'https://yeezy.com/cdn-cgi/image';
const CDN_PARAMS = 'quality=100,compression=fast,slow-connection-quality=80,fit=pad,gravity=center,background=transparent';

export function isLocalImage(src) {
  return src?.startsWith('/') || src?.startsWith('http://') || src?.startsWith('https://');
}

export function cartImageUrl(src, w = 200) {
  if (isLocalImage(src)) return src;
  return `${CDN}/width=${w},height=${w},${CDN_PARAMS}/${src}`;
}

export function fmtMoney(value) {
  return `$${Number(value).toFixed(2)}`;
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
 * [thumb 6rem] | name — price / size — value / qty — controls
 */
export function buildCartLineItem(item, index, onChangeQty) {
  const line = document.createElement('article');
  line.className = 'cart-line';

  const inner = document.createElement('div');
  inner.className = 'cart-line-inner';

  const thumb = document.createElement('div');
  thumb.className = 'cart-line-thumb';
  const img = document.createElement('img');
  img.src = cartImageUrl(item.image, 200);
  img.alt = item.label;
  img.loading = 'lazy';
  img.decoding = 'async';
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
  price.textContent = fmtMoney(item.price);
  nameRow.append(name, price);

  const sizeVal = document.createElement('span');
  sizeVal.className = 'cart-line-value';
  sizeVal.textContent = item.size;

  const qtyControls = document.createElement('div');
  qtyControls.className = 'cart-qty-controls';

  const plus = qtyBtn('+', `Increase quantity of ${item.label}`);
  plus.addEventListener('click', () => onChangeQty(index, 1));

  const qtyVal = document.createElement('span');
  qtyVal.className = 'cart-qty-val';
  qtyVal.textContent = String(item.qty);

  const minus = qtyBtn('−', `Decrease quantity of ${item.label}`);
  minus.addEventListener('click', () => onChangeQty(index, -1));

  qtyControls.append(plus, qtyVal, minus);

  body.append(
    nameRow,
    lineRow('Size', sizeVal),
    lineRow('Qty', qtyControls),
  );

  inner.append(thumb, body);
  line.append(inner);
  return line;
}

export function renderTotalsBlock(container, { subtotal, taxes = 0, shippingLabel = 'CALCULATED AT NEXT STEP' }) {
  const total = subtotal + taxes;
  container.innerHTML = `
    <div class="cart-totals-block">
      <div class="cart-totals-row"><span>Subtotal</span><span>${fmtMoney(subtotal)}</span></div>
      <div class="cart-totals-row"><span>Shipping</span><span class="cart-totals-muted">${shippingLabel}</span></div>
      <div class="cart-totals-row"><span>Taxes</span><span>${fmtMoney(taxes)}</span></div>
    </div>
    <div class="cart-totals-grand"><span>Total</span><span>${fmtMoney(total)}</span></div>
  `;
}

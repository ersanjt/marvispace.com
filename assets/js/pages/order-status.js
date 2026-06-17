import { getOrderById } from '../core/storage.js';
import { buildCartLineItem, renderTotalsBlock } from '../modules/cart-ui.js';
import { mountDeveloperCredit } from '../core/credits.js';

const form = document.getElementById('orderLookupForm');
const orderIdInput = document.getElementById('orderIdInput');
const emailInput = document.getElementById('orderEmailInput');
const errorEl = document.getElementById('orderLookupError');
const resultEl = document.getElementById('orderLookupResult');
const statusEl = document.getElementById('orderStatusLabel');
const itemsEl = document.getElementById('orderStatusItems');
const totalsEl = document.getElementById('orderStatusTotals');

function statusLabel(status) {
  if (status === 'shipped') return 'Shipped';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'processing') return 'Processing';
  return 'Pending';
}

form?.addEventListener('submit', e => {
  e.preventDefault();
  const id = orderIdInput?.value.trim();
  const email = emailInput?.value.trim().toLowerCase();
  const order = getOrderById(id);

  if (!order) {
    errorEl.hidden = false;
    errorEl.textContent = 'Order not found on this device. Contact support with your order ID.';
    resultEl.hidden = true;
    return;
  }

  const orderEmail = String(order.customer?.email || '').toLowerCase();
  if (email && orderEmail && email !== orderEmail) {
    errorEl.hidden = false;
    errorEl.textContent = 'Email does not match this order.';
    resultEl.hidden = true;
    return;
  }

  errorEl.hidden = true;
  resultEl.hidden = false;
  statusEl.textContent = statusLabel(order.status);

  itemsEl.innerHTML = '';
  (order.items || []).forEach((item, index) => {
    itemsEl.append(buildCartLineItem(item, index, () => {}));
    itemsEl.lastElementChild?.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.35';
    });
  });

  renderTotalsBlock(totalsEl, { subtotal: order.total || 0, taxes: 0 });
});

const presetId = new URLSearchParams(window.location.search).get('id');
if (presetId && orderIdInput) orderIdInput.value = presetId;

mountDeveloperCredit();

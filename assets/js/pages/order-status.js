import { lookupOrder } from '../core/storage.js';
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
  if (status === 'completed') return 'Completed';
  return 'Pending';
}

function showOrder(order) {
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
}

form?.addEventListener('submit', async e => {
  e.preventDefault();
  const id = orderIdInput?.value.trim();
  const email = emailInput?.value.trim().toLowerCase();

  try {
    const order = await lookupOrder(id, email);
    if (!order) {
      errorEl.hidden = false;
      errorEl.textContent = 'Order not found. Check your order ID and email.';
      resultEl.hidden = true;
      return;
    }
    showOrder(order);
  } catch (err) {
    errorEl.hidden = false;
    errorEl.textContent = err.message || 'Could not look up order.';
    resultEl.hidden = true;
  }
});

const presetId = new URLSearchParams(window.location.search).get('id');
if (presetId && orderIdInput) orderIdInput.value = presetId;

mountDeveloperCredit();

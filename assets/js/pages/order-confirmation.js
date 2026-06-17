import { getLastOrder, lookupOrder } from '../core/storage.js';
import { buildCartLineItem, renderTotalsBlock } from '../modules/cart-ui.js';
import { mountDeveloperCredit } from '../core/credits.js';
import { SITE } from '../config/site.js';

const params = new URLSearchParams(window.location.search);
const orderId = params.get('id');

const emptyEl = document.getElementById('confirmEmpty');
const contentEl = document.getElementById('confirmContent');
const orderIdEl = document.getElementById('confirmOrderId');
const orderEmailEl = document.getElementById('confirmEmail');
const itemsEl = document.getElementById('confirmItems');
const totalsEl = document.getElementById('confirmTotals');

function renderOrder(order) {
  if (!order) {
    emptyEl.hidden = false;
    contentEl.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  contentEl.hidden = false;
  orderIdEl.textContent = order.id;
  orderEmailEl.textContent = order.customer?.email || '—';

  itemsEl.innerHTML = '';
  (order.items || []).forEach((item, index) => {
    itemsEl.append(buildCartLineItem(item, index, () => {}));
    itemsEl.lastElementChild?.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.35';
    });
  });

  renderTotalsBlock(totalsEl, {
    subtotal: order.total || 0,
    taxes: 0,
  });

  document.getElementById('supportLink')?.setAttribute(
    'href',
    `mailto:${SITE.supportEmail}?subject=${encodeURIComponent(`Order ${order.id}`)}`,
  );
}

(async () => {
  let order = getLastOrder();
  if (orderId) {
    try {
      order = await lookupOrder(orderId, order?.customer?.email || '') || order;
    } catch {
      order = order || null;
    }
  }
  renderOrder(order);
})();

mountDeveloperCredit();

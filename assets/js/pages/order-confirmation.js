import { consumeOrderConfirmContext, lookupOrder } from '../core/storage.js';
import { buildCartLineItem, renderTotalsBlock } from '../modules/cart-ui.js?v=20260829-store';
import { mountDeveloperCredit } from '../core/credits.js?v=20260901-workshop';
import { SITE } from '../config/site.js';
import { trackPurchase } from '../core/analytics-events.js?v=20260829-store';

const params = new URLSearchParams(window.location.search);
const orderId = params.get('id');
const confirmToken = params.get('t') || '';

const emptyEl = document.getElementById('confirmEmpty');
const contentEl = document.getElementById('confirmContent');
const orderIdEl = document.getElementById('confirmOrderId');
const orderEmailEl = document.getElementById('confirmEmail');
const itemsEl = document.getElementById('confirmItems');
const totalsEl = document.getElementById('confirmTotals');

function renderOrder(order, { missingEmail = false } = {}) {
  if (!order) {
    emptyEl.hidden = false;
    contentEl.hidden = true;
    const msg = emptyEl.querySelector('p');
    if (msg) {
      msg.textContent = missingEmail
        ? 'We need your order email to show details here. Use order lookup or check your inbox for the confirmation email.'
        : 'We could not find a recent order on this device. Check your email or contact support.';
    }
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
  trackPurchase(order);

  document.getElementById('supportLink')?.setAttribute(
    'href',
    `mailto:${SITE.supportEmail}?subject=${encodeURIComponent(`Order ${order.id}`)}`,
  );
}

(async () => {
  const email = orderId ? consumeOrderConfirmContext(orderId) : '';
  let order = null;
  if (orderId) {
    if (!email && !confirmToken) {
      renderOrder(null, { missingEmail: true });
      mountDeveloperCredit();
      return;
    }
    try {
      order = await lookupOrder(orderId, email, confirmToken);
    } catch {
      order = null;
    }
  }
  renderOrder(order);
})();

mountDeveloperCredit();

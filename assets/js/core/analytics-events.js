/**
 * GA4 ecommerce events. No-ops until analytics.js loads (cookie accept).
 */
import { getStoreCurrency } from '../modules/cart-ui.js?v=20260829-store';

function currency() {
  return getStoreCurrency() || 'USD';
}

export function gaItemFromProduct(item, { quantity = 1, variant = '' } = {}) {
  return {
    item_id: String(item?.id || ''),
    item_name: item?.label || '',
    item_category: item?.category || '',
    item_variant: String(variant || item?.size || ''),
    price: Number(item?.price) || 0,
    quantity: Number(quantity) || 1,
  };
}

export function gaItemFromCartLine(item) {
  return gaItemFromProduct(item, { quantity: item?.qty, variant: item?.size });
}

export function trackEvent(name, params = {}) {
  try {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
      return;
    }
    window.dataLayer.push({ event: name, ...params });
  } catch {
    /* ignore */
  }
}

export function trackViewItem(item) {
  if (!item) return;
  const gaItem = gaItemFromProduct(item);
  trackEvent('view_item', {
    currency: currency(),
    value: gaItem.price,
    items: [gaItem],
  });
}

export function trackAddToCart(item, { quantity = 1, variant = '' } = {}) {
  if (!item) return;
  const gaItem = gaItemFromProduct(item, { quantity, variant });
  trackEvent('add_to_cart', {
    currency: currency(),
    value: gaItem.price * gaItem.quantity,
    items: [gaItem],
  });
}

export function trackBeginCheckout(items, value) {
  const lines = (items || []).map(gaItemFromCartLine);
  trackEvent('begin_checkout', {
    currency: currency(),
    value: Number(value) || 0,
    items: lines,
  });
}

export function trackPurchase(order) {
  if (!order?.id) return;
  const key = `marvispace_ga4_purchase_${order.id}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    /* still send */
  }
  const items = (order.items || []).map(gaItemFromCartLine);
  const value = Number(order.total) || items.reduce((sum, line) => sum + line.price * line.quantity, 0);
  trackEvent('purchase', {
    transaction_id: String(order.id),
    currency: currency(),
    value,
    items,
  });
}

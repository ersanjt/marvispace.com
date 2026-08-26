/**
 * @file storage.js — persistence via server API (MySQL). localStorage only for offline local dev.
 * @project MARVISPACE
 * @author Ersan JT <https://github.com/ersanjt>
 */
import * as api from './api-client.js';

const PRODUCTS_KEY = 'marvispace_products_v3';
const ORDERS_KEY = 'marvispace_orders';
const CART_KEY = 'marvispace_cart';
const AUTH_KEY = 'marvispace_admin_auth';
const ADMIN_PWD_OVERRIDE_KEY = 'marvispace_admin_pwd_hash';
const ORDER_CONFIRM_KEY = 'marvispace_order_confirm';

const LEGACY_KEYS = {
  orders: ['marvispace_orders_v1'],
  products: ['marvispace_products_v2'],
};

export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

let migrated = false;

export function isProductionHost() {
  return /marvispace\.com$/i.test(window.location.hostname);
}

function migrateLegacyStorage() {
  if (migrated) return;
  migrated = true;

  try {
    if (!localStorage.getItem(ORDERS_KEY)) {
      for (const key of LEGACY_KEYS.orders) {
        const raw = localStorage.getItem(key);
        if (raw) {
          localStorage.setItem(ORDERS_KEY, raw);
          break;
        }
      }
    }

    if (!localStorage.getItem(PRODUCTS_KEY)) {
      for (const key of LEGACY_KEYS.products) {
        const raw = localStorage.getItem(key);
        if (raw) {
          localStorage.setItem(PRODUCTS_KEY, raw);
          break;
        }
      }
    }
  } catch {
    /* ignore */
  }
}

export function normalizeProduct(product) {
  return {
    id: product.id,
    label: product.label || '',
    image: product.image || '',
    images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
    galleryCount: product.galleryCount || 0,
    price: Number(product.price) || 0,
    discountPercent: Math.max(0, Math.min(90, Math.round(Number(product.discountPercent) || 0))),
    category: product.category || 'jackets',
    gender: product.gender || 'mens',
    inStock: product.inStock !== false,
    stock: Number(product.stock) || 0,
    sizes: Array.isArray(product.sizes) && product.sizes.length
      ? product.sizes.map(String)
      : [...DEFAULT_SIZES],
  };
}

export function discountPercent(product) {
  const n = Math.round(Number(product?.discountPercent) || 0);
  return Math.max(0, Math.min(90, n));
}

export function salePrice(product) {
  const price = Number(product?.price) || 0;
  const pct = discountPercent(product);
  if (pct <= 0) return Math.round(price * 100) / 100;
  return Math.round(price * (1 - pct / 100) * 100) / 100;
}

function getProductsLocal(seed = []) {
  migrateLegacyStorage();
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeProduct);
    }
  } catch {
    /* ignore */
  }
  const normalized = seed.map(normalizeProduct);
  saveProductsLocal(normalized);
  return normalized;
}

function saveProductsLocal(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products.map(normalizeProduct)));
}

function getOrdersLocal() {
  migrateLegacyStorage();
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveOrdersLocal(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getOrderByIdLocal(orderId) {
  if (!orderId) return null;
  return getOrdersLocal().find(o => o.id === orderId) || null;
}

function addOrderLocal(order) {
  const orders = getOrdersLocal();
  orders.unshift(order);
  saveOrdersLocal(orders);
  return order;
}

function updateOrderStatusLocal(orderId, status) {
  const orders = getOrdersLocal();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;
  order.status = status;
  saveOrdersLocal(orders);
  return order;
}

function getCartLocal() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveCartLocal(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function clearCartLocal() {
  localStorage.removeItem(CART_KEY);
}

export function createId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isAdminAuthed() {
  try {
    return sessionStorage.getItem(AUTH_KEY) === '1';
  } catch {
    /* ignore */
  }
  return false;
}

export function setAdminAuthed(value) {
  try {
    if (value) sessionStorage.setItem(AUTH_KEY, '1');
    else sessionStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
}

export function getAdminPasswordHashOverride() {
  try {
    return localStorage.getItem(ADMIN_PWD_OVERRIDE_KEY) || '';
  } catch {
    return '';
  }
}

export function setAdminPasswordHashOverride(hash) {
  try {
    localStorage.setItem(ADMIN_PWD_OVERRIDE_KEY, hash);
  } catch {
    /* ignore */
  }
}

export function clearAdminPasswordHashOverride() {
  try {
    localStorage.removeItem(ADMIN_PWD_OVERRIDE_KEY);
  } catch {
    /* ignore */
  }
}

/* ── Server API (MySQL on cPanel) ── */

const API_FALSE_CACHE_MS = 15000;
const HEALTH_RETRIES = 3;

let apiEnabled = null;
let apiCheckedAt = 0;
let apiProbePromise = null;

export function resetApiHealthCache() {
  apiEnabled = null;
  apiCheckedAt = 0;
  apiProbePromise = null;
}

async function probeApiHealth() {
  for (let attempt = 0; attempt < HEALTH_RETRIES; attempt++) {
    try {
      const health = await api.healthCheck();
      if (health?.database) return true;
    } catch {
      /* retry on transient network / cold-start failures */
    }
    if (attempt < HEALTH_RETRIES - 1) {
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }
  return false;
}

export async function isApiEnabled() {
  const now = Date.now();
  if (apiEnabled === true) return true;
  if (apiEnabled === false && now - apiCheckedAt < API_FALSE_CACHE_MS) return false;

  if (!apiProbePromise) {
    apiProbePromise = probeApiHealth().finally(() => {
      apiProbePromise = null;
    });
  }

  const enabled = await apiProbePromise;
  apiEnabled = enabled;
  apiCheckedAt = Date.now();
  return enabled;
}

async function requireDatabase() {
  if (await isApiEnabled()) return true;
  if (isProductionHost()) {
    throw new Error('Store database is unavailable. Please try again in a moment.');
  }
  return false;
}

export async function loadProducts(seed = []) {
  if (await isApiEnabled()) {
    const list = await api.fetchProducts();
    return list.map(normalizeProduct);
  }
  if (isProductionHost()) {
    throw new Error('Store database is unavailable. Please try again in a moment.');
  }
  // Local/static preview: prefer seed catalog when localStorage is empty/stale
  if (Array.isArray(seed) && seed.length) {
    try {
      const raw = localStorage.getItem(PRODUCTS_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(existing) || existing.length < seed.length) {
        const normalized = seed.map(normalizeProduct);
        saveProductsLocal(normalized);
        return normalized;
      }
    } catch {
      /* fall through to getProductsLocal */
    }
  }
  return getProductsLocal(seed);
}

export async function saveProduct(product) {
  const normalized = normalizeProduct(product);
  if (await requireDatabase()) {
    return api.adminUpsertProduct(normalized);
  }
  const products = getProductsLocal();
  const idx = products.findIndex(p => p.id === normalized.id);
  if (idx >= 0) products[idx] = normalized;
  else products.unshift(normalized);
  saveProductsLocal(products);
  return normalized;
}

export async function removeProduct(id) {
  if (await requireDatabase()) {
    await api.adminDeleteProduct(id);
    return;
  }
  saveProductsLocal(getProductsLocal().filter(p => p.id !== id));
}

function applyPricePatch(price, patch) {
  const value = Number(patch.value) || 0;
  let next = Number(price) || 0;
  switch (patch.mode) {
    case 'percent_increase':
      next = next * (1 + value / 100);
      break;
    case 'percent_decrease':
      next = next * (1 - value / 100);
      break;
    case 'amount_increase':
      next = next + value;
      break;
    case 'amount_decrease':
      next = next - value;
      break;
    case 'set':
      next = value;
      break;
    default:
      return price;
  }
  return Math.max(0, Math.round(next * 100) / 100);
}

function applyStockPatch(stock, patch) {
  const value = Number(patch.value) || 0;
  let next = Number(stock) || 0;
  switch (patch.mode) {
    case 'add':
      next = next + value;
      break;
    case 'subtract':
      next = next - value;
      break;
    case 'set':
      next = value;
      break;
    default:
      return stock;
  }
  return Math.max(0, Math.round(next));
}

export async function bulkUpdateProducts({ ids, price, stock, category, gender, inStock, discountPercent }) {
  if (await requireDatabase()) {
    return api.adminBulkUpdateProducts({ ids, price, stock, category, gender, inStock, discountPercent });
  }

  const idSet = new Set(ids);
  const products = getProductsLocal().map((product) => {
    if (!idSet.has(product.id)) return product;
    const next = { ...product };
    if (price) next.price = applyPricePatch(next.price, price);
    if (stock) next.stock = applyStockPatch(next.stock, stock);
    if (category !== undefined) next.category = category;
    if (gender !== undefined) next.gender = gender;
    if (inStock !== undefined) next.inStock = Boolean(inStock);
    if (discountPercent !== undefined) next.discountPercent = discountPercent;
    return normalizeProduct(next);
  });
  saveProductsLocal(products);
  return { updated: ids.length, ids };
}

export async function loadOrders() {
  if (await requireDatabase()) {
    return api.adminFetchOrders();
  }
  return getOrdersLocal();
}

export async function lookupOrder(orderId, email = '') {
  if (await requireDatabase()) {
    return api.fetchOrder(orderId, email);
  }
  return getOrderByIdLocal(orderId);
}

/** Store order email in session (avoids putting PII in the URL). */
export function setOrderConfirmContext(orderId, email) {
  try {
    sessionStorage.setItem(ORDER_CONFIRM_KEY, JSON.stringify({ orderId, email }));
  } catch {
    /* ignore */
  }
}

/** Read and clear stored confirmation context when order id matches. */
export function consumeOrderConfirmContext(orderId) {
  try {
    const raw = sessionStorage.getItem(ORDER_CONFIRM_KEY);
    if (!raw) return '';
    const ctx = JSON.parse(raw);
    if (ctx?.orderId === orderId) {
      sessionStorage.removeItem(ORDER_CONFIRM_KEY);
      return String(ctx.email || '');
    }
  } catch {
    /* ignore */
  }
  return '';
}

export async function placeOrder(order) {
  if (await requireDatabase()) {
    return api.createOrder(order);
  }
  return addOrderLocal(order);
}

export async function loadSiteSettings() {
  if (await isApiEnabled()) {
    return api.fetchSiteSettings();
  }
  return { currency: 'USD', cardGateway: '', ziraat: { enabled: false }, paynet: { enabled: false } };
}

export async function startPaynetPayment({ order, card }) {
  if (!(await requireDatabase())) {
    throw new Error('Paynet payments require the server database.');
  }
  return api.initializePaynetPayment({ order, card });
}

export async function startZiraatPayment({ order, card }) {
  if (!(await requireDatabase())) {
    throw new Error('Ziraat payments require the server database.');
  }
  return api.initializeZiraatPayment({ order, card });
}

export async function setOrderStatus(orderId, status) {
  if (await requireDatabase()) {
    return api.adminUpdateOrderStatus(orderId, status);
  }
  return updateOrderStatusLocal(orderId, status);
}

export async function loadCart() {
  if (await isApiEnabled()) {
    return await api.fetchCart();
  }
  if (isProductionHost()) {
    throw new Error('Store database is unavailable. Please try again in a moment.');
  }
  return getCartLocal();
}

export async function saveCart(items) {
  if (await isApiEnabled()) {
    await api.saveCart(items);
    return;
  }
  if (!isProductionHost()) {
    saveCartLocal(items);
  }
}

export async function clearCart() {
  if (await isApiEnabled()) {
    await api.clearCart();
    return;
  }
  clearCartLocal();
}

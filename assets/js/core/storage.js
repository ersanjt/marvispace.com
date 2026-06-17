/**
 * @file storage.js — persistence layer (server API + local cart fallback)
 * @project MARVISPACE
 * @author Ersan JT <https://github.com/ersanjt>
 */
import * as api from './api-client.js';
const PRODUCTS_KEY = 'marvispace_products_v3';
const ORDERS_KEY = 'marvispace_orders';
const CART_KEY = 'marvispace_cart';
const AUTH_KEY = 'marvispace_admin_auth';
const ADMIN_PWD_OVERRIDE_KEY = 'marvispace_admin_pwd_hash';
const LAST_ORDER_KEY = 'marvispace_last_order';

const LEGACY_KEYS = {
  orders: ['yzy_orders', 'marvispace_orders_v1'],
  products: ['yzy_products', 'marvispace_products_v2'],
};

export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

let migrated = false;

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
    category: product.category || 'jackets',
    gender: product.gender || 'mens',
    inStock: product.inStock !== false,
    stock: Number(product.stock) || 0,
    sizes: Array.isArray(product.sizes) && product.sizes.length
      ? product.sizes.map(String)
      : [...DEFAULT_SIZES],
  };
}

export function getProducts(seed = []) {
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
  saveProducts(normalized);
  return normalized;
}

export function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products.map(normalizeProduct)));
}

export function resetProducts(seed = []) {
  const normalized = seed.map(normalizeProduct);
  saveProducts(normalized);
  return normalized;
}

export function getOrders() {
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

export function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function getOrderById(orderId) {
  if (!orderId) return null;
  return getOrders().find(o => o.id === orderId) || null;
}

export function addOrder(order) {
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  setLastOrder(order);
  return order;
}

export function setLastOrder(order) {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

export function getLastOrder() {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return null;
}

export function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;
  order.status = status;
  saveOrders(orders);
  return order;
}

export function createId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isAdminAuthed() {
  try {
    if (sessionStorage.getItem(AUTH_KEY) === '1') return true;
    if (sessionStorage.getItem('yzy_admin_auth') === '1') {
      sessionStorage.setItem(AUTH_KEY, '1');
      sessionStorage.removeItem('yzy_admin_auth');
      return true;
    }
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

export function getCart() {
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

export function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

/* ── Server API (MySQL on cPanel) ── */

let apiEnabled = null;

export async function isApiEnabled() {
  if (apiEnabled !== null) return apiEnabled;
  try {
    const health = await api.healthCheck();
    apiEnabled = !!health?.database;
  } catch {
    apiEnabled = false;
  }
  return apiEnabled;
}

export async function loadProducts(seed = []) {
  if (await isApiEnabled()) {
    const list = await api.fetchProducts();
    return list.map(normalizeProduct);
  }
  return getProducts(seed);
}

export async function persistProducts(products) {
  if (await isApiEnabled()) {
    await Promise.all(products.map(p => api.adminUpsertProduct(normalizeProduct(p))));
    return products.map(normalizeProduct);
  }
  saveProducts(products);
  return products;
}

export async function saveProduct(product) {
  const normalized = normalizeProduct(product);
  if (await isApiEnabled()) {
    return api.adminUpsertProduct(normalized);
  }
  const products = getProducts();
  const idx = products.findIndex(p => p.id === normalized.id);
  if (idx >= 0) products[idx] = normalized;
  else products.unshift(normalized);
  saveProducts(products);
  return normalized;
}

export async function removeProduct(id) {
  if (await isApiEnabled()) {
    await api.adminDeleteProduct(id);
    return;
  }
  saveProducts(getProducts().filter(p => p.id !== id));
}

export async function loadOrders() {
  if (await isApiEnabled()) {
    return api.adminFetchOrders();
  }
  return getOrders();
}

export async function lookupOrder(orderId, email = '') {
  if (await isApiEnabled()) {
    return api.fetchOrder(orderId, email);
  }
  return getOrderById(orderId);
}

export async function placeOrder(order) {
  if (await isApiEnabled()) {
    const created = await api.createOrder(order);
    setLastOrder(created);
    return created;
  }
  return addOrder(order);
}

export async function setOrderStatus(orderId, status) {
  if (await isApiEnabled()) {
    return api.adminUpdateOrderStatus(orderId, status);
  }
  return updateOrderStatus(orderId, status);
}

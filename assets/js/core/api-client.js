/**
 * @file api-client.js — server API (PHP + MySQL on cPanel)
 * @author Ersan JT <https://github.com/ersanjt>
 */

const API_BASE = '/api/v1';

async function request(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers,
    body: options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body,
  });

  let payload = {};
  try {
    payload = await res.json();
  } catch {
    /* non-json */
  }

  if (!res.ok || payload.ok === false) {
    throw new Error(payload.error || `Request failed (${res.status})`);
  }

  return payload.data;
}

export async function healthCheck() {
  return request('/health.php');
}

export async function fetchProducts() {
  return request('/products.php');
}

export async function fetchProduct(id) {
  return request(`/products.php?id=${encodeURIComponent(id)}`);
}

export async function createOrder(order) {
  return request('/orders.php', { method: 'POST', body: { order } });
}

export async function fetchOrder(id, email = '') {
  const qs = new URLSearchParams({ id });
  if (email) qs.set('email', email);
  return request(`/orders.php?${qs}`);
}

export async function adminLogin(email, password) {
  return request('/admin/login.php', { method: 'POST', body: { email, password } });
}

export async function adminLogout() {
  return request('/admin/logout.php', { method: 'POST', body: {} });
}

export async function adminMe() {
  return request('/admin/me.php');
}

export async function adminFetchProducts() {
  return request('/admin/products.php');
}

export async function adminUpsertProduct(product) {
  if (product?.id) {
    return request(`/admin/products.php?id=${encodeURIComponent(product.id)}`, {
      method: 'PUT',
      body: { product },
    });
  }
  return request('/admin/products.php', { method: 'POST', body: { product } });
}

export async function adminDeleteProduct(id) {
  return request(`/admin/products.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function adminFetchOrders() {
  return request('/admin/orders.php');
}

export async function adminUpdateOrderStatus(id, status) {
  return request(`/admin/orders.php?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { status },
  });
}

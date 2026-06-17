import { products as seedProducts } from '../data/products.js';
import {
  createId,
  DEFAULT_SIZES,
  isApiEnabled,
  loadOrders,
  loadProducts,
  normalizeProduct,
  removeProduct,
  saveProduct,
  setOrderStatus,
} from '../core/storage.js';
import {
  adminCreateUser,
  adminDeleteUser,
  adminFetchSettings,
  adminFetchUsers,
  adminMe,
} from '../core/api-client.js';
import { mountAdminLogin, signOutAdmin } from '../core/admin-auth.js';
import { createFaviconUploadUI } from '../modules/admin-favicon.js';
import { createImageUploadUI } from '../modules/admin-upload.js';

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = [...document.querySelectorAll('.nav-item')];
const viewPanels = [...document.querySelectorAll('.view-panel')];
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const topNewProductBtn = document.getElementById('topNewProductBtn');
const topNewUserBtn = document.getElementById('topNewUserBtn');

const productsTableBody = document.getElementById('productsTableBody');
const productsEmpty = document.getElementById('productsEmpty');
const productsCount = document.getElementById('productsCount');
const productSearch = document.getElementById('productSearch');
const productFilter = document.getElementById('productFilter');

const ordersTableBody = document.getElementById('ordersTableBody');
const ordersCount = document.getElementById('ordersCount');
const ordersEmpty = document.getElementById('ordersEmpty');

const navProductCount = document.getElementById('navProductCount');
const navOrderCount = document.getElementById('navOrderCount');
const navUserCount = document.getElementById('navUserCount');

const usersTableBody = document.getElementById('usersTableBody');
const usersCount = document.getElementById('usersCount');
const usersEmpty = document.getElementById('usersEmpty');
const usersApiNotice = document.getElementById('usersApiNotice');
const usersTableWrap = document.getElementById('usersTableWrap');

const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const userFormError = document.getElementById('userFormError');
const newUserBtn = document.getElementById('newUserBtn');
const cancelUserBtn = document.getElementById('cancelUserBtn');
const userNameInput = document.getElementById('userName');
const userEmailInput = document.getElementById('userEmail');
const userPasswordInput = document.getElementById('userPassword');
const userPasswordConfirmInput = document.getElementById('userPasswordConfirm');

const settingsApiNotice = document.getElementById('settingsApiNotice');
const settingsContent = document.getElementById('settingsContent');
const resetFaviconBtn = document.getElementById('resetFaviconBtn');

const statTotal = document.getElementById('statTotal');
const statInStock = document.getElementById('statInStock');
const statOutStock = document.getElementById('statOutStock');
const statOrders = document.getElementById('statOrders');
const statRevenue = document.getElementById('statRevenue');
const dashOrdersList = document.getElementById('dashOrdersList');
const dashLowStockList = document.getElementById('dashLowStockList');

const productModal = document.getElementById('productModal');
const orderModal = document.getElementById('orderModal');
const orderModalBody = document.getElementById('orderModalBody');
const orderModalTitle = document.getElementById('orderModalTitle');
const productForm = document.getElementById('productForm');
const formTitle = document.getElementById('formTitle');
const newProductBtn = document.getElementById('newProductBtn');
const resetFormBtn = document.getElementById('resetFormBtn');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewImg = document.getElementById('imagePreviewImg');
const toast = document.getElementById('toast');

const fields = {
  id: document.getElementById('productId'),
  label: document.getElementById('productLabel'),
  price: document.getElementById('productPrice'),
  stock: document.getElementById('productStock'),
  category: document.getElementById('productCategory'),
  gender: document.getElementById('productGender'),
  inStock: document.getElementById('productInStock'),
  image: document.getElementById('productImage'),
  gallery: document.getElementById('productGallery'),
  sizes: document.getElementById('productSizes'),
};

const VIEW_META = {
  dashboard: { title: 'Dashboard', subtitle: 'Store overview' },
  products: { title: 'Products', subtitle: 'Catalog and inventory management' },
  orders: { title: 'Orders', subtitle: 'Order tracking and status' },
  users: { title: 'Users', subtitle: 'Admin accounts and access' },
  settings: { title: 'Settings', subtitle: 'Site branding and appearance' },
};

let products = [];
let orders = [];
let adminUsers = [];
let siteSettings = null;
let currentAdminEmail = '';
let usersApiReady = false;
let settingsApiReady = false;
let activeTab = 'dashboard';
let toastTimer;

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function categoryLabel(value) {
  if (value === 'coats') return 'Coats';
  if (value === 'shirts') return 'Shirts';
  if (value === 'bottoms') return 'Bottoms';
  if (value === 'accessories') return 'Accessories';
  return 'Jackets';
}

function genderLabel(value) {
  return value === 'womens' ? 'Womens' : 'Mens';
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2800);
}

const imageUpload = createImageUploadUI({
  mainImageZone: document.getElementById('mainImageZone'),
  mainImageFile: document.getElementById('mainImageFile'),
  mainImageEmpty: document.getElementById('mainImageEmpty'),
  imagePreview,
  imagePreviewImg,
  mainImageRemove: document.getElementById('mainImageRemove'),
  mainImageStatus: document.getElementById('mainImageStatus'),
  productImage: document.getElementById('productImage'),
  productImageUrl: document.getElementById('productImageUrl'),
  galleryZone: document.getElementById('galleryZone'),
  galleryFiles: document.getElementById('galleryFiles'),
  galleryGrid: document.getElementById('galleryGrid'),
  galleryUploadStatus: document.getElementById('galleryUploadStatus'),
  productGallery: document.getElementById('productGallery'),
  productGalleryUrl: document.getElementById('productGalleryUrl'),
  showToast,
});

function applyPageFavicon(favicon) {
  if (!favicon?.url) return;
  document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(link => {
    link.href = favicon.url;
    if (favicon.type && link.rel === 'icon') link.type = favicon.type;
  });
}

const faviconUpload = createFaviconUploadUI({
  zone: document.getElementById('faviconZone'),
  fileInput: document.getElementById('faviconFile'),
  empty: document.getElementById('faviconEmpty'),
  preview: document.getElementById('faviconPreview'),
  previewImg: document.getElementById('faviconPreviewImg'),
  removeBtn: null,
  statusEl: document.getElementById('faviconStatus'),
  resetBtn,
  showToast,
  onUpdated: favicon => {
    siteSettings = { ...(siteSettings || {}), favicon };
    applyPageFavicon(favicon);
  },
});

async function showApp() {
  document.body.classList.add('is-logged-in');
  if (loginScreen) loginScreen.hidden = true;
  if (adminApp) adminApp.hidden = false;

  if (await isApiEnabled()) {
    try {
      const me = await adminMe();
      if (me.authenticated) currentAdminEmail = (me.email || '').toLowerCase();
    } catch {
      /* ignore */
    }
  }

  products = await loadProducts(seedProducts);
  orders = await loadOrders();
  await Promise.all([loadAdminUsers(), loadSiteSettings()]);
  renderAll();
}

function switchTab(name) {
  activeTab = name;
  navItems.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));
  viewPanels.forEach(panel => panel.classList.toggle('active', panel.dataset.view === name));

  const meta = VIEW_META[name] || VIEW_META.dashboard;
  if (pageTitle) pageTitle.textContent = meta.title;
  if (pageSubtitle) pageSubtitle.textContent = meta.subtitle;
  if (topNewProductBtn) topNewProductBtn.hidden = name !== 'products';
  if (topNewUserBtn) topNewUserBtn.hidden = name !== 'users' || !usersApiReady;

  if (name === 'orders') renderOrders();
  if (name === 'dashboard') renderDashboard();
  if (name === 'users') renderUsers();
  if (name === 'settings') renderSettings();
}

function openModal() {
  if (!productModal) return;
  productModal.hidden = false;
  productModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!productModal) return;
  productModal.hidden = true;
  productModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function openUserModal() {
  if (!userModal) return;
  userForm?.reset();
  if (userFormError) userFormError.hidden = true;
  userModal.hidden = false;
  userModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  userEmailInput?.focus();
}

function closeUserModal() {
  if (!userModal) return;
  userModal.hidden = true;
  userModal.setAttribute('aria-hidden', 'true');
  if (userFormError) userFormError.hidden = true;
  document.body.style.overflow = '';
}

async function loadAdminUsers() {
  usersApiReady = false;
  adminUsers = [];

  if (!(await isApiEnabled())) {
    return;
  }

  try {
    adminUsers = await adminFetchUsers();
    usersApiReady = true;
  } catch {
    usersApiReady = false;
  }
}

async function loadSiteSettings() {
  settingsApiReady = false;
  siteSettings = null;

  if (!(await isApiEnabled())) {
    return;
  }

  try {
    siteSettings = await adminFetchSettings();
    settingsApiReady = true;
    if (siteSettings?.favicon) applyPageFavicon(siteSettings.favicon);
  } catch {
    settingsApiReady = false;
  }
}

function renderUsers() {
  const apiOn = usersApiReady;

  if (usersApiNotice) usersApiNotice.hidden = apiOn;
  if (usersTableWrap) usersTableWrap.hidden = !apiOn;
  if (newUserBtn) newUserBtn.hidden = !apiOn;
  if (topNewUserBtn) topNewUserBtn.hidden = activeTab !== 'users' || !apiOn;

  if (!apiOn) {
    if (usersEmpty) usersEmpty.hidden = true;
    if (usersCount) usersCount.textContent = '0 users';
    if (navUserCount) navUserCount.textContent = '0';
    if (usersTableBody) usersTableBody.innerHTML = '';
    return;
  }

  if (usersCount) usersCount.textContent = `${adminUsers.length} user${adminUsers.length === 1 ? '' : 's'}`;
  if (navUserCount) navUserCount.textContent = String(adminUsers.length);
  if (usersTableBody) usersTableBody.innerHTML = '';

  if (!adminUsers.length) {
    if (usersEmpty) usersEmpty.hidden = false;
    return;
  }
  if (usersEmpty) usersEmpty.hidden = true;

  adminUsers.forEach(user => {
    const row = document.createElement('tr');
    const isSelf = user.email.toLowerCase() === currentAdminEmail;
    const displayName = user.name?.trim() || '—';

    row.innerHTML = `
      <td><strong>${esc(displayName)}</strong>${isSelf ? ' <span class="muted">(you)</span>' : ''}</td>
      <td dir="ltr">${esc(user.email)}</td>
      <td>${fmtDate(user.createdAt)}</td>
      <td>
        ${isSelf
    ? '<span class="muted">—</span>'
    : `<button type="button" class="btn btn-ghost btn-danger" data-user-delete="${user.id}">Delete</button>`}
      </td>
    `;
    usersTableBody.append(row);
  });
}

function renderSettings() {
  const apiOn = settingsApiReady;

  if (settingsApiNotice) settingsApiNotice.hidden = apiOn;
  if (settingsContent) settingsContent.hidden = !apiOn;
  if (resetFaviconBtn) resetFaviconBtn.hidden = !apiOn;

  if (!apiOn) return;

  const favicon = siteSettings?.favicon;
  faviconUpload.showPreview(favicon?.url || '/favicon.svg');
}

function resetForm() {
  productForm?.reset();
  if (fields.id) fields.id.value = '';
  if (fields.inStock) fields.inStock.checked = true;
  if (fields.sizes) fields.sizes.value = DEFAULT_SIZES.join(',');
  if (formTitle) formTitle.textContent = 'Add product';
  imageUpload.reset();
}

function fillForm(product) {
  fields.id.value = product.id;
  fields.label.value = product.label;
  fields.price.value = String(product.price);
  fields.stock.value = String(product.stock);
  fields.category.value = product.category;
  fields.gender.value = product.gender;
  fields.inStock.checked = product.inStock;
  fields.sizes.value = product.sizes.join(',');
  imageUpload.setMainImage(product.image || '');
  imageUpload.setGallery(product.images || []);
  formTitle.textContent = `Edit ${product.label}`;
  openModal();
}

function readForm() {
  const images = imageUpload.getGallery();

  const sizes = fields.sizes.value
    .split(',')
    .map(size => size.trim())
    .filter(Boolean);

  return normalizeProduct({
    id: fields.id.value || createId(),
    label: fields.label.value.trim(),
    price: Number(fields.price.value),
    stock: Number(fields.stock.value),
    category: fields.category.value,
    gender: fields.gender.value,
    inStock: fields.inStock.checked,
    image: fields.image.value.trim(),
    images: images.length ? images : (fields.image.value.trim() ? [fields.image.value.trim()] : []),
    galleryCount: images.length || (fields.image.value.trim() ? 1 : 0),
    sizes: sizes.length ? sizes : [...DEFAULT_SIZES],
  });
}

function getFilteredProducts() {
  const q = (productSearch?.value || '').trim().toLowerCase();
  const filter = productFilter?.value || 'all';

  return products.filter(p => {
    const matchQ = !q
      || p.label.toLowerCase().includes(q)
      || p.category.toLowerCase().includes(q)
      || p.gender.toLowerCase().includes(q);

    let matchF = true;
    if (filter === 'in') matchF = p.inStock;
    else if (filter === 'out') matchF = !p.inStock;
    else if (filter === 'low') matchF = p.stock <= 5;

    return matchQ && matchF;
  });
}

function stockStatus(product) {
  if (!product.inStock) return { cls: 'off', label: 'Out of stock' };
  if (product.stock <= 5) return { cls: 'low', label: 'Low stock' };
  return { cls: 'on', label: 'In stock' };
}

function renderProducts() {
  const list = getFilteredProducts();
  productsTableBody.innerHTML = '';

  if (productsCount) productsCount.textContent = `${products.length} products`;
  if (navProductCount) navProductCount.textContent = String(products.length);
  if (productsEmpty) productsEmpty.hidden = list.length > 0;

  list.forEach(product => {
    const row = document.createElement('tr');
    const st = stockStatus(product);
    const thumb = product.image
      ? `<img class="thumb" src="${esc(product.image)}" alt="${esc(product.label)}" loading="lazy" />`
      : `<div class="thumb-empty">—</div>`;

    row.innerHTML = `
      <td>${thumb}</td>
      <td><strong>${esc(product.label)}</strong></td>
      <td>${categoryLabel(product.category)}</td>
      <td>${genderLabel(product.gender)}</td>
      <td dir="ltr">${money(product.price)}</td>
      <td dir="ltr">${product.stock}</td>
      <td><span class="status-pill ${st.cls}">${st.label}</span></td>
      <td>
        <div class="row-actions">
          <button type="button" class="btn btn-ghost" data-action="edit" data-id="${esc(product.id)}">Edit</button>
          <button type="button" class="btn btn-ghost" data-action="toggle" data-id="${esc(product.id)}">
            ${product.inStock ? 'Hide' : 'Publish'}
          </button>
          <button type="button" class="btn btn-ghost btn-danger" data-action="delete" data-id="${esc(product.id)}">Delete</button>
        </div>
      </td>
    `;
    productsTableBody.append(row);
  });
}

function orderStatusLabel(status) {
  if (status === 'completed') return { cls: 'on', label: 'Completed' };
  if (status === 'processing') return { cls: 'low', label: 'Processing' };
  if (status === 'shipped') return { cls: 'on', label: 'Shipped' };
  if (status === 'cancelled') return { cls: 'off', label: 'Cancelled' };
  return { cls: 'off', label: 'Pending' };
}

function customerName(customer) {
  if (!customer) return '—';
  return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '—';
}

function customerAddress(customer) {
  if (!customer) return '—';
  const lines = [];
  const street = [customer.address, customer.address2].filter(Boolean).join(', ');
  if (street) lines.push(street);

  const cityLine = [customer.city, customer.state, customer.zip].filter(Boolean).join(', ');
  if (cityLine) lines.push(cityLine);
  if (customer.country) lines.push(customer.country);

  return lines.length ? lines.join('\n') : '—';
}

function paymentLabel(value) {
  if (value === 'card') return 'Credit / Debit Card';
  if (value === 'usdc') return 'USDC (Crypto)';
  if (value === 'crypto') return 'MARVISPACE (Crypto)';
  return value || '—';
}

function detailRow(label, value, { ltr = false, link = false } = {}) {
  const safe = esc(String(value || '—'));
  const content = link && value
    ? `<a href="${link === true ? `mailto:${safe}` : esc(link)}" dir="ltr">${safe}</a>`
    : `<span${ltr ? ' dir="ltr"' : ''}>${safe}</span>`;

  return `
    <div class="detail-row">
      <span class="detail-label">${esc(label)}</span>
      <div class="detail-value">${content}</div>
    </div>
  `;
}

function openOrderModal(order) {
  if (!orderModal || !orderModalBody) return;

  const customer = order.customer || {};
  const st = orderStatusLabel(order.status);
  if (orderModalTitle) orderModalTitle.textContent = `Order ${order.id}`;

  const itemsHtml = (order.items || []).map(item => `
    <div class="order-detail-item">
      ${item.image ? `<img class="order-detail-thumb" src="${esc(item.image)}" alt="" loading="lazy" />` : '<div class="order-detail-thumb order-detail-thumb--empty">—</div>'}
      <div class="order-detail-item-copy">
        <strong>${esc(item.label)}</strong>
        <span class="muted">Size ${esc(item.size || '—')} · ${item.qty}× · ${money(item.price)} each</span>
      </div>
      <div class="order-detail-item-total" dir="ltr">${money((item.price || 0) * (item.qty || 1))}</div>
    </div>
  `).join('');

  orderModalBody.innerHTML = `
    <div class="order-detail-grid">
      <section class="order-detail-section">
        <h3>Order</h3>
        ${detailRow('Order ID', order.id, { ltr: true })}
        ${detailRow('Date', fmtDate(order.createdAt))}
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <div class="detail-value"><span class="status-pill ${st.cls}">${st.label}</span></div>
        </div>
        ${detailRow('Total', money(order.total), { ltr: true })}
        ${detailRow('Payment', paymentLabel(customer.payment))}
        ${detailRow('Email sent', order.emailSentAt ? fmtDate(order.emailSentAt) : 'Not sent yet')}
      </section>

      <section class="order-detail-section">
        <h3>Customer</h3>
        ${detailRow('Name', customerName(customer))}
        ${detailRow('Email', customer.email || '—', { ltr: true, link: true })}
        ${detailRow('Phone', customer.phone || '—', { ltr: true })}
        ${detailRow('Tax ID', customer.taxId || '—', { ltr: true })}
        ${detailRow('Newsletter', customer.subscribe ? 'Subscribed' : 'Not subscribed')}
        ${detailRow('Billing same as shipping', customer.billingSame ? 'Yes' : 'No')}
      </section>

      <section class="order-detail-section order-detail-section--full">
        <h3>Shipping address</h3>
        <pre class="order-detail-address">${esc(customerAddress(customer))}</pre>
      </section>

      <section class="order-detail-section order-detail-section--full">
        <h3>Items</h3>
        <div class="order-detail-items">${itemsHtml || '<p class="muted">No items</p>'}</div>
      </section>
    </div>
  `;

  orderModal.hidden = false;
  orderModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
  if (!orderModal) return;
  orderModal.hidden = true;
  orderModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function renderOrders() {
  if (ordersCount) ordersCount.textContent = `${orders.length} orders`;
  if (navOrderCount) navOrderCount.textContent = String(orders.length);
  ordersTableBody.innerHTML = '';

  if (!orders.length) {
    if (ordersEmpty) ordersEmpty.hidden = false;
    return;
  }
  if (ordersEmpty) ordersEmpty.hidden = true;

  orders.forEach(order => {
    const row = document.createElement('tr');
    const itemsHtml = order.items.map(item =>
      `<span>${esc(item.label)} · Size ${esc(item.size)} · ${item.qty}× · ${money(item.price * item.qty)}</span>`
    ).join('');
    const customer = order.customer
      ? `${esc(customerName(order.customer))}<br><span class="muted" dir="ltr">${esc(order.customer.email || '')}</span>`
      : '—';
    const st = orderStatusLabel(order.status);

    row.innerHTML = `
      <td><code dir="ltr">${esc(order.id)}</code></td>
      <td>${fmtDate(order.createdAt)}</td>
      <td>${customer || '—'}</td>
      <td><div class="order-items">${itemsHtml}</div></td>
      <td dir="ltr"><strong>${money(order.total)}</strong></td>
      <td>
        <span class="status-pill ${st.cls}">
          ${st.label}
        </span>
      </td>
      <td>
        <div class="row-actions">
          <button type="button" class="btn btn-ghost" data-order-view data-order-id="${esc(order.id)}">View</button>
          <button type="button" class="btn btn-ghost" data-order-action="pending" data-order-id="${esc(order.id)}">Pending</button>
          <button type="button" class="btn btn-ghost" data-order-action="completed" data-order-id="${esc(order.id)}">Complete</button>
        </div>
      </td>
    `;
    ordersTableBody.append(row);
  });
}

function renderDashboard() {
  const inStock = products.filter(p => p.inStock).length;
  const outStock = products.length - inStock;
  const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  if (statTotal) statTotal.textContent = String(products.length);
  if (statInStock) statInStock.textContent = String(inStock);
  if (statOutStock) statOutStock.textContent = String(outStock);
  if (statOrders) statOrders.textContent = String(orders.length);
  if (statRevenue) statRevenue.textContent = money(revenue);

  if (dashOrdersList) {
    const recent = orders.slice(0, 5);
    dashOrdersList.innerHTML = recent.length
      ? recent.map(o => `
        <div class="dash-row">
          <div>
            <strong dir="ltr">${esc(o.id.slice(0, 8))}</strong>
            <div class="muted">${fmtDate(o.createdAt)}</div>
          </div>
          <div dir="ltr"><strong>${money(o.total)}</strong></div>
        </div>
      `).join('')
      : '<p class="empty-state">No orders yet.</p>';
  }

  if (dashLowStockList) {
    const low = products.filter(p => p.inStock && p.stock <= 5).slice(0, 6);
    dashLowStockList.innerHTML = low.length
      ? low.map(p => `
        <div class="dash-row">
          <strong>${esc(p.label)}</strong>
          <span class="status-pill low">${p.stock} left</span>
        </div>
      `).join('')
      : '<p class="empty-state">All products have sufficient stock.</p>';
  }
}

function renderAll() {
  renderProducts();
  renderOrders();
  renderDashboard();
  renderUsers();
  renderSettings();
}

async function refreshData() {
  products = await loadProducts(seedProducts);
  orders = await loadOrders();
  await Promise.all([loadAdminUsers(), loadSiteSettings()]);
  renderAll();
}

/* ── Events ── */
navItems.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.goto));
});

topNewProductBtn?.addEventListener('click', () => {
  resetForm();
  openModal();
});

newProductBtn?.addEventListener('click', () => {
  resetForm();
  openModal();
});

topNewUserBtn?.addEventListener('click', openUserModal);
newUserBtn?.addEventListener('click', openUserModal);
cancelUserBtn?.addEventListener('click', closeUserModal);

userModal?.querySelectorAll('[data-close-user-modal]').forEach(el => {
  el.addEventListener('click', closeUserModal);
});

userForm?.addEventListener('submit', async e => {
  e.preventDefault();
  if (userFormError) userFormError.hidden = true;

  const email = userEmailInput?.value?.trim() || '';
  const name = userNameInput?.value?.trim() || '';
  const password = userPasswordInput?.value || '';
  const confirmPassword = userPasswordConfirmInput?.value || '';

  if (password !== confirmPassword) {
    if (userFormError) {
      userFormError.hidden = false;
      userFormError.textContent = 'Passwords do not match.';
    }
    return;
  }

  try {
    await adminCreateUser({ email, name, password, confirmPassword });
    await loadAdminUsers();
    renderUsers();
    closeUserModal();
    showToast('Admin user created');
  } catch (err) {
    if (userFormError) {
      userFormError.hidden = false;
      userFormError.textContent = err.message || 'Could not create user.';
    }
  }
});

usersTableBody?.addEventListener('click', async e => {
  const btn = e.target.closest('button[data-user-delete]');
  if (!btn) return;

  const id = Number(btn.dataset.userDelete);
  const user = adminUsers.find(item => item.id === id);
  if (!user) return;

  if (!confirm(`Delete admin user "${user.email}"?`)) return;

  try {
    await adminDeleteUser(id);
    await loadAdminUsers();
    renderUsers();
    showToast('User deleted');
  } catch (err) {
    showToast(err.message || 'Could not delete user');
  }
});

resetFormBtn?.addEventListener('click', closeModal);

productModal?.querySelectorAll('[data-close-modal]').forEach(el => {
  el.addEventListener('click', closeModal);
});

productSearch?.addEventListener('input', renderProducts);
productFilter?.addEventListener('change', renderProducts);

productForm?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!fields.image?.value?.trim()) {
    showToast('Add a main product image');
    return;
  }
  const product = readForm();
  const index = products.findIndex(item => item.id === product.id);

  try {
    await saveProduct(product);
    if (index >= 0) products[index] = product;
    else products.unshift(product);
    await refreshData();
    closeModal();
    showToast(index >= 0 ? 'Product updated' : 'Product added');
  } catch (err) {
    showToast(err.message || 'Could not save product');
  }
});

productsTableBody?.addEventListener('click', async e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const id = btn.dataset.id;
  const product = products.find(item => item.id === id);
  if (!product) return;

  if (btn.dataset.action === 'edit') {
    fillForm(product);
    return;
  }

  if (btn.dataset.action === 'toggle') {
    product.inStock = !product.inStock;
    try {
      await saveProduct(product);
      await refreshData();
      showToast(product.inStock ? 'Product published' : 'Product hidden from store');
    } catch (err) {
      showToast(err.message || 'Could not update product');
    }
    return;
  }

  if (btn.dataset.action === 'delete') {
    if (!confirm(`Delete product "${product.label}"?`)) return;
    try {
      await removeProduct(id);
      await refreshData();
      showToast('Product deleted');
    } catch (err) {
      showToast(err.message || 'Could not delete product');
    }
  }
});

ordersTableBody?.addEventListener('click', async e => {
  const viewBtn = e.target.closest('button[data-order-view]');
  if (viewBtn) {
    const order = orders.find(item => item.id === viewBtn.dataset.orderId);
    if (order) openOrderModal(order);
    return;
  }

  const btn = e.target.closest('button[data-order-action]');
  if (!btn) return;
  try {
    await setOrderStatus(btn.dataset.orderId, btn.dataset.orderAction);
    orders = await loadOrders();
    renderAll();
    showToast('Order status updated');
  } catch (err) {
    showToast(err.message || 'Could not update order');
  }
});

orderModal?.querySelectorAll('[data-close-order-modal]').forEach(el => {
  el.addEventListener('click', closeOrderModal);
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (productModal && !productModal.hidden) closeModal();
  if (userModal && !userModal.hidden) closeUserModal();
  if (orderModal && !orderModal.hidden) closeOrderModal();
});

logoutBtn?.addEventListener('click', signOutAdmin);

mountAdminLogin({ onSuccess: showApp });

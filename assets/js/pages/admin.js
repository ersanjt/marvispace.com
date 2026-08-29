import {
  createId,
  DEFAULT_SIZES,
  isApiEnabled,
  loadOrders,
  loadProducts,
  normalizeProduct,
  discountPercent,
  salePrice,
  removeProduct,
  saveProduct,
  bulkUpdateProducts,
  setOrderStatus,
} from '../core/storage.js';
import {
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUser,
  adminFetchSettings,
  adminFetchUsers,
  adminMe,
  adminSaveNotificationSettings,
  adminSavePaynetSettings,
  adminSaveWhatsAppSettings,
  adminSaveZiraatSettings,
  adminSendTestNotification,
  fetchSiteSettings,
} from '../core/api-client.js';
import { mountAdminLogin, signOutAdmin } from '../core/admin-auth.js';
import { createFaviconUploadUI } from '../modules/admin-favicon.js';
import { createImageUploadUI } from '../modules/admin-upload.js';

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const logoutBtn = document.getElementById('logoutBtn');
const topbarLogoutBtn = document.getElementById('topbarLogoutBtn');
const navItems = [...document.querySelectorAll('.nav-item')];
const viewPanels = [...document.querySelectorAll('.view-panel')];
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const topNewProductBtn = document.getElementById('topNewProductBtn');
const topNewUserBtn = document.getElementById('topNewUserBtn');

const productsTableBody = document.getElementById('productsTableBody');
const productsTableWrap = document.getElementById('productsTableWrap');
const productsCards = document.getElementById('productsCards');
const productsEmpty = document.getElementById('productsEmpty');
const productsCount = document.getElementById('productsCount');
const productSearch = document.getElementById('productSearch');
const productFilter = document.getElementById('productFilter');
const productBulkBar = document.getElementById('productBulkBar');
const productSelectionLabel = document.getElementById('productSelectionLabel');
const productSelectAllVisible = document.getElementById('productSelectAllVisible');
const productSelectAllFiltered = document.getElementById('productSelectAllFiltered');
const bulkEditBtn = null;
const openBulkEditBtn = document.getElementById('openBulkEditBtn');
const clearProductSelectionBtn = document.getElementById('clearProductSelectionBtn');
const bulkEditModal = document.getElementById('bulkEditModal');
const bulkEditForm = document.getElementById('bulkEditForm');
const bulkEditTitle = document.getElementById('bulkEditTitle');
const bulkEditLead = document.getElementById('bulkEditLead');
const bulkEditSubmitBtn = document.getElementById('bulkEditSubmitBtn');
const bulkEnablePrice = document.getElementById('bulkEnablePrice');
const bulkPriceMode = document.getElementById('bulkPriceMode');
const bulkPriceValue = document.getElementById('bulkPriceValue');
const bulkEnableStock = document.getElementById('bulkEnableStock');
const bulkStockMode = document.getElementById('bulkStockMode');
const bulkStockValue = document.getElementById('bulkStockValue');
const bulkEnableCategory = document.getElementById('bulkEnableCategory');
const bulkCategory = document.getElementById('bulkCategory');
const bulkEnableGender = document.getElementById('bulkEnableGender');
const bulkGender = document.getElementById('bulkGender');
const bulkEnableDiscount = document.getElementById('bulkEnableDiscount');
const bulkDiscountValue = document.getElementById('bulkDiscountValue');

const ordersTableBody = document.getElementById('ordersTableBody');
const ordersTableWrap = document.getElementById('ordersTableWrap');
const ordersCards = document.getElementById('ordersCards');
const ordersQuickFilters = document.getElementById('ordersQuickFilters');
const ordersCount = document.getElementById('ordersCount');
const ordersEmpty = document.getElementById('ordersEmpty');
const ordersFilterEmpty = document.getElementById('ordersFilterEmpty');
const ordersStats = document.getElementById('ordersStats');
const orderSearch = document.getElementById('orderSearch');
const orderStatusFilter = document.getElementById('orderStatusFilter');
const orderPaymentFilter = document.getElementById('orderPaymentFilter');
const orderSort = document.getElementById('orderSort');
const clearOrderFiltersBtn = document.getElementById('clearOrderFiltersBtn');
const exportOrdersBtn = document.getElementById('exportOrdersBtn');
const orderModalStatus = document.getElementById('orderModalStatus');
const orderModalSaveStatus = document.getElementById('orderModalSaveStatus');
const orderModalEmail = document.getElementById('orderModalEmail');
const orderModalCopyId = document.getElementById('orderModalCopyId');

const navProductCount = document.getElementById('navProductCount');
const navOrderCount = document.getElementById('navOrderCount');
const navUserCount = document.getElementById('navUserCount');

const usersTableBody = document.getElementById('usersTableBody');
const usersCards = document.getElementById('usersCards');
const usersCount = document.getElementById('usersCount');
const usersEmpty = document.getElementById('usersEmpty');
const usersApiNotice = document.getElementById('usersApiNotice');
const usersTableWrap = document.getElementById('usersTableWrap');
const usersHint = document.getElementById('usersHint');

const userModal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const userFormError = document.getElementById('userFormError');
const cancelUserBtn = document.getElementById('cancelUserBtn');
const userNameInput = document.getElementById('userName');
const userEmailInput = document.getElementById('userEmail');
const userPasswordInput = document.getElementById('userPassword');
const userPasswordConfirmInput = document.getElementById('userPasswordConfirm');
const userPasswordFields = document.getElementById('userPasswordFields');
const userEmailField = document.getElementById('userEmailField');
const userFormTitle = document.getElementById('userFormTitle');
const userFormSubmitBtn = document.getElementById('userFormSubmitBtn');
const permissionInputs = [...document.querySelectorAll('[data-permission]')];

const settingsApiNotice = document.getElementById('settingsApiNotice');
const settingsContent = document.getElementById('settingsContent');
const paynetSettingsForm = document.getElementById('paynetSettingsForm');
const paynetStatusLine = document.getElementById('paynetStatusLine');
const ziraatSettingsForm = document.getElementById('ziraatSettingsForm');
const ziraatStatusLine = document.getElementById('ziraatStatusLine');
const resetFaviconBtn = document.getElementById('resetFaviconBtn');
const notificationSettingsForm = document.getElementById('notificationSettingsForm');
const notifyStatusLine = document.getElementById('notifyStatusLine');
const settingsTabs = [...document.querySelectorAll('[data-settings-tab]')];
const settingsPanels = [...document.querySelectorAll('[data-settings-panel]')];

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
const newProductBtn = null;
const resetFormBtn = document.getElementById('resetFormBtn');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewImg = document.getElementById('imagePreviewImg');
const toast = document.getElementById('toast');

const fields = {
  id: document.getElementById('productId'),
  label: document.getElementById('productLabel'),
  price: document.getElementById('productPrice'),
  discount: document.getElementById('productDiscount'),
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
  users: { title: 'Users', subtitle: 'Admin accounts and access levels' },
  settings: { title: 'Settings', subtitle: 'Branding, payments, and email alerts' },
};

const PERMISSION_ORDER = ['dashboard', 'products', 'orders', 'users', 'settings'];

const PERMISSION_LABELS = {
  dashboard: 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  users: 'Users',
  settings: 'Settings',
};

const FULL_PERMISSIONS = {
  dashboard: true,
  products: true,
  orders: true,
  users: true,
  settings: true,
};

let products = [];
let selectedProductIds = new Set();
let lastFilteredProductIds = [];
let orders = [];
let adminUsers = [];
let siteSettings = null;
let currentAdminEmail = '';
let currentAdminPermissions = { ...FULL_PERMISSIONS };
let currentAdminIsOwner = false;
let editingUserId = null;
let usersApiReady = false;
let settingsApiReady = false;
let activeSettingsTab = 'brand';
let activeTab = 'dashboard';
let toastTimer;
let activeOrderId = null;
let orderQuickFilter = 'all';

const ORDER_QUICK_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'action', label: 'Needs action' },
  { id: 'progress', label: 'In progress' },
  { id: 'paid', label: 'Paid' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

function priceCell(product) {
  const pct = discountPercent(product);
  if (pct <= 0) return money(product.price);
  return `${money(salePrice(product))} <span class="muted">-${pct}%</span>`;
}

function fmtDate(iso) {
  return fmtDateShort(iso);
}

function fmtDateShort(iso) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function fmtRelativeTime(iso) {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return '';
  } catch {
    return '';
  }
}

function shortOrderId(id) {
  if (!id) return '—';
  return id.length > 12 ? `${id.slice(0, 12)}…` : id;
}

function orderPaymentKey(order) {
  return (order.paymentStatus || 'unpaid').toLowerCase();
}

function isCancelledOrder(order) {
  return (order.status || '') === 'cancelled';
}

function isPaidOrder(order) {
  return orderPaymentKey(order) === 'paid';
}

function orderPaidRevenue(list) {
  return (list || []).reduce((sum, order) => {
    if (isCancelledOrder(order) || !isPaidOrder(order)) return sum;
    return sum + (Number(order.total) || 0);
  }, 0);
}

function orderNeedsAttention(order) {
  const status = order.status || 'pending';
  if (status === 'cancelled' || status === 'completed') return false;
  const pay = orderPaymentKey(order);
  return status === 'pending'
    || status === 'awaiting_payment'
    || pay === 'failed'
    || pay === 'unpaid'
    || pay === 'pending';
}

function orderMatchesFilter(order, filter = 'all') {
  if (filter === 'all') return true;
  const status = order.status || 'pending';
  const pay = orderPaymentKey(order);
  if (filter === 'action') return orderNeedsAttention(order);
  if (filter === 'progress') return status === 'processing' || status === 'shipped';
  if (filter === 'paid') return pay === 'paid';
  if (filter === 'unpaid') return pay === 'unpaid' || pay === 'failed' || pay === 'pending';
  if (filter === 'completed') return status === 'completed';
  if (filter === 'cancelled') return status === 'cancelled';
  return true;
}

function orderMatchesQuickFilter(order) {
  return orderMatchesFilter(order, orderQuickFilter);
}

function orderQuickFilterCount(filterId) {
  return orders.filter(order => orderMatchesFilter(order, filterId)).length;
}

function orderStatusSelectClass(status) {
  return `order-status-select is-${status || 'pending'}`;
}

function orderStatusSelectHtml(order) {
  const status = order.status || 'pending';
  return `
    <select class="${orderStatusSelectClass(status)}" data-order-status data-order-id="${esc(order.id)}" aria-label="Change order status">
      ${orderStatusOptionsHtml(status)}
    </select>
  `;
}

function orderRowClass(order) {
  const classes = ['order-row'];
  if (orderNeedsAttention(order)) classes.push('order-row--attention');
  if (isCancelledOrder(order)) classes.push('order-row--cancelled');
  return classes.join(' ');
}

function ordersFiltersActive() {
  return Boolean(
    (orderSearch?.value || '').trim()
    || (orderStatusFilter?.value || 'all') !== 'all'
    || (orderPaymentFilter?.value || 'all') !== 'all'
    || orderQuickFilter !== 'all',
  );
}

function clearOrderFilters() {
  orderQuickFilter = 'all';
  if (orderSearch) orderSearch.value = '';
  if (orderStatusFilter) orderStatusFilter.value = 'all';
  if (orderPaymentFilter) orderPaymentFilter.value = 'all';
  if (orderSort) orderSort.value = 'newest';
  renderOrders();
}

function renderOrderQuickFilters() {
  if (!ordersQuickFilters) return;
  ordersQuickFilters.innerHTML = ORDER_QUICK_FILTERS.map(f => {
    const count = orderQuickFilterCount(f.id);
    return `
      <button
        type="button"
        class="orders-chip${orderQuickFilter === f.id ? ' is-active' : ''}"
        data-order-quick="${f.id}"
        aria-pressed="${orderQuickFilter === f.id}"
      >${f.label}<span class="orders-chip__count">${count}</span></button>
    `;
  }).join('');
}

function orderRowHtml(order) {
  const customer = order.customer || {};
  const pay = paymentStatusLabel(order.paymentStatus);
  const itemCount = orderItemCount(order);
  const relative = fmtRelativeTime(order.createdAt);

  return `
    <td>
      <div class="order-stack">
        <button type="button" class="order-id-btn" data-copy-order-id="${esc(order.id)}" title="Copy order ID">
          <code dir="ltr">${esc(shortOrderId(order.id))}</code>
        </button>
        <span class="order-date">${fmtDateShort(order.createdAt)}${relative ? ` · ${relative}` : ''}</span>
      </div>
    </td>
    <td>
      <div class="order-stack">
        <span class="order-customer-name">${esc(customerName(customer))}</span>
        <span class="muted order-email" dir="ltr">${esc(customer.email || '—')}</span>
      </div>
    </td>
    <td>
      <div class="order-items-compact">
        <span class="order-items-count">${itemCount} item${itemCount === 1 ? '' : 's'}</span>
        <span class="order-items-preview">${esc(orderItemsPreview(order))}</span>
      </div>
    </td>
    <td dir="ltr" class="order-total-cell"><strong class="order-total">${money(order.total)}</strong></td>
    <td><span class="status-pill ${pay.cls}">${pay.label}</span></td>
    <td class="order-status-cell">${orderStatusSelectHtml(order)}</td>
    <td class="order-actions-cell">
      <div class="row-actions">
        <button type="button" class="btn btn-primary btn-sm" data-order-view data-order-id="${esc(order.id)}">View</button>
        ${customer.email ? `<a class="btn btn-ghost btn-sm" href="mailto:${esc(customer.email)}?subject=${encodeURIComponent(`Order ${order.id}`)}">Email</a>` : ''}
      </div>
    </td>
  `;
}

function orderCardHtml(order) {
  const customer = order.customer || {};
  const pay = paymentStatusLabel(order.paymentStatus);
  const itemCount = orderItemCount(order);
  const relative = fmtRelativeTime(order.createdAt);
  const attention = orderNeedsAttention(order);
  const cancelled = isCancelledOrder(order);

  return `
    <article class="order-card${attention ? ' order-card--attention' : ''}${cancelled ? ' order-card--cancelled' : ''}" data-order-id="${esc(order.id)}">
      <div class="order-card__head">
        <button type="button" class="order-id-btn" data-copy-order-id="${esc(order.id)}" title="Copy order ID">
          <code dir="ltr">${esc(shortOrderId(order.id))}</code>
        </button>
        <strong class="order-card__total" dir="ltr">${money(order.total)}</strong>
      </div>
      <div class="order-card__meta">
        <span class="order-customer-name">${esc(customerName(customer))}</span>
        <span class="muted order-email" dir="ltr">${esc(customer.email || '—')}</span>
      </div>
      <p class="order-card__items">${itemCount} item${itemCount === 1 ? '' : 's'} · ${esc(orderItemsPreview(order, 1))}</p>
      <div class="order-card__badges">
        <span class="status-pill ${pay.cls}">${pay.label}</span>
      </div>
      <div class="order-card__foot">
        ${orderStatusSelectHtml(order)}
        <div class="row-actions">
          <button type="button" class="btn btn-primary btn-sm" data-order-view data-order-id="${esc(order.id)}">View</button>
          ${customer.email ? `<a class="btn btn-ghost btn-sm" href="mailto:${esc(customer.email)}?subject=${encodeURIComponent(`Order ${order.id}`)}">Email</a>` : ''}
        </div>
      </div>
      <span class="order-date">${fmtDateShort(order.createdAt)}${relative ? ` · ${relative}` : ''}</span>
    </article>
  `;
}

function productCardHtml(product) {
  const st = stockStatus(product);
  const thumb = product.image
    ? `<img class="product-card__thumb" src="${esc(product.image)}" alt="${esc(product.label)}" loading="lazy" />`
    : `<div class="product-card__thumb product-card__thumb--empty">—</div>`;
  const checked = selectedProductIds.has(product.id) ? 'checked' : '';
  const selected = selectedProductIds.has(product.id) ? ' is-selected' : '';

  return `
    <article class="product-card${selected}" data-product-id="${esc(product.id)}">
      <div class="product-card__head">
        <label class="product-card__check">
          <input type="checkbox" class="product-select" data-id="${esc(product.id)}" aria-label="Select ${esc(product.label)}" ${checked} />
        </label>
        ${thumb}
        <div class="product-card__meta">
          <strong>${esc(product.label)}</strong>
          <span class="muted">${categoryLabel(product.category)} · ${genderLabel(product.gender)}</span>
        </div>
        <span class="status-pill ${st.cls}">${st.label}</span>
      </div>
      <div class="product-card__stats">
        <span dir="ltr"><strong>${priceCell(product)}</strong></span>
        <span class="muted" dir="ltr">Stock ${product.stock}</span>
      </div>
      <div class="product-card__actions row-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-action="edit" data-id="${esc(product.id)}">Edit</button>
        <button type="button" class="btn btn-ghost btn-sm" data-action="toggle" data-id="${esc(product.id)}">
          ${product.inStock ? 'Hide' : 'Publish'}
        </button>
        <button type="button" class="btn btn-ghost btn-sm btn-danger" data-action="delete" data-id="${esc(product.id)}">Delete</button>
      </div>
    </article>
  `;
}

function userCardHtml(user, { ownerCount, isSelf, canEdit, canDelete, emailOk }) {
  const email = String(user.email || '');
  const displayName = user.name?.trim() || '—';

  let actions = '<span class="muted">—</span>';
  if (canEdit || canDelete) {
    actions = '<div class="row-actions">';
    if (canEdit) {
      actions += `<button type="button" class="btn btn-ghost btn-sm" data-user-edit="${user.id}">Edit access</button>`;
    }
    if (canDelete) {
      actions += `<button type="button" class="btn btn-ghost btn-sm btn-danger" data-user-delete="${user.id}">Delete</button>`;
    }
    actions += '</div>';
  } else if (isSelf) {
    actions = '<span class="muted">You</span>';
  } else if (user.isOwner) {
    actions = '<span class="muted">Protected</span>';
  }

  return `
    <article class="user-card">
      <div class="user-card__head">
        <div class="user-name-cell">
          <strong>${esc(displayName)}</strong>
          ${isSelf ? '<span class="muted">(you)</span>' : ''}
          ${user.isOwner ? '<span class="permission-badge permission-badge--owner">Owner</span>' : ''}
        </div>
        <span class="muted user-card__date">${fmtDate(user.createdAt)}</span>
      </div>
      <p class="user-card__email${emailOk ? '' : ' user-email--invalid'}" dir="ltr">${esc(email || '—')}</p>
      ${emailOk ? '' : '<span class="user-email-warn">Invalid email</span>'}
      <div class="user-card__access"><div class="permission-badges">${formatPermissionBadges(user)}</div></div>
      <div class="user-card__actions">${actions}</div>
    </article>
  `;
}

function orderStatusOptionsHtml(selected = 'pending') {
  return ORDER_STATUS_OPTIONS.map(opt => (
    `<option value="${opt.value}"${opt.value === selected ? ' selected' : ''}>${opt.label}</option>`
  )).join('');
}

function orderItemCount(order) {
  return (order.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
}

function orderItemsPreview(order, limit = 2) {
  const items = order.items || [];
  if (!items.length) return '—';
  const lines = items.slice(0, limit).map(item => (
    `${item.label}${item.size ? ` · ${item.size}` : ''} ×${item.qty}`
  ));
  if (items.length > limit) lines.push(`+${items.length - limit} more`);
  return lines.join(' · ');
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

function canAccessSection(section) {
  if (currentAdminIsOwner) return true;
  return !!currentAdminPermissions[section];
}

function firstAllowedTab() {
  for (const key of PERMISSION_ORDER) {
    if (canAccessSection(key)) return key;
  }
  return 'dashboard';
}

function applyNavPermissions() {
  navItems.forEach(btn => {
    const tab = btn.dataset.tab;
    const allowed = tab ? canAccessSection(tab) : true;
    btn.hidden = !allowed;
    btn.disabled = !allowed;
  });
}

function readUserFormPermissions() {
  const permissions = { dashboard: true };
  permissionInputs.forEach(input => {
    const key = input.dataset.permission;
    if (!key || key === 'dashboard') return;
    permissions[key] = input.checked;
  });
  return permissions;
}

function setUserFormPermissions(permissions = {}) {
  permissionInputs.forEach(input => {
    const key = input.dataset.permission;
    if (!key) return;
    if (key === 'dashboard') {
      input.checked = true;
      return;
    }
    input.checked = !!permissions[key];
  });
}

function formatPermissionBadges(user) {
  if (user.isOwner || user.role === 'owner') {
    return '<span class="permission-badge permission-badge--owner">Owner · full access</span>';
  }

  const perms = user.permissions || {};
  const enabled = PERMISSION_ORDER.filter(key => perms[key]);
  if (!enabled.length) {
    return '<span class="permission-badge permission-badge--off">Dashboard only</span>';
  }

  return enabled.map(key => (
    `<span class="permission-badge">${esc(PERMISSION_LABELS[key] || key)}</span>`
  )).join('');
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

let faviconUpload = null;

function getFaviconUpload() {
  if (faviconUpload) return faviconUpload;

  faviconUpload = createFaviconUploadUI({
    zone: document.getElementById('faviconZone'),
    fileInput: document.getElementById('faviconFile'),
    empty: document.getElementById('faviconEmpty'),
    preview: document.getElementById('faviconPreview'),
    previewImg: document.getElementById('faviconPreviewImg'),
    removeBtn: null,
    statusEl: document.getElementById('faviconStatus'),
    resetBtn: resetFaviconBtn,
    showToast,
    onUpdated: favicon => {
      siteSettings = { ...(siteSettings || {}), favicon };
      applyPageFavicon(favicon);
    },
  });

  return faviconUpload;
}

async function showApp() {
  document.body.classList.add('is-logged-in');
  if (loginScreen) loginScreen.hidden = true;
  if (adminApp) adminApp.hidden = false;

  if (await isApiEnabled()) {
    try {
      const me = await adminMe();
      if (me.authenticated) {
        currentAdminEmail = (me.email || '').toLowerCase();
        currentAdminIsOwner = !!me.isOwner || me.role === 'owner';
        currentAdminPermissions = me.permissions || { ...FULL_PERMISSIONS };
      }
    } catch {
      /* ignore */
    }
  }

  applyNavPermissions();

  const loadTasks = [];
  if (canAccessSection('products') || canAccessSection('dashboard')) {
    loadTasks.push(loadProducts([]).then(list => { products = list; }));
  } else {
    products = [];
  }
  if (canAccessSection('orders') || canAccessSection('dashboard')) {
    loadTasks.push(loadOrders().then(list => { orders = list; }));
  } else {
    orders = [];
  }
  if (canAccessSection('users')) {
    loadTasks.push(loadAdminUsers());
  } else {
    usersApiReady = false;
    adminUsers = [];
  }
  if (canAccessSection('settings')) {
    loadTasks.push(loadSiteSettings());
  } else {
    settingsApiReady = false;
    siteSettings = null;
  }

  await Promise.all(loadTasks);
  renderAll();

  let initialTab = firstAllowedTab();
  try {
    const saved = sessionStorage.getItem('adminTab');
    if (saved && VIEW_META[saved]) initialTab = saved;
  } catch {
    /* ignore */
  }
  const hashTab = window.location.hash.replace(/^#/, '');
  if (hashTab.startsWith('settings')) {
    initialTab = 'settings';
    if (hashTab.startsWith('settings-')) {
      activeSettingsTab = hashTab.slice('settings-'.length);
    }
  } else if (hashTab && VIEW_META[hashTab] && canAccessSection(hashTab)) {
    initialTab = hashTab;
  }
  if (!canAccessSection(initialTab)) initialTab = firstAllowedTab();
  switchTab(initialTab);
}

function syncPageHeader() {
  const meta = VIEW_META[activeTab] || VIEW_META.dashboard;
  if (pageTitle) pageTitle.textContent = meta.title;
  if (pageSubtitle) pageSubtitle.textContent = meta.subtitle;
  if (topNewProductBtn) topNewProductBtn.hidden = activeTab !== 'products' || !canAccessSection('products');
  if (topNewUserBtn) topNewUserBtn.hidden = activeTab !== 'users' || !usersApiReady || !canAccessSection('users');
}

function switchTab(name) {
  if (!VIEW_META[name] || !canAccessSection(name)) name = firstAllowedTab();
  activeTab = name;
  try {
    sessionStorage.setItem('adminTab', name);
  } catch {
    /* ignore */
  }

  navItems.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));
  viewPanels.forEach(panel => panel.classList.toggle('active', panel.dataset.view === name));
  syncPageHeader();

  if (name === 'orders') renderOrders();
  if (name === 'dashboard') renderDashboard();
  if (name === 'users') renderUsers();
  if (name === 'settings') {
    const hash = window.location.hash.replace(/^#/, '');
    if (hash.startsWith('settings-')) {
      activeSettingsTab = hash.replace('settings-', '');
    }
    renderSettings();
  }
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

function openUserModal(user = null) {
  if (!userModal) return;
  editingUserId = user?.id || null;
  userForm?.reset();
  if (userFormError) userFormError.hidden = true;

  const isEdit = !!user;
  if (userFormTitle) userFormTitle.textContent = isEdit ? 'Edit admin access' : 'Add admin user';
  if (userFormSubmitBtn) userFormSubmitBtn.textContent = isEdit ? 'Save access' : 'Create user';

  if (userEmailField) userEmailField.hidden = isEdit;
  if (userPasswordFields) userPasswordFields.hidden = isEdit;
  if (userEmailInput) {
    userEmailInput.required = !isEdit;
    userEmailInput.value = user?.email || '';
    userEmailInput.readOnly = isEdit;
  }
  if (userPasswordInput) userPasswordInput.required = !isEdit;
  if (userPasswordConfirmInput) userPasswordConfirmInput.required = !isEdit;
  if (userNameInput) userNameInput.value = user?.name || '';
  setUserFormPermissions(user?.permissions || { dashboard: true });

  userModal.hidden = false;
  userModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  (isEdit ? userNameInput : userEmailInput)?.focus();
}

function closeUserModal() {
  if (!userModal) return;
  userModal.hidden = true;
  userModal.setAttribute('aria-hidden', 'true');
  editingUserId = null;
  if (userEmailInput) userEmailInput.readOnly = false;
  if (userFormError) userFormError.hidden = true;
  document.body.style.overflow = '';
}

async function loadAdminUsers() {
  usersApiReady = false;
  adminUsers = [];

  if (!(await isApiEnabled()) || !canAccessSection('users')) {
    return;
  }

  try {
    adminUsers = await adminFetchUsers();
    usersApiReady = true;
  } catch (err) {
    usersApiReady = false;
    if (err?.message?.includes('403') || err?.message?.includes('access')) {
      showToast('You do not have permission to manage users');
    }
  }
}

async function loadSiteSettings() {
  settingsApiReady = false;
  siteSettings = null;

  if (!(await isApiEnabled()) || !canAccessSection('settings')) {
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
  const ownerCount = adminUsers.filter(u => u.isOwner).length;

  if (usersApiNotice) usersApiNotice.hidden = apiOn;
  if (usersTableWrap) usersTableWrap.hidden = !apiOn;
  if (usersHint) usersHint.hidden = !apiOn;
  if (topNewUserBtn) topNewUserBtn.hidden = activeTab !== 'users' || !apiOn || !canAccessSection('users');

  if (!apiOn) {
    if (usersEmpty) usersEmpty.hidden = true;
    if (usersCount) usersCount.textContent = '0 users';
    if (navUserCount) navUserCount.textContent = '0';
    if (usersTableBody) usersTableBody.innerHTML = '';
    if (usersCards) {
      usersCards.innerHTML = '';
      usersCards.hidden = true;
    }
    return;
  }

  if (usersCount) usersCount.textContent = `${adminUsers.length} user${adminUsers.length === 1 ? '' : 's'}`;
  if (navUserCount) navUserCount.textContent = String(adminUsers.length);
  if (usersTableBody) usersTableBody.innerHTML = '';
  if (usersCards) usersCards.innerHTML = '';

  if (!adminUsers.length) {
    if (usersEmpty) usersEmpty.hidden = false;
    if (usersTableWrap) usersTableWrap.hidden = true;
    if (usersCards) usersCards.hidden = true;
    return;
  }
  if (usersEmpty) usersEmpty.hidden = true;
  if (usersTableWrap) usersTableWrap.hidden = false;
  if (usersCards) usersCards.hidden = false;

  adminUsers.forEach(user => {
    const row = document.createElement('tr');
    const email = String(user.email || '');
    const isSelf = email.toLowerCase() === currentAdminEmail.toLowerCase();
    const displayName = user.name?.trim() || '—';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const canEdit = !isSelf && !user.isOwner;
    const canDelete = !isSelf && (
      !user.isOwner || (currentAdminIsOwner && ownerCount > 1)
    );

    let actions = '<span class="muted">—</span>';
    if (canEdit || canDelete) {
      actions = '<div class="row-actions">';
      if (canEdit) {
        actions += `<button type="button" class="btn btn-ghost" data-user-edit="${user.id}">Edit access</button>`;
      }
      if (canDelete) {
        actions += `<button type="button" class="btn btn-ghost btn-danger" data-user-delete="${user.id}">Delete</button>`;
      }
      actions += '</div>';
    } else if (isSelf) {
      actions = '<span class="muted">You</span>';
    } else if (user.isOwner) {
      actions = '<span class="muted">Protected</span>';
    }

    row.innerHTML = `
      <td>
        <div class="user-name-cell">
          <strong>${esc(displayName)}</strong>
          ${isSelf ? '<span class="muted">(you)</span>' : ''}
          ${user.isOwner ? '<span class="permission-badge permission-badge--owner">Owner</span>' : ''}
        </div>
      </td>
      <td dir="ltr">
        <span class="user-email${emailOk ? '' : ' user-email--invalid'}">${esc(email || '—')}</span>
        ${emailOk ? '' : '<span class="user-email-warn">Invalid email</span>'}
      </td>
      <td><div class="permission-badges">${formatPermissionBadges(user)}</div></td>
      <td>${fmtDate(user.createdAt)}</td>
      <td>${actions}</td>
    `;
    usersTableBody.append(row);

    if (usersCards) {
      const card = document.createElement('div');
      card.innerHTML = userCardHtml(user, { ownerCount, isSelf, canEdit, canDelete, emailOk });
      usersCards.append(card.firstElementChild);
    }
  });
}

function switchSettingsTab(name) {
  if (!['brand', 'payments', 'notifications', 'support'].includes(name)) name = 'brand';
  activeSettingsTab = name;

  settingsTabs.forEach(btn => {
    const on = btn.dataset.settingsTab === name;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });

  settingsPanels.forEach(panel => {
    const on = panel.dataset.settingsPanel === name;
    panel.classList.toggle('is-active', on);
    panel.hidden = !on;
  });
}

function renderSettings() {
  const apiOn = settingsApiReady;

  if (settingsApiNotice) settingsApiNotice.hidden = apiOn;
  if (settingsContent) settingsContent.hidden = !apiOn;
  if (resetFaviconBtn) resetFaviconBtn.hidden = !apiOn;

  if (!apiOn) return;

  switchSettingsTab(activeSettingsTab);

  const favicon = siteSettings?.favicon;
  getFaviconUpload().showPreview(favicon?.url || '/favicon.svg');

  const paynet = siteSettings?.paynet;
  if (paynet) {
    const enabledEl = document.getElementById('paynetEnabled');
    const modeEl = document.getElementById('paynetMode');
    const currencyEl = document.getElementById('paynetCurrency');
    const domainEl = document.getElementById('paynetDomain');
    const pubEl = document.getElementById('paynetPublishableKey');
    const instalmentEl = document.getElementById('paynetInstalment');

    if (enabledEl) enabledEl.checked = !!paynet.enabled;
    if (modeEl) modeEl.value = paynet.mode === 'live' ? 'live' : 'sandbox';
    if (currencyEl) currencyEl.value = paynet.currency || 'TRY';
    if (domainEl) domainEl.value = paynet.domain || 'marvispace.com';
    if (pubEl) pubEl.value = paynet.publishableKey || '';
    if (instalmentEl) instalmentEl.checked = !!paynet.instalment;

    if (paynetStatusLine) {
      const parts = [];
      if (paynet.secretConfigured) parts.push('Secret key configured on server');
      else parts.push('Secret key missing — add paynet.secret_key to api_config.php');
      if (paynet.ready) parts.push('Checkout ready');
      else if (paynet.enabled) parts.push('Enabled but not ready');
      else parts.push('Disabled');
      paynetStatusLine.textContent = parts.join(' · ');
    }
  }

  const ziraat = siteSettings?.ziraat;
  if (ziraat) {
    const enabledEl = document.getElementById('ziraatEnabled');
    const modeEl = document.getElementById('ziraatMode');
    const currencyEl = document.getElementById('ziraatCurrency');
    const merchantEl = document.getElementById('ziraatMerchantId');
    const instalmentEl = document.getElementById('ziraatInstalment');
    const panelUrlEl = document.getElementById('ziraatPanelUrl');
    const panelUserEl = document.getElementById('ziraatPanelUser');
    const securityCodeEl = document.getElementById('ziraatSecurityCode');
    const supportPhoneEl = document.getElementById('ziraatSupportPhone');
    const storeKeyEl = document.getElementById('ziraatStoreKey');
    const panelLink = document.getElementById('ziraatPanelLink');
    const supportDisplay = document.getElementById('ziraatSupportDisplay');
    const storeKeyStatus = document.getElementById('ziraatStoreKeyStatus');
    const readyStatus = document.getElementById('ziraatReadyStatus');
    const storeKeyHint = document.getElementById('ziraatStoreKeyHint');

    if (enabledEl) enabledEl.checked = !!ziraat.enabled;
    if (modeEl) modeEl.value = ziraat.mode === 'test' ? 'test' : 'live';
    if (currencyEl) currencyEl.value = ziraat.currency || 'TRY';
    if (merchantEl) merchantEl.value = ziraat.merchantId || '192868559';
    if (instalmentEl) instalmentEl.checked = !!ziraat.instalment;
    if (panelUrlEl) panelUrlEl.value = ziraat.panelUrl || 'https://sanalpos2.ziraatbank.com.tr';
    if (panelUserEl) panelUserEl.value = ziraat.panelUser || 'marvisadmin';
    if (securityCodeEl) securityCodeEl.value = ziraat.securityCode || 'OTLN';
    if (supportPhoneEl) supportPhoneEl.value = ziraat.supportPhone || '0212 319 06 19';
    if (storeKeyEl) storeKeyEl.value = '';

    if (panelLink) {
      const url = ziraat.panelUrl || 'https://sanalpos2.ziraatbank.com.tr';
      panelLink.href = url;
      panelLink.textContent = url.replace(/^https?:\/\//, '');
    }
    if (supportDisplay) {
      supportDisplay.textContent = ziraat.supportPhone || '—';
    }
    if (storeKeyStatus) {
      storeKeyStatus.textContent = ziraat.storeKeySet ? 'Configured' : 'Not set';
      storeKeyStatus.classList.toggle('is-ok', !!ziraat.storeKeySet);
      storeKeyStatus.classList.toggle('is-warn', !ziraat.storeKeySet);
    }
    if (readyStatus) {
      readyStatus.textContent = ziraat.ready ? 'Ready' : 'Not ready';
      readyStatus.classList.toggle('is-ok', !!ziraat.ready);
      readyStatus.classList.toggle('is-warn', !ziraat.ready);
    }
    if (storeKeyHint) {
      storeKeyHint.textContent = ziraat.storeKeySet
        ? 'Store key is saved. Enter a new value only to replace it.'
        : 'Create store key in Ziraat panel, then paste it here and save.';
    }

    if (ziraatStatusLine) {
      const parts = [];
      if (ziraat.storeKeySet) parts.push('Store key saved');
      else parts.push('Add store key below');
      if (ziraat.merchantId) parts.push(`Merchant ${ziraat.merchantId}`);
      if (ziraat.securityCode) parts.push(`Code ${ziraat.securityCode}`);
      if (ziraat.ready) parts.push('Checkout live');
      else if (ziraat.enabled) parts.push('Enabled — missing store key');
      else parts.push('Disabled');
      ziraatStatusLine.textContent = parts.join(' · ');
    }
  }

  const notify = siteSettings?.notifications;
  if (notify) {
    const emailEl = document.getElementById('notifyAdminEmail');
    const ordersEl = document.getElementById('notifyOrders');
    const newsletterEl = document.getElementById('notifyNewsletter');
    const smtpEl = document.getElementById('notifySmtpStatus');
    const fromEl = document.getElementById('notifyFromStatus');
    const inboxEl = document.getElementById('notifyInboxStatus');

    if (emailEl) emailEl.value = notify.adminEmail || '';
    if (ordersEl) ordersEl.checked = notify.notifyOrders !== false;
    if (newsletterEl) newsletterEl.checked = notify.notifyNewsletter !== false;

    if (smtpEl) {
      smtpEl.textContent = notify.smtpConfigured ? 'Configured' : 'Not set';
      smtpEl.classList.toggle('is-ok', !!notify.smtpConfigured);
      smtpEl.classList.toggle('is-warn', !notify.smtpConfigured);
    }

    if (fromEl) {
      fromEl.textContent = notify.mailFrom || '—';
      fromEl.classList.toggle('is-ok', !!notify.mailFrom);
    }

    if (inboxEl) {
      inboxEl.textContent = notify.adminEmail || 'Not set';
      inboxEl.classList.toggle('is-ok', !!notify.adminEmail);
      inboxEl.classList.toggle('is-warn', !notify.adminEmail);
    }

    if (notifyStatusLine && !notifyStatusLine.dataset.pending) {
      const hints = [];
      if (!notify.smtpConfigured) {
        hints.push('Add SMTP credentials in api_config.php to send emails');
      }
      if (!notify.adminEmail) {
        hints.push('Set your notification email below');
      }
      notifyStatusLine.textContent = hints.join(' · ');
    }
  }

  const whatsapp = siteSettings?.whatsapp;
  if (whatsapp) {
    const enabledEl = document.getElementById('whatsappEnabled');
    const phoneEl = document.getElementById('whatsappPhone');
    const messageEl = document.getElementById('whatsappMessage');
    const testLink = document.getElementById('whatsappTestLink');
    const statusLine = document.getElementById('whatsappStatusLine');

    if (enabledEl) enabledEl.checked = !!whatsapp.enabled;
    if (phoneEl) phoneEl.value = whatsapp.phone || '';
    if (messageEl) messageEl.value = whatsapp.message || '';

    if (testLink) {
      const url = buildWhatsAppAdminUrl(whatsapp);
      if (url && whatsapp.enabled && whatsapp.phone) {
        testLink.href = url;
        testLink.hidden = false;
      } else {
        testLink.hidden = true;
      }
    }

    if (statusLine && !statusLine.dataset.pending) {
      statusLine.textContent = whatsapp.enabled && whatsapp.phone
        ? `Live on store · +${whatsapp.phone}`
        : 'Disabled — enable and save a phone number to show the chat button';
    }
  }

  renderWhatsAppSetupCard();
}

function buildWhatsAppAdminUrl(config) {
  const phone = String(config?.phone || '').replace(/\D/g, '');
  if (!phone) return '';
  const text = String(config?.message || '').trim();
  const base = `https://wa.me/${phone}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

async function renderWhatsAppSetupCard() {
  const card = document.getElementById('whatsappSetupCard');
  const status = document.getElementById('whatsappSetupStatus');
  const configureBtn = document.getElementById('whatsappConfigureBtn');
  const previewBtn = document.getElementById('whatsappPreviewBtn');
  if (!card || !status) return;

  let whatsapp = siteSettings?.whatsapp;
  if (!whatsapp) {
    try {
      const publicSettings = await fetchSiteSettings();
      whatsapp = publicSettings?.whatsapp;
    } catch {
      whatsapp = null;
    }
  }

  const canConfigure = canAccessSection('settings');
  if (configureBtn) configureBtn.hidden = !canConfigure;

  if (whatsapp?.enabled && whatsapp?.phone) {
    card.classList.add('is-connected');
    status.textContent = `Connected · customers can chat on +${whatsapp.phone}`;
    if (previewBtn) {
      previewBtn.href = whatsapp.url || buildWhatsAppAdminUrl(whatsapp);
      previewBtn.hidden = false;
    }
  } else {
    card.classList.remove('is-connected');
    status.textContent = canConfigure
      ? 'Not connected — add your WhatsApp number in Settings → Support.'
      : 'WhatsApp support is not active. Ask an admin to configure it in Settings.';
    if (previewBtn) previewBtn.hidden = true;
  }
}

function resetForm() {
  productForm?.reset();
  if (fields.id) fields.id.value = '';
  if (fields.inStock) fields.inStock.checked = true;
  if (fields.discount) fields.discount.value = '0';
  if (fields.sizes) fields.sizes.value = DEFAULT_SIZES.join(',');
  if (formTitle) formTitle.textContent = 'Add product';
  imageUpload.reset();
}

function fillForm(product) {
  fields.id.value = product.id;
  fields.label.value = product.label;
  fields.price.value = String(product.price);
  fields.discount.value = String(discountPercent(product));
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
    discountPercent: Number(fields.discount.value || 0),
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
    else if (filter === 'sale') matchF = discountPercent(p) > 0;

    return matchQ && matchF;
  });
}

function stockStatus(product) {
  if (!product.inStock) return { cls: 'off', label: 'Out of stock' };
  if (product.stock <= 5) return { cls: 'low', label: 'Low stock' };
  return { cls: 'on', label: 'In stock' };
}

function handleProductSelectChange(checkbox) {
  toggleProductSelection(checkbox.dataset.id, checkbox.checked);
  checkbox.closest('tr')?.classList.toggle('is-selected', checkbox.checked);
  checkbox.closest('.product-card')?.classList.toggle('is-selected', checkbox.checked);
}

async function handleProductAction(btn) {
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
      selectedProductIds.delete(id);
      await refreshData();
      showToast('Product deleted');
    } catch (err) {
      showToast(err.message || 'Could not delete product');
    }
  }
}

async function handleUserCardClick(e) {
  const editBtn = e.target.closest('button[data-user-edit]');
  if (editBtn) {
    const id = Number(editBtn.dataset.userEdit);
    const user = adminUsers.find(item => item.id === id);
    if (user) openUserModal(user);
    return;
  }

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
}

function updateProductSelectionUi() {
  const count = selectedProductIds.size;
  const hasSelection = count > 0;

  if (productBulkBar) productBulkBar.hidden = !hasSelection;
  if (bulkEditBtn) bulkEditBtn.hidden = !hasSelection;
  if (productSelectionLabel) {
    productSelectionLabel.textContent = count === 1 ? '1 product selected' : `${count} products selected`;
  }

  const filteredIds = lastFilteredProductIds;
  const allFilteredSelected = filteredIds.length > 0
    && filteredIds.every(id => selectedProductIds.has(id));

  if (productSelectAllVisible) {
    productSelectAllVisible.checked = allFilteredSelected;
    productSelectAllVisible.indeterminate = !allFilteredSelected
      && filteredIds.some(id => selectedProductIds.has(id));
  }
  if (productSelectAllFiltered) {
    productSelectAllFiltered.checked = allFilteredSelected;
    productSelectAllFiltered.indeterminate = productSelectAllVisible?.indeterminate ?? false;
  }
}

function toggleProductSelection(id, checked) {
  if (checked) selectedProductIds.add(id);
  else selectedProductIds.delete(id);
  updateProductSelectionUi();
}

function selectFilteredProducts(checked) {
  lastFilteredProductIds.forEach(id => {
    if (checked) selectedProductIds.add(id);
    else selectedProductIds.delete(id);
  });
  updateProductSelectionUi();
  renderProducts();
}

function clearProductSelection() {
  selectedProductIds.clear();
  updateProductSelectionUi();
  renderProducts();
}

function resetBulkEditForm() {
  bulkEditForm?.reset();
  if (bulkCategory) bulkCategory.disabled = true;
  if (bulkGender) bulkGender.disabled = true;
  if (bulkVisibility) bulkVisibility.disabled = true;
  if (bulkDiscountValue) bulkDiscountValue.disabled = true;
  if (bulkPriceMode) bulkPriceMode.disabled = true;
  if (bulkPriceValue) bulkPriceValue.disabled = true;
  if (bulkStockMode) bulkStockMode.disabled = true;
  if (bulkStockValue) bulkStockValue.disabled = true;
}

function openBulkEditModal() {
  if (!bulkEditModal || selectedProductIds.size === 0) return;
  const count = selectedProductIds.size;
  if (bulkEditTitle) {
    bulkEditTitle.textContent = count === 1 ? 'Bulk edit · 1 product' : `Bulk edit · ${count} products`;
  }
  if (bulkEditLead) {
    bulkEditLead.textContent = `Changes apply to ${count} selected product${count === 1 ? '' : 's'}. Enable only the fields you want to update.`;
  }
  resetBulkEditForm();
  bulkEditModal.hidden = false;
  bulkEditModal.setAttribute('aria-hidden', 'false');
}

function closeBulkEditModal() {
  if (!bulkEditModal) return;
  bulkEditModal.hidden = true;
  bulkEditModal.setAttribute('aria-hidden', 'true');
}

function readBulkEditPayload() {
  const payload = { ids: [...selectedProductIds] };

  if (bulkEnablePrice?.checked) {
    payload.price = {
      mode: bulkPriceMode?.value || 'percent_increase',
      value: Number(bulkPriceValue?.value || 0),
    };
  }
  if (bulkEnableStock?.checked) {
    payload.stock = {
      mode: bulkStockMode?.value || 'add',
      value: Number(bulkStockValue?.value || 0),
    };
  }
  if (bulkEnableCategory?.checked) {
    payload.category = bulkCategory?.value || 'jackets';
  }
  if (bulkEnableGender?.checked) {
    payload.gender = bulkGender?.value || 'mens';
  }
  if (bulkEnableVisibility?.checked) {
    payload.inStock = bulkVisibility?.value === '1';
  }
  if (bulkEnableDiscount?.checked) {
    payload.discountPercent = Number(bulkDiscountValue?.value || 0);
  }

  return payload;
}

function renderProducts() {
  const list = getFilteredProducts();
  lastFilteredProductIds = list.map(p => p.id);
  productsTableBody.innerHTML = '';
  if (productsCards) productsCards.innerHTML = '';
  const tableWrap = productsTableWrap || productsTableBody?.closest('.table-wrap');

  if (productsCount) productsCount.textContent = `${products.length} products`;
  if (navProductCount) navProductCount.textContent = String(products.length);
  if (productsEmpty) productsEmpty.hidden = list.length > 0;
  if (tableWrap) tableWrap.hidden = list.length === 0;
  if (productsCards) productsCards.hidden = list.length === 0;
  if (productBulkBar && list.length === 0) productBulkBar.hidden = true;

  list.forEach(product => {
    const row = document.createElement('tr');
    if (selectedProductIds.has(product.id)) row.classList.add('is-selected');
    const st = stockStatus(product);
    const thumb = product.image
      ? `<img class="thumb" src="${esc(product.image)}" alt="${esc(product.label)}" loading="lazy" />`
      : `<div class="thumb-empty">—</div>`;
    const checked = selectedProductIds.has(product.id) ? 'checked' : '';

    row.innerHTML = `
      <td class="col-check">
        <input type="checkbox" class="product-select" data-id="${esc(product.id)}" aria-label="Select ${esc(product.label)}" ${checked} />
      </td>
      <td>${thumb}</td>
      <td><strong>${esc(product.label)}</strong></td>
      <td>${categoryLabel(product.category)}</td>
      <td>${genderLabel(product.gender)}</td>
      <td dir="ltr">${priceCell(product)}</td>
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

    if (productsCards) {
      const card = document.createElement('div');
      card.innerHTML = productCardHtml(product);
      productsCards.append(card.firstElementChild);
    }
  });

  updateProductSelectionUi();
}

function orderStatusLabel(status) {
  if (status === 'completed') return { cls: 'on', label: 'Completed' };
  if (status === 'processing') return { cls: 'info', label: 'Processing' };
  if (status === 'shipped') return { cls: 'on', label: 'Shipped' };
  if (status === 'cancelled') return { cls: 'danger', label: 'Cancelled' };
  if (status === 'awaiting_payment') return { cls: 'warn', label: 'Awaiting payment' };
  return { cls: 'pending', label: 'Pending' };
}

function paymentStatusLabel(value) {
  if (value === 'paid') return { cls: 'on', label: 'Paid' };
  if (value === 'pending') return { cls: 'warn', label: 'Pending' };
  if (value === 'failed') return { cls: 'danger', label: 'Failed' };
  if (value === 'unpaid') return { cls: 'off', label: 'Unpaid' };
  return { cls: 'off', label: value || '—' };
}

function paymentStatusText(value) {
  return paymentStatusLabel(value).label;
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

  activeOrderId = order.id;
  const customer = order.customer || {};
  const st = orderStatusLabel(order.status);
  const pay = paymentStatusLabel(order.paymentStatus);
  if (orderModalTitle) orderModalTitle.textContent = `Order ${shortOrderId(order.id)}`;

  if (orderModalStatus) {
    orderModalStatus.innerHTML = orderStatusOptionsHtml(order.status || 'pending');
  }
  if (orderModalEmail) {
    const email = customer.email || '';
    orderModalEmail.href = email ? `mailto:${email}?subject=${encodeURIComponent(`Order ${order.id}`)}` : '#';
    orderModalEmail.hidden = !email;
  }
  if (orderModalCopyId) {
    orderModalCopyId.dataset.orderId = order.id;
  }

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
    <div class="order-modal-hero">
      <div class="order-modal-hero__main">
        <p class="order-modal-hero__customer">${esc(customerName(customer))}</p>
        <p class="order-modal-hero__email muted" dir="ltr">${esc(customer.email || '—')}</p>
      </div>
      <div class="order-modal-hero__side">
        <strong class="order-modal-hero__total" dir="ltr">${money(order.total)}</strong>
        <div class="order-modal-hero__badges">
          <span class="status-pill ${st.cls}">${st.label}</span>
          <span class="status-pill ${pay.cls}">${pay.label}</span>
        </div>
      </div>
    </div>
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
        <div class="detail-row">
          <span class="detail-label">Payment status</span>
          <div class="detail-value"><span class="status-pill ${pay.cls}">${pay.label}</span></div>
        </div>
        ${order.gatewayTransactionId ? detailRow('Transaction ID', order.gatewayTransactionId, { ltr: true }) : ''}
        ${order.paidAt ? detailRow('Paid at', fmtDate(order.paidAt)) : ''}
        ${order.paymentError ? detailRow('Payment error', order.paymentError) : ''}
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
  activeOrderId = null;
  orderModal.hidden = true;
  orderModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function getFilteredOrders() {
  const q = (orderSearch?.value || '').trim().toLowerCase();
  const statusFilter = orderStatusFilter?.value || 'all';
  const paymentFilter = orderPaymentFilter?.value || 'all';
  const sort = orderSort?.value || 'newest';

  let list = orders.filter(order => {
    const customer = order.customer || {};
    const name = customerName(customer).toLowerCase();
    const email = (customer.email || '').toLowerCase();
    const phone = (customer.phone || '').toLowerCase();
    const id = (order.id || '').toLowerCase();
    const itemsText = (order.items || [])
      .map(item => `${item.label || ''} ${item.size || ''}`)
      .join(' ')
      .toLowerCase();
    const matchQ = !q
      || id.includes(q)
      || name.includes(q)
      || email.includes(q)
      || phone.includes(q)
      || itemsText.includes(q);

    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    const pay = orderPaymentKey(order);
    const matchPayment = paymentFilter === 'all' || pay === paymentFilter;
    const matchQuick = orderMatchesQuickFilter(order);

    return matchQ && matchStatus && matchPayment && matchQuick;
  });

  list = [...list].sort((a, b) => {
    if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === 'total-desc') return (Number(b.total) || 0) - (Number(a.total) || 0);
    if (sort === 'total-asc') return (Number(a.total) || 0) - (Number(b.total) || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return list;
}

function renderOrderStats() {
  if (!ordersStats) return;

  const action = orderQuickFilterCount('action');
  const processing = orderQuickFilterCount('progress');
  const completed = orderQuickFilterCount('completed');
  const revenue = orderPaidRevenue(orders);

  const statBtn = (filter, label, value, { accent = false, hint = '' } = {}) => `
    <button
      type="button"
      class="orders-stat${accent ? ' orders-stat--accent' : ''}${orderQuickFilter === filter ? ' is-active' : ''}"
      data-order-stat="${filter}"
      aria-pressed="${orderQuickFilter === filter}"
    >
      <span class="orders-stat__label">${label}</span>
      <strong class="orders-stat__value"${accent ? ' dir="ltr"' : ''}>${value}</strong>
      ${hint ? `<span class="orders-stat__hint">${hint}</span>` : ''}
    </button>
  `;

  ordersStats.innerHTML = [
    statBtn('action', 'Needs action', action, { hint: action ? 'Pending or unpaid' : 'All caught up' }),
    statBtn('progress', 'In progress', processing, { hint: 'Processing & shipped' }),
    statBtn('completed', 'Completed', completed, { hint: 'Fulfilled orders' }),
    statBtn('paid', 'Paid revenue', money(revenue), { accent: true, hint: 'Paid · excludes cancelled' }),
  ].join('');
}

function exportOrdersCsv() {
  const list = getFilteredOrders();
  if (!list.length) {
    showToast('No orders to export');
    return;
  }

  const rows = [
    ['Order ID', 'Date', 'Customer', 'Email', 'Phone', 'Items', 'Products', 'Total', 'Status', 'Payment', 'Payment method'],
  ];

  list.forEach(order => {
    const customer = order.customer || {};
    rows.push([
      order.id,
      order.createdAt || '',
      customerName(customer),
      customer.email || '',
      customer.phone || '',
      String(orderItemCount(order)),
      orderItemsPreview(order, 8),
      String(order.total ?? ''),
      order.status || '',
      order.paymentStatus || '',
      paymentLabel(customer.payment),
    ]);
  });

  const csv = rows
    .map(cols => cols.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `marvispace-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${list.length} orders`);
}

function renderOrders() {
  renderOrderStats();
  renderOrderQuickFilters();

  if (!ordersTableBody) return;

  const list = getFilteredOrders();
  const tableWrap = ordersTableWrap || ordersTableBody.closest('.table-wrap');
  const filtersActive = ordersFiltersActive();
  if (clearOrderFiltersBtn) clearOrderFiltersBtn.hidden = !filtersActive;

  if (ordersCount) {
    ordersCount.textContent = list.length === orders.length
      ? `${orders.length} orders`
      : `${list.length} of ${orders.length} orders`;
  }
  if (navOrderCount) navOrderCount.textContent = String(orders.length);
  ordersTableBody.innerHTML = '';
  if (ordersCards) ordersCards.innerHTML = '';

  if (!orders.length) {
    if (ordersEmpty) ordersEmpty.hidden = false;
    if (ordersFilterEmpty) ordersFilterEmpty.hidden = true;
    if (tableWrap) tableWrap.hidden = true;
    if (ordersCards) ordersCards.hidden = true;
    return;
  }
  if (ordersEmpty) ordersEmpty.hidden = true;

  if (!list.length) {
    if (ordersFilterEmpty) ordersFilterEmpty.hidden = false;
    if (tableWrap) tableWrap.hidden = true;
    if (ordersCards) ordersCards.hidden = true;
    return;
  }
  if (ordersFilterEmpty) ordersFilterEmpty.hidden = true;
  if (tableWrap) tableWrap.hidden = false;
  if (ordersCards) ordersCards.hidden = false;

  list.forEach(order => {
    const row = document.createElement('tr');
    row.className = orderRowClass(order);
    row.dataset.orderId = order.id;
    row.innerHTML = orderRowHtml(order);
    ordersTableBody.append(row);

    if (ordersCards) {
      const wrap = document.createElement('div');
      wrap.innerHTML = orderCardHtml(order);
      const card = wrap.firstElementChild;
      if (card) ordersCards.append(card);
    }
  });
}

function renderDashboard() {
  const inStock = products.filter(p => p.inStock).length;
  const outStock = products.length - inStock;
  const revenue = orderPaidRevenue(orders);

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
  syncPageHeader();
}

async function refreshData() {
  products = await loadProducts([]);
  orders = await loadOrders();
  await Promise.all([loadAdminUsers(), loadSiteSettings()]);
  renderAll();
}

/* ── Events ── */
navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
    if (btn.dataset.tab) {
      window.location.hash = btn.dataset.tab;
    }
  });
});

window.addEventListener('hashchange', () => {
  const hashTab = window.location.hash.replace(/^#/, '');
  if (hashTab.startsWith('settings')) {
    if (hashTab.startsWith('settings-')) {
      activeSettingsTab = hashTab.slice('settings-'.length);
    }
    switchTab('settings');
  } else if (hashTab && VIEW_META[hashTab]) {
    switchTab(hashTab);
  }
});

document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.goto;
    if (btn.dataset.settingsTab) {
      activeSettingsTab = btn.dataset.settingsTab;
      try {
        window.history.replaceState(null, '', `#settings-${btn.dataset.settingsTab}`);
      } catch {
        /* ignore */
      }
    }
    switchTab(tab);
    if (tab === 'settings') {
      switchSettingsTab(activeSettingsTab);
    }
  });
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
  const permissions = readUserFormPermissions();

  if (!editingUserId && password !== confirmPassword) {
    if (userFormError) {
      userFormError.hidden = false;
      userFormError.textContent = 'Passwords do not match.';
    }
    return;
  }

  try {
    if (editingUserId) {
      await adminUpdateUser(editingUserId, { name, permissions });
      showToast('Access updated');
    } else {
      await adminCreateUser({ email, name, password, confirmPassword, permissions });
      showToast('Admin user created');
    }
    await loadAdminUsers();
    renderUsers();
    closeUserModal();
  } catch (err) {
    if (userFormError) {
      userFormError.hidden = false;
      userFormError.textContent = err.message || 'Could not save user.';
    }
  }
});

usersTableBody?.addEventListener('click', handleUserCardClick);
usersCards?.addEventListener('click', handleUserCardClick);

resetFormBtn?.addEventListener('click', closeModal);

productModal?.querySelectorAll('[data-close-modal]').forEach(el => {
  el.addEventListener('click', closeModal);
});

productSearch?.addEventListener('input', renderProducts);
productFilter?.addEventListener('change', renderProducts);

productSelectAllVisible?.addEventListener('change', e => {
  selectFilteredProducts(e.target.checked);
});

productSelectAllFiltered?.addEventListener('change', e => {
  selectFilteredProducts(e.target.checked);
});

bulkEditBtn?.addEventListener('click', openBulkEditModal);
openBulkEditBtn?.addEventListener('click', openBulkEditModal);
clearProductSelectionBtn?.addEventListener('click', clearProductSelection);

bulkEnableCategory?.addEventListener('change', e => {
  if (bulkCategory) bulkCategory.disabled = !e.target.checked;
});
bulkEnableGender?.addEventListener('change', e => {
  if (bulkGender) bulkGender.disabled = !e.target.checked;
});
bulkEnableVisibility?.addEventListener('change', e => {
  if (bulkVisibility) bulkVisibility.disabled = !e.target.checked;
});
bulkEnableDiscount?.addEventListener('change', e => {
  if (bulkDiscountValue) bulkDiscountValue.disabled = !e.target.checked;
});
bulkEnablePrice?.addEventListener('change', e => {
  const on = e.target.checked;
  if (bulkPriceMode) bulkPriceMode.disabled = !on;
  if (bulkPriceValue) bulkPriceValue.disabled = !on;
});
bulkEnableStock?.addEventListener('change', e => {
  const on = e.target.checked;
  if (bulkStockMode) bulkStockMode.disabled = !on;
  if (bulkStockValue) bulkStockValue.disabled = !on;
});

bulkEditModal?.querySelectorAll('[data-close-bulk-modal]').forEach(el => {
  el.addEventListener('click', closeBulkEditModal);
});

bulkEditForm?.addEventListener('submit', async e => {
  e.preventDefault();
  if (selectedProductIds.size === 0) {
    showToast('Select at least one product');
    return;
  }

  const payload = readBulkEditPayload();
  const changeCount = ['price', 'stock', 'category', 'gender', 'inStock', 'discountPercent']
    .filter(key => key in payload).length;
  if (!changeCount) {
    showToast('Enable at least one field to update');
    return;
  }

  const count = payload.ids.length;
  const summary = [];
  if (payload.price) summary.push('price');
  if (payload.stock) summary.push('stock');
  if (payload.category) summary.push('category');
  if (payload.gender) summary.push('gender');
  if (payload.inStock !== undefined) summary.push('visibility');
  if (payload.discountPercent !== undefined) summary.push('sale discount');

  if (!confirm(`Apply ${summary.join(', ')} changes to ${count} product${count === 1 ? '' : 's'}?`)) {
    return;
  }

  if (bulkEditSubmitBtn) bulkEditSubmitBtn.disabled = true;
  try {
    const result = await bulkUpdateProducts(payload);
    await refreshData();
    closeBulkEditModal();
    const updated = result?.updated ?? count;
    showToast(`Updated ${updated} product${updated === 1 ? '' : 's'}`);
  } catch (err) {
    showToast(err.message || 'Bulk update failed');
  } finally {
    if (bulkEditSubmitBtn) bulkEditSubmitBtn.disabled = false;
  }
});

productsTableBody?.addEventListener('change', e => {
  const checkbox = e.target.closest('.product-select');
  if (!checkbox) return;
  handleProductSelectChange(checkbox);
});

productsCards?.addEventListener('change', e => {
  const checkbox = e.target.closest('.product-select');
  if (!checkbox) return;
  handleProductSelectChange(checkbox);
});

productForm?.addEventListener('submit', async e => {
  e.preventDefault();

  // Relative image paths fail type=url validation; keep a clear fallback message.
  if (typeof productForm.checkValidity === 'function' && !productForm.checkValidity()) {
    productForm.reportValidity();
    showToast('Fill required fields before saving');
    return;
  }

  if (!fields.image?.value?.trim()) {
    showToast('Add a main product image');
    fields.image?.focus?.();
    return;
  }

  const saveBtn = document.getElementById('saveProductBtn');
  if (saveBtn) saveBtn.disabled = true;

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
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
});

productsTableBody?.addEventListener('click', async e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  await handleProductAction(btn);
});

productsCards?.addEventListener('click', async e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  await handleProductAction(btn);
});

async function applyOrderStatus(orderId, status) {
  if (!orderId || !status) return false;
  try {
    await setOrderStatus(orderId, status);
    orders = await loadOrders();
    renderAll();
    showToast('Order status updated');
    if (activeOrderId === orderId) {
      const order = orders.find(item => item.id === orderId);
      if (order) openOrderModal(order);
    }
    return true;
  } catch (err) {
    showToast(err.message || 'Could not update order');
    return false;
  }
}

ordersTableBody?.addEventListener('pointerdown', e => {
  if (e.target.closest('select[data-order-status]')) e.stopPropagation();
});

ordersTableBody?.addEventListener('click', async e => {
  if (e.target.closest('select, a, button[data-copy-order-id], button[data-order-view]')) {
    const viewBtn = e.target.closest('button[data-order-view]');
    if (viewBtn) {
      const order = orders.find(item => item.id === viewBtn.dataset.orderId);
      if (order) openOrderModal(order);
    }

    const copyBtn = e.target.closest('[data-copy-order-id]');
    if (copyBtn) {
      const id = copyBtn.dataset.copyOrderId;
      try {
        await navigator.clipboard.writeText(id);
        showToast('Order ID copied');
      } catch {
        showToast(id);
      }
    }
    return;
  }

  const row = e.target.closest('tr.order-row');
  if (row?.dataset.orderId) {
    const order = orders.find(item => item.id === row.dataset.orderId);
    if (order) openOrderModal(order);
  }
});

ordersCards?.addEventListener('pointerdown', e => {
  if (e.target.closest('select[data-order-status]')) e.stopPropagation();
});

ordersCards?.addEventListener('click', async e => {
  if (e.target.closest('select, a')) return;

  const viewBtn = e.target.closest('button[data-order-view]');
  if (viewBtn) {
    const order = orders.find(item => item.id === viewBtn.dataset.orderId);
    if (order) openOrderModal(order);
    return;
  }

  const copyBtn = e.target.closest('[data-copy-order-id]');
  if (copyBtn) {
    const id = copyBtn.dataset.copyOrderId;
    try {
      await navigator.clipboard.writeText(id);
      showToast('Order ID copied');
    } catch {
      showToast(id);
    }
    return;
  }

  const card = e.target.closest('.order-card');
  if (card?.dataset.orderId) {
    const order = orders.find(item => item.id === card.dataset.orderId);
    if (order) openOrderModal(order);
  }
});

ordersStats?.addEventListener('click', e => {
  const btn = e.target.closest('[data-order-stat]');
  if (!btn) return;
  const next = btn.dataset.orderStat || 'all';
  orderQuickFilter = orderQuickFilter === next ? 'all' : next;
  renderOrders();
});

ordersQuickFilters?.addEventListener('click', e => {
  const btn = e.target.closest('[data-order-quick]');
  if (!btn) return;
  const next = btn.dataset.orderQuick || 'all';
  orderQuickFilter = orderQuickFilter === next && next !== 'all' ? 'all' : next;
  renderOrders();
});

clearOrderFiltersBtn?.addEventListener('click', clearOrderFilters);
document.getElementById('ordersFilterEmptyClear')?.addEventListener('click', clearOrderFilters);

orderModalCopyId?.addEventListener('click', async () => {
  const id = orderModalCopyId.dataset.orderId || activeOrderId;
  if (!id) return;
  try {
    await navigator.clipboard.writeText(id);
    showToast('Order ID copied');
  } catch {
    showToast(id);
  }
});

async function handleOrderStatusChange(select) {
  if (!select) return;
  const orderId = select.dataset.orderId;
  const prev = orders.find(item => item.id === orderId)?.status || 'pending';
  select.className = orderStatusSelectClass(select.value);
  const ok = await applyOrderStatus(orderId, select.value);
  if (!ok && select.isConnected) {
    select.value = prev;
    select.className = orderStatusSelectClass(prev);
  }
}

ordersTableBody?.addEventListener('change', async e => {
  await handleOrderStatusChange(e.target.closest('select[data-order-status]'));
});

ordersCards?.addEventListener('change', async e => {
  await handleOrderStatusChange(e.target.closest('select[data-order-status]'));
});

orderSearch?.addEventListener('input', () => renderOrders());
orderStatusFilter?.addEventListener('change', () => renderOrders());
orderPaymentFilter?.addEventListener('change', () => renderOrders());
orderSort?.addEventListener('change', () => renderOrders());
exportOrdersBtn?.addEventListener('click', exportOrdersCsv);

orderModalSaveStatus?.addEventListener('click', async () => {
  if (!activeOrderId || !orderModalStatus) return;
  await applyOrderStatus(activeOrderId, orderModalStatus.value);
});

orderModal?.querySelectorAll('[data-close-order-modal]').forEach(el => {
  el.addEventListener('click', closeOrderModal);
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (productModal && !productModal.hidden) closeModal();
  if (userModal && !userModal.hidden) closeUserModal();
  if (orderModal && !orderModal.hidden) closeOrderModal();
  if (bulkEditModal && !bulkEditModal.hidden) closeBulkEditModal();
});

paynetSettingsForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const saveBtn = document.getElementById('savePaynetBtn');
  if (saveBtn) saveBtn.disabled = true;
  try {
    const payload = {
      enabled: document.getElementById('paynetEnabled')?.checked || false,
      mode: document.getElementById('paynetMode')?.value || 'sandbox',
      currency: document.getElementById('paynetCurrency')?.value || 'TRY',
      domain: document.getElementById('paynetDomain')?.value?.trim() || 'marvispace.com',
      publishableKey: document.getElementById('paynetPublishableKey')?.value?.trim() || '',
      instalment: document.getElementById('paynetInstalment')?.checked || false,
    };
    const updated = await adminSavePaynetSettings(payload);
    siteSettings = { ...(siteSettings || {}), ...updated };
    renderSettings();
    showToast('Payment settings saved');
  } catch (err) {
    showToast(err.message || 'Could not save payment settings');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
});

ziraatSettingsForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const saveBtn = document.getElementById('saveZiraatBtn');
  if (saveBtn) saveBtn.disabled = true;
  try {
    const payload = {
      enabled: document.getElementById('ziraatEnabled')?.checked || false,
      mode: document.getElementById('ziraatMode')?.value || 'live',
      currency: document.getElementById('ziraatCurrency')?.value || 'TRY',
      merchantId: document.getElementById('ziraatMerchantId')?.value?.trim() || '',
      panelUrl: document.getElementById('ziraatPanelUrl')?.value?.trim() || '',
      panelUser: document.getElementById('ziraatPanelUser')?.value?.trim() || '',
      securityCode: document.getElementById('ziraatSecurityCode')?.value?.trim() || '',
      supportPhone: document.getElementById('ziraatSupportPhone')?.value?.trim() || '',
      storeKey: document.getElementById('ziraatStoreKey')?.value?.trim() || '',
      instalment: document.getElementById('ziraatInstalment')?.checked || false,
    };
    const updated = await adminSaveZiraatSettings(payload);
    siteSettings = { ...(siteSettings || {}), ...updated };
    renderSettings();
    showToast('Ziraat settings saved');
  } catch (err) {
    showToast(err.message || 'Could not save Ziraat settings');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
});

settingsTabs.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.settingsTab;
    if (!tab) return;
    activeSettingsTab = tab;
    try {
      window.history.replaceState(null, '', `#settings-${tab}`);
    } catch {
      /* ignore */
    }
    switchSettingsTab(tab);
  });
});

notificationSettingsForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const saveBtn = document.getElementById('saveNotifyBtn');
  if (saveBtn) saveBtn.disabled = true;
  if (notifyStatusLine) {
    notifyStatusLine.dataset.pending = '1';
    notifyStatusLine.textContent = 'Saving…';
  }
  try {
    const payload = {
      adminEmail: document.getElementById('notifyAdminEmail')?.value?.trim() || '',
      notifyOrders: document.getElementById('notifyOrders')?.checked ?? true,
      notifyNewsletter: document.getElementById('notifyNewsletter')?.checked ?? true,
    };
    const updated = await adminSaveNotificationSettings(payload);
    siteSettings = { ...(siteSettings || {}), ...updated };
    if (notifyStatusLine) {
      delete notifyStatusLine.dataset.pending;
      notifyStatusLine.textContent = 'Notification settings saved';
    }
    renderSettings();
    showToast('Notification settings saved');
  } catch (err) {
    if (notifyStatusLine) {
      delete notifyStatusLine.dataset.pending;
      notifyStatusLine.textContent = err.message || 'Could not save';
    }
    showToast(err.message || 'Could not save notification settings');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
});

document.getElementById('testNotifyBtn')?.addEventListener('click', async () => {
  const testBtn = document.getElementById('testNotifyBtn');
  if (testBtn) testBtn.disabled = true;
  if (notifyStatusLine) {
    notifyStatusLine.dataset.pending = '1';
    notifyStatusLine.textContent = 'Sending test email…';
  }
  try {
    await adminSendTestNotification();
    if (notifyStatusLine) {
      delete notifyStatusLine.dataset.pending;
      notifyStatusLine.textContent = 'Test email sent — check your inbox';
    }
    showToast('Test email sent');
  } catch (err) {
    if (notifyStatusLine) {
      delete notifyStatusLine.dataset.pending;
      notifyStatusLine.textContent = err.message || 'Send failed';
    }
    showToast(err.message || 'Could not send test email');
  } finally {
    if (testBtn) testBtn.disabled = false;
  }
});

document.getElementById('whatsappSettingsForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const saveBtn = document.getElementById('saveWhatsAppBtn');
  const statusLine = document.getElementById('whatsappStatusLine');
  if (saveBtn) saveBtn.disabled = true;
  if (statusLine) {
    statusLine.dataset.pending = '1';
    statusLine.textContent = 'Saving…';
  }
  try {
    const payload = {
      enabled: document.getElementById('whatsappEnabled')?.checked || false,
      phone: document.getElementById('whatsappPhone')?.value?.trim() || '',
      message: document.getElementById('whatsappMessage')?.value?.trim() || '',
    };
    const updated = await adminSaveWhatsAppSettings(payload);
    siteSettings = { ...(siteSettings || {}), ...updated };
    if (statusLine) {
      delete statusLine.dataset.pending;
      statusLine.textContent = 'WhatsApp settings saved';
    }
    renderSettings();
    showToast('WhatsApp support updated');
  } catch (err) {
    if (statusLine) {
      delete statusLine.dataset.pending;
      statusLine.textContent = err.message || 'Could not save';
    }
    showToast(err.message || 'Could not save WhatsApp settings');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
});

logoutBtn?.addEventListener('click', signOutAdmin);
topbarLogoutBtn?.addEventListener('click', signOutAdmin);

mountAdminLogin({ onSuccess: showApp });

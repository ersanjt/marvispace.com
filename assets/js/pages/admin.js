import {
  createId,
  DEFAULT_SIZES,
  isApiEnabled,
  loadOrders,
  loadProducts,
  normalizeProduct,
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
const productBulkBar = document.getElementById('productBulkBar');
const productSelectionLabel = document.getElementById('productSelectionLabel');
const productSelectAllVisible = document.getElementById('productSelectAllVisible');
const productSelectAllFiltered = document.getElementById('productSelectAllFiltered');
const bulkEditBtn = document.getElementById('bulkEditBtn');
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
const bulkEnableVisibility = document.getElementById('bulkEnableVisibility');
const bulkVisibility = document.getElementById('bulkVisibility');

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

  if (usersApiNotice) usersApiNotice.hidden = apiOn;
  if (usersTableWrap) usersTableWrap.hidden = !apiOn;
  if (newUserBtn) newUserBtn.hidden = !apiOn || !canAccessSection('users');
  if (topNewUserBtn) topNewUserBtn.hidden = activeTab !== 'users' || !apiOn || !canAccessSection('users');

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
      <td><strong>${esc(displayName)}</strong>${isSelf ? ' <span class="muted">(you)</span>' : ''}${user.isOwner ? ' <span class="permission-badge permission-badge--owner">Owner</span>' : ''}</td>
      <td dir="ltr">${esc(user.email)}</td>
      <td><div class="permission-badges">${formatPermissionBadges(user)}</div></td>
      <td>${fmtDate(user.createdAt)}</td>
      <td>
        ${isSelf || user.isOwner
    ? '<span class="muted">—</span>'
    : `<button type="button" class="btn btn-ghost" data-user-edit="${user.id}">Edit access</button>
       <button type="button" class="btn btn-ghost btn-danger" data-user-delete="${user.id}">Delete</button>`}
      </td>
    `;
    usersTableBody.append(row);
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

  return payload;
}

function renderProducts() {
  const list = getFilteredProducts();
  lastFilteredProductIds = list.map(p => p.id);
  productsTableBody.innerHTML = '';

  if (productsCount) productsCount.textContent = `${products.length} products`;
  if (navProductCount) navProductCount.textContent = String(products.length);
  if (productsEmpty) productsEmpty.hidden = list.length > 0;

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

  updateProductSelectionUi();
}

function orderStatusLabel(status) {
  if (status === 'completed') return { cls: 'on', label: 'Completed' };
  if (status === 'processing') return { cls: 'low', label: 'Processing' };
  if (status === 'shipped') return { cls: 'on', label: 'Shipped' };
  if (status === 'cancelled') return { cls: 'off', label: 'Cancelled' };
  if (status === 'awaiting_payment') return { cls: 'low', label: 'Awaiting payment' };
  return { cls: 'off', label: 'Pending' };
}

function paymentStatusLabel(value) {
  if (value === 'paid') return 'Paid';
  if (value === 'pending') return 'Pending';
  if (value === 'failed') return 'Failed';
  if (value === 'unpaid') return 'Unpaid';
  return value || '—';
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
        ${detailRow('Payment status', paymentStatusLabel(order.paymentStatus))}
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

usersTableBody?.addEventListener('click', async e => {
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
});

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
  const changeCount = ['price', 'stock', 'category', 'gender', 'inStock']
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
  toggleProductSelection(checkbox.dataset.id, checkbox.checked);
  checkbox.closest('tr')?.classList.toggle('is-selected', checkbox.checked);
});

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
      selectedProductIds.delete(id);
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

mountAdminLogin({ onSuccess: showApp });

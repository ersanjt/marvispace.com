import { products as seedProducts } from '../data/products.js';
import {
  createId,
  DEFAULT_SIZES,
  getOrders,
  getProducts,
  normalizeProduct,
  saveProducts,
  updateOrderStatus,
} from '../core/storage.js';

const adminApp = document.getElementById('adminApp');
const navItems = [...document.querySelectorAll('.nav-item')];
const viewPanels = [...document.querySelectorAll('.view-panel')];
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const topNewProductBtn = document.getElementById('topNewProductBtn');

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

const statTotal = document.getElementById('statTotal');
const statInStock = document.getElementById('statInStock');
const statOutStock = document.getElementById('statOutStock');
const statOrders = document.getElementById('statOrders');
const statRevenue = document.getElementById('statRevenue');
const dashOrdersList = document.getElementById('dashOrdersList');
const dashLowStockList = document.getElementById('dashLowStockList');

const productModal = document.getElementById('productModal');
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
};

let products = [];
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

function switchTab(name) {
  activeTab = name;
  navItems.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));
  viewPanels.forEach(panel => panel.classList.toggle('active', panel.dataset.view === name));

  const meta = VIEW_META[name] || VIEW_META.dashboard;
  if (pageTitle) pageTitle.textContent = meta.title;
  if (pageSubtitle) pageSubtitle.textContent = meta.subtitle;
  if (topNewProductBtn) topNewProductBtn.hidden = name !== 'products';

  if (name === 'orders') renderOrders();
  if (name === 'dashboard') renderDashboard();
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

function resetForm() {
  productForm?.reset();
  if (fields.id) fields.id.value = '';
  if (fields.inStock) fields.inStock.checked = true;
  if (fields.sizes) fields.sizes.value = DEFAULT_SIZES.join(',');
  if (formTitle) formTitle.textContent = 'Add product';
  updateImagePreview();
}

function fillForm(product) {
  fields.id.value = product.id;
  fields.label.value = product.label;
  fields.price.value = String(product.price);
  fields.stock.value = String(product.stock);
  fields.category.value = product.category;
  fields.gender.value = product.gender;
  fields.inStock.checked = product.inStock;
  fields.image.value = product.image;
  fields.gallery.value = (product.images || []).join('\n');
  fields.sizes.value = product.sizes.join(',');
  formTitle.textContent = `Edit ${product.label}`;
  updateImagePreview();
  openModal();
}

function readForm() {
  const images = fields.gallery.value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

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
    images,
    galleryCount: images.length || 0,
    sizes: sizes.length ? sizes : [...DEFAULT_SIZES],
  });
}

function updateImagePreview() {
  const url = fields.image?.value?.trim();
  if (!url || !imagePreview || !imagePreviewImg) {
    if (imagePreview) imagePreview.hidden = true;
    return;
  }
  imagePreviewImg.src = url;
  imagePreviewImg.onerror = () => { imagePreview.hidden = true; };
  imagePreviewImg.onload = () => { imagePreview.hidden = false; };
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

function renderOrders() {
  const orders = getOrders();
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
      ? `${esc(order.customer.firstName || '')} ${esc(order.customer.lastName || '')}`.trim()
      : '—';
    const done = order.status === 'completed';

    row.innerHTML = `
      <td><code dir="ltr">${esc(order.id.slice(0, 8))}</code></td>
      <td>${fmtDate(order.createdAt)}</td>
      <td>${customer || '—'}</td>
      <td><div class="order-items">${itemsHtml}</div></td>
      <td dir="ltr"><strong>${money(order.total)}</strong></td>
      <td>
        <span class="status-pill ${done ? 'on' : 'off'}">
          ${done ? 'Completed' : 'Pending'}
        </span>
      </td>
      <td>
        <div class="row-actions">
          <button type="button" class="btn btn-ghost" data-order-action="pending" data-order-id="${esc(order.id)}">Pending</button>
          <button type="button" class="btn btn-ghost" data-order-action="completed" data-order-id="${esc(order.id)}">Complete</button>
        </div>
      </td>
    `;
    ordersTableBody.append(row);
  });
}

function renderDashboard() {
  const orders = getOrders();
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

resetFormBtn?.addEventListener('click', closeModal);

productModal?.querySelectorAll('[data-close-modal]').forEach(el => {
  el.addEventListener('click', closeModal);
});

fields.image?.addEventListener('input', updateImagePreview);

productSearch?.addEventListener('input', renderProducts);
productFilter?.addEventListener('change', renderProducts);

productForm?.addEventListener('submit', e => {
  e.preventDefault();
  const product = readForm();
  const index = products.findIndex(item => item.id === product.id);

  if (index >= 0) products[index] = product;
  else products.unshift(product);

  saveProducts(products);
  renderAll();
  closeModal();
  showToast(index >= 0 ? 'Product updated' : 'Product added');
});

productsTableBody?.addEventListener('click', e => {
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
    saveProducts(products);
    renderAll();
    showToast(product.inStock ? 'Product published' : 'Product hidden from store');
    return;
  }

  if (btn.dataset.action === 'delete') {
    if (!confirm(`Delete product "${product.label}"?`)) return;
    products = products.filter(item => item.id !== id);
    saveProducts(products);
    renderAll();
    showToast('Product deleted');
  }
});

ordersTableBody?.addEventListener('click', e => {
  const btn = e.target.closest('button[data-order-action]');
  if (!btn) return;
  updateOrderStatus(btn.dataset.orderId, btn.dataset.orderAction);
  renderAll();
  showToast('Order status updated');
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && productModal && !productModal.hidden) closeModal();
});

products = getProducts(seedProducts);
renderAll();

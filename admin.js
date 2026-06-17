import { products as seedProducts } from './products.js';
import {
  ADMIN_PASSWORD,
  createId,
  DEFAULT_SIZES,
  getOrders,
  getProducts,
  isAdminAuthed,
  normalizeProduct,
  saveOrders,
  saveProducts,
  setAdminAuthed,
  updateOrderStatus,
} from './storage.js';

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const tabBtns = [...document.querySelectorAll('.tab-btn')];
const productsPanel = document.getElementById('productsPanel');
const ordersPanel = document.getElementById('ordersPanel');
const productsTableBody = document.getElementById('productsTableBody');
const ordersTableBody = document.getElementById('ordersTableBody');
const ordersCount = document.getElementById('ordersCount');
const ordersEmpty = document.getElementById('ordersEmpty');
const productForm = document.getElementById('productForm');
const formTitle = document.getElementById('formTitle');
const newProductBtn = document.getElementById('newProductBtn');
const resetFormBtn = document.getElementById('resetFormBtn');

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

let products = [];

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString('fa-IR');
  } catch {
    return iso;
  }
}

function categoryLabel(value) {
  if (value === 'accessories') return 'ACCESSORIES';
  if (value === 'slides') return 'SLIDES';
  return 'FOOTWEAR';
}

function showApp() {
  loginScreen.hidden = true;
  adminApp.hidden = false;
  products = getProducts(seedProducts);
  renderProducts();
  renderOrders();
}

function hideApp() {
  setAdminAuthed(false);
  loginScreen.hidden = false;
  adminApp.hidden = true;
}

function switchTab(name) {
  tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));
  productsPanel.classList.toggle('active', name === 'products');
  ordersPanel.classList.toggle('active', name === 'orders');
  if (name === 'orders') renderOrders();
}

function resetForm() {
  productForm.reset();
  fields.id.value = '';
  fields.inStock.checked = true;
  fields.sizes.value = DEFAULT_SIZES.join(',');
  formTitle.textContent = 'افزودن محصول';
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
  fields.gallery.value = product.images.join('\n');
  fields.sizes.value = product.sizes.join(',');
  formTitle.textContent = `ویرایش ${product.label}`;
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

function renderProducts() {
  productsTableBody.innerHTML = '';

  products.forEach(product => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${product.label}</td>
      <td>${categoryLabel(product.category)}</td>
      <td>${money(product.price)}</td>
      <td>${product.stock}</td>
      <td>
        <span class="status-pill ${product.inStock ? 'on' : 'off'}">
          ${product.inStock ? 'موجود' : 'ناموجود'}
        </span>
      </td>
      <td>
        <div class="row-actions">
          <button type="button" data-action="edit" data-id="${product.id}">ویرایش</button>
          <button type="button" data-action="toggle" data-id="${product.id}">
            ${product.inStock ? 'ناموجود' : 'موجود'}
          </button>
          <button type="button" data-action="delete" data-id="${product.id}">حذف</button>
        </div>
      </td>
    `;

    productsTableBody.append(row);
  });
}

function renderOrders() {
  const orders = getOrders();
  ordersCount.textContent = `${orders.length} سفارش`;
  ordersTableBody.innerHTML = '';

  if (!orders.length) {
    ordersEmpty.hidden = false;
    return;
  }

  ordersEmpty.hidden = true;

  orders.forEach(order => {
    const row = document.createElement('tr');
    const itemsHtml = order.items.map(item => (
      `<span>${item.label} / SIZE ${item.size} / QTY ${item.qty} / ${money(item.price * item.qty)}</span>`
    )).join('');

    row.innerHTML = `
      <td>${order.id.slice(0, 8)}</td>
      <td>${fmtDate(order.createdAt)}</td>
      <td><div class="order-items">${itemsHtml}</div></td>
      <td>${money(order.total)}</td>
      <td>
        <span class="status-pill ${order.status === 'completed' ? 'on' : 'off'}">
          ${order.status === 'completed' ? 'تکمیل' : 'در انتظار'}
        </span>
      </td>
      <td>
        <div class="row-actions">
          <button type="button" data-order-action="pending" data-order-id="${order.id}">در انتظار</button>
          <button type="button" data-order-action="completed" data-order-id="${order.id}">تکمیل</button>
        </div>
      </td>
    `;

    ordersTableBody.append(row);
  });
}

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const password = document.getElementById('loginPassword').value;
  if (password !== ADMIN_PASSWORD) {
    alert('رمز عبور اشتباه است');
    return;
  }
  setAdminAuthed(true);
  showApp();
});

logoutBtn.addEventListener('click', hideApp);

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

newProductBtn.addEventListener('click', resetForm);
resetFormBtn.addEventListener('click', resetForm);

productForm.addEventListener('submit', e => {
  e.preventDefault();
  const product = readForm();
  const index = products.findIndex(item => item.id === product.id);

  if (index >= 0) products[index] = product;
  else products.unshift(product);

  saveProducts(products);
  renderProducts();
  fillForm(product);
  alert('محصول ذخیره شد');
});

productsTableBody.addEventListener('click', e => {
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
    renderProducts();
    return;
  }

  if (btn.dataset.action === 'delete') {
    if (!confirm(`محصول ${product.label} حذف شود؟`)) return;
    products = products.filter(item => item.id !== id);
    saveProducts(products);
    renderProducts();
    if (fields.id.value === id) resetForm();
  }
});

ordersTableBody.addEventListener('click', e => {
  const btn = e.target.closest('button[data-order-action]');
  if (!btn) return;
  updateOrderStatus(btn.dataset.orderId, btn.dataset.orderAction);
  renderOrders();
});

if (isAdminAuthed()) showApp();
else {
  loginScreen.hidden = false;
  adminApp.hidden = true;
}

resetForm();

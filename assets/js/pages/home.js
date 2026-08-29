import { loadCart, loadProducts, loadSiteSettings, resetApiHealthCache, saveCart, discountPercent, salePrice } from '../core/storage.js';
import { buildCartLineItem, renderTotalsBlock, setStoreCurrency } from '../modules/cart-ui.js?v=20260829-store';
import { mountDeveloperCredit } from '../core/credits.js';
import { SITE } from '../config/site.js';
import { buildSlugMap, productPath, productUrl } from '../core/product-seo.js';
import { initI18n, applyDomI18n, t, homePath } from '../core/i18n.js';
import { trackAddToCart, trackViewItem } from '../core/analytics-events.js?v=20260829-store';
import {
  appendOptimizedPicture,
  prefetchGalleryImages,
  PREVIEW_SIZES,
  PREVIEW_WIDTHS,
  GRID_SIZES,
  GRID_WIDTHS,
} from '../core/image-url.js?v=20260829-store';

/* ════════════════════════════════════
   DOM refs
   ════════════════════════════════════ */
const menuBtn        = document.getElementById('menuBtn');
const navSpacer      = document.getElementById('navSpacer');
const siteNav        = document.querySelector('.site-nav');
const cartBtn        = document.getElementById('cartBtn');
const cartDrawer     = document.getElementById('cartDrawer');
const cartClose      = document.getElementById('cartClose');
const cartOverlay    = document.getElementById('cartOverlay');
const cartCountEl    = document.getElementById('cartCount');
const cartItemsEl    = document.getElementById('cartItems');
const cartEmptyEl    = document.getElementById('cartEmpty');
const cartFooterEl   = document.getElementById('cartFooter');
const cartTotalsEl   = document.getElementById('cartTotals');
const cartDiscountToggle = document.getElementById('cartDiscountToggle');
const cartDiscountForm = document.getElementById('cartDiscountForm');
const checkoutBtn    = document.getElementById('checkoutBtn');
const filterBtns     = [...document.querySelectorAll('.f-btn')];
const grid           = document.getElementById('productGrid');
const preview        = document.getElementById('preview');
const flyIn          = document.getElementById('flyIn');
const imgMover       = document.getElementById('imgMover');
const pinchWrap      = document.getElementById('pinchWrap');
const imgSquare      = document.getElementById('imgSquare');
const previewDots    = document.getElementById('previewDots');
const pPrev          = document.getElementById('pPrev');
const pNext          = document.getElementById('pNext');
const pNameEl        = document.getElementById('pName');
const pPriceEl       = document.getElementById('pPrice');
const pAddEl         = document.getElementById('pAdd');
const previewMeta    = document.getElementById('previewMeta');
const sizePanel      = document.getElementById('sizePanel');
const szGrid         = document.getElementById('szGrid');
const szAdd          = document.getElementById('szAdd');
const szClear        = document.getElementById('szClear');
const szHelp         = document.getElementById('szHelp');
const szNameStack    = document.getElementById('szNameStack');
const szPriceStack   = document.getElementById('szPriceStack');
const szNameTxt      = document.getElementById('szNameTxt');
const szPriceTxt     = document.getElementById('szPriceTxt');
const pDesc          = document.getElementById('pDesc');

/* ════════════════════════════════════
   Constants
   ════════════════════════════════════ */
const ZOOM_DUR = 300;
const WHEEL_COOLDOWN = 450;
const GALLERY_FADE = 220;

const SIZES_TABLE = [
  { us:'XS', eu:'34' },{ us:'S',  eu:'36' },{ us:'M',  eu:'38' },
  { us:'L',  eu:'40' },{ us:'XL', eu:'42' },{ us:'XXL',eu:'44' },
];

const CODE_PREFIX = {
  jackets: 'JK',
  coats: 'CT',
  shirts: 'SH',
  accessories: 'AC',
  bottoms: 'BT',
};

let productCodes = {};
let slugMap = {};

/* ════════════════════════════════════
   State
   ════════════════════════════════════ */
let activeFilter   = 'new';
let visible        = [];
let gridBtns       = [];
let activeIdx      = -1;
let isOpen         = false;
let lastZoom       = { sc:1, tx:0, ty:0 };
let pinchPtrs      = new Map();
let pinchState     = { sc:1, x:0, y:0 };
let selectedSize   = null;
let sizeOOS        = false;
let szOpen         = false;
let euMode         = false;
let descVisible    = false;
let cartItems      = [];

function buildProductCodes(list) {
  const counters = {};
  const map = {};
  list.forEach((p) => {
    const prefix = CODE_PREFIX[p.category] || 'PR';
    counters[prefix] = (counters[prefix] || 0) + 1;
    map[p.id] = `${prefix}-${String(counters[prefix]).padStart(2, '0')}`;
  });
  return map;
}

function productCode(item) {
  return productCodes[item.id] || item.code || item.label;
}

function productDisplayName(item) {
  return productCode(item);
}
let gridMode       = 'dense'; // dense = 6 cols (default) | sparse = 3 cols
let activeImageIdx = 0;
let wheelLock      = false;
let products       = [];
let swipe          = null; // touch swipe tracking { x, y, t, id }

function persistCart() {
  void saveCart(cartItems).catch(() => {});
}

function mkPicture(item, eager, priority = false) {
  const pic = document.createElement('picture');
  appendOptimizedPicture(pic, {
    src: item.image,
    alt: item.label,
    className: 'prod-img',
    eager,
    priority,
    widths: GRID_WIDTHS,
    sizes: GRID_SIZES,
    quality: 88,
  });
  return pic;
}

function getGallery(item) {
  if (item.images?.length) return item.images;

  const url = item.image;
  const numbered = url.match(/^(.*-)(\d+)(\.\w+)$/i);
  if (numbered) {
    const count = item.galleryCount || 6;
    return Array.from({ length: count }, (_, i) => `${numbered[1]}${i + 1}${numbered[3]}`);
  }

  const imageNamed = url.match(/^(.*image-)(\d+)(\.\w+)$/i);
  if (imageNamed) {
    const count = item.galleryCount || 6;
    return Array.from({ length: count }, (_, i) => `${imageNamed[1]}${i + 1}${imageNamed[3]}`);
  }

  return [url];
}

/** Preview gallery — responsive WebP with smooth reveal */
function mkPreviewPicture(imageUrl, item, eager = true) {
  const pic = document.createElement('picture');
  appendOptimizedPicture(pic, {
    src: imageUrl,
    fallbackSrc: item.image || imageUrl,
    alt: item.label || productDisplayName(item),
    className: 'preview-img',
    eager,
    priority: eager,
    widths: PREVIEW_WIDTHS,
    sizes: PREVIEW_SIZES,
    quality: 90,
  });
  const img = pic.querySelector('.preview-img');
  if (img) img.style.setProperty('--scale', '1');
  return pic;
}

function mkPictureFromUrl(imageUrl, item, eager = true) {
  return mkPreviewPicture(imageUrl, item, eager);
}

/* ════════════════════════════════════
   Cart
   ════════════════════════════════════ */
function fmt(p) { return `$${p}`; }
function fmtMoney(p) { return `$${p.toFixed(2)}`; }

function setPriceText(el, item) {
  if (!el) return;
  const pct = discountPercent(item);
  const now = salePrice(item);
  if (pct > 0) {
    el.replaceChildren();
    const was = document.createElement('s');
    was.className = 'p-price-was';
    was.textContent = fmt(item.price);
    const current = document.createElement('span');
    current.className = 'p-price-now';
    current.textContent = fmt(now);
    const off = document.createElement('span');
    off.className = 'p-price-off';
    off.textContent = `-${pct}%`;
    el.append(was, ' ', current, ' ', off);
    return;
  }
  el.textContent = fmt(item.price);
}

function cartCount() {
  return cartItems.reduce((s, ci) => s + ci.qty, 0);
}

function cartSubtotal() {
  return cartItems.reduce((s, ci) => s + ci.price * ci.qty, 0);
}

function changeQty(idx, delta) {
  const item = cartItems[idx];
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cartItems.splice(idx, 1);
  renderCart();
  persistCart();
}

function openCart() {
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden','false');
  cartOverlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden','true');
  cartOverlay.classList.remove('visible');
  document.body.style.overflow = '';
}

function renderCart() {
  const count = cartCount();
  cartCountEl.textContent = String(count);
  cartBtn?.classList.toggle('has-items', count > 0);
  cartBtn?.setAttribute('data-count', String(count));

  if (count === 0) {
    cartEmptyEl.hidden = false;
    cartFooterEl.hidden = true;
    cartItemsEl.innerHTML = '';
    cartItemsEl.append(cartEmptyEl);
    return;
  }

  cartEmptyEl.hidden = true;
  cartFooterEl.hidden = false;
  cartItemsEl.innerHTML = '';

  cartItems.forEach((ci, idx) => {
    cartItemsEl.append(buildCartLineItem(ci, idx, changeQty));
  });

  renderTotalsBlock(cartTotalsEl, { subtotal: cartSubtotal(), taxes: 0 });
}

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

checkoutBtn?.addEventListener('click', async () => {
  if (!cartItems.length) return;
  try {
    await saveCart(cartItems);
  } catch {
    alert('Could not save cart. Please try again.');
    return;
  }
  window.location.href = '/checkout';
});

cartDiscountToggle?.addEventListener('click', () => {
  const open = cartDiscountForm.hidden;
  cartDiscountForm.hidden = !open;
  cartDiscountToggle.setAttribute('aria-expanded', String(open));
});

document.getElementById('cartDiscountApply')?.addEventListener('click', () => {
  const input = document.getElementById('cartDiscountInput');
  const code = (input?.value || '').trim();
  if (!code) {
    input?.focus();
    return;
  }
  alert('Discount codes are not available yet.');
});

/* ════════════════════════════════════
   Column count
   ════════════════════════════════════ */
function cols(w) {
  if (gridMode === 'sparse') {
    if (w < 480) return 2;
    if (w < 700) return 2;
    if (w < 960) return 3;
    return 3;
  }
  if (w < 480) return 2;
  if (w < 700) return 3;
  if (w < 960) return 4;
  return 6;
}

function syncGridMode() {
  menuBtn.dataset.grid = gridMode;
  menuBtn.setAttribute(
    'aria-label',
    gridMode === 'sparse' ? t('morePerRow') : t('fewerPerRow')
  );
}

function toggleGridMode() {
  gridMode = gridMode === 'dense' ? 'sparse' : 'dense';
  syncGridMode();
  updateCols();
}
function updateCols() {
  grid.style.setProperty('--cols', String(cols(window.innerWidth)));
  if (isOpen && activeIdx >= 0) {
    requestAnimationFrame(() => {
      const z = zoomGrid(gridBtns[activeIdx], false);
      flyInInverse(z, false);
    });
  }
}

/* ════════════════════════════════════
   Spacer sync
   ════════════════════════════════════ */
function syncSpacer(open) {
  navSpacer.classList.toggle('preview-open', open);
  siteNav.classList.toggle('preview-open', open);
  if (open) {
    navSpacer.style.height = '';
  } else {
    navSpacer.style.height = `${siteNav.offsetHeight}px`;
  }
}

/* ════════════════════════════════════
   Filter
   ════════════════════════════════════ */
function filtered(key) {
  let list = products;
  if (key === 'new') list = products.slice(0, 18);
  else if (key === 'mens') list = products.filter(p => p.gender === 'mens');
  else if (key === 'womens') list = products.filter(p => p.gender === 'womens');
  else if (key === 'footwear') list = products.filter(p => ['jackets', 'coats'].includes(p.category));
  else if (key === 'accessories') list = products.filter(p => p.category === 'accessories');
  else if (key === 'sale') list = products.filter(p => discountPercent(p) > 0);
  return list.filter(p => p.inStock !== false);
}

function applyFilter(key) {
  activeFilter = key;
  filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === key));
  visible = filtered(key);
  renderGrid(visible);
  if (!window.__MARVISPACE_OPEN_PRODUCT__) injectProductSchema(visible);
  updateCols();
  scrollActiveFilterIntoView();
}

function scrollActiveFilterIntoView() {
  const scroller = document.querySelector('.filter-row');
  const chip = filterBtns.find(b => b.classList.contains('active'));
  if (!scroller || !chip || scroller.scrollWidth <= scroller.clientWidth) return;
  const pad = 12;
  const left = chip.offsetLeft - pad;
  const right = chip.offsetLeft + chip.offsetWidth + pad;
  if (left < scroller.scrollLeft) {
    scroller.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  } else if (right > scroller.scrollLeft + scroller.clientWidth) {
    scroller.scrollTo({ left: right - scroller.clientWidth, behavior: 'smooth' });
  }
}

function absoluteUrl(path) {
  if (!path) return SITE.url;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}

function productShareUrl(product) {
  return productUrl(product, slugMap, SITE.url);
}

function injectProductSchema(items) {
  let el = document.getElementById('productSchema');
  if (!el) {
    el = document.createElement('script');
    el.id = 'productSchema';
    el.type = 'application/ld+json';
    document.head.append(el);
  }

  const list = items
    .filter(p => p.inStock !== false)
    .slice(0, 24)
    .map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        '@id': productShareUrl(p),
        name: p.label,
        sku: p.id,
        image: absoluteUrl(p.image),
        brand: { '@type': 'Brand', name: 'MARVISPACE' },
        offers: {
          '@type': 'Offer',
          url: productShareUrl(p),
          priceCurrency: 'USD',
          price: String(salePrice(p)),
          availability: p.inStock === false
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
        },
      },
    }));

  el.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'MARVISPACE Product Catalog',
    itemListElement: list,
  });
}

filterBtns.forEach(b => {
  b.addEventListener('click', () => {
    if (b.dataset.filter === activeFilter) return;
    if (isOpen) closePreview(false);
    applyFilter(b.dataset.filter);
  });
});

/* ════════════════════════════════════
   Render grid
   ════════════════════════════════════ */
function renderGrid(items) {
  grid.innerHTML = '';
  gridBtns = [];
  items.forEach((item, i) => {
    const btn = document.createElement('a');
    btn.className = 'product-btn';
    btn.href = productPath(item, slugMap);
    const now = salePrice(item);
    const pct = discountPercent(item);
    btn.setAttribute('aria-label', pct > 0
      ? `${item.label} — $${now} (-${pct}%)`
      : `${item.label} — $${item.price}`);
    btn.title = pct > 0 ? `${item.label} — -${pct}%` : `${item.label} — $${item.price}`;
    btn.dataset.id = item.id;
    btn.dataset.i = String(i);

    const wrap = document.createElement('div');
    wrap.className = 'prod-img-wrap';
    wrap.append(mkPicture(item, i < 12, i < 4));

    const meta = document.createElement('div');
    meta.className = 'prod-meta';
    const lbl = document.createElement('span');
    lbl.className = 'prod-label';
    lbl.textContent = productDisplayName(item);
    meta.append(lbl);
    if (pct > 0) {
      const sale = document.createElement('span');
      sale.className = 'prod-sale';
      sale.textContent = `-${pct}%`;
      meta.append(sale);
    }

    btn.append(wrap, meta);
    btn.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      openPreview(i);
    });
    btn.addEventListener('mouseenter', () => prefetchGalleryImages(getGallery(item), 0), { passive: true });
    btn.addEventListener('focusin', () => prefetchGalleryImages(getGallery(item), 0));
    grid.append(btn);
    gridBtns.push(btn);
  });
}

/* ════════════════════════════════════
   Size selector
   ════════════════════════════════════ */
function renderSizes() {
  const item = visible[activeIdx];
  const allowed = new Set(item?.sizes || SIZES_TABLE.map(s => s.us));

  szGrid.innerHTML = '';
  selectedSize = null;
  sizeOOS = false;
  szNameStack.dataset.alt = 'false';
  szPriceStack.dataset.alt = 'false';

  let chipIndex = 0;
  SIZES_TABLE.forEach((sz) => {
    if (!allowed.has(sz.us)) return;

    const chip = document.createElement('button');
    chip.className = 'sz-chip';
    chip.type = 'button';
    const oos = item?.inStock === false || (item?.stock !== undefined && item.stock <= 0);
    if (oos) { chip.classList.add('out-of-stock'); chip.disabled = true; }
    chip.setAttribute('aria-label', `${t('sizeUs')} ${sz.us}`);

    const col = chipIndex % 7;
    const row = Math.floor(chipIndex / 7);
    const delayIndex = chipIndex;
    chipIndex += 1;
    chip.style.setProperty('--csx', `${(3 - col) * 70}px`);
    chip.style.setProperty('--csy', `${row > 0 ? '-2.5rem' : '-1rem'}`);

    const inner = document.createElement('div');
    inner.className = 'sz-chip-inner';
    const eu = document.createElement('span');
    eu.className = 'sz-lbl-eu';
    eu.textContent = sz.eu;
    const us = document.createElement('span');
    us.className = 'sz-lbl-us';
    us.textContent = sz.us;
    inner.append(eu, us);
    chip.append(inner);

    chip.addEventListener('click', () => {
      if (oos) return;
      szGrid.querySelectorAll('.sz-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedSize = sz.us;
      sizeOOS = oos;
      szPriceStack.dataset.alt = 'false';
      confirmSizeAdd();
    });

    szGrid.append(chip);

    requestAnimationFrame(() => {
      setTimeout(() => chip.classList.add('in'), delayIndex * 16);
    });
  });

  szGrid.dataset.eu = String(euMode);
}

function openSizes() {
  if (szOpen) return;
  settleFlyIn(true);
  resetPinch();
  szOpen = true;
  preview.classList.add('sz-open');
  sizePanel.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => renderSizes());
  });
}

function closeSizes() {
  if (!szOpen) return;
  szOpen = false;
  preview.classList.remove('sz-open');
  sizePanel.setAttribute('aria-hidden', 'true');
  szGrid.querySelectorAll('.sz-chip').forEach(c => c.classList.remove('in', 'selected'));
}

function confirmSizeAdd() {
  if (!selectedSize || sizeOOS) return;
  const item = visible[activeIdx];
  if (!item) return;
  szNameStack.dataset.alt = 'true';
  const existing = cartItems.find(ci => ci.id === item.id && ci.size === selectedSize);
  if (existing) {
    existing.qty += 1;
    existing.price = salePrice(item);
  }
  else cartItems.push({ id: item.id, label: item.label, price: salePrice(item), size: selectedSize, image: item.image, qty: 1 });
  trackAddToCart({ ...item, price: salePrice(item) }, { quantity: 1, variant: selectedSize });
  renderCart();
  persistCart();
  setTimeout(() => {
    szNameStack.dataset.alt = 'false';
    closeSizes();
    closePreview(false);
    openCart();
  }, 450);
}

/* ════════════════════════════════════
   Zoom helpers
   ════════════════════════════════════ */
function zoomGrid(btn, animate = true) {
  if (!btn) return lastZoom;
  const gr = grid.getBoundingClientRect();
  const br = btn.getBoundingClientRect();

  const ox = br.left + br.width/2 - gr.left;
  const oy = br.top  + br.height/2 - gr.top;

  const isMobile = window.innerWidth <= 768;
  const sc = Math.min(
    (window.innerWidth * (isMobile ? 0.72 : 0.52)) / br.width,
    (window.innerHeight * (isMobile ? 0.42 : 0.48)) / br.height,
    isMobile ? 2.2 : 3.8
  );

  const tx = window.innerWidth / 2 - (br.left + br.width / 2);
  const targetY = window.innerWidth <= 768
    ? window.innerHeight * 0.44
    : window.innerHeight * 0.38;
  const ty = targetY - (br.top + br.height / 2);

  grid.style.transformOrigin = `${ox}px ${oy}px`;
  if (!animate) grid.style.setProperty('--dur', '0ms');
  grid.style.setProperty('--sc', String(sc));
  grid.style.setProperty('--tx', `${tx}px`);
  grid.style.setProperty('--ty', `${ty}px`);
  grid.style.setProperty('--op', '0');

  if (!animate) requestAnimationFrame(() => grid.style.setProperty('--dur', `${ZOOM_DUR}ms`));
  lastZoom = { sc, tx, ty };
  return lastZoom;
}

function flyInInverse(z, animate = true) {
  if (!animate) flyIn.style.setProperty('transition','none');
  flyIn.style.setProperty('--fx-sc', String(1/z.sc));
  flyIn.style.setProperty('--fx-tx', `${-z.tx}px`);
  flyIn.style.setProperty('--fx-ty', `${-z.ty}px`);
  flyIn.style.setProperty('--fx-op', '1');
  if (!animate) requestAnimationFrame(() => flyIn.style.removeProperty('transition'));
}
function settleFlyIn(animate = true) {
  if (!animate) flyIn.style.setProperty('transition','none');
  flyIn.style.setProperty('--fx-sc', '1');
  flyIn.style.setProperty('--fx-tx', '0px');
  flyIn.style.setProperty('--fx-ty', '0px');
  flyIn.style.setProperty('--fx-op', '1');
  if (!animate) requestAnimationFrame(() => flyIn.style.removeProperty('transition'));
}
function resetGrid(animate = true) {
  if (!animate) grid.style.setProperty('--dur','0ms');
  grid.style.transformOrigin = '50% 50%';
  grid.style.setProperty('--sc','1');
  grid.style.setProperty('--tx','0px');
  grid.style.setProperty('--ty','0px');
  grid.style.setProperty('--op','1');
  grid.classList.remove('is-open');
  gridBtns.forEach(b => b.classList.remove('active'));
  lastZoom = { sc:1, tx:0, ty:0 };
  if (!animate) requestAnimationFrame(() => grid.style.setProperty('--dur',`${ZOOM_DUR}ms`));
}

/* ════════════════════════════════════
   Pinch zoom
   ════════════════════════════════════ */
function resetPinch() {
  pinchState = { sc:1, x:0, y:0 };
  pinchWrap.style.setProperty('--pz-s','1');
  pinchWrap.style.setProperty('--pz-x','0px');
  pinchWrap.style.setProperty('--pz-y','0px');
  const previewImg = imgSquare.querySelector('.preview-img');
  if (previewImg) previewImg.style.setProperty('--scale', '1');
  menuBtn.dataset.zoom = '0';
}
function applyPinch() {
  pinchWrap.style.setProperty('--pz-s', String(pinchState.sc));
  pinchWrap.style.setProperty('--pz-x', `${pinchState.x}px`);
  pinchWrap.style.setProperty('--pz-y', `${pinchState.y}px`);
  const previewImg = imgSquare.querySelector('.preview-img');
  if (previewImg) previewImg.style.setProperty('--scale', String(pinchState.sc));
  menuBtn.dataset.zoom = pinchState.sc > 1.05 ? '1' : '0';
}

/* ════════════════════════════════════
   Dots
   ════════════════════════════════════ */
function buildDots(n, active) {
  previewDots.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('role','tab');
    d.setAttribute('aria-label', `${t('imageN')} ${i+1}`);
    d.classList.toggle('active', i === active);
    d.addEventListener('click', () => setGalleryImage(i));
    previewDots.append(d);
  }
}

function updateDotsActive(active) {
  previewDots.querySelectorAll('button').forEach((el, j) => {
    el.classList.toggle('active', j === active);
  });
}

function updateGalleryImage(imageUrl, animate = true) {
  const item = visible[activeIdx];
  if (!item) return;

  const gallery = getGallery(item);
  prefetchGalleryImages(gallery, activeImageIdx);

  const revealPreview = (img) => {
    if (!img) return;
    const show = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { img.style.opacity = '1'; });
      });
    };
    if (img.complete) {
      show();
      return;
    }
    img.addEventListener('load', show, { once: true });
    img.addEventListener('error', show, { once: true });
  };

  const render = () => {
    imgSquare.innerHTML = '';
    imgSquare.append(mkPreviewPicture(imageUrl, item, true));
    revealPreview(imgSquare.querySelector('.preview-img'));
  };

  if (!animate) {
    render();
    const img = imgSquare.querySelector('.preview-img');
    if (img) img.style.opacity = '1';
    return;
  }

  const current = imgSquare.querySelector('.preview-img');
  if (current) current.style.opacity = '0';
  setTimeout(render, GALLERY_FADE);
}

function setGalleryImage(idx, animate = true) {
  const item = visible[activeIdx];
  if (!item) return;
  const gallery = getGallery(item);
  if (!gallery.length) return;
  activeImageIdx = ((idx % gallery.length) + gallery.length) % gallery.length;
  updateGalleryImage(gallery[activeImageIdx], animate);
  updateDotsActive(activeImageIdx);
}

function stepGallery(delta) {
  if (!isOpen) return;
  setGalleryImage(activeImageIdx + delta);
}

/* ════════════════════════════════════
   Preview content
   ════════════════════════════════════ */
function loadPreviewContent(idx, { keepSizes = false } = {}) {
  const item = visible[idx];
  if (!item) return;

  activeImageIdx = 0;
  const gallery = getGallery(item);

  pNameEl.textContent = productDisplayName(item);
  setPriceText(pPriceEl, item);
  szNameTxt.textContent = t('selectSize');
  setPriceText(szPriceTxt, item);
  szNameStack.dataset.alt = 'false';
  szPriceStack.dataset.alt = 'false';
  descVisible = false;
  euMode = false;
  pDesc.textContent = `${t('materials')}\n${t('ships')}`;
  pDesc.classList.add('show');
  if (!keepSizes) closeSizes();
  renderSizes();
  buildDots(gallery.length, 0);
  prefetchGalleryImages(gallery, 0);
  updateGalleryImage(gallery[0], false);
  resetPinch();
}

function setPreviewNav(open) {
  menuBtn.dataset.preview = open ? 'true' : 'false';
  menuBtn.setAttribute('aria-label', open ? t('back') : (
    gridMode === 'sparse' ? t('morePerRow') : t('fewerPerRow')
  ));
}

/* ════════════════════════════════════
   Open / close preview
   ════════════════════════════════════ */
function openPreview(idx) {
  if (!visible[idx]) return;
  if (isOpen && activeIdx === idx) return;

  activeIdx = idx;
  isOpen = true;

  gridBtns.forEach((b,i) => b.classList.toggle('active', i===idx));
  grid.classList.add('is-open');
  document.body.classList.add('preview-open');
  setPreviewNav(true);
  syncSpacer(true);

  loadPreviewContent(idx);
  syncProductDeepLink(visible[idx]);
  trackViewItem({ ...visible[idx], price: salePrice(visible[idx]) });

  const z = zoomGrid(gridBtns[idx], true);
  flyInInverse(z, false);

  preview.setAttribute('aria-hidden','false');
  preview.classList.add('visible');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => settleFlyIn(true));
  });
}

function syncProductDeepLink(product) {
  try {
    const next = product?.id ? productPath(product, slugMap) : homePath();
    const current = window.location.pathname.replace(/\/index\.(html|php)$/i, '/') || '/';
    if (current !== next) {
      window.history.replaceState({}, '', next);
    }
  } catch {
    /* ignore */
  }
}

function closePreview(animate = true) {
  if (!isOpen) return;
  const z = { ...lastZoom };
  flyInInverse(z, animate);
  resetGrid(animate);
  resetPinch();
  closeSizes();

  const finish = () => {
    flyIn.style.setProperty('--fx-op','0');
    isOpen = false;
    activeIdx = -1;
    preview.classList.remove('visible');
    preview.setAttribute('aria-hidden','true');
    document.body.classList.remove('preview-open');
    setPreviewNav(false);
    syncSpacer(false);
    syncProductDeepLink(null);
  };

  animate ? setTimeout(finish, ZOOM_DUR) : finish();
}

function stepPreview(d) {
  if (!isOpen || !visible.length) return;
  const next = (activeIdx + d + visible.length) % visible.length;
  activeIdx = next;
  gridBtns.forEach((b,i) => b.classList.toggle('active', i===next));
  loadPreviewContent(next, { keepSizes: szOpen });
  syncProductDeepLink(visible[next]);
  const z = zoomGrid(gridBtns[next], true);
  flyInInverse(z, false);
  requestAnimationFrame(() => settleFlyIn(true));
}

/* ════════════════════════════════════
   Add to cart
   ════════════════════════════════════ */
pAddEl.addEventListener('click', () => {
  if (!isOpen) return;
  openSizes();
});

szAdd.addEventListener('click', () => {
  if (!selectedSize || sizeOOS) return;
  confirmSizeAdd();
});

szClear.addEventListener('click', () => {
  closeSizes();
  selectedSize = null;
  sizeOOS = false;
  szGrid.querySelectorAll('.sz-chip').forEach(c => c.classList.remove('selected'));
  szPriceStack.dataset.alt = 'false';
});

szHelp.addEventListener('click', () => {
  euMode = !euMode;
  szGrid.dataset.eu = String(euMode);
  descVisible = !descVisible;
  pDesc.classList.toggle('show', descVisible);
});

/* ════════════════════════════════════
   Menu button
   ════════════════════════════════════ */
menuBtn.addEventListener('click', () => {
  if (isOpen) { closePreview(); return; }
  toggleGridMode();
});

/* ════════════════════════════════════
   Nav arrows
   ════════════════════════════════════ */
pPrev.addEventListener('click', () => stepGallery(-1));
pNext.addEventListener('click', () => stepGallery(1));

/* ════════════════════════════════════
   Keyboard
   ════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (cartDrawer?.classList.contains('open')) {
      closeCart();
      return;
    }
    if (!isOpen) return;
    if (szOpen) { closeSizes(); return; }
    closePreview();
    return;
  }
  if (!isOpen) return;
  if (e.key === 'ArrowLeft') stepGallery(-1);
  if (e.key === 'ArrowRight') stepGallery(1);
});

/* ════════════════════════════════════
   Wheel — switch products
   ════════════════════════════════════ */
preview.addEventListener('wheel', e => {
  if (!isOpen || wheelLock) return;
  if (e.ctrlKey) return;
  if (Math.abs(e.deltaY) < 8) return;

  e.preventDefault();
  wheelLock = true;
  stepPreview(e.deltaY > 0 ? 1 : -1);
  setTimeout(() => { wheelLock = false; }, WHEEL_COOLDOWN);
}, { passive: false });

/* ════════════════════════════════════
   Pinch / wheel zoom
   ════════════════════════════════════ */
pinchWrap.addEventListener('wheel', e => {
  if (!isOpen || !e.ctrlKey) return;
  e.preventDefault();
  pinchState.sc = Math.min(3, Math.max(1, pinchState.sc - e.deltaY * 0.004));
  applyPinch();
}, { passive: false });

pinchWrap.addEventListener('pointerdown', e => {
  if (!isOpen || e.pointerType === 'mouse') return;
  pinchPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  pinchWrap.setPointerCapture(e.pointerId);
});
pinchWrap.addEventListener('pointermove', e => {
  if (!pinchPtrs.has(e.pointerId)) return;
  // Pan only while zoomed in; otherwise let the swipe handler manage the gesture.
  if (pinchPtrs.size === 1 && pinchState.sc > 1.05) {
    const p = pinchPtrs.get(e.pointerId);
    pinchState.x += e.clientX - p.x;
    pinchState.y += e.clientY - p.y;
    pinchPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    applyPinch();
  } else if (pinchPtrs.size === 1) {
    pinchPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }
});
pinchWrap.addEventListener('pointerup', e => {
  pinchPtrs.delete(e.pointerId);
  if (pinchPtrs.size === 0 && pinchState.sc < 1.05) resetPinch();
});
pinchWrap.addEventListener('pointercancel', e => {
  pinchPtrs.delete(e.pointerId);
});

/* ════════════════════════════════════
   Touch swipe — horizontal = gallery, vertical = product
   ════════════════════════════════════ */
const SWIPE_DIST  = 45;   // min travel (px) to count as a swipe
const SWIPE_RATIO = 1.25; // axis dominance needed to lock direction

pinchWrap.addEventListener('pointerdown', e => {
  if (!isOpen) { swipe = null; return; }
  // Ignore multi-touch (pinch) and zoomed state.
  if (pinchPtrs.size > 1 || pinchState.sc > 1.05) { swipe = null; return; }
  swipe = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
});

pinchWrap.addEventListener('pointermove', e => {
  if (!swipe) return;
  if (pinchPtrs.size > 1 || pinchState.sc > 1.05) swipe = null;
});

pinchWrap.addEventListener('pointerup', e => {
  if (!swipe || swipe.id !== e.pointerId) { swipe = null; return; }
  const dx = e.clientX - swipe.x;
  const dy = e.clientY - swipe.y;
  swipe = null;

  if (!isOpen || pinchState.sc > 1.05) return;

  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  if (adx < SWIPE_DIST && ady < SWIPE_DIST) return;

  if (adx > ady * SWIPE_RATIO) {
    // Horizontal swipe → browse the product gallery.
    stepGallery(dx < 0 ? 1 : -1);
  } else if (ady > adx * SWIPE_RATIO) {
    // Vertical swipe → next / previous product (swipe up = next).
    stepPreview(dy < 0 ? 1 : -1);
  }
});

/* ════════════════════════════════════
   Resize
   ════════════════════════════════════ */
window.addEventListener('resize', () => {
  updateCols();
  if (!isOpen) syncSpacer(false);
});

/* ════════════════════════════════════
   Init
   ════════════════════════════════════ */
syncSpacer(false);
syncGridMode();

window.addEventListener('load', () => {
  if (!isOpen) syncSpacer(false);
});
if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    if (!isOpen) syncSpacer(false);
  });
}

(async () => {
  await initI18n();
  applyDomI18n(document);
  syncGridMode();
  await mountDeveloperCredit();

  async function fetchSeedProducts() {
    try {
      const res = await fetch('/install/products.json', { cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async function bootStore() {
    try {
      const settings = await loadSiteSettings();
      setStoreCurrency(settings?.currency || 'USD');
    } catch {
      /* keep default currency */
    }
    products = await loadProducts(await fetchSeedProducts());
    productCodes = buildProductCodes(products);
    slugMap = buildSlugMap(products);
    cartItems = await loadCart();
    renderCart();
    applyFilter('new');
    openProductFromDeepLink();
  }

  function deepLinkProductId() {
    const boot = window.__MARVISPACE_OPEN_PRODUCT__;
    if (boot?.id) return String(boot.id);
    const queryId = new URLSearchParams(window.location.search).get('product');
    if (queryId) return queryId;
    const pathMatch = window.location.pathname.match(/^\/(?:tr|en)\/product\/([^/]+)\/?$/)
      || window.location.pathname.match(/^\/product\/([^/]+)\/?$/);
    if (!pathMatch) return '';
    const slug = decodeURIComponent(pathMatch[1]);
    const bySlug = products.find(p => slugMap[p.id] === slug);
    return bySlug?.id || slug;
  }

  function openProductFromDeepLink() {
    try {
      const id = deepLinkProductId();
      if (!id) return;
      const found = products.find(p => p.id === id && p.inStock !== false);
      if (!found) return;

      let idx = visible.findIndex(p => p.id === id);
      if (idx < 0) {
        visible = products.filter(p => p.inStock !== false);
        renderGrid(visible);
        if (!window.__MARVISPACE_OPEN_PRODUCT__) injectProductSchema(visible);
        updateCols();
        idx = visible.findIndex(p => p.id === id);
      }
      if (idx >= 0) openPreview(idx);
    } catch {
      /* ignore */
    }
  }

  try {
    await bootStore();
  } catch (err) {
    resetApiHealthCache();
    try {
      await bootStore();
    } catch (retryErr) {
      console.error(retryErr);
      grid.innerHTML = `<p class="empty-state">${t('storeUnavailable')}</p>`;
    }
  }
})();

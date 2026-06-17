import { products as seedProducts } from './products.js';
import { getCart, getProducts, saveCart } from './storage.js';

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
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartTaxesEl    = document.getElementById('cartTaxes');
const cartTotalEl    = document.getElementById('cartTotalPrice');
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
const CDN    = 'https://yeezy.com/cdn-cgi/image';
const CDN_PARAMS = 'quality=100,compression=fast,slow-connection-quality=80,fit=pad,gravity=center,background=transparent';
const WIDTHS = [16, 375, 560, 1024];
const SIZES  = '(max-width: 767px) 375px, 560px';
const ZOOM_DUR = 300;
const WHEEL_COOLDOWN = 450;
const GALLERY_FADE = 180;

const SIZES_TABLE = [
  { us:'4',  eu:'36'   },{ us:'5',  eu:'37.5' },{ us:'6',  eu:'39'  },
  { us:'7',  eu:'40.5' },{ us:'8',  eu:'42'   },{ us:'9',  eu:'43'  },
  { us:'10', eu:'44.5' },{ us:'11', eu:'46'   },{ us:'12', eu:'47'  },
  { us:'13', eu:'48'   },{ us:'14', eu:'49.5' },{ us:'15', eu:'51'  },
  { us:'16', eu:'52'   }
];

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
let cartItems      = getCart();
let gridMode       = 'dense'; // dense = 6 cols | sparse = 3 cols
let activeImageIdx = 0;
let wheelLock      = false;
let products       = getProducts(seedProducts);

/* ════════════════════════════════════
   CDN image helpers
   ════════════════════════════════════ */
function cdnUrl(src, w, fmt) {
  const base = `width=${w},height=${w},${CDN_PARAMS}`;
  const f = fmt ? `,format=${fmt}` : '';
  return `${CDN}/${base}${f}/${src}`;
}
function srcset(src, fmt) {
  return WIDTHS.map(w => `${cdnUrl(src,w,fmt)} ${w}w`).join(', ');
}
function mkPicture(item, eager) {
  const pic = document.createElement('picture');
  const avif = document.createElement('source');
  avif.type = 'image/avif';
  avif.srcset = srcset(item.image,'avif');
  avif.sizes = SIZES;
  const webp = document.createElement('source');
  webp.type = 'image/webp';
  webp.srcset = srcset(item.image,'webp');
  webp.sizes = SIZES;
  const img = document.createElement('img');
  img.decoding = 'async';
  img.loading = eager ? 'eager' : 'lazy';
  if (eager) img.fetchPriority = 'high';
  img.src = cdnUrl(item.image, 560);
  img.srcset = srcset(item.image);
  img.sizes = SIZES;
  img.alt = item.label;
  img.className = 'prod-img';
  img.draggable = false;
  pic.append(avif, webp, img);
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

function mkPictureFromUrl(imageUrl, label, eager) {
  return mkPicture({ image: imageUrl, label }, eager);
}

/* ════════════════════════════════════
   Cart
   ════════════════════════════════════ */
function fmt(p) { return `$${p}`; }
function fmtMoney(p) { return `$${p.toFixed(2)}`; }

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
    const row = document.createElement('div');
    row.className = 'cart-item';

    const img = document.createElement('img');
    img.className = 'cart-item-img';
    img.src = cdnUrl(ci.image, 128);
    img.alt = ci.label;
    img.loading = 'lazy';

    const main = document.createElement('div');
    main.className = 'cart-item-main';

    const top = document.createElement('div');
    top.className = 'cart-item-top';

    const name = document.createElement('span');
    name.className = 'cart-item-name';
    name.textContent = ci.label;

    const price = document.createElement('span');
    price.className = 'cart-item-price';
    price.textContent = fmtMoney(ci.price * ci.qty);

    top.append(name, price);

    const meta = document.createElement('div');
    meta.className = 'cart-item-meta';

    const size = document.createElement('span');
    size.className = 'cart-item-size';
    size.textContent = `SIZE: ${ci.size}`;

    const qtyRow = document.createElement('div');
    qtyRow.className = 'cart-qty';

    const qtyLabel = document.createElement('span');
    qtyLabel.className = 'cart-qty-label';
    qtyLabel.textContent = 'QTY:';

    const minus = document.createElement('button');
    minus.type = 'button';
    minus.className = 'qty-btn';
    minus.textContent = '−';
    minus.setAttribute('aria-label', `Decrease quantity of ${ci.label}`);
    minus.addEventListener('click', () => changeQty(idx, -1));

    const qtyVal = document.createElement('span');
    qtyVal.className = 'qty-val';
    qtyVal.textContent = String(ci.qty);

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'qty-btn';
    plus.textContent = '+';
    plus.setAttribute('aria-label', `Increase quantity of ${ci.label}`);
    plus.addEventListener('click', () => changeQty(idx, 1));

    qtyRow.append(qtyLabel, minus, qtyVal, plus);
    meta.append(size, qtyRow);
    main.append(top, meta);
    row.append(img, main);
    cartItemsEl.append(row);
  });

  const subtotal = cartSubtotal();
  cartSubtotalEl.textContent = fmtMoney(subtotal);
  cartTaxesEl.textContent = fmtMoney(0);
  cartTotalEl.textContent = fmtMoney(subtotal);
  saveCart(cartItems);
}

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

checkoutBtn?.addEventListener('click', () => {
  if (!cartItems.length) return;
  saveCart(cartItems);
  window.location.href = 'checkout.html';
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
  grid.classList.toggle('grid-sparse', gridMode === 'sparse');
  document.body.classList.toggle('grid-sparse', gridMode === 'sparse');
  menuBtn.setAttribute(
    'aria-label',
    gridMode === 'sparse' ? 'Show more products per row' : 'Show fewer products per row'
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
}

/* ════════════════════════════════════
   Filter
   ════════════════════════════════════ */
function filtered(key) {
  let list = products;
  if (key === 'new') list = products.slice(0, 18);
  else if (key === 'mens') list = products.filter(p => p.gender === 'mens');
  else if (key === 'womens') list = products.filter(p => p.gender === 'womens');
  else if (key === 'footwear') list = products.filter(p => p.category === 'footwear');
  else if (key === 'accessories') list = products.filter(p => p.category === 'accessories');
  else if (key === 'slides') list = products.filter(p => p.category === 'slides');
  return list.filter(p => p.inStock !== false);
}

function applyFilter(key) {
  activeFilter = key;
  filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === key));
  visible = filtered(key);
  renderGrid(visible);
  updateCols();
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
    const btn = document.createElement('button');
    btn.className = 'product-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', `View ${item.label}`);
    btn.dataset.id = item.id;
    btn.dataset.i = String(i);

    const wrap = document.createElement('div');
    wrap.className = 'prod-img-wrap';
    wrap.append(mkPicture(item, i < 6));

    const meta = document.createElement('div');
    meta.className = 'prod-meta';
    const lbl = document.createElement('span');
    lbl.className = 'prod-label';
    lbl.textContent = item.label;
    const price = document.createElement('span');
    price.className = 'prod-price';
    price.textContent = fmt(item.price);
    meta.append(lbl, price);

    btn.append(wrap, meta);
    btn.addEventListener('click', () => openPreview(i));
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
  szClear.disabled = true;
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
    chip.setAttribute('aria-label', `Size US ${sz.us}`);

    const col = chipIndex % 7;
    const row = Math.floor(chipIndex / 7);
    const delayIndex = chipIndex;
    chipIndex += 1;
    chip.style.setProperty('--csx', `${(3 - col) * 60}px`);
    chip.style.setProperty('--csy', `${row > 0 ? -44 : 0}px`);

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
      szGrid.querySelectorAll('.sz-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedSize = sz.us;
      sizeOOS = oos;
      szClear.disabled = false;
      szPriceStack.dataset.alt = oos ? 'true' : 'false';
    });

    szGrid.append(chip);

    requestAnimationFrame(() => {
      setTimeout(() => chip.classList.add('in'), delayIndex * 16);
    });
  });

  szGrid.dataset.eu = String(euMode);
}

function openSizes() {
  szOpen = true;
  preview.classList.add('sz-open');
}
function closeSizes() {
  szOpen = false;
  preview.classList.remove('sz-open');
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

  const sc = Math.min(
    (window.innerWidth * 0.52) / br.width,
    (window.innerHeight * 0.48) / br.height,
    3.8
  );

  const tx = window.innerWidth/2 - (br.left + br.width/2);
  const ty = window.innerHeight*0.38 - (br.top + br.height/2);

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
  menuBtn.dataset.zoom = '0';
}
function applyPinch() {
  pinchWrap.style.setProperty('--pz-s', String(pinchState.sc));
  pinchWrap.style.setProperty('--pz-x', `${pinchState.x}px`);
  pinchWrap.style.setProperty('--pz-y', `${pinchState.y}px`);
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
    d.setAttribute('aria-label', `Image ${i+1}`);
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

  const render = () => {
    imgSquare.innerHTML = '';
    imgSquare.append(mkPictureFromUrl(imageUrl, item.label, true));
    if (animate) requestAnimationFrame(() => { imgSquare.style.opacity = '1'; });
  };

  if (!animate) {
    imgSquare.style.opacity = '1';
    render();
    return;
  }

  imgSquare.style.opacity = '0';
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
  if (!isOpen || szOpen) return;
  setGalleryImage(activeImageIdx + delta);
}

/* ════════════════════════════════════
   Preview content
   ════════════════════════════════════ */
function loadPreviewContent(idx) {
  const item = visible[idx];
  if (!item) return;

  activeImageIdx = 0;
  const gallery = getGallery(item);

  pNameEl.textContent = item.label;
  pPriceEl.textContent = fmt(item.price);
  szNameTxt.textContent = 'SELECT SIZE';
  szPriceTxt.textContent = fmt(item.price);
  szNameStack.dataset.alt = 'false';
  szPriceStack.dataset.alt = 'false';
  descVisible = false;
  euMode = false;
  pDesc.textContent = `${item.label}\n100% PREMIUM MATERIALS\nSHIPS 3-5 BUSINESS DAYS`;
  pDesc.classList.remove('show');
  closeSizes();
  renderSizes();
  buildDots(gallery.length, 0);
  updateGalleryImage(gallery[0], false);
  resetPinch();
}

function setPreviewNav(open) {
  menuBtn.dataset.preview = open ? 'true' : 'false';
  menuBtn.setAttribute('aria-label', open ? 'Back' : (
    gridMode === 'sparse' ? 'Show more products per row' : 'Show fewer products per row'
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

  const z = zoomGrid(gridBtns[idx], true);
  flyInInverse(z, false);

  preview.setAttribute('aria-hidden','false');
  preview.classList.add('visible');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => settleFlyIn(true));
  });
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
  };

  animate ? setTimeout(finish, ZOOM_DUR) : finish();
}

function stepPreview(d) {
  if (!isOpen || !visible.length) return;
  const next = (activeIdx + d + visible.length) % visible.length;
  activeIdx = next;
  gridBtns.forEach((b,i) => b.classList.toggle('active', i===next));
  loadPreviewContent(next);
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
  const item = visible[activeIdx];
  if (!item) return;
  szNameStack.dataset.alt = 'true';
  const existing = cartItems.find(ci => ci.id === item.id && ci.size === selectedSize);
  if (existing) existing.qty += 1;
  else cartItems.push({ id: item.id, label: item.label, price: item.price, size: selectedSize, image: item.image, qty: 1 });
  renderCart();
  setTimeout(() => {
    szNameStack.dataset.alt = 'false';
    closeSizes();
  }, 800);
});

szClear.addEventListener('click', () => {
  closeSizes();
  selectedSize = null;
  sizeOOS = false;
  szGrid.querySelectorAll('.sz-chip').forEach(c => c.classList.remove('selected'));
  szPriceStack.dataset.alt = 'false';
  szClear.disabled = true;
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
  if (!isOpen) return;
  if (e.key === 'Escape') closePreview();
  if (szOpen) return;
  if (e.key === 'ArrowLeft') stepGallery(-1);
  if (e.key === 'ArrowRight') stepGallery(1);
});

/* ════════════════════════════════════
   Wheel — switch products
   ════════════════════════════════════ */
preview.addEventListener('wheel', e => {
  if (!isOpen || szOpen || wheelLock) return;
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
  if (pinchPtrs.size === 1) {
    const p = pinchPtrs.get(e.pointerId);
    pinchState.x += e.clientX - p.x;
    pinchState.y += e.clientY - p.y;
    pinchPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    applyPinch();
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
   Resize
   ════════════════════════════════════ */
window.addEventListener('resize', updateCols);

window.addEventListener('storage', e => {
  if (e.key !== 'yzy_products') return;
  products = getProducts(seedProducts);
  if (isOpen) closePreview(false);
  applyFilter(activeFilter);
});

/* ════════════════════════════════════
   Init
   ════════════════════════════════════ */
syncSpacer(false);
syncGridMode();
renderCart();
applyFilter('new');

/**
 * @file admin-upload.js — product image upload UI (admin)
 */
import * as api from '../core/api-client.js';
import { isApiEnabled } from '../core/storage.js';

export function createImageUploadUI({
  mainImageZone,
  mainImageFile,
  mainImageEmpty,
  imagePreview,
  imagePreviewImg,
  mainImageRemove,
  mainImageStatus,
  productImage,
  productImageUrl,
  galleryZone,
  galleryFiles,
  galleryGrid,
  galleryUploadStatus,
  productGallery,
  productGalleryUrl,
  showToast,
}) {
  let galleryUrls = [];

  function syncGalleryField() {
    if (productGallery) productGallery.value = galleryUrls.join('\n');
    if (productGalleryUrl) productGalleryUrl.value = galleryUrls.join('\n');
  }

  function setStatus(el, msg, isError = false) {
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.textContent = '';
      el.classList.remove('is-error');
      return;
    }
    el.hidden = false;
    el.textContent = msg;
    el.classList.toggle('is-error', isError);
  }

  function setMainImage(url) {
    const value = (url || '').trim();
    if (productImage) productImage.value = value;
    if (productImageUrl) {
      productImageUrl.value = value;
      productImageUrl.setCustomValidity('');
    }

    if (!value || !imagePreview || !imagePreviewImg) {
      if (imagePreview) imagePreview.hidden = true;
      if (mainImageEmpty) mainImageEmpty.hidden = false;
      return;
    }

    imagePreviewImg.src = value;
    imagePreviewImg.onerror = () => {
      imagePreview.hidden = true;
      if (mainImageEmpty) mainImageEmpty.hidden = false;
    };
    imagePreviewImg.onload = () => {
      imagePreview.hidden = false;
      if (mainImageEmpty) mainImageEmpty.hidden = true;
    };
  }

  function clearMainImage() {
    setMainImage('');
    if (mainImageFile) mainImageFile.value = '';
  }

  function moveGalleryItem(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0) return;
    if (fromIndex >= galleryUrls.length || toIndex >= galleryUrls.length) return;
    const [item] = galleryUrls.splice(fromIndex, 1);
    galleryUrls.splice(toIndex, 0, item);
    renderGallery();
  }

  function renderGallery() {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    if (!galleryUrls.length) {
      galleryGrid.hidden = true;
      syncGalleryField();
      const hint = document.getElementById('galleryHint');
      if (hint) hint.hidden = true;
      return;
    }

    galleryGrid.hidden = false;
    const hint = document.getElementById('galleryHint');
    if (hint) hint.hidden = false;
    galleryUrls.forEach((url, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.draggable = true;
      item.dataset.index = String(index);
      const safeUrl = url.replace(/"/g, '&quot;');
      item.innerHTML = `
        <span class="gallery-order">${index + 1}</span>
        <button type="button" class="gallery-handle" aria-label="Drag to reorder image ${index + 1}" tabindex="-1">⋮⋮</button>
        <img src="${safeUrl}" alt="" loading="lazy" draggable="false" />
        <div class="gallery-item-actions">
          <button type="button" class="gallery-move" data-dir="-1" data-index="${index}" aria-label="Move image ${index + 1} earlier"${index === 0 ? ' disabled' : ''}>‹</button>
          <button type="button" class="gallery-move" data-dir="1" data-index="${index}" aria-label="Move image ${index + 1} later"${index === galleryUrls.length - 1 ? ' disabled' : ''}>›</button>
        </div>
        <button type="button" class="gallery-remove" data-index="${index}" aria-label="Remove image ${index + 1}">×</button>
      `;
      galleryGrid.append(item);
    });

    syncGalleryField();
  }

  function setGallery(urls) {
    galleryUrls = (urls || []).map(u => u.trim()).filter(Boolean);
    renderGallery();
  }

  function addGalleryUrls(urls) {
    urls.forEach(url => {
      const v = url.trim();
      if (v && !galleryUrls.includes(v)) galleryUrls.push(v);
    });
    renderGallery();
  }

  async function uploadOne(file) {
    if (!(await isApiEnabled())) {
      throw new Error('Image upload needs server API. Use URL fallback or run install/setup-server.sh');
    }
    const result = await api.adminUploadImage(file);
    return result.url;
  }

  async function handleMainFile(file) {
    if (!file) return;
    setStatus(mainImageStatus, 'Uploading…');
    try {
      const url = await uploadOne(file);
      setMainImage(url);
      setStatus(mainImageStatus, 'Uploaded');
      setTimeout(() => setStatus(mainImageStatus, ''), 1500);
    } catch (err) {
      setStatus(mainImageStatus, err.message || 'Upload failed', true);
      showToast?.(err.message || 'Upload failed');
    }
  }

  async function handleGalleryFiles(fileList) {
    const files = [...fileList];
    if (!files.length) return;

    setStatus(galleryUploadStatus, `Uploading ${files.length} image(s)…`);
    let ok = 0;
    for (const file of files) {
      try {
        const url = await uploadOne(file);
        addGalleryUrls([url]);
        ok += 1;
      } catch (err) {
        showToast?.(err.message || 'Gallery upload failed');
      }
    }
    setStatus(
      galleryUploadStatus,
      ok ? `Added ${ok} image(s)` : 'Upload failed',
      !ok,
    );
    setTimeout(() => setStatus(galleryUploadStatus, ''), 2000);
    if (galleryFiles) galleryFiles.value = '';
  }

  function bindDropZone(zone, onFiles) {
    if (!zone) return;

    zone.addEventListener('click', e => {
      if (e.target.closest('.upload-remove, .gallery-remove, .gallery-move, .gallery-handle, .gallery-item')) return;
      const input = zone.querySelector('input[type="file"]');
      input?.click();
    });

    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('is-dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('is-dragover');
    });

    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('is-dragover');
      if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
    });
  }

  bindDropZone(mainImageZone, files => handleMainFile(files[0]));
  bindDropZone(galleryZone, files => handleGalleryFiles(files));

  mainImageFile?.addEventListener('change', () => {
    handleMainFile(mainImageFile.files?.[0]);
  });

  galleryFiles?.addEventListener('change', () => {
    handleGalleryFiles(galleryFiles.files || []);
  });

  mainImageRemove?.addEventListener('click', e => {
    e.stopPropagation();
    clearMainImage();
  });

  let dragFromIndex = null;

  galleryGrid?.addEventListener('dragstart', e => {
    const item = e.target.closest('.gallery-item');
    if (!item || !galleryGrid.contains(item)) return;
    dragFromIndex = Number(item.dataset.index);
    if (Number.isNaN(dragFromIndex)) return;
    item.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(dragFromIndex));
  });

  galleryGrid?.addEventListener('dragend', () => {
    galleryGrid.querySelectorAll('.gallery-item').forEach(el => {
      el.classList.remove('is-dragging', 'is-drop-target');
    });
    dragFromIndex = null;
  });

  galleryGrid?.addEventListener('dragover', e => {
    const item = e.target.closest('.gallery-item');
    if (!item || !galleryGrid.contains(item)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    galleryGrid.querySelectorAll('.gallery-item.is-drop-target').forEach(el => {
      if (el !== item) el.classList.remove('is-drop-target');
    });
    item.classList.add('is-drop-target');
  });

  galleryGrid?.addEventListener('dragleave', e => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    const related = e.relatedTarget;
    if (related instanceof Node && item.contains(related)) return;
    item.classList.remove('is-drop-target');
  });

  galleryGrid?.addEventListener('drop', e => {
    const item = e.target.closest('.gallery-item');
    if (!item || dragFromIndex === null) return;
    e.preventDefault();
    e.stopPropagation();
    const toIndex = Number(item.dataset.index);
    item.classList.remove('is-drop-target');
    if (!Number.isNaN(toIndex)) moveGalleryItem(dragFromIndex, toIndex);
  });

  galleryGrid?.addEventListener('click', e => {
    const moveBtn = e.target.closest('.gallery-move');
    if (moveBtn) {
      e.stopPropagation();
      if (moveBtn.disabled) return;
      const index = Number(moveBtn.dataset.index);
      const dir = Number(moveBtn.dataset.dir);
      if (!Number.isNaN(index) && !Number.isNaN(dir)) moveGalleryItem(index, index + dir);
      return;
    }

    const btn = e.target.closest('.gallery-remove');
    if (!btn) return;
    e.stopPropagation();
    const index = Number(btn.dataset.index);
    if (Number.isNaN(index)) return;
    galleryUrls.splice(index, 1);
    renderGallery();
  });

  productImageUrl?.addEventListener('change', () => {
    setMainImage(productImageUrl.value);
  });

  productGalleryUrl?.addEventListener('change', () => {
    const urls = productGalleryUrl.value.split('\n').map(s => s.trim()).filter(Boolean);
    setGallery(urls);
  });

  return {
    setMainImage,
    clearMainImage,
    setGallery,
    getGallery: () => [...galleryUrls],
    reset() {
      clearMainImage();
      setGallery([]);
      setStatus(mainImageStatus, '');
      setStatus(galleryUploadStatus, '');
    },
  };
}

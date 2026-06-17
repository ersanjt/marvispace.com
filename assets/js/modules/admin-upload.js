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
    if (productImageUrl) productImageUrl.value = value;

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

  function renderGallery() {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    if (!galleryUrls.length) {
      galleryGrid.hidden = true;
      syncGalleryField();
      return;
    }

    galleryGrid.hidden = false;
    galleryUrls.forEach((url, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `
        <img src="${url.replace(/"/g, '&quot;')}" alt="" loading="lazy" />
        <button type="button" class="gallery-remove" data-index="${index}" aria-label="Remove image">×</button>
      `;
      galleryGrid.append(item);
    });

    syncGalleryField();
  }

  function setGallery(urls) {
    galleryUrls = [...new Set((urls || []).map(u => u.trim()).filter(Boolean))];
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
      if (e.target.closest('.upload-remove, .gallery-remove')) return;
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

  galleryGrid?.addEventListener('click', e => {
    const btn = e.target.closest('.gallery-remove');
    if (!btn) return;
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

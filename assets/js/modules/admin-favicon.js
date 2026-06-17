/**
 * @file admin-favicon.js — favicon upload in admin settings
 */
import { adminResetFavicon, adminUploadFavicon } from '../core/api-client.js';
import { isApiEnabled } from '../core/storage.js';

export function createFaviconUploadUI({
  zone,
  fileInput,
  empty,
  preview,
  previewImg,
  removeBtn,
  statusEl,
  resetBtn,
  showToast,
  onUpdated,
}) {
  function setStatus(msg, isError = false) {
    if (!statusEl) return;
    if (!msg) {
      statusEl.hidden = true;
      statusEl.textContent = '';
      statusEl.classList.remove('is-error');
      return;
    }
    statusEl.hidden = false;
    statusEl.textContent = msg;
    statusEl.classList.toggle('is-error', isError);
  }

  function showPreview(url) {
    const value = (url || '').trim();
    if (!value || !preview || !previewImg) {
      if (preview) preview.hidden = true;
      if (empty) empty.hidden = false;
      return;
    }

    previewImg.src = value;
    previewImg.onerror = () => {
      preview.hidden = true;
      if (empty) empty.hidden = false;
    };
    previewImg.onload = () => {
      preview.hidden = false;
      if (empty) empty.hidden = true;
    };
  }

  async function uploadFile(file) {
    if (!(await isApiEnabled())) {
      setStatus('Server API required for favicon upload', true);
      return;
    }

    setStatus('Uploading…');
    try {
      const data = await adminUploadFavicon(file);
      showPreview(data.favicon?.url || '');
      setStatus('');
      showToast?.('Favicon updated');
      onUpdated?.(data.favicon);
    } catch (err) {
      setStatus(err.message || 'Upload failed', true);
    }
  }

  function onFiles(files) {
    const file = files?.[0];
    if (!file) return;
    uploadFile(file);
  }

  zone?.addEventListener('click', () => fileInput?.click());

  zone?.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('is-dragover');
  });

  zone?.addEventListener('dragleave', () => {
    zone.classList.remove('is-dragover');
  });

  zone?.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('is-dragover');
    onFiles(e.dataTransfer?.files);
  });

  fileInput?.addEventListener('change', () => {
    onFiles(fileInput.files);
    fileInput.value = '';
  });

  removeBtn?.addEventListener('click', e => {
    e.stopPropagation();
    showPreview('');
  });

  resetBtn?.addEventListener('click', async () => {
    if (!(await isApiEnabled())) {
      setStatus('Server API required', true);
      return;
    }
    if (!confirm('Reset favicon to the default MARVISPACE icon?')) return;

    setStatus('Resetting…');
    try {
      const data = await adminResetFavicon();
      showPreview(data.favicon?.url || '/favicon.svg');
      setStatus('');
      showToast?.('Favicon reset to default');
      onUpdated?.(data.favicon);
    } catch (err) {
      setStatus(err.message || 'Could not reset favicon', true);
    }
  });

  return { showPreview };
}

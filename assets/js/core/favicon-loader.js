/**
 * @file favicon-loader.js — apply site favicon from API (when customized in admin)
 */
const DEFAULT_FAVICON = '/favicon.svg';

function applyFavicon(url, type) {
  if (!url) return;

  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(link => {
    link.remove();
  });

  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.href = url;
  if (type) icon.type = type;
  document.head.appendChild(icon);

  const apple = document.createElement('link');
  apple.rel = 'apple-touch-icon';
  apple.href = url;
  document.head.appendChild(apple);
}

async function loadSiteFavicon() {
  try {
    const res = await fetch('/api/v1/settings.php', { credentials: 'omit' });
    const payload = await res.json();
    const favicon = payload?.data?.favicon;
    if (!favicon?.url || favicon.url === DEFAULT_FAVICON) return;
    applyFavicon(favicon.url, favicon.type);
  } catch {
    /* keep default from HTML */
  }
}

loadSiteFavicon();

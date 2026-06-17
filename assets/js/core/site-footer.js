/**
 * @file site-footer.js — shared footer navigation
 * @author Ersan JT <https://github.com/ersanjt>
 */

const FOOTER_INNER_HTML = `
  <div class="footer-inner">
    <ul class="footer-nav">
      <li><a href="/contact" class="nav-item">Contact</a></li>
      <li><a href="/terms" class="nav-item">Terms</a></li>
      <li><a href="/privacy" class="nav-item">Privacy</a></li>
      <li><a href="/accessibility" class="nav-item">Accessibility</a></li>
      <li><a href="/privacy-right-center" class="nav-item">DNSMPI</a></li>
      <li><button type="button" class="nav-item" data-cookies-btn>Cookies</button></li>
      <li><a href="/order-status" class="nav-item">Order Status</a></li>
    </ul>
  </div>
`;

function bindCookiesButton(footer) {
  footer.querySelector('[data-cookies-btn]')?.addEventListener('click', () => {
    window.location.href = '/privacy#cookies';
  });
}

export function mountSiteFooter(root = document) {
  root.querySelectorAll('[data-site-footer], .site-footer').forEach(footer => {
    if (!footer.querySelector('.footer-inner')) {
      footer.classList.add('site-footer');
      footer.innerHTML = FOOTER_INNER_HTML;
    }
    bindCookiesButton(footer);
  });
}

if (document.currentScript?.type === 'module') {
  mountSiteFooter();
}

/**
 * @file admin-auth.js — client-side admin session (custom login UI)
 * @author Ersan JT <https://github.com/ersanjt>
 */
import { ADMIN_PASSWORD_SHA256 } from '../config/admin-auth.js';
import { isAdminAuthed, setAdminAuthed } from './storage.js';

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyAdminPassword(password) {
  if (!password) return false;
  const hash = await sha256(password);
  return hash === ADMIN_PASSWORD_SHA256;
}

export function mountAdminLogin({ onSuccess }) {
  const screen = document.getElementById('loginScreen');
  const app = document.getElementById('adminApp');
  const form = document.getElementById('loginForm');
  const input = document.getElementById('loginPassword');
  const error = document.getElementById('loginError');
  const toggle = document.getElementById('loginShowPass');

  function setLoggedIn(on) {
    document.body.classList.toggle('is-logged-in', on);
    if (screen) screen.hidden = on;
    if (app) app.hidden = !on;
  }

  if (isAdminAuthed()) {
    setLoggedIn(true);
    onSuccess?.();
    return;
  }

  setLoggedIn(false);

  toggle?.addEventListener('click', () => {
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(show));
    toggle.textContent = show ? 'Hide' : 'Show';
  });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const pwd = input?.value.trim() || '';
    const ok = await verifyAdminPassword(pwd);
    if (!ok) {
      if (error) {
        error.hidden = false;
        error.textContent = 'Incorrect password. Try again.';
      }
      input?.focus();
      return;
    }
    if (error) error.hidden = true;
    setAdminAuthed(true);
    setLoggedIn(true);
    onSuccess?.();
  });
}

export function signOutAdmin() {
  setAdminAuthed(false);
  window.location.reload();
}

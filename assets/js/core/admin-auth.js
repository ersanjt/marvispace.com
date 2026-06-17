/**
 * @file admin-auth.js — client-side admin session (custom login UI)
 * @author Ersan JT <https://github.com/ersanjt>
 */
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD_SHA256,
  ADMIN_RECOVERY_SHA256,
} from '../config/admin-auth.js';
import {
  getAdminPasswordHashOverride,
  isAdminAuthed,
  setAdminAuthed,
  setAdminPasswordHashOverride,
} from './storage.js';

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function stripSensitiveQueryParams() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('password') && !url.searchParams.has('email')) return;
    url.searchParams.delete('password');
    url.searchParams.delete('email');
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, '', next);
  } catch {
    /* ignore */
  }
}

function activePasswordHash() {
  return getAdminPasswordHashOverride() || ADMIN_PASSWORD_SHA256;
}

export function verifyAdminEmail(email) {
  return normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL);
}

export async function verifyAdminCredentials(email, password) {
  if (!verifyAdminEmail(email) || !password) return false;
  const hash = await sha256(password);
  return hash === activePasswordHash();
}

export async function verifyRecoveryCode(code) {
  if (!code) return false;
  const hash = await sha256(code);
  return hash === ADMIN_RECOVERY_SHA256;
}

export async function resetAdminPassword(newPassword) {
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }
  const hash = await sha256(newPassword);
  setAdminPasswordHashOverride(hash);
  return { ok: true };
}

function bindPasswordToggle(button, input) {
  button?.addEventListener('click', () => {
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(show));
    button.textContent = show ? 'Hide' : 'Show';
  });
}

export function mountAdminLogin({ onSuccess }) {
  stripSensitiveQueryParams();

  const screen = document.getElementById('loginScreen');
  const app = document.getElementById('adminApp');
  const loginForm = document.getElementById('loginForm');
  const recoveryForm = document.getElementById('recoveryForm');
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');
  const recoveryError = document.getElementById('recoveryError');
  const recoverySuccess = document.getElementById('recoverySuccess');
  const forgotBtn = document.getElementById('forgotPasswordBtn');
  const backToLoginBtn = document.getElementById('backToLoginBtn');
  const loginShowPass = document.getElementById('loginShowPass');
  const recoveryShowPass = document.getElementById('recoveryShowPass');
  const recoveryShowNew = document.getElementById('recoveryShowNew');

  function setLoggedIn(on) {
    document.body.classList.toggle('is-logged-in', on);
    if (screen) screen.hidden = on;
    if (app) app.hidden = !on;
  }

  function showLoginView() {
    if (loginForm) loginForm.hidden = false;
    if (recoveryForm) recoveryForm.hidden = true;
    if (recoverySuccess) recoverySuccess.hidden = true;
    if (recoveryError) recoveryError.hidden = true;
    if (loginError) loginError.hidden = true;
  }

  function showRecoveryView() {
    if (loginForm) loginForm.hidden = true;
    if (recoveryForm) recoveryForm.hidden = false;
    if (recoverySuccess) recoverySuccess.hidden = true;
    if (recoveryError) recoveryError.hidden = true;
    if (loginError) loginError.hidden = true;
    document.getElementById('recoveryEmail')?.focus();
  }

  if (isAdminAuthed()) {
    setLoggedIn(true);
    onSuccess?.();
    return;
  }

  setLoggedIn(false);
  showLoginView();

  if (emailInput && !emailInput.value) {
    emailInput.value = ADMIN_EMAIL;
  }

  bindPasswordToggle(loginShowPass, passwordInput);
  bindPasswordToggle(recoveryShowPass, document.getElementById('recoveryCode'));
  bindPasswordToggle(recoveryShowNew, document.getElementById('recoveryNewPassword'));

  forgotBtn?.addEventListener('click', showRecoveryView);
  backToLoginBtn?.addEventListener('click', e => {
    e.preventDefault();
    showLoginView();
    passwordInput?.focus();
  });

  loginForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = emailInput?.value || '';
    const pwd = passwordInput?.value || '';

    if (!verifyAdminEmail(email)) {
      if (loginError) {
        loginError.hidden = false;
        loginError.textContent = 'This email is not authorized for admin access.';
      }
      emailInput?.focus();
      return;
    }

    const ok = await verifyAdminCredentials(email, pwd);
    if (!ok) {
      if (loginError) {
        loginError.hidden = false;
        loginError.textContent = 'Incorrect password. Use "Forgot password?" to reset.';
      }
      passwordInput?.focus();
      return;
    }

    if (loginError) loginError.hidden = true;
    setAdminAuthed(true);
    setLoggedIn(true);
    onSuccess?.();
  });

  recoveryForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('recoveryEmail')?.value || '';
    const code = document.getElementById('recoveryCode')?.value || '';
    const newPwd = document.getElementById('recoveryNewPassword')?.value || '';
    const confirmPwd = document.getElementById('recoveryConfirmPassword')?.value || '';

    if (!verifyAdminEmail(email)) {
      if (recoveryError) {
        recoveryError.hidden = false;
        recoveryError.textContent = 'This email is not authorized for admin access.';
      }
      return;
    }

    const codeOk = await verifyRecoveryCode(code);
    if (!codeOk) {
      if (recoveryError) {
        recoveryError.hidden = false;
        recoveryError.textContent = 'Invalid recovery code. Check your handoff notes or contact the developer.';
      }
      return;
    }

    if (newPwd !== confirmPwd) {
      if (recoveryError) {
        recoveryError.hidden = false;
        recoveryError.textContent = 'New passwords do not match.';
      }
      return;
    }

    const result = await resetAdminPassword(newPwd);
    if (!result.ok) {
      if (recoveryError) {
        recoveryError.hidden = false;
        recoveryError.textContent = result.error;
      }
      return;
    }

    if (recoveryError) recoveryError.hidden = true;
    if (recoverySuccess) recoverySuccess.hidden = false;
    if (recoveryForm) recoveryForm.hidden = true;

    setAdminAuthed(true);
    setTimeout(() => {
      setLoggedIn(true);
      onSuccess?.();
    }, 1200);
  });
}

export function signOutAdmin() {
  setAdminAuthed(false);
  window.location.href = '/admin';
}

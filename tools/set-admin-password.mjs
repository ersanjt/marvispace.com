import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const password = process.argv[2];
const recovery = process.argv[3];

if (!password) {
  console.error('Usage: node tools/set-admin-password.mjs "YourPassword" ["RecoveryCode"]');
  process.exit(1);
}

const file = new URL('../assets/js/config/admin-auth.js', import.meta.url);
let email = 'ersanjahedtabrizi@gmail.com';
let recoveryHash = '7132ea8afa6d4a3ef4528a7168b396ef59d95b455cd2ea5035001cf48c7c5083';

try {
  const existing = readFileSync(file, 'utf8');
  const emailMatch = existing.match(/ADMIN_EMAIL = '([^']+)'/);
  const recoveryMatch = existing.match(/ADMIN_RECOVERY_SHA256 = '([^']+)'/);
  if (emailMatch) email = emailMatch[1];
  if (recoveryMatch) recoveryHash = recoveryMatch[1];
} catch {
  /* first run */
}

if (recovery) {
  recoveryHash = createHash('sha256').update(recovery).digest('hex');
}

const passwordHash = createHash('sha256').update(password).digest('hex');

const content = `/**
 * Admin credentials (SHA-256 hashes). Update with:
 *   node tools/set-admin-password.mjs 'YourPassword'
 *   node tools/set-admin-password.mjs 'YourPassword' 'RecoveryCode'
 */
export const ADMIN_EMAIL = '${email}';
export const ADMIN_PASSWORD_SHA256 = '${passwordHash}';
export const ADMIN_RECOVERY_SHA256 = '${recoveryHash}';
`;

writeFileSync(file, content, 'utf8');
console.log('Updated assets/js/config/admin-auth.js');
console.log(`Admin email: ${email}`);
if (recovery) console.log('Recovery code updated.');
console.log('Deploy to apply changes on the server.');

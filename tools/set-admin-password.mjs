import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const password = process.argv[2];
const recovery = process.argv[3];

if (!password) {
  console.error('Usage: node tools/set-admin-password.mjs "YourPassword" ["RecoveryCode"]');
  process.exit(1);
}

const exampleFile = new URL('../assets/js/config/admin-auth.js.example', import.meta.url);
const targetFile = new URL('../assets/js/config/admin-auth.js', import.meta.url);

let email = process.env.MARVISPACE_ADMIN_EMAIL || 'admin@example.com';
let recoveryHash = '';

const source = existsSync(targetFile)
  ? targetFile
  : exampleFile;

try {
  const existing = readFileSync(source, 'utf8');
  const emailMatch = existing.match(/ADMIN_EMAIL = '([^']*)'/);
  const recoveryMatch = existing.match(/ADMIN_RECOVERY_SHA256 = '([^']*)'/);
  if (emailMatch?.[1]) email = emailMatch[1];
  if (recoveryMatch?.[1]) recoveryHash = recoveryMatch[1];
} catch {
  /* first run */
}

if (recovery) {
  recoveryHash = createHash('sha256').update(recovery).digest('hex');
}

const passwordHash = createHash('sha256').update(password).digest('hex');

const content = `/**
 * Local admin fallback (gitignored). Copy from admin-auth.js.example if missing.
 *   node tools/set-admin-password.mjs 'YourPassword' 'YourRecoveryCode'
 */
export const ADMIN_EMAIL = '${email}';
export const ADMIN_PASSWORD_SHA256 = '${passwordHash}';
export const ADMIN_RECOVERY_SHA256 = '${recoveryHash}';
`;

writeFileSync(targetFile, content, 'utf8');
console.log('Updated assets/js/config/admin-auth.js (gitignored)');
console.log(`Admin email: ${email}`);
if (recovery) console.log('Recovery code updated.');
console.log('This file is NOT committed to GitHub. Deploy copies it separately on the server.');

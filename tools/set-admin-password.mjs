import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node tools/set-admin-password.mjs "YourPassword"');
  process.exit(1);
}

const hash = createHash('sha256').update(password).digest('hex');
const file = new URL('../assets/js/config/admin-auth.js', import.meta.url);

const content = `/**
 * Admin password hash (SHA-256). Update with: node tools/set-admin-password.mjs 'YourPassword'
 */
export const ADMIN_PASSWORD_SHA256 = '${hash}';
`;

writeFileSync(file, content, 'utf8');
console.log('Updated assets/js/config/admin-auth.js');
console.log('Deploy to apply the new password on the server.');

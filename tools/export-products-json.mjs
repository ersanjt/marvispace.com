import { readFileSync, writeFileSync } from 'node:fs';

const src = new URL('../assets/js/data/products.js', import.meta.url);
const raw = readFileSync(src, 'utf8');
const match = raw.match(/export const products = (\[[\s\S]*\]);/);
if (!match) {
  console.error('Could not parse products.js');
  process.exit(1);
}

const products = JSON.parse(match[1]);
const out = new URL('../install/products.json', import.meta.url);
writeFileSync(out, JSON.stringify(products, null, 2), 'utf8');
console.log(`Wrote ${products.length} products to install/products.json`);

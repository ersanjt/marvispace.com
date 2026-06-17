import { readFileSync, writeFileSync } from 'node:fs';
import { products } from '../assets/js/data/products.js';

const map = {
  'Aris Deri Ceket': 'Aris Leather Jacket',
  'Apex Deri Ceket': 'Apex Leather Jacket',
  'Axis Bomber Deri Ceket': 'Axis Bomber Leather Jacket',
  'Asis Bomber Deri Ceket': 'Asis Bomber Leather Jacket',
  'Aron Süet Gömlek Ceket': 'Aron Suede Shirt Jacket',
  'Aven Süet Bomber Ceket': 'Aven Suede Bomber Jacket',
  'Kros Süet Bomber Ceket': 'Kros Suede Bomber Jacket',
  'Kian Deri Gömlek Ceket': 'Kian Leather Shirt Jacket',
  'Maya Vizon Süet Gömlek': 'Maya Mink Suede Shirt',
  'Mila Deri Crop Bomber': 'Mila Leather Crop Bomber',
  'Rhea Crop Biker': 'Rhea Crop Biker Jacket',
  'Scarlet Süet Ceket': 'Scarlet Suede Jacket',
  'Nova Deri Gömlek Ceket': 'Nova Leather Shirt Jacket',
  'Rico Gri Süet Ceket': 'Rico Grey Suede Jacket',
  'Omar Bomber Süet Ceket': 'Omar Suede Bomber Jacket',
  'Luca Deri Ceket': 'Luca Leather Jacket',
  'Zion Deri Bomber Ceket': 'Zion Leather Bomber Jacket',
};

for (const p of products) {
  if (map[p.label]) p.label = map[p.label];
}

writeFileSync('assets/js/data/products.js', `export const products = ${JSON.stringify(products, null, 2)};\n`, 'utf8');
console.log('Done:', products.map(p => p.label).join(', '));

#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scanDir = path.join(root, 'src');

const replacements = new Map([
  ['✅', '[OK]'],
  ['📊', '[chart]'],
  ['💊', '[pill]'],
  ['⚠️', '[WARN]'],
  ['⚠', '[WARN]'],
  ['🚨', '[ALERT]'],
  ['📎', '[attach]'],
  ['👁️', '[eye]'],
  ['👁', '[eye]'],
  ['🙈', '[hide]'],
  ['✓', '[OK]'],
  ['•', '-'],
  ['—', '-'],
  ['…', '...'],
  ['📊', '[chart]'],
  ['📈', '[chart]']
]);

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results.push(...walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(scanDir).filter((f) => /\.(js|ts|jsx|tsx)$/.test(f));
let changed = 0;
files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let orig = content;
  replacements.forEach((value, key) => {
    if (content.includes(key)) {
      const re = new RegExp(key.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1"), 'g');
      content = content.replace(re, value);
    }
  });

  // Remove other non-ASCII characters conservatively: replace with empty string
  const cleaned = content.replace(/[\u0080-\uFFFF]/g, '');
  if (cleaned !== orig) {
    fs.writeFileSync(file, cleaned, 'utf8');
    console.log(`Sanitized ${file}`);
    changed++;
  }
});

console.log(`Sanitization complete. Files changed: ${changed}`);
process.exit(0);

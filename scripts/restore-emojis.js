#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scanDir = path.join(root, 'src');

const map = new Map([
  ['[chart]', '📊'],
  ['[pill]', '💊'],
  ['[OK]', '✅'],
  ['[WARN]', '⚠️'],
  ['[ALERT]', '🚨'],
  ['[attach]', '📎'],
  ['[eye]', '👁️'],
  ['[hide]', '🙈'],
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
  map.forEach((emoji, token) => {
    const re = new RegExp(token.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1"), 'g');
    content = content.replace(re, emoji);
  });
  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    changed++;
  }
});

console.log(`Restore complete. Files changed: ${changed}`);
process.exit(0);

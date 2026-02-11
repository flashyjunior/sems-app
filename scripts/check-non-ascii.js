#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scanDir = path.join(root, 'src');

function isAscii(str) {
  // allow common whitespace and control chars
  return /^[\u0000-\u007f]*$/.test(str);
}

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
let found = 0;
files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (!isAscii(ch)) {
      const snippet = content.substr(Math.max(0, i - 20), 60).replace(/\n/g, '\\n');
      console.error(`Non-ASCII char in ${file}: index ${i} -> ...${snippet}...`);
      found++;
      break;
    }
  }
});

if (found > 0) {
  console.error(`\nFound ${found} files with non-ASCII characters. Please remove or replace glyphs before committing.`);
  process.exit(2);
} else {
  console.log('No non-ASCII characters found in src/');
  process.exit(0);
}

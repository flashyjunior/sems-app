#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scanDir = path.join(root, 'src');

function isAllowedChar(ch) {
  // Allow ASCII and emoji / pictographic characters (so UI emojis are permitted)
  // Uses Unicode property escapes; requires a modern Node.js (v10+).
  if (/^[\u0000-\u007f]$/.test(ch)) return true;
  try {
    // match Emoji or Extended_Pictographic characters
    return /\p{Emoji}|\p{Extended_Pictographic}/u.test(ch);
  } catch (e) {
    // Fallback: allow common emoji-range codepoints (basic BMP symbols)
    return /[\u2600-\u26FF\u2700-\u27BF\u1F300-\u1F6FF\u1F900-\u1F9FF]/.test(ch);
  }
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
    if (!isAllowedChar(ch)) {
      const snippet = content.substr(Math.max(0, i - 20), 60).replace(/\n/g, '\\n');
      console.error(`Disallowed char in ${file}: index ${i} -> ...${snippet}...`);
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

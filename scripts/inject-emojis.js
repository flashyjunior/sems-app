#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scanDir = path.join(root, 'src');

const keywords = [
  { kw: 'New Dispense', emoji: '💊' },
  { kw: 'Dispense', emoji: '💊' },
  { kw: 'Dashboard', emoji: '📊' },
  { kw: 'Analytics', emoji: '📈' },
  { kw: 'Support', emoji: '🎫' },
  { kw: 'Ticket', emoji: '🎫' },
  { kw: 'Tickets', emoji: '🎫' },
  { kw: 'Settings', emoji: '⚙️' },
  { kw: 'Patient', emoji: '👤' },
  { kw: 'Help', emoji: '💡' },
];

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

  keywords.forEach(({ kw, emoji }) => {
    // match headings like <h1 ...>Text</h1> or heading tags with class attributes
    const re = new RegExp(`(<h[1-4][^>]*>\\s*)((${kw})(?![\\S\\s]*${emoji}))`, 'g');
    content = content.replace(re, (m, p1, p2) => {
      return `${p1}${emoji} ${p2}`;
    });
  });

  if (content !== orig) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Injected emojis into ${file}`);
    changed++;
  }
});

console.log(`Injection complete. Files changed: ${changed}`);
process.exit(0);

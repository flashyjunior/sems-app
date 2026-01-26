const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

console.log('Cleaning up malformed className attributes...\n');

fs.readdirSync(componentsDir).forEach(file => {
  if (!file.endsWith('.tsx')) return;
  
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Fix: className="className="... -> className="...
  content = content.replace(/className="className="/g, 'className="');
  
  // Fix: className="... text-gray-900 bg-white" text-gray-900 bg-white" -> className="... text-gray-900 bg-white"
  content = content.replace(/className="([^"]*)" (text-gray-900|bg-white)"/g, 'className="$1"');
  
  // Fix: className="... bg-white " bg-white" -> className="... bg-white"
  content = content.replace(/bg-white\s+" bg-white"/g, 'bg-white"');
  
  // Fix: text-gray\n-900 (split across lines) -> text-gray-900
  content = content.replace(/text-gray\n\s*-900/g, 'text-gray-900');
  
  if (originalContent !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('\nDone!');

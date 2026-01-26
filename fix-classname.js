const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

console.log('Fixing duplicate className= in:', componentsDir);

fs.readdirSync(componentsDir).forEach(file => {
  if (!file.endsWith('.tsx')) return;
  
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Fix duplicate className="className="
  content = content.replace(/className="className="/g, 'className="');
  
  // Also clean up any duplicate text-gray-900 or bg-white in the same className
  content = content.replace(/className="([^"]*)(text-gray-900[^"]*)(text-gray-900)/g, 'className="$1$2"');
  content = content.replace(/className="([^"]*)(bg-white[^"]*)(bg-white)/g, 'className="$1$2"');
  
  if (originalContent !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log('Done!');

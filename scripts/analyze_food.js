const fs = require('fs');
const path = require('path');

const dir = './src/data/food';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

let total = 0;

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const matches = [...content.matchAll(/id:\s*['"]([^'"]+)['"]/g)];
  total += matches.length;
  console.log(`${file}: ${matches.length} items`);
});

console.log(`\nTotal items across all files: ${total}`);

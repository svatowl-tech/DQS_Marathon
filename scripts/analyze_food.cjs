const fs = require('fs');
const path = require('path');

const dir = './src/data/food';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

let total = 0;

const validCategories = new Set([
  'fruits', 'vegetables', 'greens', 'meat', 'dairy', 'cheese', 'nuts',
  'oils', 'whole_grains', 'legumes', 'potatoes', 'other_grains', 'sweets',
  'sugary_drinks', 'alcohol', 'fried_food', 'processed_meat'
]);

const legacyKeyCounts = {};
const categoryUsage = {};

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const matches = [...content.matchAll(/id:\s*['"]([^'"]+)['"]/g)];
  total += matches.length;

  const servingMatches = [...content.matchAll(/servings:\s*\{([^}]+)\}/g)];
  servingMatches.forEach(m => {
    const pairs = m[1].split(',');
    pairs.forEach(p => {
      const parts = p.split(':');
      if (parts.length === 2) {
        const k = parts[0].trim();
        categoryUsage[k] = (categoryUsage[k] || 0) + 1;
        if (!validCategories.has(k)) {
          legacyKeyCounts[k] = (legacyKeyCounts[k] || 0) + 1;
        }
      }
    });
  });

  console.log(`${file}: ${matches.length} items`);
});

console.log(`\nTotal items across all files: ${total}`);
console.log('\nAll Serving Category Keys Usage:', categoryUsage);
console.log('\nLegacy / Non-standard Keys Usage:', legacyKeyCounts);

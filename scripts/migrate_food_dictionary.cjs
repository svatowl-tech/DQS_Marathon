const fs = require('fs');
const path = require('path');

const dir = './src/data/food';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

function transformServings(servingsObj, title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  const newServings = {};

  for (const [key, val] of Object.entries(servingsObj)) {
    if (val === 0 || val === null || val === undefined) continue;

    let targetKey = key;

    // 1. Legacy replacements
    if (key === 'nuts_seeds') targetKey = 'nuts';
    else if (key === 'oils_fats') targetKey = 'oils';
    else if (key === 'processed_meats') targetKey = 'processed_meat';
    else if (key === 'lean_proteins') {
      if (/тофу|эдамаме|соя|соевый|темпе/.test(text)) {
        targetKey = 'legumes';
      } else {
        targetKey = 'meat';
      }
    } else if (key === 'refined_grains') {
      if (/гречк|овсян|киноа|бурый рис|дикий рис|перловк|цельнозерн|\bцз\b/.test(text)) {
        targetKey = 'whole_grains';
      } else if (/картоф|драник/.test(text)) {
        targetKey = 'potatoes';
      } else {
        targetKey = 'other_grains';
      }
    } else if (key === 'sugary_drinks_alcohol') {
      if (/пиво|вино|коньяк|водка|виски|ром|джин|сидр|коктейль|шампанск|ликёр|вермут|эль|але|портер|сидр/.test(text)) {
        targetKey = 'alcohol';
      } else {
        targetKey = 'sugary_drinks';
      }
    } else if (key === 'healthy_drinks') {
      if (/молок|кефир|йогурт|какао|ряженк/.test(text)) {
        targetKey = 'dairy';
      } else if (/сок|морс|компот|смузи/.test(text)) {
        targetKey = 'fruits';
      } else {
        continue; // Water/tea/coffee without additions
      }
    }

    // 2. Specific 17-category refinements based on item content

    // CHEESE: if targetKey is 'dairy' or 'oils' and item is clearly cheese
    if ((targetKey === 'dairy' || targetKey === 'oils') && /сыр\b|сыра\b|сыром\b|пармезан|моцарелл|фета\b|брынз|сулугуни|дорблю|гауда|чеддер|рикотт|маскарпоне|халуми|чечил/.test(text)) {
      // If it's pure cheese or cheese snack
      if (!/творог|йогурт|кефир|сметан|молоко|сырники/.test(text) || /сыр твердый|сыр плавленый|сыр пармезан|сыр моцарелла|сыр фета|сыр брынза|сырная тарелка/.test(text)) {
        targetKey = 'cheese';
      }
    }

    // GREENS: if targetKey is 'vegetables' and item is herbs/leafy greens
    if (targetKey === 'vegetables' && /зелень|петрушк|укроп|кинз|шпинат|рукол|салат листовой|салат латук|салат айсберг|микрозелень|щавель|базилик|мята/.test(text)) {
      if (/зелень свежая|шпинат свежий|рукола|салат айсберг|салат латук|микрозелень|укроп|петрушка/.test(text)) {
        targetKey = 'greens';
      }
    }

    // LEGUMES: if targetKey is 'vegetables' or 'meat' or 'other_grains' and item is beans/lentils/chickpeas/hummus/tofu
    if ((targetKey === 'vegetables' || targetKey === 'meat' || targetKey === 'other_grains') && /фасоль|чечевиц|нут\b|горох|маш\b|хумус|эдамаме|бобы|тофу/.test(text)) {
      if (!/мясо|куриц|говядин|свинин|индейк/.test(text) || /хумус|чечевица|нут|фасоль|тофу/.test(text)) {
        targetKey = 'legumes';
      }
    }

    // POTATOES: if targetKey is 'vegetables' or 'other_grains' and item is potato
    if ((targetKey === 'vegetables' || targetKey === 'other_grains') && /картоф|картошка|пюре картоф|драник/.test(text)) {
      targetKey = 'potatoes';
    }

    // PROCESSED MEAT: if targetKey is 'meat' and item is sausages/bacon/ham/salami
    if (targetKey === 'meat' && /сосиск|сардельк|колбас|ветчин|бекон|сало|сервелат|салями|пепперони|паштет/.test(text)) {
      targetKey = 'processed_meat';
    }

    // FRIED FOOD: if item is french fries, nuggets, cheburek, donut
    if (/картофель фри|наггетс|чебурек|беляш|пончик|фритюр/.test(text)) {
      if (!newServings.fried_food && (targetKey === 'potatoes' || targetKey === 'other_grains' || targetKey === 'processed_meat' || targetKey === 'sweets')) {
        // add fried_food
        newServings.fried_food = 1;
      }
    }

    newServings[targetKey] = (newServings[targetKey] || 0) + val;
  }

  return newServings;
}

// Process each file
files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace servings blocks by evaluating food item objects
  let updatedCount = 0;

  // Simple string match and replace for `servings: { ... }`
  content = content.replace(/(\{\s*id:\s*['"][^'"]+['"][\s\S]*?title:\s*['"]([^'"]+)['"][\s\S]*?servings:\s*\{([^}]+)\}[\s\S]*?description:\s*['"]([^'"]*)['"])/g, (match, fullBlock, title, servingsStr, description) => {
    // parse servingsStr
    const oldServings = {};
    servingsStr.split(',').forEach(p => {
      const parts = p.split(':');
      if (parts.length === 2) {
        const k = parts[0].trim();
        const v = parseFloat(parts[1].trim());
        if (k && !isNaN(v)) oldServings[k] = v;
      }
    });

    const newServings = transformServings(oldServings, title, description);
    const newServingsFormatted = Object.entries(newServings)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const oldFormatted = Object.entries(oldServings)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    if (oldFormatted !== newServingsFormatted) {
      updatedCount++;
    }

    return match.replace(`servings: { ${servingsStr} }`, `servings: { ${newServingsFormatted} }`);
  });

  console.log(`File ${file}: updated ${updatedCount} items`);
  fs.writeFileSync(filePath, content, 'utf8');
});

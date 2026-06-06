// extract.js
const fs = require('fs');
const path = require('path');

// The folders we want to look inside
const splits = ['train', 'dev', 'test'];
const difficulties = ['middle', 'high'];

// ─── NEW CLEANING FUNCTION ────────────────────────────────────────────────
function cleanText(text) {
  if (!text) return "";
  return text
    // 1. Fix spacing before punctuation (e.g., "word . " -> "word.")
    .replace(/\s+([.,!?;:])/g, '$1')
    // 2. Fix spacing after punctuation (ensure one space after)
    .replace(/([.,!?;:])([A-Za-z])/g, '$1 $2')
    // 3. Remove excessive newlines/tabs and replace with single spaces
    .replace(/\s+/g, ' ')
    .trim();
}

function compileDataset(difficulty) {
  let compiledData = [];
  console.log(`\nStarting extraction for: ${difficulty}...`);

  splits.forEach(split => {
    const dirPath = path.join(__dirname, 'RACE', split, difficulty);
    
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️ Folder not found, skipping: ${dirPath}`);
      return;
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.txt'));
    console.log(`Found ${files.length} files in RACE/${split}/${difficulty}`);

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      try {
        const parsed = JSON.parse(content);
        
        // ─── APPLY CLEANING HERE ──────────────────────────────────────────
        parsed.article = cleanText(parsed.article);
        if (parsed.questions) {
            parsed.questions = parsed.questions.map(q => cleanText(q));
        }
        // ──────────────────────────────────────────────────────────────────
        
        compiledData.push(parsed);
      } catch(e) {
        console.error(`❌ Error parsing JSON in file: ${filePath}`);
      }
    });
  });

  const outputPath = path.join(__dirname, `race_${difficulty}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(compiledData));
  console.log(`✅ Successfully saved ${compiledData.length} articles to ${outputPath}`);
}

// Run the extractor
compileDataset('middle');
compileDataset('high');
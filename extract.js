// extract.js
const fs = require('fs');
const path = require('path');

// The folders we want to look inside
const splits = ['train', 'dev', 'test'];
const difficulties = ['middle', 'high'];

function compileDataset(difficulty) {
  let compiledData = [];
  console.log(`\nStarting extraction for: ${difficulty}...`);

  splits.forEach(split => {
    const dirPath = path.join(__dirname, 'RACE', split, difficulty);
    
    // Check if the folder exists before trying to read it
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
        // The RACE .txt files are actually valid JSON inside!
        const parsed = JSON.parse(content);
        compiledData.push(parsed);
      } catch(e) {
        console.error(`❌ Error parsing JSON in file: ${filePath}`);
      }
    });
  });

  // Save everything into one massive JSON file
  const outputPath = path.join(__dirname, `race_${difficulty}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(compiledData));
  console.log(`✅ Successfully saved ${compiledData.length} articles to ${outputPath}`);
}

// Run the extractor
compileDataset('middle');
compileDataset('high');
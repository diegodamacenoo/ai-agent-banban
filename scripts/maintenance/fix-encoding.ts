import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

// Map of common Portuguese accented characters to their non-accented equivalents
const accentMap: { [key: string]: string } = {
  'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a',
  'é': 'e', 'ê': 'e',
  'í': 'i',
  'ó': 'o', 'ô': 'o', 'õ': 'o',
  'ú': 'u',
  'ç': 'c',
  'ñ': 'n',
  'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A',
  'É': 'E', 'Ê': 'E',
  'Í': 'I',
  'Ó': 'O', 'Ô': 'O', 'Õ': 'O',
  'Ú': 'U',
  'Ç': 'C',
  'Ñ': 'N'
};

// Function to remove accents from text
function removeAccents(text: string): string {
  return text.replace(/[áàãâéêíóôõúçñÁÀÃÂÉÊÍÓÔÕÚÇÑ]/g, char => accentMap[char] || char);
}

// Files and directories to exclude
const excludePatterns = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/*.log',
  '**/*.md',
  '**/migrations/**/*.sql',
  '**/test/**/*.ts',
  '**/tests/**/*.ts',
  '**/__tests__/**/*.ts',
  '**/jest.config.*',
];

// File extensions to process
const includeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.mjs'];

async function processFile(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const newContent = removeAccents(content);
    
    if (content !== newContent) {
      await fs.writeFile(filePath, newContent, 'utf-8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error);
    return false;
  }
}

async function main() {
  try {
    // Get all files matching the include patterns but excluding the exclude patterns
    const files = await glob('**/*.*', {
      ignore: excludePatterns,
      nodir: true,
    });

    // Filter files by extension
    const targetFiles = files.filter(file => 
      includeExtensions.includes(path.extname(file).toLowerCase())
    );

    console.log(`Found ${targetFiles.length} files to process`);
    
    let fixedFiles = 0;
    for (const file of targetFiles) {
      const wasFixed = await processFile(file);
      if (wasFixed) fixedFiles++;
    }

    console.log('\nSummary:');
    console.log(`Total files processed: ${targetFiles.length}`);
    console.log(`Files fixed: ${fixedFiles}`);
    console.log(`Files unchanged: ${targetFiles.length - fixedFiles}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 
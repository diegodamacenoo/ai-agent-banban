
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');
const extensionsToScan = ['.ts', '.tsx', '.css'];
const oldPrefix = '--hu-';
const newPrefix = '--';

let filesChanged = 0;

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Ignora pastas conhecidas para otimizar a busca
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        processDirectory(fullPath);
      }
    } else if (extensionsToScan.includes(path.extname(fullPath))) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes(oldPrefix)) {
      const originalContent = content;
      content = content.replace(new RegExp(oldPrefix, 'g'), newPrefix);

      if (originalContent !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Arquivo modificado: ${path.relative(projectRoot, filePath)}`);
        filesChanged++;
      }
    }
  } catch (error) {
    console.error(`Falha ao processar o arquivo ${filePath}:`, error);
  }
}

console.log(`Iniciando a busca por variáveis CSS com prefixo "${oldPrefix}" em "${srcDir}"...`);

processDirectory(srcDir);

if (filesChanged > 0) {  console.log(`
Concluído! ${filesChanged} arquivo(s) foram atualizados.`);} else {  console.log(`
Nenhum arquivo precisou ser modificado.`);}

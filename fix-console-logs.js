const fs = require('fs');
const path = require('path');

// Configurações
const config = {
  // Diretórios para processar
  directories: [
    'src',
  ],
  // Extensões de arquivo para processar
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  // Padrões para ignorar
  ignorePatterns: [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
    '__tests__',
    '.test.',
    '.spec.',
  ],
  // Console methods que devem ser mantidos (não alterados)
  keepMethods: [
    'console.error',
    'console.warn', 
    'console.info',
    'console.debug'
  ]
};

class ConsoleFixer {
  constructor() {
    this.processedFiles = 0;
    this.changedFiles = 0;
    this.totalReplacements = 0;
  }

  /**
   * Executa a correção em lote
   */
  async run() {
    console.log('🔧 Iniciando correção de console.log em lote...');
    console.log(`📁 Processando diretórios: ${config.directories.join(', ')}`);
    console.log(`📄 Extensões: ${config.extensions.join(', ')}`);
    
    for (const dir of config.directories) {
      if (fs.existsSync(dir)) {
        await this.processDirectory(dir);
      } else {
        console.warn(`⚠️ Diretório não encontrado: ${dir}`);
      }
    }

    this.printSummary();
  }

  /**
   * Processa um diretório recursivamente
   */
  async processDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Verificar se deve ignorar
      if (this.shouldIgnore(entry.name, fullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        await this.processDirectory(fullPath);
      } else if (entry.isFile() && this.shouldProcessFile(entry.name)) {
        await this.processFile(fullPath);
      }
    }
  }

  /**
   * Verifica se deve ignorar um arquivo/diretório
   */
  shouldIgnore(name, fullPath) {
    return config.ignorePatterns.some(pattern => {
      return name.includes(pattern) || fullPath.includes(pattern);
    });
  }

  /**
   * Verifica se deve processar um arquivo
   */
  shouldProcessFile(fileName) {
    return config.extensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Processa um arquivo individual
   */
  async processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const updatedContent = this.replaceConsoleLogs(content);

      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        this.changedFiles++;
        console.log(`✅ ${filePath}`);
      }

      this.processedFiles++;
    } catch (error) {
      console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    }
  }

  /**
   * Substitui console.log por console.debug
   */
  replaceConsoleLogs(content) {
    let replacements = 0;
    
    // Regex para encontrar console.log mantendo formatação
    const consoleLogRegex = /console\.log\s*\(/g;
    
    const result = content.replace(consoleLogRegex, (match) => {
      replacements++;
      this.totalReplacements++;
      return 'console.debug(';
    });

    if (replacements > 0) {
      console.log(`  📝 ${replacements} substituições`);
    }

    return result;
  }

  /**
   * Imprime resumo final
   */
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DA CORREÇÃO');
    console.log('='.repeat(50));
    console.log(`📄 Arquivos processados: ${this.processedFiles}`);
    console.log(`✏️ Arquivos alterados: ${this.changedFiles}`);
    console.log(`🔄 Total de substituições: ${this.totalReplacements}`);
    console.log('='.repeat(50));
    
    if (this.totalReplacements > 0) {
      console.log('✅ Correção concluída com sucesso!');
      console.log('💡 Execute "npm run build" para verificar se não há mais warnings');
    } else {
      console.log('ℹ️ Nenhum console.log encontrado para corrigir');
    }
  }
}

// Executar script
if (require.main === module) {
  const fixer = new ConsoleFixer();
  fixer.run().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = ConsoleFixer; 
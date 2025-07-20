#!/usr/bin/env powershell

<#
.SYNOPSIS
Script para gerar módulo automaticamente no sistema Axon

.DESCRIPTION
Este script automatiza a criação de módulos padrão e customizados, 
copiando templates e substituindo placeholders automaticamente.

.PARAMETER ModuleSlug
Nome do módulo em kebab-case (ex: advanced-analytics)

.PARAMETER ModuleType
Tipo do módulo: 'standard' ou 'custom'

.PARAMETER Category
Categoria do módulo (padrão: analytics)

.PARAMETER Author
Nome do autor (padrão: Axon Team)

.PARAMETER ClientSlug
Slug do cliente (obrigatório para módulos custom)

.EXAMPLE
.\generate-module.ps1 -ModuleSlug "advanced-analytics" -ModuleType "standard" -Category "analytics" -Author "Axon Team"

.EXAMPLE
.\generate-module.ps1 -ModuleSlug "fashion-insights" -ModuleType "custom" -Category "insights" -Author "BanBan Team" -ClientSlug "banban"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ModuleSlug,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("standard", "custom")]
    [string]$ModuleType,
    
    [Parameter(Mandatory=$false)]
    [string]$Category = "analytics",
    
    [Parameter(Mandatory=$false)]
    [string]$Author = "Axon Team",
    
    [Parameter(Mandatory=$false)]
    [string]$ClientSlug = ""
)

# Função para escrever com cor
function Write-ColorOutput {
    param(
        [string]$ForegroundColor,
        [string]$Message
    )
    $currentColor = $Host.UI.RawUI.ForegroundColor
    $Host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $Host.UI.RawUI.ForegroundColor = $currentColor
}

# Banner
Write-ColorOutput "Cyan" ""
Write-ColorOutput "Cyan" "🚀 Axon Module Generator v2.0.0"
Write-ColorOutput "Cyan" "=================================="
Write-ColorOutput "White" ""

# Validar cliente para módulos custom
if ($ModuleType -eq "custom" -and [string]::IsNullOrEmpty($ClientSlug)) {
    Write-ColorOutput "Red" "❌ Para módulos custom, especifique o cliente:"
    Write-ColorOutput "Yellow" "   .\generate-module.ps1 -ModuleSlug '$ModuleSlug' -ModuleType 'custom' -Category '$Category' -Author '$Author' -ClientSlug '<cliente>'"
    exit 1
}

# Derivar nomes
$ModuleName = (Get-Culture).TextInfo.ToTitleCase($ModuleSlug.Replace("-", " "))
$ModuleClass = ($ModuleSlug -split '-' | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }) -join ''
$ModuleDescription = "Módulo de $Category para o sistema Axon"

# Configurações específicas por tipo
if ($ModuleType -eq "standard") {
    $BaseDir = "src\core\modules\standard\$ModuleSlug"
    $PricingTier = "free"
    $ClientName = "Axon Team"
    $ClientOrganization = "Axon Systems"
    $ClientDomain = "axon.dev"
    $TemplateDir = "context\04-development\templates\standard-module"
} else {
    $BaseDir = "src\core\modules\$ClientSlug\$ModuleSlug"
    $PricingTier = "premium"
    $ClientName = "$ClientSlug Team"
    $ClientOrganization = "$ClientSlug Organization"
    $ClientDomain = "$ClientSlug.com"
    $TemplateDir = "context\04-development\templates\custom-module"
}

Write-ColorOutput "Cyan" "📋 Configuração do Módulo:"
Write-Output "   Nome: $ModuleName"
Write-Output "   Slug: $ModuleSlug"
Write-Output "   Classe: $ModuleClass"
Write-Output "   Tipo: $ModuleType"
Write-Output "   Categoria: $Category"
Write-Output "   Autor: $Author"
Write-Output "   Localização: $BaseDir"
Write-Output "   Pricing: $PricingTier"
if ($ModuleType -eq "custom") {
    Write-Output "   Cliente: $ClientSlug"
    Write-Output "   Organização: $ClientOrganization"
}
Write-Output ""

# Confirmar criação
$confirmation = Read-Host "🤔 Continuar com a criação? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-ColorOutput "Yellow" "⚠️ Operação cancelada"
    exit 1
}

Write-ColorOutput "Cyan" "🏗️ Criando estrutura de diretórios..."

# Verificar se diretório já existe
if (Test-Path $BaseDir) {
    Write-ColorOutput "Red" "❌ Diretório $BaseDir já existe!"
    $overwrite = Read-Host "🤔 Sobrescrever? (y/N)"
    if ($overwrite -ne 'y' -and $overwrite -ne 'Y') {
        Write-ColorOutput "Yellow" "⚠️ Operação cancelada"
        exit 1
    }
    Remove-Item -Recurse -Force $BaseDir
}

# Criar estrutura de diretórios
$directories = @("types", "services", "handlers", "utils", "tests", "docs", "migrations", "components")
foreach ($dir in $directories) {
    New-Item -ItemType Directory -Force -Path "$BaseDir\$dir" | Out-Null
}

Write-ColorOutput "Cyan" "📄 Copiando templates..."

# Verificar se template existe
if (-not (Test-Path $TemplateDir)) {
    Write-ColorOutput "Red" "❌ Template não encontrado: $TemplateDir"
    exit 1
}

# Copiar arquivos do template
Copy-Item -Recurse -Force "$TemplateDir\*" $BaseDir

Write-ColorOutput "Cyan" "🔄 Processando placeholders..."

# Função para substituir placeholders
function Replace-Placeholders {
    param([string]$FilePath)
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $content = $content -replace '\{\{MODULE_NAME\}\}', $ModuleName
        $content = $content -replace '\{\{MODULE_SLUG\}\}', $ModuleSlug
        $content = $content -replace '\{\{MODULE_CLASS\}\}', $ModuleClass
        $content = $content -replace '\{\{MODULE_DESCRIPTION\}\}', $ModuleDescription
        $content = $content -replace '\{\{MODULE_CATEGORY\}\}', $Category
        $content = $content -replace '\{\{MODULE_AUTHOR\}\}', $Author
        $content = $content -replace '\{\{CLIENT_NAME\}\}', $ClientName
        $content = $content -replace '\{\{CLIENT_ORGANIZATION\}\}', $ClientOrganization
        $content = $content -replace '\{\{CLIENT_SLUG\}\}', $ClientSlug
        $content = $content -replace '\{\{CLIENT_DOMAIN\}\}', $ClientDomain
        
        Set-Content -Path $FilePath -Value $content -Encoding UTF8
    }
}

# Processar todos os arquivos
Get-ChildItem -Recurse $BaseDir -Include "*.json", "*.md", "*.ts", "*.tsx", "*.sql" | ForEach-Object {
    Replace-Placeholders $_.FullName
}

# Renomear arquivos que contêm placeholders no nome
$widgetFile = Join-Path $BaseDir "components\ModuleWidget.tsx"
if (Test-Path $widgetFile) {
    Move-Item $widgetFile (Join-Path $BaseDir "components\${ModuleClass}Widget.tsx")
}

$configFile = Join-Path $BaseDir "components\ModuleConfig.tsx"
if (Test-Path $configFile) {
    Move-Item $configFile (Join-Path $BaseDir "components\${ModuleClass}Config.tsx")
}

$serviceFile = Join-Path $BaseDir "services\ModuleService.ts"
if (Test-Path $serviceFile) {
    Move-Item $serviceFile (Join-Path $BaseDir "services\${ModuleClass}Service.ts")
}

Write-ColorOutput "Cyan" "📦 Criando arquivos específicos..."

# Criar package.json específico
$packageJson = @"
{
  "name": "@axon/module-$ModuleSlug",
  "version": "1.0.0",
  "description": "$ModuleDescription",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/jest": "^29.5.0",
    "typescript": "^5.3.0",
    "jest": "^29.7.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0"
  },
  "keywords": [
    "axon",
    "module",
    "$Category",
    "$ModuleSlug"
  ],
  "author": "$Author",
  "license": "MIT"
}
"@

Set-Content -Path (Join-Path $BaseDir "package.json") -Value $packageJson -Encoding UTF8

# Criar tsconfig.json
$tsConfig = @"
{
  "extends": "../../../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true,
    "paths": {
      "@/*": ["../../../../src/*"],
      "@/shared/*": ["../../../../src/shared/*"],
      "@/core/*": ["../../../../src/core/*"]
    }
  },
  "include": [
    "src/**/*",
    "types/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
"@

Set-Content -Path (Join-Path $BaseDir "tsconfig.json") -Value $tsConfig -Encoding UTF8

# Criar jest.config.js
$jestConfig = @"
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
"@

Set-Content -Path (Join-Path $BaseDir "jest.config.js") -Value $jestConfig -Encoding UTF8

# Criar .env.example
$ModuleSlugUpper = $ModuleSlug.ToUpper().Replace("-", "_")
$envExample = @"
# Configuração do módulo $ModuleName
${ModuleSlugUpper}_LOG_LEVEL=info
${ModuleSlugUpper}_CACHE_TTL=3600
${ModuleSlugUpper}_MAX_BATCH_SIZE=100
${ModuleSlugUpper}_RETRY_ATTEMPTS=3

# URLs e endpoints (se aplicável)
${ModuleSlugUpper}_API_URL=
${ModuleSlugUpper}_WEBHOOK_URL=

# Chaves de API (se aplicável)
${ModuleSlugUpper}_API_KEY=
${ModuleSlugUpper}_SECRET_KEY=
"@

Set-Content -Path (Join-Path $BaseDir ".env.example") -Value $envExample -Encoding UTF8

# Criar migração inicial
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$tablePrefix = $ModuleSlug
if ($ModuleType -eq "custom") {
    $tablePrefix = "${ClientSlug}_${ModuleSlug}"
}

$migrationContent = @"
-- Migração inicial para o módulo $ModuleName
-- Data: $(Get-Date -Format "yyyy-MM-dd")
-- Módulo: $ModuleSlug
-- Tipo: $ModuleType

-- Criar tabela principal de dados
CREATE TABLE IF NOT EXISTS ${tablePrefix}_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'processing', 'error')),
  properties JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT ${tablePrefix}_data_org_name_unique UNIQUE (organization_id, name)
);

-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS ${tablePrefix}_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Uma configuração por organização
  CONSTRAINT ${tablePrefix}_config_org_unique UNIQUE (organization_id)
);

-- Criar tabela de métricas
CREATE TABLE IF NOT EXISTS ${tablePrefix}_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_data_org_id ON ${tablePrefix}_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_data_status ON ${tablePrefix}_data(status);
CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_data_created_at ON ${tablePrefix}_data(created_at);

CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_config_org_id ON ${tablePrefix}_config(organization_id);

CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_metrics_org_id ON ${tablePrefix}_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_${tablePrefix}_metrics_created_at ON ${tablePrefix}_metrics(created_at);

-- Políticas RLS (Row Level Security)
ALTER TABLE ${tablePrefix}_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${tablePrefix}_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${tablePrefix}_metrics ENABLE ROW LEVEL SECURITY;

-- Política de isolamento por organização
CREATE POLICY "${tablePrefix}_data_organization_isolation" ON ${tablePrefix}_data
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "${tablePrefix}_config_organization_isolation" ON ${tablePrefix}_config
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "${tablePrefix}_metrics_organization_isolation" ON ${tablePrefix}_metrics
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS `$`$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
`$`$ language 'plpgsql';

CREATE TRIGGER update_${tablePrefix}_data_updated_at 
  BEFORE UPDATE ON ${tablePrefix}_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_${tablePrefix}_config_updated_at 
  BEFORE UPDATE ON ${tablePrefix}_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_${tablePrefix}_metrics_updated_at 
  BEFORE UPDATE ON ${tablePrefix}_metrics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE ${tablePrefix}_data IS 'Dados principais do módulo $ModuleName';
COMMENT ON TABLE ${tablePrefix}_config IS 'Configurações por organização do módulo $ModuleName';
COMMENT ON TABLE ${tablePrefix}_metrics IS 'Métricas de uso e performance do módulo $ModuleName';

-- Log da migração
INSERT INTO migrations_log (name, applied_at, description) 
VALUES (
  '${timestamp}_initial_${ModuleSlug}',
  NOW(),
  'Migração inicial para o módulo $ModuleName - tabelas de dados, configurações e métricas com RLS'
) ON CONFLICT (name) DO NOTHING;
"@

Set-Content -Path (Join-Path $BaseDir "migrations\${timestamp}_initial_${ModuleSlug}.sql") -Value $migrationContent -Encoding UTF8

Write-ColorOutput "Green" "✅ Módulo $ModuleName gerado com sucesso!"
Write-Output ""
Write-ColorOutput "Cyan" "📂 Localização: $BaseDir"
Write-Output ""
Write-ColorOutput "Yellow" "📝 Próximos passos:"
Write-Output "   1. cd $BaseDir"
Write-Output "   2. npm install"
Write-Output "   3. Implementar lógica em services\${ModuleClass}Service.ts"
Write-Output "   4. Customizar tipos em types\index.ts"
Write-Output "   5. Adicionar testes em tests\"
Write-Output "   6. Aplicar migração SQL em migrations\"
Write-Output "   7. npm test -- --coverage"
Write-Output "   8. Registrar no sistema de módulos"
Write-Output ""
Write-ColorOutput "Green" "🚀 Happy coding!" 
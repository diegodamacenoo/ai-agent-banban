#!/bin/bash

# Script para gerar módulo automaticamente
# Uso: ./generate-module.sh <nome-modulo> <tipo> [categoria] [autor] [cliente]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "🚀 Axon Module Generator v2.0.0"
echo "=================================="
echo -e "${NC}"

# Validar parâmetros
if [ $# -lt 2 ]; then
    echo -e "${RED}❌ Uso incorreto!${NC}"
    echo ""
    echo "Uso: ./generate-module.sh <nome-modulo> <tipo> [categoria] [autor] [cliente]"
    echo ""
    echo "Parâmetros:"
    echo "  nome-modulo  : Nome do módulo em kebab-case (ex: advanced-analytics)"
    echo "  tipo         : 'standard' ou 'custom'"
    echo "  categoria    : analytics|operations|insights|reports|settings|admin (padrão: analytics)"
    echo "  autor        : Nome do autor (padrão: Axon Team)"
    echo "  cliente      : Slug do cliente (obrigatório para tipo custom)"
    echo ""
    echo "Exemplos:"
    echo "  ./generate-module.sh advanced-analytics standard analytics 'Axon Team'"
    echo "  ./generate-module.sh fashion-insights custom insights 'BanBan Team' banban"
    exit 1
fi

# Parâmetros
MODULE_SLUG=${1}
MODULE_TYPE=${2}
MODULE_CATEGORY=${3:-"analytics"}
MODULE_AUTHOR=${4:-"Axon Team"}
CLIENT_SLUG=${5:-""}

# Validar tipo
if [[ "$MODULE_TYPE" != "standard" && "$MODULE_TYPE" != "custom" ]]; then
    echo -e "${RED}❌ Tipo deve ser 'standard' ou 'custom'${NC}"
    exit 1
fi

# Validar cliente para módulos custom
if [[ "$MODULE_TYPE" == "custom" && -z "$CLIENT_SLUG" ]]; then
    echo -e "${RED}❌ Para módulos custom, especifique o cliente:${NC}"
    echo "   ./generate-module.sh $MODULE_SLUG custom $MODULE_CATEGORY '$MODULE_AUTHOR' <cliente>"
    exit 1
fi

# Derivar nomes
MODULE_NAME=$(echo $MODULE_SLUG | sed 's/-/ /g' | sed 's/\b\w/\U&/g')
MODULE_CLASS=$(echo $MODULE_SLUG | sed -r 's/(^|-)([a-z])/\U\2/g')
MODULE_DESCRIPTION="Módulo de $MODULE_CATEGORY para o sistema Axon"

# Configurações específicas por tipo
if [ "$MODULE_TYPE" = "standard" ]; then
    BASE_DIR="src/core/modules/standard/$MODULE_SLUG"
    PRICING_TIER="free"
    CLIENT_NAME="Axon Team"
    CLIENT_ORGANIZATION="Axon Systems"
    CLIENT_DOMAIN="axon.dev"
    TEMPLATE_DIR="context/04-development/templates/standard-module"
else
    if [ -z "$CLIENT_SLUG" ]; then
        echo -e "${RED}❌ Para módulos custom, especifique o cliente${NC}"
        exit 1
    fi
    BASE_DIR="src/core/modules/$CLIENT_SLUG/$MODULE_SLUG"
    PRICING_TIER="premium"
    CLIENT_NAME="$CLIENT_SLUG Team"
    CLIENT_ORGANIZATION="$CLIENT_SLUG Organization"
    CLIENT_DOMAIN="$CLIENT_SLUG.com"
    TEMPLATE_DIR="context/04-development/templates/custom-module"
fi

echo -e "${BLUE}📋 Configuração do Módulo:${NC}"
echo "   Nome: $MODULE_NAME"
echo "   Slug: $MODULE_SLUG"
echo "   Classe: $MODULE_CLASS"
echo "   Tipo: $MODULE_TYPE"
echo "   Categoria: $MODULE_CATEGORY"
echo "   Autor: $MODULE_AUTHOR"
echo "   Localização: $BASE_DIR"
echo "   Pricing: $PRICING_TIER"
if [ "$MODULE_TYPE" = "custom" ]; then
    echo "   Cliente: $CLIENT_SLUG"
    echo "   Organização: $CLIENT_ORGANIZATION"
fi
echo ""

# Confirmar criação
read -p "🤔 Continuar com a criação? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️ Operação cancelada${NC}"
    exit 1
fi

echo -e "${BLUE}🏗️ Criando estrutura de diretórios...${NC}"

# Verificar se diretório já existe
if [ -d "$BASE_DIR" ]; then
    echo -e "${RED}❌ Diretório $BASE_DIR já existe!${NC}"
    read -p "🤔 Sobrescrever? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⚠️ Operação cancelada${NC}"
        exit 1
    fi
    rm -rf "$BASE_DIR"
fi

# Criar estrutura de diretórios
mkdir -p "$BASE_DIR"/{types,services,handlers,utils,tests,docs,migrations,components}

echo -e "${BLUE}📄 Copiando templates...${NC}"

# Verificar se template existe
if [ ! -d "$TEMPLATE_DIR" ]; then
    echo -e "${RED}❌ Template não encontrado: $TEMPLATE_DIR${NC}"
    exit 1
fi

# Copiar arquivos do template
cp -r "$TEMPLATE_DIR"/* "$BASE_DIR/"

echo -e "${BLUE}🔄 Processando placeholders...${NC}"

# Função para substituir placeholders
replace_placeholders() {
    local file=$1
    if [ -f "$file" ]; then
        # Substituir placeholders usando sed (compatível com macOS e Linux)
        sed -i.bak "s/{{MODULE_NAME}}/$MODULE_NAME/g" "$file"
        sed -i.bak "s/{{MODULE_SLUG}}/$MODULE_SLUG/g" "$file"
        sed -i.bak "s/{{MODULE_CLASS}}/$MODULE_CLASS/g" "$file"
        sed -i.bak "s/{{MODULE_DESCRIPTION}}/$MODULE_DESCRIPTION/g" "$file"
        sed -i.bak "s/{{MODULE_CATEGORY}}/$MODULE_CATEGORY/g" "$file"
        sed -i.bak "s/{{MODULE_AUTHOR}}/$MODULE_AUTHOR/g" "$file"
        sed -i.bak "s/{{CLIENT_NAME}}/$CLIENT_NAME/g" "$file"
        sed -i.bak "s/{{CLIENT_ORGANIZATION}}/$CLIENT_ORGANIZATION/g" "$file"
        sed -i.bak "s/{{CLIENT_SLUG}}/$CLIENT_SLUG/g" "$file"
        sed -i.bak "s/{{CLIENT_DOMAIN}}/$CLIENT_DOMAIN/g" "$file"
        
        # Remover arquivo backup
        rm -f "$file.bak"
    fi
}

# Processar todos os arquivos
find "$BASE_DIR" -type f \( -name "*.json" -o -name "*.md" -o -name "*.ts" -o -name "*.tsx" -o -name "*.sql" \) | while read -r file; do
    replace_placeholders "$file"
done

# Renomear arquivos que contêm placeholders no nome
if [ -f "$BASE_DIR/components/ModuleWidget.tsx" ]; then
    mv "$BASE_DIR/components/ModuleWidget.tsx" "$BASE_DIR/components/${MODULE_CLASS}Widget.tsx"
fi

if [ -f "$BASE_DIR/components/ModuleConfig.tsx" ]; then
    mv "$BASE_DIR/components/ModuleConfig.tsx" "$BASE_DIR/components/${MODULE_CLASS}Config.tsx"
fi

if [ -f "$BASE_DIR/services/ModuleService.ts" ]; then
    mv "$BASE_DIR/services/ModuleService.ts" "$BASE_DIR/services/${MODULE_CLASS}Service.ts"
fi

echo -e "${BLUE}📦 Criando arquivos específicos...${NC}"

# Criar package.json específico
cat > "$BASE_DIR/package.json" << EOF
{
  "name": "@axon/module-$MODULE_SLUG",
  "version": "1.0.0",
  "description": "$MODULE_DESCRIPTION",
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
    "$MODULE_CATEGORY",
    "$MODULE_SLUG"
  ],
  "author": "$MODULE_AUTHOR",
  "license": "MIT"
}
EOF

# Criar tsconfig.json
cat > "$BASE_DIR/tsconfig.json" << EOF
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
EOF

# Criar jest.config.js
cat > "$BASE_DIR/jest.config.js" << EOF
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
EOF

# Criar .env.example
cat > "$BASE_DIR/.env.example" << EOF
# Configuração do módulo $MODULE_NAME
${MODULE_SLUG^^}_LOG_LEVEL=info
${MODULE_SLUG^^}_CACHE_TTL=3600
${MODULE_SLUG^^}_MAX_BATCH_SIZE=100
${MODULE_SLUG^^}_RETRY_ATTEMPTS=3

# URLs e endpoints (se aplicável)
${MODULE_SLUG^^}_API_URL=
${MODULE_SLUG^^}_WEBHOOK_URL=

# Chaves de API (se aplicável)
${MODULE_SLUG^^}_API_KEY=
${MODULE_SLUG^^}_SECRET_KEY=
EOF

# Criar migração inicial
TIMESTAMP=$(date +%Y%m%d%H%M%S)
TABLE_PREFIX=$MODULE_SLUG
if [ "$MODULE_TYPE" = "custom" ]; then
    TABLE_PREFIX="${CLIENT_SLUG}_${MODULE_SLUG}"
fi

cat > "$BASE_DIR/migrations/${TIMESTAMP}_initial_${MODULE_SLUG}.sql" << EOF
-- Migração inicial para o módulo $MODULE_NAME
-- Data: $(date +%Y-%m-%d)
-- Módulo: $MODULE_SLUG
-- Tipo: $MODULE_TYPE

-- Criar tabela principal de dados
CREATE TABLE IF NOT EXISTS ${TABLE_PREFIX}_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'processing', 'error')),
  properties JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT ${TABLE_PREFIX}_data_org_name_unique UNIQUE (organization_id, name)
);

-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS ${TABLE_PREFIX}_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Uma configuração por organização
  CONSTRAINT ${TABLE_PREFIX}_config_org_unique UNIQUE (organization_id)
);

-- Criar tabela de métricas
CREATE TABLE IF NOT EXISTS ${TABLE_PREFIX}_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_${TABLE_PREFIX}_data_org_id ON ${TABLE_PREFIX}_data(organization_id);
CREATE INDEX IF NOT EXISTS idx_${TABLE_PREFIX}_data_status ON ${TABLE_PREFIX}_data(status);
CREATE INDEX IF NOT EXISTS idx_${TABLE_PREFIX}_data_created_at ON ${TABLE_PREFIX}_data(created_at);

CREATE INDEX IF NOT EXISTS idx_${TABLE_PREFIX}_config_org_id ON ${TABLE_PREFIX}_config(organization_id);

CREATE INDEX IF NOT EXISTS idx_${TABLE_PREFIX}_metrics_org_id ON ${TABLE_PREFIX}_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_${TABLE_PREFIX}_metrics_created_at ON ${TABLE_PREFIX}_metrics(created_at);

-- Políticas RLS (Row Level Security)
ALTER TABLE ${TABLE_PREFIX}_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${TABLE_PREFIX}_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${TABLE_PREFIX}_metrics ENABLE ROW LEVEL SECURITY;

-- Política de isolamento por organização
CREATE POLICY "${TABLE_PREFIX}_data_organization_isolation" ON ${TABLE_PREFIX}_data
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "${TABLE_PREFIX}_config_organization_isolation" ON ${TABLE_PREFIX}_config
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE id = (
        SELECT organization_id FROM profiles 
        WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "${TABLE_PREFIX}_metrics_organization_isolation" ON ${TABLE_PREFIX}_metrics
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
RETURNS TRIGGER AS \$\$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
\$\$ language 'plpgsql';

CREATE TRIGGER update_${TABLE_PREFIX}_data_updated_at 
  BEFORE UPDATE ON ${TABLE_PREFIX}_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_${TABLE_PREFIX}_config_updated_at 
  BEFORE UPDATE ON ${TABLE_PREFIX}_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_${TABLE_PREFIX}_metrics_updated_at 
  BEFORE UPDATE ON ${TABLE_PREFIX}_metrics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE ${TABLE_PREFIX}_data IS 'Dados principais do módulo $MODULE_NAME';
COMMENT ON TABLE ${TABLE_PREFIX}_config IS 'Configurações por organização do módulo $MODULE_NAME';
COMMENT ON TABLE ${TABLE_PREFIX}_metrics IS 'Métricas de uso e performance do módulo $MODULE_NAME';

-- Log da migração
INSERT INTO migrations_log (name, applied_at, description) 
VALUES (
  '${TIMESTAMP}_initial_${MODULE_SLUG}',
  NOW(),
  'Migração inicial para o módulo $MODULE_NAME - tabelas de dados, configurações e métricas com RLS'
) ON CONFLICT (name) DO NOTHING;
EOF

echo -e "${GREEN}✅ Módulo $MODULE_NAME gerado com sucesso!${NC}"
echo ""
echo -e "${BLUE}📂 Localização:${NC} $BASE_DIR"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo "   1. cd $BASE_DIR"
echo "   2. npm install"
echo "   3. Implementar lógica em services/${MODULE_CLASS}Service.ts"
echo "   4. Customizar tipos em types/index.ts"
echo "   5. Adicionar testes em tests/"
echo "   6. Aplicar migração SQL em migrations/"
echo "   7. npm test -- --coverage"
echo "   8. Registrar no sistema de módulos"
echo ""
echo -e "${GREEN}🚀 Happy coding!${NC}" 
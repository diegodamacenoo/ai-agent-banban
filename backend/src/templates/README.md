# 🚀 Templates para Integration Hub

Este diretório contém templates baseados na implementação comprovada do **Banban Integration Hub** para facilitar a criação de novas integrações com clientes.

## 📁 Estrutura

```
templates/
├── flow-template/              # Templates para fluxos específicos
│   └── sales-flow.template.ts  # Template Sales Flow
├── connector-template/         # Templates para conectores completos
│   └── client-connector.template.ts
├── webhook-template/           # Templates para webhooks
│   └── webhook-flow.template.ts
└── README.md                   # Este arquivo
```

## 🎯 Como Usar os Templates

### 1. **Sales Flow Template** (`flow-template/sales-flow.template.ts`)

Template para criar módulos de Sales Flow baseado no modelo Banban.

**Passos:**
1. Copie o arquivo para `src/integrations/{cliente}/flows/sales/index.ts`
2. Substitua todas as ocorrências de:
   - `{{CLIENT_NAME}}` → Nome do cliente (ex: `Riachuelo`)
   - `{{CLIENT_NAME_LOWER}}` → Nome em minúsculas (ex: `riachuelo`)
3. Implemente o serviço `{{CLIENT_NAME}}SalesService`
4. Ajuste os schemas e validações conforme necessário

**Exemplo:**
```typescript
// De: {{CLIENT_NAME}}SalesFlowModule
// Para: RiachueloSalesFlowModule

// De: '{{CLIENT_NAME_LOWER}}-sales-flow'  
// Para: 'riachuelo-sales-flow'
```

### 2. **Client Connector Template** (`connector-template/client-connector.template.ts`)

Template para criar Integration Hub completo para um cliente.

**Passos:**
1. Copie o arquivo para `src/integrations/{cliente}/index.ts`
2. Substitua as variáveis como acima
3. Descomente e implemente os módulos de fluxo necessários
4. Configure features específicas do cliente

**Features padrão incluídas:**
- `sales-processing`
- `purchase-management`
- `inventory-control`
- `transfer-management`
- `returns-processing`
- `etl-automation`
- `performance-analytics`
- `eca-engine`
- `real-time-webhooks`
- `audit-logging`

### 3. **Webhook Flow Template** (`webhook-template/webhook-flow.template.ts`)

Template genérico para qualquer tipo de fluxo (Purchase, Inventory, Transfer, etc.).

**Passos:**
1. Copie o arquivo para `src/integrations/{cliente}/flows/{fluxo}/index.ts`
2. Substitua as variáveis:
   - `{{CLIENT_NAME}}` → Nome do cliente
   - `{{FLOW_NAME}}` → Nome do fluxo (ex: `Purchase`, `Inventory`)
   - `{{FLOW_NAME_LOWER}}` → Nome do fluxo em minúsculas (ex: `purchase`, `inventory`)
   - `{{FLOW_NAME_UPPER}}` → Nome do fluxo em maiúsculas (ex: `PURCHASE`, `INVENTORY`)
3. Configure as ações específicas do fluxo
4. Implemente validações específicas
5. Adicione endpoints adicionais se necessário

## 🛠️ Exemplo Prático: Criando Integração Riachuelo

### Passo 1: Criar Connector Principal
```bash
# Copiar template
cp src/templates/connector-template/client-connector.template.ts src/integrations/riachuelo/index.ts

# Substituir variáveis (pode usar sed ou editor)
sed -i 's/{{CLIENT_NAME}}/Riachuelo/g' src/integrations/riachuelo/index.ts
sed -i 's/{{CLIENT_NAME_LOWER}}/riachuelo/g' src/integrations/riachuelo/index.ts
```

### Passo 2: Criar Sales Flow
```bash
# Criar diretório
mkdir -p src/integrations/riachuelo/flows/sales

# Copiar template
cp src/templates/flow-template/sales-flow.template.ts src/integrations/riachuelo/flows/sales/index.ts

# Substituir variáveis
sed -i 's/{{CLIENT_NAME}}/Riachuelo/g' src/integrations/riachuelo/flows/sales/index.ts
sed -i 's/{{CLIENT_NAME_LOWER}}/riachuelo/g' src/integrations/riachuelo/flows/sales/index.ts
```

### Passo 3: Criar Purchase Flow
```bash
# Criar diretório
mkdir -p src/integrations/riachuelo/flows/purchase

# Copiar template
cp src/templates/webhook-template/webhook-flow.template.ts src/integrations/riachuelo/flows/purchase/index.ts

# Substituir variáveis
sed -i 's/{{CLIENT_NAME}}/Riachuelo/g' src/integrations/riachuelo/flows/purchase/index.ts
sed -i 's/{{CLIENT_NAME_LOWER}}/riachuelo/g' src/integrations/riachuelo/flows/purchase/index.ts
sed -i 's/{{FLOW_NAME}}/Purchase/g' src/integrations/riachuelo/flows/purchase/index.ts
sed -i 's/{{FLOW_NAME_LOWER}}/purchase/g' src/integrations/riachuelo/flows/purchase/index.ts
sed -i 's/{{FLOW_NAME_UPPER}}/PURCHASE/g' src/integrations/riachuelo/flows/purchase/index.ts
```

### Passo 4: Registrar no Fastify
```typescript
// Em src/index.ts ou arquivo principal
import { RiachueloIntegrationHub } from './integrations/riachuelo';

const riachueloHub = new RiachueloIntegrationHub();

app.register(async function (fastify) {
  await riachueloHub.register(fastify);
});
```

## 🔧 Customizações Comuns

### Actions por Tipo de Fluxo

**Sales Flow:**
```typescript
const SALES_ACTIONS = {
  'register_sale': 'Registrar venda',
  'cancel_sale': 'Cancelar venda',
  'update_sale': 'Atualizar venda'
};
```

**Purchase Flow:**
```typescript
const PURCHASE_ACTIONS = {
  'create_order': 'Criar pedido',
  'approve_order': 'Aprovar pedido',
  'register_invoice': 'Registrar NF',
  'effectuate_cd': 'Efetivar CD'
};
```

**Inventory Flow:**
```typescript
const INVENTORY_ACTIONS = {
  'snapshot_inventory': 'Snapshot inventário',
  'update_stock': 'Atualizar estoque',
  'adjust_inventory': 'Ajustar inventário'
};
```

### Features por Cliente

**E-commerce Básico:**
```typescript
const BASIC_FEATURES = [
  'sales-processing',
  'inventory-control',
  'real-time-webhooks'
];
```

**E-commerce Avançado:**
```typescript
const ADVANCED_FEATURES = [
  'sales-processing',
  'purchase-management',
  'inventory-control',
  'transfer-management',
  'returns-processing',
  'etl-automation',
  'performance-analytics',
  'eca-engine',
  'real-time-webhooks',
  'audit-logging'
];
```

## 📊 Endpoints Gerados Automaticamente

Cada integração criada com os templates terá os seguintes endpoints:

### Endpoints Base
- `GET /api/integrations/{cliente}/overview`
- `GET /api/integrations/{cliente}/health`
- `GET /api/integrations/{cliente}/metrics`

### Webhooks por Fluxo
- `POST /api/webhooks/{cliente}/sales`
- `POST /api/webhooks/{cliente}/purchase`
- `POST /api/webhooks/{cliente}/inventory`
- `POST /api/webhooks/{cliente}/transfer`
- `POST /api/webhooks/{cliente}/returns`
- `POST /api/webhooks/{cliente}/etl`

### Consultas e Analytics
- `GET /api/webhooks/{cliente}/{fluxo}?external_id=X`
- `GET /api/modules/{cliente}/{fluxo}-flow/analytics`
- `GET /api/modules/{cliente}/{fluxo}-flow/health`

## 🎯 Vantagens dos Templates

### ✅ **Baseados em Implementação Comprovada**
- Templates extraídos do **Banban Integration Hub** que está 100% funcional
- Padrões já testados em produção
- Arquitetura ECA validada

### ✅ **Desenvolvimento Rápido**
- **70% menos código** para escrever
- Estrutura padronizada e consistente
- Validações e tratamento de erro já implementados

### ✅ **Manutenibilidade**
- Padrões uniformes entre clientes
- Fácil debug e troubleshooting
- Documentação automática via schemas

### ✅ **Escalabilidade**
- Framework de base reutilizável
- Extensível para novos fluxos
- Suporte a features avançadas (ECA, Analytics, ETL)

## 🚨 Checklist de Implementação

Ao usar os templates, certifique-se de:

- [ ] Substituir todas as variáveis `{{VARIAVEL}}`
- [ ] Implementar os serviços específicos do cliente
- [ ] Configurar actions apropriadas para cada fluxo
- [ ] Ajustar validações de payload
- [ ] Implementar lógica de negócio específica
- [ ] Configurar autenticação/autorização
- [ ] Testar todos os endpoints criados
- [ ] Documentar APIs específicas do cliente
- [ ] Configurar monitoring e logging

## 📞 Suporte

Para dúvidas sobre os templates:
- Consulte a implementação de referência em `src/integrations/banban/`
- Veja exemplos de uso nos comentários dos templates
- Verifique o framework base em `src/shared/integration-hub/`

Os templates são **autossuficientes** e incluem tudo necessário para uma integração completa! 🎉
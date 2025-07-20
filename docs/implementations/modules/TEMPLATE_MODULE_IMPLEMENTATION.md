# Documentação do Módulo Template

## Visão Geral

O Módulo Template é um modelo base para criação de módulos customizados no sistema Axon. Ele implementa uma estrutura padrão com dois recursos de exemplo (Resource1 e Resource2) e demonstra as melhores práticas de implementação.

## Estrutura do Módulo

```
src/core/modules/template/
├── api/
│   ├── endpoints.ts
│   └── handlers/
│       ├── resource1.ts
│       └── resource2.ts
├── services/
│   ├── resource1.ts
│   └── resource2.ts
├── config.ts
└── permissions.ts
```

## Configuração

O módulo pode ser configurado através do arquivo `config.ts`. As principais configurações incluem:

- `enabled`: Habilita/desabilita o módulo
- `routes.prefix`: Prefixo base para as rotas do módulo
- `logging.enabled`: Habilita/desabilita logs do módulo
- `logging.level`: Nível de log (debug, info, warn, error)

## Sistema de Permissões

O módulo implementa um sistema granular de permissões definido em `permissions.ts`:

### Resource1
- `view-resource1`: Visualização de recursos
- `manage-resource1`: Criação e edição de recursos
- `delete-resource1`: Remoção de recursos

### Resource2
- `view-resource2`: Visualização de recursos
- `manage-resource2`: Criação e edição de recursos
- `delete-resource2`: Remoção de recursos

### Grupos de Permissões
- `ADMIN`: Todas as permissões
- `VIEWER`: Apenas visualização
- `MANAGER`: Gerenciamento sem permissão de remoção

## API Endpoints

### Resource1

```typescript
GET /api/template/resource1
POST /api/template/resource1
GET /api/template/resource1/:id
PUT /api/template/resource1/:id
DELETE /api/template/resource1/:id
```

### Resource2

```typescript
GET /api/template/resource2
POST /api/template/resource2
GET /api/template/resource2/:id
PUT /api/template/resource2/:id
DELETE /api/template/resource2/:id
```

## Modelos de Dados

### Resource1

```typescript
interface Resource1 {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

### Resource2

```typescript
interface Resource2 {
  id: string;
  title: string;
  content: string;
  type: 'type1' | 'type2' | 'type3';
  metadata: {
    key1: string;
    key2: number;
    key3: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Como Usar o Template

1. Copie a estrutura do módulo template
2. Renomeie o diretório e arquivos conforme necessário
3. Atualize as interfaces e implementações dos recursos
4. Ajuste as permissões de acordo com as necessidades
5. Implemente a lógica de negócios nos serviços
6. Atualize a documentação

## Integração com o Sistema

O módulo template foi projetado para ser facilmente integrado ao sistema Axon:

1. Registre o módulo no sistema:

```typescript
import { TemplateModule } from './modules/template/config';

// No arquivo de inicialização do Fastify
const templateModule = new TemplateModule(fastify, {
  enabled: true,
  routes: {
    prefix: '/api/custom-module'
  }
});

await templateModule.initialize();
```

2. Configure as permissões necessárias no sistema de autenticação

3. Implemente os repositórios para persistência dos dados

## Considerações de Segurança

- Todas as rotas são protegidas por middleware de autenticação
- Sistema granular de permissões
- Validação de entrada em todas as operações
- Logs detalhados para auditoria

## Próximos Passos

1. Implementar a camada de persistência
2. Adicionar validações específicas do domínio
3. Implementar testes automatizados
4. Configurar monitoramento e métricas 
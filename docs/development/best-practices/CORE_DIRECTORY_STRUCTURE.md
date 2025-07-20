# Estrutura de Diretórios Core

## Visão Geral
Este documento detalha a estrutura de diretórios core do projeto, incluindo a organização atual, padrões a serem seguidos e ações necessárias para manutenção.

## Estrutura Principal

### `/src`
Diretório raiz do código-fonte.

#### `/src/app`
Diretório principal do Next.js 13+ (App Router).

- `/(protected)` - Rotas protegidas por autenticação
- `/(public)` - Rotas públicas
- `/api` - Endpoints da API
- `/actions` - Server Actions do Next.js
- `/contexts` - Contextos React
- `/lib` - Utilitários específicos da aplicação
- `/ui` - Componentes UI específicos de páginas

Arquivos principais:
- `layout.tsx` - Layout principal da aplicação
- `global-error.tsx` - Tratamento de erros global
- `error.tsx` - Tratamento de erros por página
- `not-found.tsx` - Página 404
- `globals.css` - Estilos globais

#### `/src/components`
Componentes React reutilizáveis.

- `/ui` - Componentes base (buttons, inputs, etc.)
- `/admin` - Componentes da área administrativa
- `/diagnostics` - Componentes de diagnóstico
- `/monitoring` - Componentes de monitoramento
- `/multi-tenant` - Componentes específicos multi-tenant

#### `/src/lib`
Bibliotecas e utilitários.

- `/security` - Implementações de segurança
- `/auth` - Lógica de autenticação
- `/supabase` - Configuração e utilitários Supabase
- `/utils` - Funções utilitárias gerais
- `/schemas` - Schemas de validação
- `/permissions` - Lógica de permissões
- `/email` - Templates e lógica de email

#### `/src/hooks`
Custom hooks React.

#### `/src/contexts`
Contextos React globais.

#### `/src/types`
Definições de tipos TypeScript.

## Padrões e Convenções

### Nomenclatura
1. Diretórios em kebab-case: `multi-tenant`
2. Componentes em PascalCase: `UserProfile.tsx`
3. Utilitários em camelCase: `formatDate.ts`
4. Tipos em PascalCase: `UserType.ts`

### Organização
1. Componentes devem estar no diretório mais específico possível
2. Utilitários devem ser organizados por domínio
3. Tipos devem ser mantidos próximos ao código relacionado
4. Contextos devem ser documentados com exemplos de uso

## Ações Necessárias

### Imediatas
1. Revisar e atualizar `src/app/layout.tsx`:
   - Verificar providers necessários
   - Confirmar configurações de metadata
   - Validar estrutura de error boundaries

2. Consolidar diretórios duplicados:
   - Mover `/app/lib` para `/lib`
   - Unificar `/components/ui` e `/app/ui`
   - Remover `/components/ui-backup`

3. Organizar componentes:
   - Mover componentes específicos de página para `/app/ui`
   - Consolidar componentes reutilizáveis em `/components`
   - Documentar componentes principais

### Médio Prazo
1. Implementar sistema de documentação de componentes
2. Criar guias de estilo para cada diretório principal
3. Estabelecer padrões de teste por diretório

### Longo Prazo
1. Automatizar validação da estrutura de diretórios
2. Implementar análise estática de código
3. Criar templates para novos componentes/módulos

## Monitoramento

### Métricas
1. Número de componentes por diretório
2. Cobertura de documentação
3. Conformidade com padrões

### Validações
1. Nomenclatura consistente
2. Estrutura de imports
3. Organização de tipos

## Manutenção

### Regular
1. Revisar e atualizar documentação
2. Validar conformidade com padrões
3. Remover código obsoleto

### Sob Demanda
1. Reorganizar diretórios conforme necessário
2. Atualizar padrões baseado em feedback
3. Refatorar áreas problemáticas

## Recursos

### Ferramentas
1. ESLint para validação de padrões
2. TypeScript para tipagem estática
3. Prettier para formatação consistente

### Documentação
1. Next.js App Router
2. React Best Practices
3. TypeScript Guidelines 
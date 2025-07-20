# Scripts de Widget Management

Scripts para gerenciamento do sistema de dashboard dinâmico.

## 📦 publish_widgets.ts

Script para publicar widgets no sistema de dashboard dinâmico.

### Funcionalidades
- ✅ Leitura automática de arquivos `widget.json` dos módulos
- ✅ Validação completa contra schema JSON
- ✅ Upsert inteligente na tabela `dashboard_widgets`
- ✅ Logging detalhado com níveis configuráveis
- ✅ Modo dry-run para simulação
- ✅ Filtragem por módulo específico
- ✅ Relatório completo de execução

### Uso

```bash
# Publicar todos os módulos
npm run publish-widgets

# Publicar módulo específico
npm run publish-widgets -- --module analytics

# Simular sem persistir
npm run publish-widgets -- --dry-run

# Combinar opções
npm run publish-widgets -- --module inventory --dry-run
```

### Opções

| Opção | Alias | Descrição |
|-------|-------|-----------|
| `--module` | `-m` | Publicar apenas o módulo especificado |
| `--dry-run` | `-d` | Executar sem fazer alterações no banco |
| `--help` | `-h` | Mostrar ajuda |

### Variáveis de Ambiente

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
LOG_LEVEL=info  # debug, info, warn, error
```

### Exemplo de Saída

```
🚀 Iniciando publicação de widgets...
✅ [SUCCESS] Publicado: analytics.performance-kpis - Performance KPIs
✅ [SUCCESS] Publicado: analytics.sales-overview - Visão Geral de Vendas
ℹ️  [INFO] Módulo analytics: 4/4 widgets publicados

📊 RELATÓRIO FINAL:
   Widgets processados: 19
   Widgets publicados: 19
   Erros: 0
   Warnings: 0

🎉 Publicação concluída com sucesso!
```

## 🔄 rollback_widgets.ts

Script para rollback e gerenciamento de versões de widgets.

### Funcionalidades
- ✅ Rollback por módulo ou versão específica
- ✅ Backup automático antes de alterações destrutivas
- ✅ Opção de apenas desativar (sem remover)
- ✅ Restauração de backups específicos
- ✅ Listagem de backups disponíveis
- ✅ Modo dry-run para simulação
- ✅ Cleanup automático de widgets de tenants

### Uso

```bash
# Rollback de módulo específico
npm run rollback-widgets -- --module analytics

# Rollback de versão específica
npm run rollback-widgets -- --version 1.0.0

# Apenas desativar (não remover)
npm run rollback-widgets -- --deactivate-only

# Listar backups disponíveis
npm run rollback-widgets -- --list-backups

# Restaurar backup específico
npm run rollback-widgets -- --restore widgets-backup-2025-06-30.json

# Simular rollback
npm run rollback-widgets -- --module inventory --dry-run
```

### Opções

| Opção | Alias | Descrição |
|-------|-------|-----------|
| `--module` | `-m` | Rollback apenas do módulo especificado |
| `--version` | `-v` | Rollback de versão específica |
| `--deactivate-only` | `-d` | Apenas desativar (não remover) |
| `--no-backup` | | Não criar backup antes do rollback |
| `--dry-run` | | Simular sem fazer alterações |
| `--list-backups` | `-l` | Listar backups disponíveis |
| `--restore` | `-r` | Restaurar de backup específico |
| `--help` | `-h` | Mostrar ajuda |

### Estrutura de Backup

Os backups são salvos em `./backups/widgets/` com formato:

```json
{
  "created_at": "2025-06-30T12:00:00.000Z",
  "widgets_count": 4,
  "widgets": [
    {
      "id": "analytics.performance-kpis",
      "module_id": "analytics",
      "version": "1.0.0",
      "data": { /* dados completos do widget */ },
      "backup_timestamp": "2025-06-30T12:00:00.000Z"
    }
  ]
}
```

## 🔧 Configuração do CI/CD

### GitHub Actions

Adicionar ao `.github/workflows/deploy.yml`:

```yaml
name: Deploy Widgets

on:
  push:
    branches: [main]
    paths: ['src/core/modules/*/widget.json']

jobs:
  publish-widgets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Publish Widgets
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: npm run publish-widgets
```

### Pre-commit Hook

Adicionar validação no `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Validar widgets antes do commit
npm run publish-widgets -- --dry-run
```

## 🚨 Troubleshooting

### Erro: Schema não encontrado
```bash
❌ [ERROR] Falha ao carregar schema: ENOENT: no such file or directory
```
**Solução**: Verificar se o arquivo `docs/implementations/widget-contract-schema.json` existe.

### Erro: Supabase connection
```bash
❌ [ERROR] SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos
```
**Solução**: Configurar variáveis de ambiente ou arquivo `.env.local`.

### Erro: Validação de contrato
```bash
❌ [ERROR] Contrato inválido em src/core/modules/analytics/widget.json:
/widgets/0/queryConfig: must have required property 'type'
```
**Solução**: Corrigir o arquivo `widget.json` conforme o schema.

### Widget não aparece no dashboard
1. Verificar se foi publicado com sucesso
2. Verificar se está ativo (`is_active: true`)
3. Verificar se o módulo está habilitado para o tenant
4. Verificar permissões do usuário

## 📊 Monitoramento

### Logs de Produção

```bash
# Ver logs da publicação
LOG_LEVEL=debug npm run publish-widgets

# Ver estatísticas
npm run rollback-widgets -- --list-backups
```

### Métricas Importantes

- **Widgets publicados**: Total de widgets no sistema
- **Módulos ativos**: Módulos com widgets ativos
- **Taxa de erro**: Falhas na publicação
- **Backups criados**: Frequência de backups

## 🔐 Segurança

### Permissões Necessárias

O service role key precisa de acesso a:
- `dashboard_widgets` (SELECT, INSERT, UPDATE, DELETE)
- `tenant_dashboard_widgets` (SELECT, DELETE)

### Validação de Input

Todos os inputs são validados:
- ✅ Schema JSON validation
- ✅ Sanitização de parâmetros
- ✅ Verificação de tipos
- ✅ Validação de permissões

### Backup e Recovery

- ✅ Backup automático antes de operações destrutivas
- ✅ Versionamento de backups com timestamp
- ✅ Capacidade de restore pontual
- ✅ Validação de integridade dos backups
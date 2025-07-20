#  ARQUIVOS SQL PARA LIMPEZA DE MÓDULOS FANTASMAS

**Data de Criação**: 03 de Janeiro de 2025  
**Problema**: Módulos banban-analytics e banban-components aparecem na interface admin mas não existem fisicamente

---

##  **ARQUIVOS GERADOS**

### **1. Script Principal de Limpeza**
- **Arquivo**: `scripts/cleanup-ghost-modules-final.sql`
- **Descrição**: Script SQL completo com verificações antes e depois da remoção
- **Uso**: Execute diretamente no banco de dados via psql ou interface gráfica
- **Comando**: `psql -h localhost -U postgres -d seu_banco -f scripts/cleanup-ghost-modules-final.sql`

### **2. Script Alternativo**
- **Arquivo**: `scripts/cleanup-ghost-modules.sql`
- **Descrição**: Script SQL básico gerado automaticamente pelo PowerShell
- **Uso**: Backup/alternativa ao script principal

### **3. Migração Supabase**
- **Arquivo**: `supabase/migrations/20250103000000_remove_ghost_modules.sql`
- **Descrição**: Migração formatada para Supabase com logs detalhados
- **Uso**: Execute via Supabase CLI ou interface do Supabase
- **Comando**: `supabase db push` ou `supabase migration up`

---

##  **INSTRUÇÕES DE EXECUÇÃO**

### **Opção 1: Script Direto (Recomendado)**
```bash
# Via psql
psql -h localhost -U postgres -d seu_banco -f scripts/cleanup-ghost-modules-final.sql

# Via Supabase CLI (se usando Supabase)
supabase db push
```

### **Opção 2: Migração Supabase**
```bash
# Aplicar migração
supabase migration up

# Ou aplicar todas as migrações pendentes
supabase db push
```

---

##  **VERIFICAÇÃO PÓS-EXECUÇÃO**

Após executar qualquer um dos scripts:

1. **Reinicie o servidor** para limpar cache
2. **Acesse a interface admin** em `/admin/modules`
3. **Verifique** se apenas os 5 módulos BanBan reais aparecem:
   - banban-insights
   - banban-inventory
   - banban-data-processing
   - banban-alerts
   - banban-performance

---

##  **TROUBLESHOOTING**

Se os módulos fantasmas ainda aparecerem:

1. Verifique se o SQL foi executado com sucesso (sem erros)
2. Confirme que o cache do servidor foi limpo
3. Execute o script de verificação:
   ```sql
   SELECT module_id, module_name FROM organization_modules 
   WHERE module_id IN (''banban-analytics'', ''banban-components'');
   ```
4. Se retornar registros, execute novamente o script de limpeza

---

**Arquivos criados em**: 03 de Janeiro de 2025  
**Status**:  **PRONTOS PARA EXECUÇÃO**

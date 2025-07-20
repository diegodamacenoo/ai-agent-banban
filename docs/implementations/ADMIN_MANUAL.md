# ADMIN MANUAL
## Manual Completo do Administrador - Sistema de Módulos Dinâmicos

### 🎯 VISÃO GERAL

Este manual ensina como usar a **interface administrativa** para gerenciar módulos, configurar navegação e monitorar o sistema. Todas as operações podem ser realizadas via interface gráfica sem necessidade de código.

### 🔐 ACESSO

- **URL**: `/admin/modules`
- **Permissão necessária**: `master_admin`
- **Login**: Use sua conta de administrador

---

## 📋 MÓDULEMANAGER - GESTÃO PRINCIPAL

### **Acessando o ModuleManager**

1. Faça login como administrador
2. Navegue para `/admin/modules`
3. Clique na aba "Gestão de Módulos"

### **Interface Principal**

A interface exibe:
- **Lista de módulos** registrados
- **Estatísticas rápidas** (total, tenants ativos, health)
- **Filtros** por categoria e status
- **Ações** para cada módulo

### **Criando um Novo Módulo**

1. **Clique em "Novo Módulo"**
2. **Preencha os campos obrigatórios**:
   - **Slug**: Identificador único (ex: `analytics-advanced`)
   - **Nome**: Nome exibido (ex: `Analytics Avançado`)
   - **Descrição**: Descrição detalhada
   - **Categoria**: analytics, operations, insights, reports, admin
   - **Status**: ALPHA, BETA, GA, DEPRECATED
   - **Tier**: FREE, PREMIUM, ENTERPRISE

3. **Clique em "Criar"**

> ⚠️ **Importante**: O slug não pode ser alterado após criação

### **Adicionando Implementações**

1. **Localize o módulo** na lista
2. **Clique no ícone "+"** na coluna de ações
3. **Configure a implementação**:
   - **Tipo de Cliente**: banban, riachuelo, custom, default
   - **Caminho do Componente**: `@/clients/banban/modules/module-name`
   - **Nome de Exibição**: Nome personalizado para o cliente
   - **Ícone**: Nome do ícone Lucide (ex: `BarChart3`)
   - **Status**: Disponível para uso

4. **Clique em "Adicionar"**

### **Gerenciando Status**

#### **Status do Módulo (Maturity)**
- **ALPHA**: Em desenvolvimento, instável
- **BETA**: Funcional, mas ainda em teste
- **GA**: Produção, estável
- **DEPRECATED**: Descontinuado

#### **Status Operacional**
- **ENABLED**: Ativo e funcionando
- **DISABLED**: Desativado temporariamente
- **UPGRADING**: Em manutenção
- **MAINTENANCE**: Manutenção programada

---

## 📊 MODULEANALYTICS - MONITORAMENTO

### **Dashboard de Analytics**

Acesse `/admin/modules` → aba "Analytics" para ver:

#### **Métricas em Tempo Real**
- **Uso por módulo**: Sessions, usuários únicos, tempo médio
- **Performance**: Tempo de carregamento, taxa de erro
- **Adoção**: Taxa de crescimento, organizações ativas
- **Satisfação**: Ratings dos usuários

#### **Relatórios Disponíveis**

1. **Relatório de Uso**
   - Módulos mais/menos utilizados
   - Picos de uso por hora
   - Tendências semanais/mensais

2. **Relatório de Performance**
   - Tempos de carregamento médios
   - Taxa de erros por módulo
   - Bounce rate

3. **Relatório de Adoção**
   - Novos módulos ativados
   - Taxa de crescimento
   - Abandono de módulos

#### **Alertas Automáticos**

O sistema monitora e alerta sobre:
- **Performance degradada** (> 3s loading)
- **Taxa de erro alta** (> 5%)
- **Uso anômalo** (picos ou quedas súbitas)
- **Módulos órfãos** (sem uso por 30 dias)

---

## 🧪 ABTESTINGMANAGER - TESTES A/B

### **Configurando Testes A/B**

1. **Acesse**: `/admin/modules` → aba "A/B Testing"
2. **Clique em "Novo Teste"**
3. **Configure o teste**:
   - **Nome**: Identificação do teste
   - **Módulo**: Selecione o módulo a testar
   - **Variações**: Configure diferentes versões
   - **Audiência**: Porcentagem de usuários
   - **Métricas**: Defina o que medir

### **Tipos de Teste Disponíveis**

#### **Interface Testing**
- Diferentes layouts de módulo
- Variações de navegação
- Temas e cores

#### **Feature Testing**  
- Funcionalidades opcionais
- Diferentes fluxos de trabalho
- Configurações avançadas

#### **Performance Testing**
- Estratégias de cache
- Carregamento lazy vs eager
- Bundle optimization

### **Monitoramento de Resultados**

- **Métricas automáticas**: Engagement, conversão, satisfação
- **Significância estatística**: Calculada automaticamente
- **Recomendações**: IA sugere vencedor quando detecta padrão

---

## 🔒 PERMISSIONMANAGER - CONTROLE DE ACESSO

### **Configurando Permissões de Módulo**

1. **Localize o módulo** no ModuleManager
2. **Clique em "Configurar"** (ícone de engrenagem)
3. **Defina permissões**:
   - **Visualizar**: `module.view`
   - **Editar**: `module.edit`  
   - **Administrar**: `module.admin`
   - **Exportar**: `module.export`

### **Tipos de Permissão**

#### **Permissões Base**
- `*.view`: Visualizar o módulo
- `*.edit`: Editar dados do módulo
- `*.admin`: Administrar configurações
- `*.export`: Exportar dados

#### **Permissões Avançadas**
- `*.analytics`: Ver analytics detalhadas
- `*.configure`: Alterar configurações
- `*.delete`: Remover dados
- `*.bulk`: Operações em lote

### **Aplicando Permissões por Organização**

1. **Acesse**: `/admin/organizations`
2. **Selecione a organização**
3. **Aba "Módulos"**
4. **Configure permissões específicas**

---

## 🔔 NOTIFICATIONMANAGER - ALERTAS

### **Configurando Notificações**

1. **Acesse**: `/admin/modules` → aba "Notificações"
2. **Configure canais**:
   - **Email**: Alertas por email
   - **Slack**: Integração com Slack
   - **Webhook**: Endpoints customizados
   - **In-app**: Notificações na interface

### **Tipos de Alerta**

#### **Alertas de Sistema**
- Módulo indisponível
- Performance degradada
- Erro crítico
- Cache falhou

#### **Alertas de Uso**
- Uso anormal detectado
- Módulo não utilizado
- Pico de demanda
- Quota excedida

### **Configuração de Regras**

```yaml
# Exemplo de regra de alerta
rules:
  - name: "Performance Degradada"
    trigger: "load_time > 3000ms"
    frequency: "immediate"
    channels: ["email", "slack"]
    
  - name: "Módulo Órfão"
    trigger: "no_usage_30_days"
    frequency: "weekly"
    channels: ["email"]
```

---

## 🛠️ OPERAÇÕES AVANÇADAS

### **Backup e Recovery**

#### **Backup de Configurações**
1. **Acesse**: `/admin/modules` → "Backup"
2. **Selecione**: Módulos, implementações, navegação
3. **Clique**: "Gerar Backup"
4. **Download**: Arquivo JSON com configurações

#### **Restore de Backup**
1. **Acesse**: `/admin/modules` → "Restore"
2. **Upload**: Arquivo de backup
3. **Preview**: Verifique mudanças
4. **Confirme**: Aplicar restore

### **Migration Tools**

#### **Migração de Dados**
- **Export**: Exportar configurações para outro ambiente
- **Import**: Importar de sistema legacy
- **Sync**: Sincronizar entre instâncias

#### **Bulk Operations**
- **Ativar múltiplos módulos**
- **Atualizar permissões em lote**
- **Migrar configurações**

---

## 📈 MONITORAMENTO E ALERTAS

### **Dashboard de Health**

Monitore em tempo real:
- **Status dos módulos**: Verde (OK), Amarelo (Atenção), Vermelho (Crítico)
- **Performance**: Tempo de resposta médio
- **Uso**: Quantidade de sessões ativas
- **Erros**: Taxa de erro por módulo

### **Métricas-Chave**

#### **SLA Targets**
- **Uptime**: > 99.9%
- **Response Time**: < 2s
- **Error Rate**: < 0.1%
- **User Satisfaction**: > 4.5/5

#### **Alertas Críticos**
- Módulo indisponível por > 5 minutos
- Taxa de erro > 5% por 10 minutos
- Performance > 5s por 3 minutos
- Cache failure rate > 20%

---

## 🚨 TROUBLESHOOTING COMUM

### **Módulo Não Aparece na Navegação**

1. **Verificar**: Se está ativo no tenant_modules
2. **Conferir**: Permissões do usuário
3. **Validar**: Configuração de navegação
4. **Testar**: Limpar cache

### **Erro de Carregamento**

1. **Verificar**: Path do componente correto
2. **Confirmar**: Componente existe no sistema
3. **Testar**: Import manual do componente
4. **Verificar**: Logs de erro no console

### **Performance Degradada**

1. **Monitorar**: Métricas de cache
2. **Verificar**: Bundle size do módulo
3. **Analisar**: Database query performance
4. **Aplicar**: Otimizações recomendadas

---

## 📚 RECURSOS ADICIONAIS

### **Documentação Técnica**
- [Developer Migration Guide](./DEVELOPER_MIGRATION_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- [API Reference](./API_REFERENCE.md)

### **Vídeos Tutoriais**
- [Criando seu primeiro módulo (5min)]
- [Configurando permissões avançadas (8min)]
- [Analytics e monitoramento (12min)]

### **Suporte**
- **Slack**: #admin-modules-support
- **Email**: admin-support@company.com
- **Docs**: [knowledge-base.company.com]

---

**⚡ DICA PRO**: Use o atalho `Ctrl+Shift+M` para acesso rápido ao ModuleManager quando estiver logado como admin.
# Plano Granular de Intervenções na Interface
## Sistema de Ciclo de Vida de Módulos

### 📋 Separação de Responsabilidades ATUALIZADA

**🏢 Página da Organização** (Foco: Atribuição)
- **Objetivo**: Atribuir módulos **já qualificados** para organizações específicas
- **Módulos exibidos**: Apenas aqueles com status `implemented` ou `active`
- **Funcionalidades**: Seleção, atribuição, teste no tenant, verificação de saúde

**⚙️ Página de Gestão de Módulos** (Foco: Ciclo de Vida)
- **Objetivo**: Gerenciar desenvolvimento, qualificação e descoberta de módulos
- **Módulos exibidos**: Todos os módulos em qualquer estado
- **Funcionalidades**: Escaneamento, desenvolvimento, qualificação, aprovação

---

## 🎯 PÁGINA DA ORGANIZAÇÃO - Intervenções Específicas

### 1. OrganizationModulesCard - Versão Simplificada

#### 🔴 PROBLEMA ATUAL
```
┌─────────────────────────────────────────────────────────────┐
│ Configuração de Módulos                        [⚙️ Configurar] │
├─────────────────────────────────────────────────────────────┤
│ Módulos atribuídos à organização                           │
│                                                             │
│ ☑️ banban-insights    │ Dashboard analytics │ Custom       │
│ ☑️ banban-performance │ Métricas em tempo   │ Custom       │
│ ☑️ banban-alerts      │ Sistema de alertas  │ Custom       │
│                                                             │
│ ❌ Não há feedback se módulos realmente funcionam           │
└─────────────────────────────────────────────────────────────┘
```

#### 🟢 SOLUÇÃO FOCADA
```
┌─────────────────────────────────────────────────────────────┐
│ Configuração de Módulos                                     │
│ 🟢 3 módulos ativos • 📊 Todos saudáveis                   │
│                                                             │
│ [🧪 Testar no Tenant] [🔄 Verificar Saúde]                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📦 Módulos Disponíveis para Atribuição (3/8)               │
│                                                             │
│ Saúde│ Módulo              │ Descrição        │ Status     │
│ ──── │ ────────────────── │ ──────────────── │ ────────── │
│ 🟢✓  │ banban-insights     │ Dashboard analí. │ Pronto     │
│ 🟢✓  │ banban-performance  │ Métricas KPI     │ Pronto     │
│ 🟢✓  │ banban-alerts       │ Sistema alertas  │ Pronto     │
│                                                             │
│                                                             │
│ [💾 Salvar Configuração]                                   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Funcionalidades do Botão

#### 👤 **Botão "Visualizar como Cliente"**
**Funcionalidade**:
```typescript
const viewAsClient = async () => {
  // 1. Valida se todos os módulos selecionados estão saudáveis
  const healthCheck = await validateModulesHealth(selectedModules);
  
  if (healthCheck.hasIssues) {
    showAlert("Alguns módulos têm problemas. Deseja continuar?");
    return;
  }
  
  // 2. Abre nova aba com o tenant da organização
  const tenantUrl = `${window.location.origin}/${organization.slug}`;
  window.open(tenantUrl, '_blank');
  
  // 3. Log da visualização
  await logAdminAction('view_as_client', { 
    organization: organization.id,
    modules: selectedModules 
  });
};
```

**O que faz exatamente**:
1. **Valida saúde**: Verifica se módulos selecionados estão funcionais
2. **Personifica cliente**: Abre tenant como se fosse um usuário da organização
3. **Permite validação**: Admin vê exatamente o que o cliente vê
4. **Log de auditoria**: Registra que admin visualizou como cliente

---

## ⚙️ PÁGINA DE GESTÃO DE MÓDULOS - Incrementos nos Cards Existentes

### 1. Card "Escaneamento de Módulos" (Incrementado)

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Escaneamento de Módulos                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [🔍 Escanear Filesystem] [🔄 Atualizar Saúde] [📊 Relatório]│
│                                                             │
│ 📊 Status do Pipeline                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Descobertos │ Desenvolvendo │ Testando │ Prontos        │ │
│ │     5       │      3        │    2     │    8           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 🚨 Alertas de Saúde                                         │
│ • 2 módulos com problemas detectados                       │
│ • 1 módulo ausente há mais de 1 hora                       │
│ • 3 módulos não verificados recentemente                   │
│                                                             │
│ ⏰ Última verificação: 27/12/2024 às 14:45                 │
│ 🔄 Próxima verificação automática: em 10 minutos           │
└─────────────────────────────────────────────────────────────┘
```

### 2. Card "Lista de Módulos" (Sem Duplicação)

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Lista de Módulos                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Filtros: [Todos ▼] [Tipo ▼] [Saúde ▼] [Organização ▼]     │
│                                                             │
│ Saúde│ Status    │ Módulo              │ Org.   │ Ações    │
│ ──── │ ───────── │ ────────────────── │ ────── │ ──────── │
│ 🟢✓  │ Ativo     │ banban-insights     │ BanBan │ [👁️][⚙️] │
│ 🟢✓  │ Pronto    │ banban-reports      │ -      │ [🧪][📝] │
│ 🟡⚠️  │ Desenvolvendo│ banban-shipping  │ -      │ [🔍][📝] │
│ 🔴❌  │ Problema  │ banban-legacy       │ XYZ    │ [🛠️][🗑️] │
│                                                             │
│ 💡 Detalhes completos e ações específicas por módulo       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUXO CORRIGIDO DE TRABALHO

### 1. **Desenvolvedor** (Página de Gestão)
```
1. 👨‍💻 Desenvolve novo módulo banban-reports
2. 🔍 Sistema detecta automaticamente (scan)
3. 📝 Desenvolvedor marca como "em desenvolvimento"
4. 🧪 Executa testes e qualificação
5. ✅ Marca como "pronto para produção"
```

### 2. **Admin** (Página da Organização)
```
1. 👤 Admin acessa configuração da organização BanBan
2. 📋 Vê apenas módulos "prontos" disponíveis
3. ☑️ Seleciona banban-reports para atribuir
4. 🧪 Clica "Testar no Tenant" para validar
5. 💾 Salva configuração
6. ✅ Cliente tem acesso imediato ao módulo
```

### 3. **Separação Clara**
```
PÁGINA DA ORGANIZAÇÃO (OrganizationModulesCard):
├─ Módulos exibidos: status = 'implemented' OR 'active'
├─ Função: Atribuição e visualização como cliente
├─ Botão: [Visualizar como Cliente]
├─ Saúde: Exibida automaticamente (sem botão)
└─ Não gerencia ciclo de vida

PÁGINA DE GESTÃO DE MÓDULOS:
├─ Card "Escaneamento": Pipeline, alertas, verificações
├─ Card "Lista de Módulos": Detalhes, ações específicas
├─ Função: Desenvolvimento, qualificação, monitoramento
└─ Gerencia ciclo de vida completo
```

---

## 🎨 INTERFACE ORGANIZAÇÃO - Versão Final

### OrganizationModulesCard Simplificado

```typescript
interface OrganizationModulesProps {
  organization: Organization;
  // Apenas módulos prontos para produção
  availableModules: ReadyModule[]; 
}

// Filtro automático - apenas módulos qualificados
const getReadyModules = async () => {
  const allModules = await getAvailableModules();
  return allModules.filter(module => 
    module.status === 'implemented' || 
    module.status === 'active'
  );
};

// Estado simplificado
const [readyModules, setReadyModules] = useState<ReadyModule[]>([]);
const [healthStatus, setHealthStatus] = useState<HealthStatus>();
const [isTesting, setIsTesting] = useState(false);
const [isCheckingHealth, setIsCheckingHealth] = useState(false);
```

### Indicadores Visuais Focados

```
🟢 SAUDÁVEL (Módulo funcionando perfeitamente)
┌─────────────────────────────────────┐
│ 🟢✓ banban-insights                 │
│    ✅ Arquivo presente e funcional   │
│    ✅ Testado há 5 minutos           │
│    [Badge: Pronto]                  │
└─────────────────────────────────────┘

🔴 PROBLEMA (Módulo com issue)
┌─────────────────────────────────────┐
│ 🔴❌ banban-alerts                  │
│    ❌ Arquivo corrompido             │
│    ⚠️ Não pode ser atribuído         │
│    [Badge: Indisponível]            │
│    💡 Contate equipe de desenvolv.   │
└─────────────────────────────────────┘
```

---

## 🎯 BENEFÍCIOS DA SEPARAÇÃO

### 1. **Clareza de Propósito**
- **Organização**: Foco em atribuir módulos prontos
- **Gestão**: Foco em desenvolver e qualificar módulos

### 2. **Interface Mais Limpa**
- Menos botões confusos na página da organização
- Funcionalidades específicas em páginas apropriadas

### 3. **Fluxo de Trabalho Otimizado**
- Desenvolvedor trabalha na gestão de módulos
- Admin trabalha na atribuição para clientes

### 4. **Menor Risco de Erro**
- Admin não pode atribuir módulos não qualificados
- Desenvolvedor tem visão completa do pipeline

Esta separação torna o sistema muito mais intuitivo e seguro, com cada página tendo um propósito claro e bem definido.

---

## 🎯 CRONOGRAMA DE IMPLEMENTAÇÃO

### Semana 1: Infraestrutura Backend
- [x] Migration aplicada ✅
- [ ] Integração do ModuleFileMonitor nas actions
- [ ] Testes das funções SQL
- [ ] Validação do escaneamento

### Semana 2: Interface Principal
- [ ] Enhancement do OrganizationModulesCard
- [ ] Implementação dos indicadores de saúde
- [ ] Função de escaneamento manual
- [ ] Alertas de módulos ausentes

### Semana 3: Monitoramento Avançado
- [ ] Página de saúde dos módulos
- [ ] Dashboard de diagnóstico
- [ ] Hook de monitoramento real-time
- [ ] Widget de status na sidebar

### Semana 4: Automação e Finalização
- [ ] Job de escaneamento automático
- [ ] Sistema de notificações
- [ ] Testes de integração completos
- [ ] Documentação de uso

---

## 🔍 CRITÉRIOS DE VALIDAÇÃO

### Funcionalidade Core
- ✅ Módulos atribuídos aparecem na interface do tenant
- ✅ Módulos ausentes são detectados automaticamente
- ✅ Estados de saúde são exibidos claramente
- ✅ Escaneamento manual funciona corretamente

### Experiência do Usuário
- ✅ Feedback visual claro sobre status dos módulos
- ✅ Ações de reparo disponíveis para admins
- ✅ Informações de última verificação visíveis
- ✅ Navegação intuitiva entre as ferramentas

### Performance e Confiabilidade
- ✅ Escaneamento não impacta performance da aplicação
- ✅ Estados são persistidos corretamente
- ✅ Recuperação automática de módulos restaurados
- ✅ Logs de auditoria completos para troubleshooting

### Escalabilidade
- ✅ Sistema funciona com múltiplas organizações
- ✅ Suporte a diferentes tipos de módulos
- ✅ Arquitetura preparada para novos recursos
- ✅ Monitoramento em tempo real eficiente

---

## 📝 PRÓXIMOS PASSOS PRIORITÁRIOS

1. **Implementar scanModulesWithLifecycle() em modules.ts**
2. **Adicionar getModuleHealthStats() action**
3. **Aplicar enhancements no OrganizationModulesCard**
4. **Testar integração com dados reais**
5. **Validar sincronização tenant-admin** 
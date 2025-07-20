# 🔍 Planejamento: Página de Detalhes de Módulo Individual

> **Objetivo**: Criar página focada em monitoramento e debug de módulo específico, complementando (sem duplicar) a página de gestão global.

**Data:** 2025-07-13  
**Status:** 📋 Planejamento Aprovado  
**Autor:** Claude Code Assistant  
**Contexto:** Solução para botão "Ver Detalhes" não funcional na BaseModulesTable.tsx

---

## 🎯 **Problema Identificado**

### **Issue Crítico:**
- ❌ Botão "Ver Detalhes" na tabela de módulos (`BaseModulesTable.tsx:295`) não funcional
- ❌ `DropdownMenuItem` sem `onClick` ou navegação definida
- ❌ Frustra usuários administradores que esperavam ver detalhes do módulo

### **Outros Botões Problemáticos Encontrados:**
- `ApprovalsModal.tsx:328` - Button sem handler
- `StandardInsightsImplementation.tsx:205` - Button vazio  
- `StandardAlertsImplementation.tsx:223` - Button sem ação

---

## 🔄 **Divisão Clara de Responsabilidades**

### **📋 Página de Gestão de Módulos** (`/admin/modules`)
**Papel:** "O que configurar" - Visão panorâmica e operações em massa

| **Tab** | **Responsabilidade** | **Funcionalidades** |
|---------|---------------------|---------------------|
| 📊 **Módulos Base** | Lista e ações em massa | Filtros, estatísticas consolidadas, CRUD |
| ⚙️ **Implementações** | Gestão por categoria | Criar/editar implementações Standard/Banban/Enterprise |
| 👥 **Assignments** | Configuração global | Atribuir módulos a tenants, configurações JSON |
| 🔧 **Desenvolvimento** | Ferramentas de dev | Migração, testes, validação |
| ✅ **Qualidade** | Métricas de qualidade | Health checks, compliance, cobertura |
| 📝 **Logs** | Logs do sistema | Logs administrativos, auditoria |

### **🔍 Página de Detalhes do Módulo** (`/admin/modules/[moduleId]`)
**Papel:** "Como está funcionando" - Deep dive e troubleshooting

| **Seção** | **Responsabilidade** | **Funcionalidades** |
|-----------|---------------------|---------------------|
| 📊 **Métricas Tempo Real** | Status live individual | Uptime, tempo resposta, cache hit, acessos |
| 🟢 **Status dos Tenants** | Monitoramento live | Online/offline, última atividade, performance |
| 📋 **Configurações Ativas** | Debug view-only | Visualizar configs sem editar, debug tools |
| 📝 **Logs Específicos** | Activity log módulo | Logs filtrados só deste módulo |
| 🔧 **Debug Tools** | Troubleshooting | Simular, testar, validar, restart |
| ⚠️ **Issues & Alerts** | Diagnóstico | Problemas ativos, sugestões de correção |

---

## 📱 **Especificação Detalhada da Nova Página**

### **Rota:**
```
/admin/modules/[moduleId]
```

### **Estrutura de Layout:**

```
┌─ Header Navigation ─────────────────────────────────┐
│ ← Voltar   📊 Performance Analytics            [⚙️] │  
│ Módulo Individual • 4 tenants ativos • 95% saúde   │
└─────────────────────────────────────────────────────┘

┌─ Real-Time Metrics Dashboard ──────────────────────┐
│ 📈 Uso Hoje: 142      ⚡ Tempo Resp: 245ms         │
│ 🔄 Uptime: 99.8%     💾 Cache Hit: 94%            │
│ 📊 Última sync: 13/07 às 10:30                    │
└─────────────────────────────────────────────────────┘

┌─ Usage Chart (7 days) ─────────────────────────────┐
│ [Gráfico específico dos acessos deste módulo]      │
└─────────────────────────────────────────────────────┘
```

### **1. Status dos Tenants (Tempo Real)**
```
┌─ Live Status por Tenant ───────────────────────────┐
│ Tenant            │ Implementação │ Status │ Última Atividade │
│───────────────────┼───────────────┼────────┼──────────────────│
│ 🟢 banban.app     │ Banban Perf   │ Online │ 2min atrás       │
│ 🟢 ca.app         │ Standard      │ Online │ 5min atrás       │
│ 🟢 riachuelo.app  │ Standard      │ Online │ 1min atrás       │
│ 🔴 demo.app       │ Enterprise    │ Offline│ 2min atrás       │
│                   │               │        │ [Investigate]    │
└─────────────────────────────────────────────────────────────┘
```

### **2. Configurações Ativas (Debug View)**
```
┌─ Current Configurations (Read-Only) ───────────────┐
│ 📋 Banban Fashion:                                  │
│   {                                                 │
│     "theme": "banban",                             │
│     "features": ["advanced_kpi", "real_time"]     │
│   }                                    [🔍 Debug]  │
│                                                     │
│ 📋 CA Store:                                        │
│   {                                                 │
│     "theme": "standard",                           │
│     "layout": "compact"                            │
│   }                                    [🔍 Debug]  │
└─────────────────────────────────────────────────────┘
```

### **3. Activity Log Específico**
```
┌─ Module Activity Log (Live) ───────────────────────┐
│ 🕐 10:32 - banban.app executou query KPI           │
│ 🕐 10:30 - cache invalidated para ca.app           │
│ 🕐 10:28 - demo.app connection timeout              │
│ 🕐 10:25 - riachuelo.app carregou dashboard        │
│ 🕐 10:22 - System: health check executado          │
│                                        [Live Feed] │
└─────────────────────────────────────────────────────┘
```

### **4. Debug Tools Específicos**
```
┌─ Debug & Testing Tools ────────────────────────────┐
│ 🔍 Module Testing                                   │
│ [Simulate Load] [Test All Tenants] [Validate Code] │
│                                                     │
│ 📊 Data Export                                      │
│ [Export Metrics] [Download Config] [Debug Report]  │
│                                                     │
│ 🧪 Live Testing                                     │
│ [Test Implementation] [Mock Data] [Stress Test]    │
└─────────────────────────────────────────────────────┘
```

### **5. Issues & Troubleshooting**
```
┌─ Active Issues & Recommendations ──────────────────┐
│ ⚠️  demo.app: Connection timeout (last 2min)       │
│     Possible causes: Network, Server overload      │
│     → [Restart Module] [Check Network] [View Logs] │
│                                                     │
│ ℹ️  banban.app: Using deprecated config key        │
│     "old_kpi_format" will be removed in v2.1       │
│     → [Auto-Fix] [Schedule Update] [Ignore]        │
│                                                     │
│ ✅ All other tenants: Operating normally           │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 **Implementação Técnica**

### **Estrutura de Arquivos:**
```
src/app/(protected)/admin/modules/[moduleId]/
├── page.tsx                          // Página principal
├── components/
│   ├── ModuleDetailHeader.tsx        // Header com breadcrumb
│   ├── RealTimeMetrics.tsx           // Dashboard tempo real
│   ├── TenantStatusTable.tsx         // Status live dos tenants
│   ├── ConfigDebugViewer.tsx         // Viewer de configurações
│   ├── ModuleActivityLog.tsx         // Log específico do módulo
│   ├── DebugToolsPanel.tsx           // Ferramentas de debug
│   ├── IssuesPanel.tsx               // Issues e troubleshooting
│   └── UsageChart.tsx                // Gráfico de uso
├── hooks/
│   ├── useModuleDetails.ts           // Hook para dados do módulo
│   ├── useRealTimeMetrics.ts         // WebSocket para métricas live
│   └── useModuleActivityLog.ts       // Live log feed
└── types/
    └── module-details.ts             // Types específicos
```

### **Server Actions Necessárias:**
```typescript
// src/app/actions/admin/module-details.ts

// Dados principais
getModuleDetails(moduleId: string): Promise<ModuleDetail>
getModuleTenantStatus(moduleId: string): Promise<TenantStatus[]>

// Métricas tempo real
getModuleRealTimeMetrics(moduleId: string): Promise<RealTimeMetrics>
getModuleUsageChart(moduleId: string, days: number): Promise<ChartData>

// Logs e atividade
getModuleActivityLog(moduleId: string, limit: number): Promise<ActivityLog[]>
getModuleIssues(moduleId: string): Promise<ModuleIssue[]>

// Debug tools
testModuleImplementation(moduleId: string, tenantId?: string): Promise<TestResult>
simulateModuleLoad(moduleId: string): Promise<LoadTestResult>
validateModuleConfig(moduleId: string, tenantId: string): Promise<ValidationResult>

// Troubleshooting
restartModuleForTenant(moduleId: string, tenantId: string): Promise<RestartResult>
clearModuleCache(moduleId: string): Promise<CacheResult>
```

### **WebSocket Integration:**
```typescript
// hooks/useRealTimeMetrics.ts
export function useRealTimeMetrics(moduleId: string) {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket(`/api/ws/module-metrics/${moduleId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMetrics(data);
    };
    
    return () => ws.close();
  }, [moduleId]);
  
  return { metrics, isConnected: metrics !== null };
}
```

### **Navegação Implementada:**
```typescript
// Correção no BaseModulesTable.tsx linha 295
<DropdownMenuItem asChild>
  <Link href={`/admin/modules/${module.id}`}>
    <Package className="mr-2 h-4 w-4" />
    Ver Detalhes
  </Link>
</DropdownMenuItem>
```

### **Types Necessários:**
```typescript
// types/module-details.ts
interface ModuleDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  implementations: ModuleImplementation[];
  tenant_assignments: TenantModuleAssignment[];
  created_at: string;
  updated_at: string;
}

interface RealTimeMetrics {
  module_id: string;
  current_usage: number;
  avg_response_time: number;
  uptime_percentage: number;
  cache_hit_rate: number;
  last_sync: string;
  total_requests_today: number;
}

interface TenantStatus {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  implementation_key: string;
  is_online: boolean;
  last_activity: string;
  response_time: number;
  error_count: number;
}

interface ActivityLog {
  id: string;
  module_id: string;
  tenant_id?: string;
  event_type: string;
  event_description: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface ModuleIssue {
  id: string;
  module_id: string;
  tenant_id?: string;
  issue_type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  suggested_actions: string[];
  created_at: string;
  resolved_at?: string;
}
```

---

## ✨ **Funcionalidades Especiais**

### **1. Live Data Feed**
- WebSocket connection para métricas em tempo real
- Auto-refresh de status dos tenants (30s)
- Live activity log stream
- Indicadores visuais de conectividade

### **2. Debug Tools Avançados**
- Simulação de carga para teste
- Validação de configurações em tempo real
- Test runner para todas as implementações
- Export de dados para análise offline

### **3. Troubleshooting Inteligente**
- Detecção automática de problemas comuns
- Sugestões de correção baseadas em histórico
- Actions de correção com um clique
- Escalação automática para admin quando necessário

### **4. Métricas Específicas**
- Gráficos focados no módulo individual
- Comparação de performance entre tenants
- Alertas visuais para degradação de performance
- Histórico de uptime e disponibilidade

---

## 🎯 **Critérios de Sucesso**

### **Funcionalidades Core:**
- [x] ✅ **Navegação funcional** - Botão "Ver Detalhes" funciona
- [ ] 🔄 **Métricas tempo real** - Dashboard live atualizado
- [ ] 🔄 **Status dos tenants** - Tabela com status online/offline
- [ ] 🔄 **Debug tools** - Ferramentas funcionais de troubleshooting
- [ ] 🔄 **Activity log** - Log específico do módulo em tempo real

### **Performance:**
- [ ] 🔄 **Carregamento < 2s** - Página carrega rapidamente
- [ ] 🔄 **WebSocket estável** - Conexão tempo real sem falhas
- [ ] 🔄 **Mobile responsive** - Interface funciona em tablets

### **UX/UI:**
- [ ] 🔄 **Design consistente** - Segue design system atual
- [ ] 🔄 **Navegação intuitiva** - Breadcrumbs e botão voltar
- [ ] 🔄 **Feedback visual** - Loading states e success/error messages

---

## 📅 **Cronograma de Implementação**

### **Dia 1: Estrutura Base**
- [x] ✅ Planejamento e especificação
- [ ] 🔄 Criar estrutura de arquivos
- [ ] 🔄 Implementar página base e routing
- [ ] 🔄 Corrigir navegação BaseModulesTable.tsx

### **Dia 1 (Tarde): Componentes Core**
- [ ] 🔄 ModuleDetailHeader + breadcrumbs
- [ ] 🔄 RealTimeMetrics dashboard
- [ ] 🔄 TenantStatusTable
- [ ] 🔄 Server actions básicas

### **Dia 2: Funcionalidades Avançadas**
- [ ] 🔄 WebSocket integration
- [ ] 🔄 ModuleActivityLog com live feed
- [ ] 🔄 DebugToolsPanel
- [ ] 🔄 IssuesPanel com troubleshooting

### **Dia 2 (Final): Polish & Testing**
- [ ] 🔄 Testes de integração
- [ ] 🔄 Responsive design
- [ ] 🔄 Error handling
- [ ] 🔄 Validação final

---

## 🔄 **Integração com Plano de Migração**

### **Posição no Roadmap:**
```
Fase 4: Frontend Reestruturação (85% → 90%)
├── ✅ Performance, Insights, Alerts implementados
├── 🔄 Inventory, Analytics pendentes  
└── 🆕 Página Detalhes de Módulo (nova feature)

Fase 5: Painel Admin (100% CONCLUÍDO)
├── ✅ Nova interface funcionando
└── 🆕 Integração com página detalhes
```

### **Dependências:**
- ✅ Nova estrutura de banco (Fases 1-3 concluídas)
- ✅ Server actions adaptadas (Fase 5 concluída)  
- ✅ Views otimizadas criadas
- 🔄 WebSocket endpoint para métricas (novo)

---

## 🚨 **Riscos e Mitigações**

### **Riscos Técnicos:**
1. **WebSocket instabilidade**
   - **Mitigação:** Fallback para polling, reconexão automática

2. **Performance com múltiplos módulos**
   - **Mitigação:** Lazy loading, cache inteligente

3. **Concorrência de dados**
   - **Mitigação:** Optimistic updates, conflict resolution

### **Riscos de UX:**
1. **Sobreposição com gestão global**
   - **Mitigação:** Responsabilidades bem definidas (documento atual)

2. **Complexidade excessiva**
   - **Mitigação:** Progressive disclosure, interface limpa

---

## 📊 **Métricas de Acompanhamento**

### **Métricas de Uso:**
- Clicks no botão "Ver Detalhes" (antes: 0, meta: >50/dia)
- Tempo médio na página (meta: >3min)
- Taxa de resolução de issues via debug tools (meta: >70%)

### **Métricas Técnicas:**
- Uptime da página (meta: >99.5%)
- Tempo de carregamento inicial (meta: <2s)
- Latência do WebSocket (meta: <100ms)

---

## ✅ **Resultado Final Esperado**

Uma página de detalhes que:

1. **✅ Resolve o problema imediato** - Botão "Ver Detalhes" funcional
2. **✅ Complementa sem duplicar** - Responsabilidades claras vs gestão global
3. **✅ Oferece valor único** - Debug e monitoramento em tempo real
4. **✅ Melhora experiência admin** - Troubleshooting eficiente
5. **✅ Escala com o projeto** - Suporta novos módulos automaticamente

**Complexidade:** Média  
**Tempo estimado:** 2 dias  
**Prioridade:** Alta (resolve UX crítico)  
**Status:** 📋 Planejamento Aprovado → 🔄 Pronto para Implementação

---

*Documento criado em 2025-07-13*  
*Próxima atualização: Pós-implementação*
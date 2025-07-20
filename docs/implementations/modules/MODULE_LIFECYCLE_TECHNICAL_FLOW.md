# Fluxo Técnico: Sistema de Ciclo de Vida de Módulos

## 🔄 ARQUITETURA DO SISTEMA

### Visão Geral dos Componentes
```
┌─────────────────────────────────────────────────────────────┐
│                    🏢 INTERFACE ADMIN                       │
├─────────────────────────────────────────────────────────────┤
│ OrganizationModulesCard.tsx                                 │
│ ├─ 🟢 Status visual em tempo real                           │
│ ├─ 🔄 Botão de escaneamento manual                          │
│ ├─ ⚠️ Alertas para problemas detectados                     │
│ └─ 📊 Estatísticas de saúde dos módulos                     │
└─────────────────────────────────────────────────────────────┘
                              ↕️ API Calls
┌─────────────────────────────────────────────────────────────┐
│                   🔧 SERVER ACTIONS                         │
├─────────────────────────────────────────────────────────────┤
│ /app/actions/admin/modules.ts                               │
│ ├─ scanModulesWithLifecycle() ← Nova função                 │
│ ├─ getModuleHealthStats() ← Nova função                     │
│ ├─ getAvailableModules() ← Melhorada                        │
│ └─ updateOrganizationModules() ← Melhorada                  │
└─────────────────────────────────────────────────────────────┘
                              ↕️ Service Calls
┌─────────────────────────────────────────────────────────────┐
│                  🔍 SERVIÇOS BACKEND                        │
├─────────────────────────────────────────────────────────────┤
│ ModuleFileMonitor.ts                                        │
│ ├─ 🔍 Escaneia arquivos no filesystem                       │
│ ├─ 🔐 Calcula hash SHA256 para detecção de mudanças         │
│ ├─ 📝 Registra eventos de auditoria                         │
│ └─ 🔄 Atualiza status no banco de dados                     │
│                                                             │
│ ModuleDiscoveryService.ts                                   │
│ ├─ 📁 Descobre módulos em src/core/modules/                 │
│ ├─ 🏷️ Identifica tipo (standard vs custom)                 │
│ └─ 📋 Retorna lista completa de módulos disponíveis         │
└─────────────────────────────────────────────────────────────┘
                              ↕️ Database Calls
┌─────────────────────────────────────────────────────────────┐
│                    💾 BANCO DE DADOS                        │
├─────────────────────────────────────────────────────────────┤
│ organization_modules (Tabela melhorada)                     │
│ ├─ file_path: string ← Novo campo                           │
│ ├─ file_hash: string ← Novo campo                           │
│ ├─ file_last_seen: timestamp ← Novo campo                   │
│ ├─ missing_since: timestamp ← Novo campo                    │
│ ├─ missing_notified: boolean ← Novo campo                   │
│ ├─ module_version: string ← Novo campo                      │
│ └─ locked_version: boolean ← Novo campo                     │
│                                                             │
│ module_file_audit (Nova tabela)                             │
│ ├─ 📝 Histórico completo de eventos                         │
│ ├─ 🔍 Rastreamento de mudanças de arquivo                   │
│ └─ 📊 Dados para análise e diagnóstico                      │
│                                                             │
│ Funções SQL (Novas)                                         │
│ ├─ get_module_health_stats() ← Estatísticas em tempo real   │
│ └─ mark_module_missing() ← Marcar módulos ausentes          │
└─────────────────────────────────────────────────────────────┘
                              ↕️ Real-time sync
┌─────────────────────────────────────────────────────────────┐
│                   👤 INTERFACE TENANT                       │
├─────────────────────────────────────────────────────────────┤
│ UnifiedSidebar.tsx                                          │
│ ├─ ✅ Carrega apenas módulos com status 'active'            │
│ ├─ 🔄 Atualização automática quando admin muda config       │
│ └─ 🚫 Nunca mais mostra módulos ausentes/órfãos             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 FLUXO DE DADOS EM TEMPO REAL

### 1. Escaneamento Automático (A cada 15 minutos)
```
⏰ Timer dispara escaneamento
    ↓
🔍 ModuleFileMonitor.scanAndUpdateModuleStatus()
    ├─ Varre diretório src/core/modules/
    ├─ Calcula hash SHA256 de cada arquivo
    ├─ Compara com hash armazenado no banco
    └─ Identifica: descobertos, atualizados, ausentes, restaurados
    ↓
💾 Atualiza banco de dados:
    ├─ organization_modules: status, file_hash, file_last_seen
    └─ module_file_audit: registra evento com metadata
    ↓
📊 Resultados disponíveis para interface admin
```

### 2. Admin Configura Módulos
```
👤 Admin seleciona módulos na interface
    ↓
⚡ updateOrganizationModules() action executada
    ├─ Valida se módulos selecionados existem no filesystem
    ├─ Mostra warnings para módulos ausentes
    └─ Atualiza implementation_config da organização
    ↓
🔄 Sincronização com organization_modules:
    ├─ Remove módulos desativados
    ├─ Adiciona módulos ativados com metadata completa
    └─ Define status: 'active' se implementation_complete
    ↓
✅ Interface tenant automaticamente reflete mudanças
```

### 3. Detecção de Problema
```
🔍 Escaneamento detecta arquivo ausente
    ↓
⚠️ ModuleFileMonitor.markModuleAsMissing()
    ├─ Atualiza status para 'missing'
    ├─ Define missing_since = NOW()
    ├─ Calcula impact_level baseado no status anterior
    └─ Registra evento na auditoria
    ↓
🚨 Interface admin mostra alerta visual:
    ├─ 🔴 Badge "Módulo Ausente"
    ├─ ⏰ "Ausente desde [timestamp]"
    └─ 🛠️ Botões de ação: "Reescanear", "Reparar"
    ↓
👤 Tenant não mostra módulo ausente na sidebar
```

### 4. Recuperação Automática
```
📁 Desenvolvedor restaura arquivo
    ↓
🔍 Próximo escaneamento detecta arquivo presente
    ↓
🔄 ModuleFileMonitor.restoreModule()
    ├─ Busca status anterior na auditoria
    ├─ Restaura status original ('active', 'implemented', etc.)
    ├─ Limpa missing_since e missing_notified
    └─ Registra evento de 'restored' com duração da ausência
    ↓
✅ Interface admin mostra notificação:
    └─ "Módulo banban-alerts restaurado automaticamente!"
    ↓
🎯 Tenant volta a mostrar módulo na sidebar
```

## 🎨 TRANSFORMAÇÕES NA INTERFACE

### OrganizationModulesCard - Antes vs Depois

#### ANTES (Código Atual)
```typescript
// Estado simples
const [availableModules, setAvailableModules] = useState([]);
const [selectedModules, setSelectedModules] = useState([]);

// Função básica de carregamento
const loadAvailableModules = async () => {
  const response = await getAvailableModules();
  setAvailableModules(response.data.discovered);
};

// Renderização sem informação de saúde
return (
  <tr>
    <td><Checkbox checked={isSelected} /></td>
    <td>{module.name}</td>
    <td>{module.description}</td>
    <td>{module.type}</td>
  </tr>
);
```

#### DEPOIS (Código Melhorado)
```typescript
// Estado expandido com saúde
const [availableModules, setAvailableModules] = useState([]);
const [healthStats, setHealthStats] = useState(null);
const [isScanning, setIsScanning] = useState(false);
const [lastScanTime, setLastScanTime] = useState(null);

// Função de escaneamento com ciclo de vida
const performModuleScan = async () => {
  setIsScanning(true);
  const scanResponse = await scanModulesWithLifecycle();
  setScanResults(scanResponse.data.scan_results);
  await loadAvailableModules(true);
  setIsScanning(false);
};

// Carregamento com informações de saúde
const loadAvailableModules = async () => {
  const [modulesResponse, healthResponse] = await Promise.all([
    getAvailableModules(),
    getModuleHealthStats(organization.id)
  ]);
  
  setAvailableModules(modulesResponse.data.discovered);
  setHealthStats(healthResponse.data);
};

// Renderização com indicadores visuais
return (
  <tr className={module.health?.status === 'missing' ? 'bg-red-50' : ''}>
    <td><ModuleHealthIndicator module={module} /></td>
    <td>
      <div className="flex items-center gap-2">
        <span>{module.name}</span>
        {module.health?.status === 'missing' && (
          <Badge variant="destructive">Ausente</Badge>
        )}
      </div>
      {module.lifecycle?.file_last_seen && (
        <div className="text-xs text-gray-400">
          Visto: {formatTimestamp(module.lifecycle.file_last_seen)}
        </div>
      )}
    </td>
    <td>{module.description}</td>
    <td>{module.type}</td>
  </tr>
);
```

## 🔍 NOVOS TIPOS TYPESCRIPT

### Extensão dos Tipos Existentes
```typescript
// Extensão do AvailableModule existente
interface EnhancedAvailableModule extends AvailableModule {
  health?: {
    status: 'healthy' | 'warning' | 'error' | 'missing';
    last_seen?: string;
    missing_since?: string;
    file_hash?: string;
    message?: string;
  };
  lifecycle?: {
    file_last_seen?: string;
    missing_since?: string;
    file_hash?: string;
    module_version?: string;
    locked_version?: boolean;
  };
}

// Novos tipos para responses
interface ModuleScanResults {
  discovered: number;
  updated: number;
  missing: number;
  restored: number;
  errors: string[];
}

interface ModuleHealthStats {
  total: number;
  by_status: {
    discovered: number;
    planned: number;
    implemented: number;
    active: number;
    missing: number;
    archived: number;
    orphaned: number;
  };
  health_issues: {
    missing_modules: number;
    orphaned_modules: number;
    outdated_files: number;
  };
  last_scan: string;
}
```

## 📈 MELHORIAS DE PERFORMANCE

### Escaneamento Inteligente
```typescript
// Cache de resultados para evitar escaneamentos desnecessários
const moduleCache = new Map<string, {
  hash: string;
  lastSeen: number;
  status: ModuleStatus;
}>();

// Escaneamento incremental - apenas arquivos modificados
const scanModifiedOnly = async () => {
  const filesChanged = await getModifiedFiles(lastScanTime);
  const results = await processChangedFiles(filesChanged);
  return results;
};

// Debounce para evitar escaneamentos excessivos
const debouncedScan = debounce(performModuleScan, 2000);
```

### Carregamento Assíncrono
```typescript
// Carregamento paralelo de dados
const loadAllData = async () => {
  const [modules, health, organizations] = await Promise.all([
    getAvailableModules(),
    getModuleHealthStats(),
    getOrganizations()
  ]);
  
  return { modules, health, organizations };
};
```

## 🎯 BENEFÍCIOS TÉCNICOS

### 1. Detecção Proativa
- **Antes**: Problemas descobertos apenas quando usuário reporta
- **Depois**: Detecção automática em até 15 minutos

### 2. Auditoria Completa
- **Antes**: Sem histórico de mudanças de módulos
- **Depois**: Log completo de todos os eventos com metadata

### 3. Sincronização Garantida
- **Antes**: Admin e tenant podem estar dessincronizados
- **Depois**: Sincronização em tempo real garantida

### 4. Interface Inteligente
- **Antes**: Interface estática, sem feedback de status
- **Depois**: Interface dinâmica com indicadores visuais claros

### 5. Recuperação Automática
- **Antes**: Problemas requerem intervenção manual
- **Depois**: Recuperação automática quando arquivos são restaurados

Este sistema transforma a gestão de módulos de um processo manual e reativo em um sistema automatizado e proativo, garantindo confiabilidade e visibilidade completa do estado dos módulos em tempo real. 
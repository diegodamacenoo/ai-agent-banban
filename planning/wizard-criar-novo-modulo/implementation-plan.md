# 📋 Plano de Implementação em Fases - Wizard de Criação de Módulos

## 🎯 Visão Geral da Implementação

**Objetivo**: Refatorar wizard de criação de módulos eliminando redundâncias e melhorando UX  
**Timeline Total**: 4-6 semanas  
**Impacto Esperado**: -40% tempo de conclusão, -50% campos manuais  
**Metodologia**: Implementação incremental com validação contínua

---

## 📅 **FASE 1 - Fundação** (Semanas 1-2)
*Eliminar redundâncias críticas e preparar base*

### **🎯 Objetivos da Fase 1**
- Eliminar duplicações identificadas na análise O3
- Implementar auto-geração de identificadores
- Unificar versioning entre steps
- Preparar base sólida para melhorias UX

### **📋 Sprint 1.1 - Eliminação de Duplicações** (5 dias)

#### **Dia 1-2: Setup e Preparação**
```bash
# Comandos de preparação
git tag -a v1.0-wizard-stable -m "Wizard estável antes da refatoração"
git checkout -b feature/wizard-refactor-phase1
```

**Tarefas:**
- [ ] **Backup completo** do wizard atual com tag `v1.0-wizard-stable`
- [ ] **Criar branch** `feature/wizard-refactor-phase1`
- [ ] **Documentar estado atual** com screenshots de cada step
- [ ] **Setup de testes** E2E para wizard completo

#### **Dia 3-4: Toggle "Implementação Standard" Único**

**Problema**: Toggle duplicado em `BasicConfigStep:566` + `ImplementationConfigStep`

**Solução**:
```typescript
// REMOVER de ImplementationConfigStep.tsx
// MANTER apenas em BasicConfigStep.tsx:566

// BasicConfigStep.tsx - Centralizar lógica
const handleAutoCreateStandardToggle = (checked: boolean) => {
  updateBasicConfig('auto_create_standard', checked);
  // Propagar decisão via context para próximos steps
  updateConfig('flow_config', { 
    skip_implementation_config: checked 
  });
};
```

**Arquivos Afetados**:
- `src/app/(protected)/admin/modules/development/components/wizard-steps/BasicConfigStep.tsx`
- `src/app/(protected)/admin/modules/development/components/wizard-steps/ImplementationConfigStep.tsx`
- `src/app/(protected)/admin/modules/development/hooks/useModuleWizard.ts`

**Testes**:
- [ ] Testes unitários para toggle único
- [ ] Validar propagação de estado via context
- [ ] E2E para fluxos Standard vs Custom

#### **Dia 5: Validação e Testes Sprint 1.1**
- [ ] **Testes E2E** criação de módulo Standard vs Custom
- [ ] **Verificar persistência** de configuração entre steps
- [ ] **QA manual** de fluxos completos
- [ ] **Code review** e merge para branch principal

### **📋 Sprint 1.2 - Auto-geração de Identificadores** (5 dias)

#### **Dia 1-2: Implementar Auto-geração**

**Problema**: Usuário precisa preencher manualmente `slug`, `implementation_key` e `component_path`

**Solução**:
```typescript
// BasicConfigStep.tsx - Modificar generateSlug()
const generateIdentifiers = (name: string) => {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // Auto-gerar campos derivados
  const derivedFields = {
    slug,
    implementation_key: `${slug}-impl`,
    component_path: `${slug}Implementation`
  };
  
  // Atualizar configuração
  updateBasicConfig('slug', slug);
  updateConfig('auto_generated', derivedFields);
  
  return derivedFields;
};

// Interface atualizada
<div className="space-y-2">
  <Label>Identificador (Slug) *</Label>
  <Input 
    value={basicConfig.slug}
    onChange={(e) => generateIdentifiers(e.target.value)} // Auto-gera outros campos
    placeholder="Gerado automaticamente baseado no nome"
    className="bg-gray-50" // Visual de campo auto-gerado
  />
  <div className="text-xs text-muted-foreground">
    <strong>Auto-gerado:</strong>
    <br />• Chave implementação: <code>{basicConfig.slug}-impl</code>
    <br />• Componente: <code>{basicConfig.slug}Implementation</code>
  </div>
</div>
```

**Tarefas**:
- [ ] Modificar `generateSlug()` para gerar campos derivados
- [ ] Tornar `implementation_key` e `component_path` **read-only** com opção "Editar Avançado"
- [ ] Adicionar preview em tempo real da estrutura gerada
- [ ] Validação de duplicidade de slug via API

#### **Dia 3-4: Versão Unificada**

**Problema**: Versão solicitada em `BasicConfigStep:410` + `ImplementationConfigStep:256`

**Solução**:
```typescript
// BasicConfigStep.tsx - Manter versão principal
<div className="space-y-2">
  <Label>Versão do Módulo *</Label>
  <Input
    value={basicConfig.version}
    onChange={(e) => {
      updateBasicConfig('version', e.target.value);
      // Propagar versão para implementação automaticamente
      updateConfig('implementation', { version: e.target.value });
    }}
    placeholder="1.0.0"
  />
</div>

// ImplementationConfigStep.tsx - Mostrar como herdado
<div className="space-y-2">
  <Label>Versão da Implementação</Label>
  <div className="flex items-center gap-2">
    <Input
      value={state.config.basic?.version || '1.0.0'}
      disabled
      className="bg-gray-50"
    />
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => setCustomVersion(true)}
    >
      Personalizar
    </Button>
  </div>
  <p className="text-xs text-muted-foreground">
    Herdada automaticamente do módulo base. Clique em "Personalizar" para definir versão específica.
  </p>
</div>
```

**Tarefas**:
- [ ] **Manter versão apenas em BasicConfigStep**
- [ ] **ImplementationConfigStep herda automaticamente**
- [ ] **Mostrar versão herdada como read-only**
- [ ] **Botão "Personalizar Versão"** para casos especiais

#### **Dia 5: Testes e Integração**
- [ ] Testes para auto-geração de identificadores
- [ ] Validar unicidade de slugs (integração com API)
- [ ] Testar herança de versão
- [ ] Verificar compatibilidade com server actions existentes

---

## 📅 **FASE 2 - Otimização UX** (Semanas 3-4)
*Condicionalizar fluxos e melhorar interface*

### **🎯 Objetivos da Fase 2**
- Implementar fluxos condicionais baseados no tipo de módulo
- Melhorar interface com configurações avançadas colapsáveis
- Adicionar preview em tempo real
- Otimizar navegação entre steps

### **📋 Sprint 2.1 - Condicionalizar Steps por Tipo** (5 dias)

#### **Dia 1-2: Lógica Condicional no Wizard**

**Problema**: Todos os steps são mostrados independente do tipo de módulo

**Solução**:
```typescript
// wizard-steps.ts - Modificar isStepVisible()
export function isStepVisible(stepId: WizardStep, moduleType?: 'standard' | 'custom'): boolean {
  const config = useModuleWizardContext().state.config;
  
  switch (stepId) {
    case 'client-config':
      // ClientConfig só para módulos Custom
      return moduleType === 'custom';
      
    case 'implementation-config':
      // Pular se auto_create_standard = true para Standard modules
      if (moduleType === 'standard' && config.basic?.auto_create_standard) {
        return false;
      }
      return true;
      
    default:
      return true;
  }
}

// useModuleWizard.ts - Progress dinâmico
const effectiveProgress = useMemo(() => {
  const visibleSteps = WIZARD_STEPS.filter(step => 
    isStepVisible(step.id, moduleType)
  );
  const totalVisible = visibleSteps.length;
  const currentIndex = visibleSteps.findIndex(step => 
    step.id === state.currentStep
  );
  
  return {
    currentStepIndex: currentIndex,
    totalSteps: totalVisible,
    percentage: totalVisible > 0 ? Math.round((currentIndex / (totalVisible - 1)) * 100) : 0
  };
}, [state.currentStep, moduleType]);
```

**Arquivos Afetados**:
- `src/app/(protected)/admin/modules/development/config/wizard-steps.ts`
- `src/app/(protected)/admin/modules/development/hooks/useModuleWizard.ts`
- `src/app/(protected)/admin/modules/contexts/ModuleWizardContext.tsx`

**Tarefas**:
- [ ] Implementar `isStepVisible()` condicional
- [ ] Progress bar dinâmico baseado em steps visíveis
- [ ] Navegação inteligente (pular steps não aplicáveis)
- [ ] Testes para diferentes tipos de módulo

#### **Dia 3-4: Fluxo Standard Simplificado**

**Cenário Otimizado**: Módulo Standard + `auto_create_standard = true`

**Novo Fluxo**:
1. **Module Type** → Standard ✅
2. **Basic Config** → `auto_create_standard = true` ✅  
3. **Review & Create** → Cria base + implementação automaticamente ✅
4. **Checklist** → Pula ClientConfig e ImplementationConfig ✅

```typescript
// ReviewCreateStep.tsx - Criar implementação automaticamente para Standard
const handleCreateStandardModule = async () => {
  try {
    // 1. Criar base module
    const baseModuleResult = await createBaseModule(baseModuleData);
    
    // 2. Se auto_create_standard = true, criar implementação automaticamente
    if (config.basic?.auto_create_standard) {
      const implementationData = {
        base_module_id: baseModuleResult.data.id,
        name: `${config.basic.name} - Implementação Padrão`,
        implementation_key: `${config.basic.slug}-standard`,
        component_path: `${config.basic.slug}StandardImplementation`,
        is_default: true,
        audience: 'generic'
      };
      
      const implResult = await createModuleImplementation(implementationData);
      updateConfig('auto_created_implementation', implResult.data);
    }
    
    // 3. Ir direto para checklist
    nextStep(); // Pula client-config e implementation-config
    
  } catch (error) {
    setError(error.message);
  }
};
```

**Tarefas**:
- [ ] Implementar auto-criação de implementação para Standard
- [ ] Pular steps desnecessários no fluxo Standard
- [ ] Testes para fluxo simplificado vs fluxo completo
- [ ] Validar compatibilidade com server actions

#### **Dia 5: Validação Condicional**
- [ ] Testes E2E para fluxo Standard vs Custom
- [ ] Verificar progress bar dinâmico
- [ ] Validar navegação inteligente
- [ ] QA manual dos novos fluxos

### **📋 Sprint 2.2 - Interface e UX** (5 dias)

#### **Dia 1-2: Acordeão para Configurações Avançadas**

**Problema**: UI poluída com campos avançados sempre visíveis (`BasicConfigStep:511-578`)

**Solução**:
```typescript
// BasicConfigStep.tsx - Implementar Collapsible
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';

const BasicConfigStep = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Campos básicos sempre visíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Essenciais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome, Slug, Descrição, Categoria */}
        </CardContent>
      </Card>

      {/* Configurações Avançadas Colapsáveis */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Configurações Avançadas</span>
                  <Badge variant="outline" className="ml-2">
                    {getAdvancedConfigCount()} configurações
                  </Badge>
                </div>
                <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Multi-tenant, tags, route pattern personalizado, e mais opções
              </p>
            </CardContent>
          </Card>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="p-6 space-y-4">
              {/* Multi-tenant, route_pattern, tags, etc. */}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
```

**Tarefas**:
- [ ] Implementar Collapsible/Accordion para configurações avançadas
- [ ] Reorganizar campos: **Essenciais visíveis**, **Avançados colapsados**
- [ ] Indicadores visuais para opções preenchidas
- [ ] Manter estado aberto/fechado durante navegação

#### **Dia 3-4: Preview em Tempo Real**

**Objetivo**: Mostrar preview da estrutura e URL conforme usuário preenche

**Solução**:
```typescript
// StructurePreview.tsx - Novo componente
const StructurePreview = ({ config }: { config: BasicModuleConfig }) => {
  const routePattern = config.route_pattern || 'auto-detect';
  const componentPath = config.slug ? `${config.slug}Implementation` : 'ModuleImplementation';
  
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <h4 className="font-medium flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-blue-600" />
          Estrutura que será criada
        </h4>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Estrutura de arquivos */}
        <div className="font-mono text-xs space-y-1 bg-white p-3 rounded border">
          <div className="flex items-center gap-1">
            <Folder className="h-3 w-3 text-yellow-600" />
            <span>src/core/modules/{routePattern}/</span>
          </div>
          <div className="ml-4 flex items-center gap-1">
            <FileText className="h-3 w-3 text-blue-600" />
            <span>{componentPath}.tsx</span>
          </div>
          <div className="ml-4 flex items-center gap-1">
            <FileText className="h-3 w-3 text-green-600" />
            <span>index.ts</span>
          </div>
        </div>
        
        {/* Preview da URL */}
        <div className="space-y-2">
          <h5 className="font-medium text-sm">URL do módulo:</h5>
          <div className="bg-white p-2 rounded border font-mono text-xs">
            /{'{tenant}'}/{routePattern}
          </div>
          <p className="text-xs text-muted-foreground">
            Exemplo: /banban-fashion/{routePattern}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// BasicConfigStep.tsx - Integrar preview
return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      {/* Formulário atual */}
    </div>
    <div className="lg:col-span-1">
      <StructurePreview config={basicConfig} />
    </div>
  </div>
);
```

**Tarefas**:
- [ ] Criar componente `StructurePreview`
- [ ] Preview da estrutura de arquivos em tempo real
- [ ] Preview da URL final baseada em configurações
- [ ] Validações visuais instantâneas (slug duplicado, etc.)
- [ ] Feedback visual para campos válidos/inválidos

#### **Dia 5: Polish e Teste Final Fase 2**
- [ ] Refinamentos de UI/UX baseados em feedback
- [ ] Testes completos de usabilidade
- [ ] Performance check e otimizações
- [ ] Documentação das melhorias implementadas

---

## 📅 **FASE 3 - Refinamentos** (Semanas 5-6)  
*Checklist interativo e melhorias finais*

### **🎯 Objetivos da Fase 3**
- Implementar checklist interativo com links diretos
- Sistema de tracking de progresso
- Implementar tags (se houver tempo)
- Polish final e otimizações

### **📋 Sprint 3.1 - Checklist Interativo** (5 dias)

#### **Dia 1-3: Links Diretos e Actions**

**Problema**: Checklist atual é estático sem ações práticas

**Solução**:
```typescript
// InteractiveChecklistItem.tsx - Novo componente
interface ChecklistTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  estimatedTime: string;
  actionType: 'open-folder' | 'open-file' | 'external-link' | 'none';
  actionData?: {
    path?: string;
    filePath?: string;
    url?: string;
  };
}

const InteractiveChecklistItem = ({ 
  task, 
  moduleData, 
  onToggle 
}: { 
  task: ChecklistTask;
  moduleData: ModuleCreationConfig;
  onToggle: (taskId: string, completed: boolean) => void;
}) => {
  const handleAction = () => {
    switch (task.actionType) {
      case 'open-folder':
        // Integração com VS Code ou File Explorer
        window.open(`vscode://file/${task.actionData?.path}`, '_blank');
        break;
      case 'open-file':
        window.open(`vscode://file/${task.actionData?.filePath}`, '_blank');
        break;
      case 'external-link':
        window.open(task.actionData?.url, '_blank');
        break;
    }
  };

  return (
    <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3 flex-1">
        <Checkbox
          checked={task.completed}
          onCheckedChange={(checked) => onToggle(task.id, checked as boolean)}
          className="mt-0.5"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </p>
            <Badge variant="outline" className="text-xs">
              {task.estimatedTime}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {task.description}
          </p>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-1 ml-4">
        {task.actionType === 'open-folder' && (
          <Button size="sm" variant="outline" onClick={handleAction}>
            <FolderOpen className="h-4 w-4" />
          </Button>
        )}
        {task.actionType === 'open-file' && (
          <Button size="sm" variant="outline" onClick={handleAction}>
            <FileText className="h-4 w-4" />
          </Button>
        )}
        {task.actionType === 'external-link' && (
          <Button size="sm" variant="outline" onClick={handleAction}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
```

**Tarefas**:
- [ ] Criar componente `InteractiveChecklistItem`
- [ ] Implementar ações: open-folder, open-file, external-link
- [ ] Links diretos para pastas/arquivos criados
- [ ] Integração com VS Code via protocol handlers
- [ ] Progress tracking por item individual

#### **Dia 4-5: Sistema de Tracking**

**Objetivo**: Persistir progresso do checklist e gerar métricas

**Solução**:
```typescript
// useChecklistProgress.ts - Hook para tracking
export const useChecklistProgress = (moduleId: string) => {
  const [progress, setProgress] = useState<ChecklistProgress>({
    moduleId,
    completedTasks: [],
    totalTasks: 0,
    completionPercentage: 0,
    startedAt: new Date(),
    estimatedCompletion: null
  });

  const updateTaskProgress = useCallback(async (taskId: string, completed: boolean) => {
    const updatedProgress = {
      ...progress,
      completedTasks: completed 
        ? [...progress.completedTasks, taskId]
        : progress.completedTasks.filter(id => id !== taskId),
      completionPercentage: calculatePercentage(progress.totalTasks, completedCount)
    };
    
    setProgress(updatedProgress);
    
    // Persistir no localStorage e/ou API
    await saveChecklistProgress(moduleId, updatedProgress);
  }, [progress, moduleId]);

  return {
    progress,
    updateTaskProgress,
    exportReport: () => generateProgressReport(progress)
  };
};
```

**Tarefas**:
- [ ] Implementar hook `useChecklistProgress`
- [ ] Persistir progresso no localStorage
- [ ] Métricas de conclusão e tempo estimado
- [ ] Exportar relatório de implementação (PDF/Markdown)
- [ ] Dashboard de progresso visual

### **📋 Sprint 3.2 - Sistema de Tags (Opcional)** (5 dias)

#### **Se Houver Tempo Disponível:**

**Problema**: Tags "Em breve" desabilitado (`BasicConfigStep:484`)

**Solução**:
```typescript
// TagsInput.tsx - Componente de tags
const TagsInput = ({ 
  value = [], 
  onChange, 
  suggestions = [] 
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag: string) => {
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const filteredSuggestions = suggestions.filter(
    suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 mb-2">
        {value.map(tag => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <X 
              className="h-3 w-3 cursor-pointer hover:text-red-500" 
              onClick={() => removeTag(tag)}
            />
          </Badge>
        ))}
      </div>
      
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue) {
              e.preventDefault();
              addTag(inputValue);
            }
          }}
          placeholder="Digite uma tag e pressione Enter"
        />
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
            {filteredSuggestions.map(suggestion => (
              <button
                key={suggestion}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                onClick={() => addTag(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

**Tarefas (se houver tempo)**:
- [ ] Implementar componente `TagsInput` com autocomplete
- [ ] Sistema de tags reutilizáveis entre módulos
- [ ] Sugestões baseadas em histórico e categoria
- [ ] Filtros por tags na listagem de módulos
- [ ] Remover badge "Em breve" do BasicConfigStep

---

## 📊 **Métricas de Sucesso & Validação**

### **KPIs por Fase**

#### **Fase 1 - Métricas Técnicas**
- [ ] **0 duplicações de código** nas funcionalidades refatoradas
- [ ] **100% backward compatibility** com módulos existentes  
- [ ] **0 regressões** em testes existentes
- [ ] **-50% campos manuais** (8 → 4 campos obrigatórios)

#### **Fase 2 - Métricas UX**
- [ ] **-25% cliques** para completar wizard (mensurar com analytics)
- [ ] **-40% tempo médio** de conclusão (5min → 3min)
- [ ] **100% steps condicionais** funcionando corretamente
- [ ] **Preview em tempo real** em 100% dos campos aplicáveis

#### **Fase 3 - Métricas de Adoção**
- [ ] **>80% taxa de conclusão** do checklist
- [ ] **>90% satisfação** em survey pós-implementação
- [ ] **<2% taxa de abandono** no wizard
- [ ] **100% links funcionais** no checklist interativo

### **Validação Contínua**
- **Daily**: Testes automatizados + smoke tests
- **Semanal**: QA manual + métricas de uso
- **Por Fase**: User testing + feedback stakeholders

---

## 🔄 **Próximos Passos**

### **Pré-requisitos para Iniciar**
1. [ ] **Aprovação** do plano pelos stakeholders
2. [ ] **Definição da equipe** e responsibilities  
3. [ ] **Setup do ambiente** de desenvolvimento
4. [ ] **Comunicação** para usuários sobre melhorias futuras

### **Kickoff da Fase 1**
1. [ ] **Sprint Planning** detalhado da Fase 1
2. [ ] **Setup de monitoramento** e métricas
3. [ ] **Preparação do ambiente** (branch, backup, feature flags)
4. [ ] **Início da implementação** seguindo checklist

---

**📅 Cronograma Alvo**:
- **Semana 1-2**: Fase 1 (Eliminação de duplicações + auto-geração)
- **Semana 3-4**: Fase 2 (UX otimizada + fluxos condicionais) 
- **Semana 5-6**: Fase 3 (Checklist interativo + polish final)

**🎯 Meta Final**: Wizard V2 com 40% menos tempo de conclusão e experiência significativamente melhorada para desenvolvedores.
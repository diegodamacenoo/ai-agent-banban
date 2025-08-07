# ✅ Checklist de Implementação - Wizard V2

## 🎯 Como Usar Este Checklist

Este checklist é seu guia prático para implementar a refatoração do wizard passo-a-passo. Cada item deve ser marcado como concluído antes de prosseguir.

**Convenções**:
- ✅ **Concluído** - Item totalmente implementado e validado
- ⏳ **Em Progresso** - Item sendo trabalhado  
- ⏸️ **Pausado** - Item pausado temporariamente
- ❌ **Falhado** - Item falhou, requer atenção
- ⏭️ **Pulado** - Item pulado intencionalmente

---

## 🚀 **PRÉ-IMPLEMENTAÇÃO**

### **📋 Setup Inicial**
- [ ] **Validar ambiente de desenvolvimento**
  ```bash
  npm --version  # >= 8.x
  node --version # >= 18.x
  git --version  # >= 2.x
  ```
- [ ] **Executar testes atuais para baseline**
  ```bash
  npm run test
  npm run test:e2e
  npm run build
  ```
- [ ] **Criar backup e versionamento**
  ```bash
  git tag -a v1.0-wizard-stable -m "Wizard estável antes da refatoração"
  git push origin v1.0-wizard-stable
  ```
- [ ] **Criar branch principal da refatoração**
  ```bash
  git checkout -b feature/wizard-refactor-v2
  ```
- [ ] **Setup de feature flags**
  ```bash
  # Adicionar em .env.local
  echo "NEXT_PUBLIC_WIZARD_VERSION=v2" >> .env.local
  echo "NEXT_PUBLIC_ENABLE_WIZARD_V2=false" >> .env.local
  echo "NEXT_PUBLIC_WIZARD_DEBUG=true" >> .env.local
  ```

### **📊 Documentação e Tracking**
- [ ] **Configurar analytics/tracking para migração**
- [ ] **Criar dashboard de métricas** (opcional mas recomendado)
- [ ] **Setup de alertas** para métricas críticas
- [ ] **Notificar stakeholders** sobre início da implementação

---

## 📅 **FASE 1 - FUNDAÇÃO** (Semanas 1-2)

### **🔴 Sprint 1.1 - Eliminação de Duplicações** (5 dias)

#### **Dia 1: Preparação**
- [ ] **Criar sub-branch para Sprint 1.1**
  ```bash
  git checkout -b feature/phase1-remove-duplications
  ```
- [ ] **Documentar estado atual com screenshots**
  - [ ] Screenshot de cada step do wizard atual
  - [ ] Documentar campos duplicados identificados
- [ ] **Setup de testes específicos para duplicações**
  ```bash
  # Criar testes que falham se duplicações voltarem
  npm run test:watch -- --testNamePattern="duplicate"
  ```

#### **Dia 2-3: Implementar Toggle Único "Implementação Standard"**

**Arquivo**: `BasicConfigStep.tsx`
- [ ] **Manter toggle apenas em BasicConfigStep.tsx linha ~566**
  ```typescript
  // MANTER este código e remover de outros lugares
  <Switch
    checked={basicConfig.auto_create_standard}
    onCheckedChange={(checked) => updateBasicConfig('auto_create_standard', checked)}
  />
  ```
- [ ] **Remover toggle duplicado de ImplementationConfigStep.tsx**
  - [ ] Localizar e remover switch duplicado
  - [ ] Verificar dependências quebradas
  - [ ] Atualizar imports se necessário

**Arquivo**: `useModuleWizard.ts`
- [ ] **Adicionar lógica de propagação de decisão**
  ```typescript
  // Adicionar no updateConfig
  const updateConfig = useCallback((section: string, data: any) => {
    if (section === 'basic' && 'auto_create_standard' in data) {
      // Propagar decisão para próximos steps
      setState(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [section]: { ...prev.config[section], ...data },
          flow_config: {
            ...prev.config.flow_config,
            skip_implementation_config: data.auto_create_standard
          }
        }
      }));
    } else {
      // Lógica normal
      setState(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [section]: { ...prev.config[section], ...data }
        }
      }));
    }
  }, []);
  ```
- [ ] **Validar propagação funciona corretamente**
- [ ] **Testes unitários para toggle único**
  ```bash
  npm run test -- --testNamePattern="auto_create_standard"
  ```

#### **Dia 4: Testes e Validação Sprint 1.1**
- [ ] **Executar todos os testes**
  ```bash
  npm run test
  npm run test:e2e
  npm run lint
  ```
- [ ] **QA Manual completo**
  - [ ] Criar módulo Standard com toggle ON → verificar se pula implementation step
  - [ ] Criar módulo Standard com toggle OFF → verificar se mostra implementation step  
  - [ ] Criar módulo Custom → verificar comportamento normal
  - [ ] Verificar se dados são salvos corretamente
- [ ] **Performance check** 
  ```bash
  npm run build
  npm run analyze # se disponível
  ```
- [ ] **Code Review** e merge para branch principal
  ```bash
  git checkout feature/wizard-refactor-v2
  git merge feature/phase1-remove-duplications
  ```

#### **Dia 5: Buffer para Ajustes**
- [ ] **Corrigir bugs identificados** no dia 4
- [ ] **Documentar decisões** tomadas durante implementação
- [ ] **Atualizar testes** se necessário

### **🔴 Sprint 1.2 - Auto-geração de Identificadores** (5 dias)

#### **Dia 1: Preparação Auto-geração**
- [ ] **Criar sub-branch para Sprint 1.2**
  ```bash
  git checkout -b feature/phase1-auto-generation
  ```
- [ ] **Analisar função generateSlug atual** em BasicConfigStep.tsx linha ~125
- [ ] **Planejar estrutura de auto-geração**

#### **Dia 2-3: Implementar Auto-geração de Identificadores**

**Arquivo**: `BasicConfigStep.tsx`
- [ ] **Modificar generateSlug para generateIdentifiers**
  ```typescript
  // SUBSTITUIR generateSlug por esta função
  const generateIdentifiers = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const identifiers = {
      slug,
      implementation_key: `${slug}-impl`,
      component_path: `${slug}Implementation`
    };
    
    // Atualizar configuração
    updateBasicConfig('slug', slug);
    updateConfig('auto_generated', identifiers);
    
    return identifiers;
  };
  ```
- [ ] **Atualizar onChange do campo nome** para usar generateIdentifiers
- [ ] **Adicionar preview dos identificadores gerados**
  ```typescript
  // Adicionar após o campo slug
  {basicConfig.slug && (
    <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
      <strong>Auto-gerado:</strong>
      <br />• Chave implementação: <code>{basicConfig.slug}-impl</code>
      <br />• Componente: <code>{basicConfig.slug}Implementation</code>
    </div>
  )}
  ```

**Arquivo**: `ImplementationConfigStep.tsx`
- [ ] **Tornar implementation_key read-only com herança automática**
  ```typescript
  // SUBSTITUIR campo manual por campo herdado
  <FormField
    control={form.control}
    name="implementation_key"
    render={({ field }) => (
      <FormItem>
        <FormLabel className="flex items-center gap-2">
          Chave da Implementação
          <Badge variant="outline">Auto-gerado</Badge>
        </FormLabel>
        <FormControl>
          <div className="flex items-center gap-2">
            <Input 
              {...field} 
              disabled
              className="bg-gray-50"
              value={state.config.auto_generated?.implementation_key || ''}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomImplementationKey(true)}
            >
              Personalizar
            </Button>
          </div>
        </FormControl>
        <p className="text-xs text-muted-foreground">
          Gerado automaticamente baseado no nome do módulo
        </p>
      </FormItem>
    )}
  />
  ```
- [ ] **Implementar lógica de personalização opcional**
- [ ] **Tornar component_path read-only similar**

#### **Dia 3-4: Implementar Versão Unificada**

**Arquivo**: `BasicConfigStep.tsx`
- [ ] **Manter campo versão principal**
- [ ] **Propagar versão para implementation automaticamente**
  ```typescript
  // No onChange da versão
  onChange={(e) => {
    const newVersion = e.target.value;
    updateBasicConfig('version', newVersion);
    // Propagar para implementação
    updateConfig('implementation', { version: newVersion });
  }}
  ```

**Arquivo**: `ImplementationConfigStep.tsx`  
- [ ] **Mostrar versão como herdada**
  ```typescript
  <FormField
    control={form.control}
    name="version"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Versão da Implementação</FormLabel>
        <FormControl>
          <div className="flex items-center gap-2">
            <Input
              {...field}
              disabled
              className="bg-gray-50"
              value={state.config.basic?.version || '1.0.0'}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomVersion(true)}
            >
              Personalizar
            </Button>
          </div>
        </FormControl>
        <p className="text-xs text-muted-foreground">
          Herdada automaticamente do módulo base
        </p>
      </FormItem>
    )}
  />
  ```
- [ ] **Implementar personalização opcional de versão**

#### **Dia 4: Validação Auto-geração**
- [ ] **Testes para auto-geração**
  - [ ] Teste: nome → slug correto
  - [ ] Teste: slug → implementation_key correto
  - [ ] Teste: slug → component_path correto
  - [ ] Teste: personalização funciona
- [ ] **Validação de unicidade** de slug via API (se aplicável)
- [ ] **Testes de herança de versão**

#### **Dia 5: Integração e Merge Sprint 1.2**
- [ ] **Verificar compatibilidade** com server actions
- [ ] **Executar suite completa de testes**
- [ ] **QA manual completo** incluindo:
  - [ ] Auto-geração funciona para diferentes nomes
  - [ ] Personalização opcional funciona
  - [ ] Versão é herdada corretamente
  - [ ] Módulos são criados com identificadores corretos
- [ ] **Merge para branch principal**
  ```bash
  git checkout feature/wizard-refactor-v2
  git merge feature/phase1-auto-generation
  ```

### **📊 Checkpoint Fase 1**
- [ ] **Executar todos os testes** antes de continuar
  ```bash
  npm run test
  npm run test:e2e
  npm run build
  ```
- [ ] **Validar métricas de sucesso Fase 1**:
  - [ ] ✅ 0 duplicações de código removidas
  - [ ] ✅ Campos manuais reduzidos (8 → ~5)
  - [ ] ✅ 100% backward compatibility
  - [ ] ✅ 0 regressões identificadas
- [ ] **Go/No-Go Decision** para Fase 2
  - [ ] Se todos os critérios ✅ → continuar para Fase 2
  - [ ] Se algum critério ❌ → resolver antes de continuar

---

## 📅 **FASE 2 - OTIMIZAÇÃO UX** (Semanas 3-4)

### **🟡 Sprint 2.1 - Steps Condicionais** (5 dias)

#### **Dia 1: Preparação Lógica Condicional**
- [ ] **Criar branch para Sprint 2.1**
  ```bash
  git checkout -b feature/phase2-conditional-steps
  ```
- [ ] **Analisar isStepVisible atual** em wizard-steps.ts
- [ ] **Planejar lógica condicional por tipo de módulo**

#### **Dia 2-3: Implementar Lógica Condicional**

**Arquivo**: `wizard-steps.ts`
- [ ] **Modificar isStepVisible para lógica condicional**
  ```typescript
  export function isStepVisible(stepId: WizardStep, moduleType?: 'standard' | 'custom', config?: ModuleCreationConfig): boolean {
    switch (stepId) {
      case 'client-config':
        // ClientConfig só para módulos Custom
        return moduleType === 'custom';
        
      case 'implementation-config':
        // Pular se auto_create_standard = true para Standard modules
        if (moduleType === 'standard' && config?.basic?.auto_create_standard) {
          return false;
        }
        return true;
        
      default:
        return true;
    }
  }
  ```
- [ ] **Implementar getVisibleSteps função auxiliar**
- [ ] **Atualizar getEffectiveStepIndex para lógica dinâmica**
- [ ] **Atualizar getTotalVisibleSteps para contagem dinâmica**

**Arquivo**: `useModuleWizard.ts`
- [ ] **Implementar progress calculation dinâmico**
  ```typescript
  const effectiveProgress = useMemo(() => {
    const moduleType = state.config.type;
    const config = state.config;
    const visibleSteps = WIZARD_STEPS.filter(step => 
      isStepVisible(step.id, moduleType, config)
    );
    const totalVisible = visibleSteps.length;
    const currentIndex = visibleSteps.findIndex(step => 
      step.id === state.currentStep
    );
    
    return {
      currentStepIndex: Math.max(0, currentIndex),
      totalSteps: totalVisible,
      percentage: totalVisible > 0 ? Math.round((currentIndex / (totalVisible - 1)) * 100) : 0
    };
  }, [state.currentStep, state.config.type, state.config.basic?.auto_create_standard]);
  ```
- [ ] **Implementar navegação inteligente (pular steps não aplicáveis)**

#### **Dia 3: Implementar Fluxo Standard Simplificado**

**Arquivo**: `ReviewCreateStep.tsx`
- [ ] **Auto-criação de implementação para Standard modules**
  ```typescript
  const handleCreateStandardModule = async () => {
    try {
      // 1. Criar base module
      const baseModuleResult = await createBaseModule(baseModuleData);
      
      // 2. Se auto_create_standard = true, criar implementação automaticamente  
      if (config.basic?.auto_create_standard) {
        const implementationData = {
          base_module_id: baseModuleResult.data.id,
          name: `${config.basic.name} - Implementação Padrão`,
          implementation_key: config.auto_generated?.implementation_key || `${config.basic.slug}-impl`,
          component_path: config.auto_generated?.component_path || `${config.basic.slug}Implementation`,
          is_default: true,
          audience: 'generic'
        };
        
        const implResult = await createModuleImplementation(implementationData);
        updateConfig('auto_created_implementation', implResult.data);
        
        // Pular para checklist (skip client-config e implementation-config)
        goToStep('checklist');
      } else {
        // Fluxo normal
        nextStep();
      }
      
    } catch (error) {
      setError(error.message);
    }
  };
  ```

**Arquivo**: `ClientConfigStep.tsx`
- [ ] **Adicionar lógica para mostrar apenas para Custom modules**
  ```typescript
  // No início do componente
  const { moduleType } = useModuleWizardContext();
  
  if (moduleType === 'standard') {
    return (
      <div className="text-center space-y-4">
        <div className="text-muted-foreground">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">Step Automático</h3>
          <p>Para módulos Standard, a configuração de cliente é feita automaticamente.</p>
        </div>
        <Button onClick={() => nextStep()} variant="outline">
          Continuar para Checklist
        </Button>
      </div>
    );
  }
  ```

#### **Dia 4-5: Testes e Validação Sprint 2.1**
- [ ] **Testes para fluxo Standard**
  - [ ] Criar módulo Standard → verifica se pula steps corretos
  - [ ] Verifica se implementação é criada automaticamente
  - [ ] Verifica se vai direto para checklist
- [ ] **Testes para fluxo Custom**  
  - [ ] Criar módulo Custom → verifica se mostra todos os steps
  - [ ] Verifica navegação normal
- [ ] **Testes para progress bar dinâmico**
- [ ] **QA manual completo de ambos os fluxos**

### **🟡 Sprint 2.2 - Interface Melhorada** (5 dias)

#### **Dia 1: Criar Preview Component**
- [ ] **Criar arquivo StructurePreview.tsx**
  ```bash
  touch src/app/\(protected\)/admin/modules/development/components/shared/StructurePreview.tsx
  ```
- [ ] **Implementar StructurePreview component**
  ```typescript
  interface StructurePreviewProps {
    config: BasicModuleConfig;
    realTime?: boolean;
  }

  export const StructurePreview = ({ config, realTime = true }: StructurePreviewProps) => {
    const routePattern = config.route_pattern || 'auto-detect';
    const componentPath = config.auto_generated?.component_path || `${config.slug}Implementation`;
    
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <h4 className="font-medium flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-blue-600" />
            Estrutura que será criada
          </h4>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* File structure tree */}
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
          
          {/* URL preview */}
          <div className="space-y-2">
            <h5 className="font-medium text-sm">URL do módulo:</h5>
            <div className="bg-white p-2 rounded border font-mono text-xs">
              /{'{tenant}'}/{routePattern}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  ```

#### **Dia 2-3: Implementar Accordion para Configurações Avançadas**

**Arquivo**: `BasicConfigStep.tsx`
- [ ] **Instalar/verificar Collapsible component**
  ```typescript
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible';
  ```
- [ ] **Refatorar seção de configurações avançadas (linhas ~511-578)**
  ```typescript
  // SUBSTITUIR a seção atual por:
  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
    <CollapsibleTrigger asChild>
      <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="font-medium">Configurações Avançadas</span>
              <Badge variant="outline" className="ml-2">
                {getAdvancedConfigCount()} opções
              </Badge>
            </div>
            <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-tenant, tags, route pattern personalizado
          </p>
        </CardContent>
      </Card>
    </CollapsibleTrigger>
    
    <CollapsibleContent>
      <Card className="mt-2">
        <CardContent className="p-6 space-y-4">
          {/* Mover multi-tenant, route_pattern, tags, etc. para cá */}
        </CardContent>
      </Card>
    </CollapsibleContent>
  </Collapsible>
  ```
- [ ] **Implementar getAdvancedConfigCount helper**
- [ ] **Manter estado do accordion durante navegação**

#### **Dia 3-4: Integrar Preview em Tempo Real**

**Arquivo**: `BasicConfigStep.tsx`
- [ ] **Modificar layout para incluir preview**
  ```typescript
  return (
    <div className="space-y-6">
      {/* Header */}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Formulário atual */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Essenciais</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Campos básicos */}
            </CardContent>
          </Card>
          
          {/* Configurações Avançadas em Accordion */}
        </div>
        
        <div className="lg:col-span-1">
          <StructurePreview config={basicConfig} />
        </div>
      </div>
    </div>
  );
  ```
- [ ] **Adicionar validações visuais em tempo real**
  ```typescript
  // Exemplo de validação de slug duplicado
  const [slugValidation, setSlugValidation] = useState<'valid' | 'invalid' | 'checking'>('valid');
  
  const checkSlugUniqueness = debounce(async (slug: string) => {
    if (!slug) return;
    
    setSlugValidation('checking');
    try {
      const isUnique = await validateSlugUniqueness(slug);
      setSlugValidation(isUnique ? 'valid' : 'invalid');
    } catch {
      setSlugValidation('valid'); // Assume válido se API falhar
    }
  }, 500);
  ```

#### **Dia 4-5: Testes e Polish Sprint 2.2**
- [ ] **Testes de interface**
  - [ ] Accordion abre/fecha corretamente
  - [ ] Preview atualiza em tempo real
  - [ ] Layout responsivo funciona
- [ ] **Testes de acessibilidade**
  - [ ] Keyboard navigation no accordion
  - [ ] Screen reader compatibility
- [ ] **Performance check**
  - [ ] Preview não causa lag durante digitação
  - [ ] Componentes são memoizados adequadamente
- [ ] **Browser compatibility**
  - [ ] Chrome, Firefox, Safari, Edge

### **📊 Checkpoint Fase 2**
- [ ] **Validar métricas de sucesso Fase 2**:
  - [ ] ✅ Steps condicionais funcionando 100%
  - [ ] ✅ Preview em tempo real operacional  
  - [ ] ✅ Accordion para configurações avançadas
  - [ ] ✅ -25% cliques para completar wizard
  - [ ] ✅ Tempo médio reduzido significativamente
- [ ] **Merge final da Fase 2**
  ```bash
  git checkout feature/wizard-refactor-v2
  git merge feature/phase2-conditional-steps
  git merge feature/phase2-interface-improvements
  ```

---

## 📅 **FASE 3 - REFINAMENTOS** (Semanas 5-6)

### **🟢 Sprint 3.1 - Checklist Interativo** (5 dias)

#### **Dia 1: Criar Interactive Checklist Component**
- [ ] **Criar arquivo InteractiveChecklistItem.tsx**
  ```bash
  touch src/app/\(protected\)/admin/modules/development/components/checklist/InteractiveChecklistItem.tsx
  ```
- [ ] **Implementar interfaces e tipos**
  ```typescript
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
  ```

#### **Dia 2-3: Implementar Interactive Features**
- [ ] **Implementar InteractiveChecklistItem component**
- [ ] **Adicionar VS Code integration**
  ```typescript
  const handleAction = (task: ChecklistTask) => {
    switch (task.actionType) {
      case 'open-folder':
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
  ```
- [ ] **Criar useChecklistProgress hook**
  ```bash
  touch src/app/\(protected\)/admin/modules/development/hooks/useChecklistProgress.ts
  ```

#### **Dia 3-4: Implementar Progress Tracking**

**Arquivo**: `useChecklistProgress.ts`
- [ ] **Implementar hook de tracking**
  ```typescript
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
      // Atualizar progress
      // Persistir no localStorage
      // Calcular estimativas
    }, []);

    return { progress, updateTaskProgress, exportReport };
  };
  ```

**Arquivo**: `ChecklistStep.tsx`
- [ ] **Integrar InteractiveChecklistItem**
- [ ] **Adicionar progress tracking**
- [ ] **Implementar export de relatório**

#### **Dia 5: Testes Checklist Interativo**
- [ ] **Testes de funcionalidade**
  - [ ] Cliques em links funcionam
  - [ ] Progress é salvo corretamente
  - [ ] Export de relatório funciona
- [ ] **Testes de integração**
  - [ ] VS Code integration (se possível)
  - [ ] LocalStorage persistence

### **🟢 Sprint 3.2 - Tags e Polish Final** (5 dias)

#### **Dia 1-2: Implementar Sistema de Tags (Opcional)**

**SE HOUVER TEMPO:**
- [ ] **Criar TagsInput component**
  ```bash
  touch src/app/\(protected\)/admin/modules/development/components/shared/TagsInput.tsx
  ```
- [ ] **Implementar autocomplete de tags**
- [ ] **Sistema de tags reutilizáveis**
- [ ] **Remover badge "Em breve" de BasicConfigStep linha ~484**

#### **Dia 3-4: Polish Final e Otimizações**
- [ ] **Performance optimizations**
  - [ ] Verificar memoização adequada
  - [ ] Otimizar re-renders
  - [ ] Bundle size check
- [ ] **Accessibility final check**
  - [ ] WCAG compliance
  - [ ] Keyboard navigation
  - [ ] Screen reader testing
- [ ] **Mobile responsiveness**
  - [ ] Testar em diferentes screen sizes
  - [ ] Touch interactions
- [ ] **Browser compatibility final**

#### **Dia 5: Testes Completos Fase 3**
- [ ] **Executar suite completa de testes**
  ```bash
  npm run test
  npm run test:e2e
  npm run build
  npm run lint
  ```
- [ ] **User acceptance testing**
  - [ ] Teste com desenvolvedores internos
  - [ ] Coletar feedback
  - [ ] Fazer ajustes finais

---

## 🎯 **VALIDAÇÃO FINAL E DEPLOY**

### **📊 Métricas de Sucesso Final**
- [ ] **Métricas Quantitativas**
  - [ ] ✅ Tempo médio < 3min (target: reduction from ~5min)
  - [ ] ✅ Taxa de abandono < 10% 
  - [ ] ✅ Cliques reduzidos -25% ou mais
  - [ ] ✅ Campos manuais -50% (8 → 4)
  - [ ] ✅ Taxa de erro < 2%

- [ ] **Métricas Qualitativas**
  - [ ] ✅ User satisfaction > 4.0/5
  - [ ] ✅ Task success rate > 90%
  - [ ] ✅ 0 critical bugs
  - [ ] ✅ Performance mantida ou melhorada

### **🚀 Preparação para Deploy**
- [ ] **Feature flag para rollout gradual**
  ```typescript
  // Configurar rollout gradual
  const getUserWizardVersion = (userId: string): 'v1' | v2' => {
    if (BETA_USERS.includes(userId)) return 'v2';
    if (process.env.NEXT_PUBLIC_WIZARD_ROLLOUT === '25') {
      return hashUserId(userId) % 4 === 0 ? 'v2' : 'v1';
    }
    return 'v1';
  };
  ```
- [ ] **Monitoring e alertas configurados**
- [ ] **Rollback plan testado e ready**
- [ ] **Documentação atualizada**
  - [ ] User documentation
  - [ ] Developer documentation  
  - [ ] API changes (if any)

### **📢 Go-Live**
- [ ] **Deploy para staging**
- [ ] **QA final em staging**  
- [ ] **Stakeholder approval**
- [ ] **Deploy para production com 0% rollout**
- [ ] **Rollout gradual**: 0% → 10% → 25% → 50% → 100%
- [ ] **Monitoring de métricas em cada step**

### **🎉 Post-Deploy**
- [ ] **Monitorar métricas por 48h**
- [ ] **Coletar feedback dos usuários**
- [ ] **Address any issues identificadas**
- [ ] **Celebrar o sucesso! 🎉**

---

## 📝 **Notas e Observações**

### **⏰ Estimativas de Tempo**
- **Fase 1**: 2 semanas (10 dias úteis)
- **Fase 2**: 2 semanas (10 dias úteis)  
- **Fase 3**: 2 semanas (10 dias úteis)
- **Total**: 6 semanas + buffer

### **🚨 Itens Críticos**
- [ ] ⚠️ **Server actions compatibility** - Testar extensivamente
- [ ] ⚠️ **Data integrity** - Validar que módulos são criados corretamente
- [ ] ⚠️ **Performance** - Não pode degradar significativamente
- [ ] ⚠️ **Rollback plan** - Deve estar sempre pronto

### **🔧 Tools e Scripts Úteis**
```bash
# Tests focused no wizard
npm run test -- --testPathPattern=wizard

# E2E tests específicos
npm run test:e2e -- --grep="wizard"

# Build e análise de bundle
npm run build && npm run analyze

# Lint específico para arquivos modificados
npx eslint src/app/\(protected\)/admin/modules/development/

# Quick smoke test
curl -f http://localhost:3000/api/health-check
```

### **📞 Contatos de Apoio**
- **Tech Lead**: [Nome] - [Contato]
- **Product Owner**: [Nome] - [Contato]
- **QA Lead**: [Nome] - [Contato]
- **DevOps**: [Nome] - [Contato]

---

**✅ CHECKLIST COMPLETO!** 

Este checklist deve ser usado como um guia vivo durante a implementação. Marque cada item conforme completado e ajuste conforme necessário baseado em descobertas durante o desenvolvimento.

**🎯 Objetivo Final**: Wizard V2 funcionando perfeitamente com experiência significativamente melhorada para desenvolvedores criando módulos.
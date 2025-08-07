# 🔍 Sistema de Validação Estrutural - Especificação Técnica

**Arquivo:** STRUCTURAL_VALIDATION_SYSTEM.md  
**Versão:** 1.0.0  
**Data:** 01/08/2025  

---

## 📋 Visão Geral

O Sistema de Validação Estrutural é o núcleo da nova página de desenvolvimento, responsável por verificar em tempo real se um módulo possui todos os arquivos, pastas e configurações necessárias para funcionamento adequado.

---

## 🏗️ Arquitetura do Sistema

### **Componentes Principais:**

```typescript
// Core validation types
interface StructuralValidator {
  id: string;
  name: string;
  description: string;
  category: ValidationCategory;
  rules: ValidationRule[];
  dependencies?: string[];
  autoFix?: AutoFixConfig;
}

interface ValidationRule {
  type: 'file' | 'folder' | 'content' | 'schema' | 'dependency';
  path: string;
  condition: string | RegExp | ((content: any) => boolean);
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  documentation?: string;
}

interface ValidationResult {
  validatorId: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  message?: string;
  details?: ValidationDetail[];
  timestamp: Date;
  autoFixApplied?: boolean;
}
```

---

## 📂 Estrutura de Validações por Tipo de Módulo

### **Standard Module - Checklist Estrutural:**

#### **🗂️ Categoria: Arquivos Obrigatórios**
- [ ] **`module.json`** - Manifesto do módulo
  - ✅ Arquivo existe
  - ✅ Schema JSON válido
  - ✅ Campos obrigatórios preenchidos
  - ✅ Versioning semântico
  
- [ ] **`README.md`** - Documentação principal
  - ✅ Arquivo existe
  - ✅ Seções obrigatórias presentes
  - ✅ Exemplos de uso incluídos
  - ✅ Links funcionais

- [ ] **`types/index.ts`** - Definições TypeScript
  - ✅ Arquivo existe
  - ✅ Exports principais definidos
  - ✅ Schemas Zod implementados
  - ✅ Interfaces documentadas

#### **📁 Categoria: Estrutura de Pastas**
- [ ] **`/services/`** - Lógica de negócio
  - ✅ Pasta existe
  - ✅ Contém service principal
  - ✅ Validators implementados
  - ✅ Cache configurado

- [ ] **`/components/`** - Componentes React (se aplicável)
  - ✅ Pasta existe (se module tem UI)
  - ✅ Widget component implementado
  - ✅ Config component implementado
  - ✅ Index exports definidos

- [ ] **`/tests/`** - Testes automatizados
  - ✅ Pasta existe
  - ✅ Tests unitários presentes
  - ✅ Coverage mínimo atingido
  - ✅ Integration tests implementados

#### **⚙️ Categoria: Configurações**
- [ ] **Package.json dependencies**
  - ✅ Dependências obrigatórias instaladas
  - ✅ Versões compatíveis
  - ✅ Dev dependencies apropriadas
  - ✅ Scripts necessários definidos

- [ ] **TypeScript configuration**
  - ✅ tsconfig.json válido
  - ✅ Strict mode habilitado
  - ✅ Path mapping configurado
  - ✅ Types resolution funcionando

#### **🔌 Categoria: Integrações**
- [ ] **Supabase integration**
  - ✅ Database types atualizados
  - ✅ RLS policies definidas
  - ✅ Migrations presentes
  - ✅ Client configuration válida

- [ ] **Module registry**
  - ✅ Module registrado no sistema
  - ✅ Implementation path válido
  - ✅ Dependencies resolvidas
  - ✅ Health check endpoint

---

### **Custom Module - Checklist Adicional:**

#### **🎯 Categoria: Client-Specific**
- [ ] **Client namespace**
  - ✅ Pasta no diretório correto (`/modules/{client}/`)
  - ✅ Naming convention seguida
  - ✅ Client-specific configurations
  - ✅ Audience targeting configurado

- [ ] **Third-party integrations**
  - ✅ API endpoints documentados
  - ✅ Authentication configured
  - ✅ Error handling implementado
  - ✅ Rate limiting configurado

- [ ] **Custom database schema**
  - ✅ Tables prefixed with client slug
  - ✅ RLS policies client-specific
  - ✅ Indexes otimizados
  - ✅ Migrations versionadas

#### **💰 Categoria: Billing & Usage**
- [ ] **Usage tracking**
  - ✅ Metrics collection implementada
  - ✅ Usage limits configurados
  - ✅ Billing integration ready
  - ✅ Overage handling definido

- [ ] **Premium features**
  - ✅ Feature flags implementadas
  - ✅ Access control configurado
  - ✅ Graceful degradation
  - ✅ Upgrade prompts implementados

---

## 🔧 Implementação Técnica

### **1. Validation Engine Core:**

```typescript
// core/validation/ValidationEngine.ts
export class StructuralValidationEngine {
  private validators: Map<string, StructuralValidator> = new Map();
  private cache: Map<string, ValidationResult[]> = new Map();
  
  async validateModule(modulePath: string, moduleType: 'standard' | 'custom'): Promise<ValidationSummary> {
    const validators = this.getValidatorsForType(moduleType);
    const results: ValidationResult[] = [];
    
    for (const validator of validators) {
      const result = await this.runValidator(validator, modulePath);
      results.push(result);
      
      // Apply auto-fix if available and configured
      if (result.status === 'failed' && validator.autoFix?.enabled) {
        const fixResult = await this.applyAutoFix(validator.autoFix, modulePath);
        if (fixResult.success) {
          result.autoFixApplied = true;
          result.status = 'passed';
        }
      }
    }
    
    return this.generateSummary(results);
  }
  
  private async runValidator(validator: StructuralValidator, modulePath: string): Promise<ValidationResult> {
    // Implementation for each validation rule
  }
  
  private async applyAutoFix(autoFix: AutoFixConfig, modulePath: string): Promise<AutoFixResult> {
    // Implementation for automatic fixes
  }
}
```

### **2. Real-time File System Monitoring:**

```typescript
// hooks/useStructuralValidation.ts
export function useStructuralValidation(modulePath: string, moduleType: 'standard' | 'custom') {
  const [validationResults, setValidationResults] = useState<ValidationSummary | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // File system watcher
  useEffect(() => {
    const watcher = new FileSystemWatcher(modulePath, {
      ignoreInitial: false,
      persistent: true,
      ignorePatterns: ['node_modules/**', '.git/**', 'dist/**']
    });
    
    const debounced = debounce(async () => {
      setIsValidating(true);
      const results = await ValidationEngine.validateModule(modulePath, moduleType);
      setValidationResults(results);
      setIsValidating(false);
    }, 1000);
    
    watcher.on('change', debounced);
    watcher.on('add', debounced);
    watcher.on('unlink', debounced);
    
    return () => watcher.close();
  }, [modulePath, moduleType]);
  
  return { validationResults, isValidating };
}
```

### **3. UI Components:**

```typescript
// components/StructuralValidationPanel.tsx
export function StructuralValidationPanel({ modulePath, moduleType }: Props) {
  const { validationResults, isValidating } = useStructuralValidation(modulePath, moduleType);
  
  if (!validationResults) return <ValidationSkeleton />;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Validação Estrutural</CardTitle>
          <ValidationStatusBadge 
            status={validationResults.overallStatus}
            score={validationResults.score}
          />
        </div>
        <ProgressBar 
          current={validationResults.passedCount} 
          total={validationResults.totalCount}
          className="mt-2"
        />
      </CardHeader>
      
      <CardContent>
        <ValidationCategories categories={validationResults.categories} />
      </CardContent>
    </Card>
  );
}

// components/ValidationCategories.tsx
export function ValidationCategories({ categories }: { categories: ValidationCategory[] }) {
  return (
    <Accordion type="multiple" defaultValue={["files", "folders"]}>
      {categories.map(category => (
        <AccordionItem key={category.id} value={category.id}>
          <AccordionTrigger>
            <div className="flex items-center gap-3">
              <CategoryIcon category={category.type} />
              <span>{category.name}</span>
              <ValidationBadge 
                passed={category.passedCount} 
                total={category.totalCount} 
              />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ValidationRulesList rules={category.rules} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

---

## 📊 Validadores Específicos por Categoria

### **File Validators:**

```typescript
const FILE_VALIDATORS: StructuralValidator[] = [
  {
    id: 'module-manifest',
    name: 'Module Manifest',
    description: 'Verificar se module.json existe e é válido',
    category: 'files',
    rules: [
      {
        type: 'file',
        path: 'module.json',
        condition: 'exists',
        severity: 'error',
        message: 'Arquivo module.json é obrigatório',
        suggestion: 'Criar arquivo module.json baseado no template',
        documentation: 'context/04-development/templates/README.md#module-json'
      },
      {
        type: 'content',
        path: 'module.json',
        condition: (content) => {
          try {
            const manifest = JSON.parse(content);
            return ModuleManifestSchema.parse(manifest);
          } catch {
            return false;
          }
        },
        severity: 'error',
        message: 'module.json possui formato inválido',
        suggestion: 'Validar JSON e campos obrigatórios'
      }
    ],
    autoFix: {
      enabled: true,
      action: 'generateFromTemplate',
      template: 'module.json.template'
    }
  },
  
  {
    id: 'readme-documentation',
    name: 'README Documentation',
    description: 'Verificar documentação principal do módulo',
    category: 'files',
    rules: [
      {
        type: 'file',
        path: 'README.md',
        condition: 'exists',
        severity: 'error',
        message: 'README.md é obrigatório para documentação',
        suggestion: 'Criar README.md baseado no template'
      },
      {
        type: 'content',
        path: 'README.md',
        condition: /^# .+\n\n.*installation.*\n\n.*usage.*\n\n.*api/im,
        severity: 'warning',
        message: 'README.md deve conter seções: Installation, Usage, API',
        suggestion: 'Adicionar seções obrigatórias ao README'
      }
    ]
  }
];
```

### **Folder Validators:**

```typescript
const FOLDER_VALIDATORS: StructuralValidator[] = [
  {
    id: 'services-structure',
    name: 'Services Structure',
    description: 'Verificar estrutura da pasta services',
    category: 'folders',
    rules: [
      {
        type: 'folder',
        path: 'services',
        condition: 'exists',
        severity: 'error',
        message: 'Pasta services/ é obrigatória',
        suggestion: 'Criar pasta services/ com estrutura básica'
      },
      {
        type: 'file',
        path: 'services/index.ts',
        condition: 'exists',
        severity: 'error',
        message: 'services/index.ts deve exportar service principal'
      },
      {
        type: 'content',
        path: 'services/index.ts',
        condition: /export.*Service.*from/,
        severity: 'warning',
        message: 'index.ts deve exportar o service principal'
      }
    ],
    autoFix: {
      enabled: true,
      action: 'createFromTemplate',
      template: 'services-structure'
    }
  }
];
```

### **Integration Validators:**

```typescript
const INTEGRATION_VALIDATORS: StructuralValidator[] = [
  {
    id: 'supabase-integration',
    name: 'Supabase Integration',
    description: 'Verificar integração com Supabase',
    category: 'integrations',
    rules: [
      {
        type: 'dependency',
        path: 'package.json',
        condition: (pkg) => pkg.dependencies?.['@supabase/supabase-js'],
        severity: 'error',
        message: '@supabase/supabase-js é dependência obrigatória'
      },
      {
        type: 'file',
        path: 'migrations',
        condition: 'folderHasFiles',
        severity: 'warning',
        message: 'Migrações SQL recomendadas se módulo usa banco'
      }
    ]
  },
  
  {
    id: 'custom-module-integrations',
    name: 'Custom Module Integrations',
    description: 'Verificar integrações específicas para módulos custom',
    category: 'integrations',
    rules: [
      {
        type: 'file',
        path: 'integrations/api-config.json',
        condition: 'exists',
        severity: 'error',
        message: 'Módulos custom devem ter configuração de API'
      },
      {
        type: 'content',
        path: 'integrations/api-config.json',
        condition: (content) => {
          const config = JSON.parse(content);
          return config.endpoints && config.authentication;
        },
        severity: 'error',
        message: 'API config deve ter endpoints e authentication'
      }
    ]
  }
];
```

---

## ⚡ Sistema de Auto-Fix

### **Auto-Fix Capabilities:**

```typescript
interface AutoFixConfig {
  enabled: boolean;
  action: 'generateFromTemplate' | 'createFromTemplate' | 'updateContent' | 'installDependency';
  template?: string;
  content?: string;
  dependencies?: string[];
  confirmationRequired?: boolean;
}

class AutoFixEngine {
  async applyFix(fix: AutoFixConfig, modulePath: string, rule: ValidationRule): Promise<AutoFixResult> {
    switch (fix.action) {
      case 'generateFromTemplate':
        return this.generateFromTemplate(fix.template!, modulePath);
        
      case 'createFromTemplate':
        return this.createFromTemplate(fix.template!, modulePath);
        
      case 'updateContent':
        return this.updateContent(rule.path, fix.content!, modulePath);
        
      case 'installDependency':
        return this.installDependencies(fix.dependencies!, modulePath);
    }
  }
  
  private async generateFromTemplate(templateName: string, modulePath: string): Promise<AutoFixResult> {
    const template = await this.loadTemplate(templateName);
    const variables = await this.extractVariables(modulePath);
    const content = await this.replaceVariables(template, variables);
    
    // Write generated content to appropriate file
    await this.writeFile(path.join(modulePath, templateName.replace('.template', '')), content);
    
    return { success: true, message: `Generated ${templateName} successfully` };
  }
}
```

---

## 🎨 Interface de Usuário

### **Visual Design Specifications:**

#### **Validation Status Colors:**
- 🟢 **Success (Passed)**: `text-green-600 bg-green-50 border-green-200`
- 🟡 **Warning**: `text-yellow-600 bg-yellow-50 border-yellow-200`
- 🔴 **Error (Failed)**: `text-red-600 bg-red-50 border-red-200`
- ⚫ **Pending/Unknown**: `text-gray-600 bg-gray-50 border-gray-200`

#### **Progress Indicators:**
- **Overall Progress Bar**: Full width with percentage and count
- **Category Progress**: Mini progress bars for each category
- **Individual Rule Status**: Checkmarks, warnings, error icons

#### **Interactive Elements:**
- **Expandable Details**: Click to see full validation details
- **Auto-Fix Buttons**: One-click fixes for supported rules
- **Documentation Links**: Direct links to relevant docs
- **Refresh Button**: Manual re-validation trigger

---

## 📈 Performance Considerations

### **Optimization Strategies:**

1. **Caching**: Cache validation results until files change
2. **Debouncing**: Debounce file system events (1s delay)
3. **Lazy Loading**: Load validators only when needed
4. **Batching**: Batch similar validations together
5. **Worker Threads**: Heavy validations in background

### **Resource Management:**

```typescript
// Validation throttling to prevent overload
const VALIDATION_THROTTLE = {
  maxConcurrent: 3,
  debounceMs: 1000,
  cacheTimeout: 5 * 60 * 1000 // 5 minutes
};

// Memory management for large modules
const MEMORY_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesToScan: 1000,
  maxCacheEntries: 100
};
```

---

## 🧪 Testing Strategy

### **Unit Tests:**
- Individual validator functions
- Auto-fix implementations
- Schema validations
- Error handling

### **Integration Tests:**
- Full validation workflows
- File system monitoring
- UI component interactions
- Real module validation

### **Performance Tests:**
- Large module validation
- Concurrent validation requests
- Memory usage monitoring
- Response time benchmarks

---

**Este sistema de validação estrutural será o coração da nova experiência de desenvolvimento, fornecendo feedback imediato e acionável para garantir que todos os módulos sigam as melhores práticas e padrões estabelecidos.**
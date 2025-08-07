# 🔄 Guia de Migração e Rollback - Wizard de Criação de Módulos

## 🎯 Visão Geral

Este guia fornece instruções detalhadas para executar a migração do wizard de criação de módulos de forma segura, incluindo estratégias de rollback e planos de contingência para cada fase.

---

## 🚀 **Preparação Pré-Migração**

### **1. Backup e Versionamento**

```bash
# 1. Criar tag do estado atual (OBRIGATÓRIO)
git tag -a v1.0-wizard-stable -m "Wizard estável antes da refatoração - $(date)"
git push origin v1.0-wizard-stable

# 2. Backup completo dos arquivos críticos
mkdir -p backups/wizard-v1
cp -r src/app/\(protected\)/admin/modules/development/ backups/wizard-v1/
cp -r src/app/\(protected\)/admin/modules/contexts/ backups/wizard-v1/

# 3. Documentar estado atual
npm run test -- --coverage --testPathPattern=wizard
npm run build # Verificar que build está funcionando
```

### **2. Environment Setup**

```bash
# Feature flags para controlar rollout
# .env.local
NEXT_PUBLIC_WIZARD_VERSION=v2
NEXT_PUBLIC_ENABLE_WIZARD_V2=false  # Iniciar desabilitado
NEXT_PUBLIC_WIZARD_DEBUG=true       # Debug durante migração
```

### **3. Monitoramento e Métricas**

```typescript
// utils/wizard-analytics.ts - Setup de tracking
export const trackWizardEvent = (event: string, data: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Integração com analytics (Google Analytics, Mixpanel, etc.)
    gtag('event', event, {
      event_category: 'wizard_migration',
      event_label: process.env.NEXT_PUBLIC_WIZARD_VERSION,
      ...data
    });
  }
  
  console.debug(`[Wizard Analytics] ${event}:`, data);
};

// Eventos a trackear durante migração
trackWizardEvent('wizard_started', { version: 'v2', user_id });
trackWizardEvent('step_completed', { step: 'basic-config', duration: 120 });
trackWizardEvent('wizard_abandoned', { last_step: 'implementation-config' });
trackWizardEvent('wizard_completed', { total_time: 180, steps_count: 4 });
```

---

## 📋 **Planos de Migração por Fase**

### **🔴 FASE 1 - Migração Fundação** (Semanas 1-2)

#### **Pré-requisitos**
- [ ] ✅ Backup completo realizado
- [ ] ✅ Testes atuais 100% passing
- [ ] ✅ Branch `feature/wizard-refactor-phase1` criado
- [ ] ✅ Feature flags configurados
- [ ] ✅ Monitoring dashboard ativo

#### **Processo de Migração**

**Sprint 1.1 - Eliminação de Duplicações**

```bash
# Dia 1-2: Setup
git checkout -b feature/wizard-phase1-duplications
# Implementar mudanças conforme implementation-plan.md

# Dia 3: Testing
npm run test:wizard:phase1
npm run test:e2e:wizard-basic-flow

# Dia 4: Code Review
# PR para feature/wizard-refactor-phase1

# Dia 5: Merge e Deploy Staging
git checkout feature/wizard-refactor-phase1
git merge feature/wizard-phase1-duplications
# Deploy para staging environment
```

**Sprint 1.2 - Auto-geração**

```bash
# Dia 1-2: Implementação
git checkout -b feature/wizard-phase1-autogen
# Implementar auto-geração conforme plano

# Dia 3-4: Validação
# Testar com dados reais de desenvolvimento
# Verificar compatibilidade com server actions

# Dia 5: Integração
git merge para feature/wizard-refactor-phase1
```

#### **Critérios de Go/No-Go Fase 1**

**✅ Critérios para continuar para Fase 2:**
- [ ] Todos os testes automatizados passing
- [ ] QA manual aprovado para cenários críticos
- [ ] Performance mantida ou melhorada (< 2s para cada step)
- [ ] 0 regressões identificadas
- [ ] Feedback positivo de 2+ desenvolvedores internos

**❌ Critérios para Rollback:**
- [ ] >1 bug crítico identificado
- [ ] Performance degradada >30%
- [ ] Testes de regressão falhando
- [ ] Feedback negativo majoritário

#### **Rollback da Fase 1**

```bash
# ROLLBACK IMEDIATO se necessário
git checkout main
git revert --mainline 1 <merge-commit-hash>

# OU rollback completo para tag
git checkout v1.0-wizard-stable
git checkout -b rollback/wizard-phase1-emergency
# Deploy rollback para produção

# Investigação pós-rollback
git log --oneline feature/wizard-refactor-phase1
# Identificar commit problemático e fix
```

### **🟡 FASE 2 - Migração UX** (Semanas 3-4)

#### **Estratégia de Deploy Gradual**

```typescript
// Feature flag granular para UX features
const FEATURE_FLAGS = {
  conditionalSteps: process.env.NEXT_PUBLIC_WIZARD_CONDITIONAL_STEPS === 'true',
  advancedAccordion: process.env.NEXT_PUBLIC_WIZARD_ADVANCED_ACCORDION === 'true',
  realTimePreview: process.env.NEXT_PUBLIC_WIZARD_REAL_TIME_PREVIEW === 'true'
};

// Implementação progressiva
export const BasicConfigStep = () => {
  // Sempre funcional: configuração básica
  const basicUI = renderBasicConfiguration();
  
  // Progressivo: accordion para configurações avançadas
  const advancedUI = FEATURE_FLAGS.advancedAccordion 
    ? renderAdvancedConfigurationAccordion()
    : renderAdvancedConfigurationStandard();
    
  // Progressivo: preview em tempo real  
  const previewUI = FEATURE_FLAGS.realTimePreview
    ? <StructurePreview config={basicConfig} />
    : null;
    
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {basicUI}
        {advancedUI}
      </div>
      <div className="lg:col-span-1">
        {previewUI}
      </div>
    </div>
  );
};
```

#### **Rollback Granular Fase 2**

```bash
# Rollback específico por feature
# Se accordion problemático
export NEXT_PUBLIC_WIZARD_ADVANCED_ACCORDION=false
# Deploy hotfix

# Se preview problemático  
export NEXT_PUBLIC_WIZARD_REAL_TIME_PREVIEW=false
# Deploy hotfix

# Se steps condicionais problemáticos
export NEXT_PUBLIC_WIZARD_CONDITIONAL_STEPS=false
# Mantém UX melhorado, remove lógica condicional
```

### **🟢 FASE 3 - Migração Final** (Semanas 5-6)

#### **Estratégia de Validação Intensiva**

**Semana 5:**
- [ ] **Alpha testing** com 3 desenvolvedores internos
- [ ] **Métricas comparativas** V1 vs V2
- [ ] **A/B testing** com 50% dos usuários internos
- [ ] **Coleta de feedback** via forms integrados

**Semana 6:**
- [ ] **Beta testing** com usuários beta (se disponível)
- [ ] **Performance testing** sob carga
- [ ] **Accessibility testing** (WCAG compliance)
- [ ] **Mobile testing** para responsividade

#### **Go-Live Strategy**

```typescript
// Gradual rollout based on user groups
const getUserWizardVersion = (userId: string): 'v1' | 'v2' => {
  // Phase 1: Internal team only
  if (INTERNAL_TEAM_IDS.includes(userId)) {
    return 'v2';
  }
  
  // Phase 2: 25% of users
  if (process.env.NEXT_PUBLIC_WIZARD_ROLLOUT_PERCENTAGE === '25') {
    return hashUserId(userId) % 4 === 0 ? 'v2' : 'v1';
  }
  
  // Phase 3: 50% of users
  if (process.env.NEXT_PUBLIC_WIZARD_ROLLOUT_PERCENTAGE === '50') {
    return hashUserId(userId) % 2 === 0 ? 'v2' : 'v1';
  }
  
  // Phase 4: 100% rollout
  if (process.env.NEXT_PUBLIC_WIZARD_ROLLOUT_PERCENTAGE === '100') {
    return 'v2';
  }
  
  return 'v1'; // Default fallback
};
```

---

## 🆘 **Planos de Contingência Detalhados**

### **Cenário 1: Bug Crítico Durante Fase 1**

**Sintomas:**
- Wizard não consegue criar módulos
- Server actions falhando
- Dados corrompidos

**Ação Imediata:**
```bash
# 1. Rollback imediato (< 15 minutos)
git checkout v1.0-wizard-stable
git checkout -b emergency/rollback-phase1-$(date +%Y%m%d-%H%M)
npm run build
npm run deploy:emergency

# 2. Comunicação
# Slack, email para stakeholders sobre rollback
echo "Wizard V2 rollback executado devido a bug crítico. Investigando." | notify-stakeholders

# 3. Post-mortem preparação
git log --since="1 week ago" --grep="wizard" > logs/wizard-changes.log
```

**Investigação:**
- [ ] Identificar commit específico que introduziu bug
- [ ] Reproduzir bug em ambiente de desenvolvimento
- [ ] Fix targeted com teste específico
- [ ] Novo deploy com fix após validação completa

### **Cenário 2: Performance Degradação Significativa**

**Sintomas:**
- Wizard lento (>5s por step)
- Memory leaks
- Bundle size aumentado significativamente

**Ação Gradual:**
```bash
# 1. Identificar bottleneck
npm run analyze:bundle
npm run lighthouse:wizard

# 2. Feature flags para desabilitar features pesadas
export NEXT_PUBLIC_WIZARD_REAL_TIME_PREVIEW=false
export NEXT_PUBLIC_WIZARD_ADVANCED_ACCORDION=false

# 3. Deploy com features reduzidas
npm run deploy:hotfix

# 4. Otimização offline
# Implementar lazy loading, memoização, etc.
```

### **Cenário 3: Feedback Negativo Majoritário**

**Sintomas:**
- >70% feedback negativo
- Increased abandonment rate
- Support tickets aumentando

**Ação Estratégica:**
```bash
# 1. Parar rollout gradual
export NEXT_PUBLIC_WIZARD_ROLLOUT_PERCENTAGE=0

# 2. A/B testing granular
# Manter features bem recebidas, rollback outras

# 3. Survey detalhado
# Identificar aspectos específicos problemáticos

# 4. Iteração rápida baseada em feedback
# Fix targeted das issues principais
```

### **Cenário 4: Incompatibilidade com Server Actions**

**Sintomas:**
- Criação de módulos falhando
- Schemas de validação incompatíveis
- Database constraints violated

**Ação Técnica:**
```bash
# 1. Rollback para V1 temporariamente
git checkout v1.0-wizard-stable

# 2. Fix de compatibilidade
# Ajustar schemas e validações
# Testes específicos para server actions

# 3. Deploy incremental
# V2 frontend + V1 backend schemas primeiro
# Depois migrar backend gradualmente
```

---

## 📊 **Monitoramento e Alertas**

### **Métricas Críticas de Monitoramento**

```typescript
// Dashboard de métricas críticas
const CRITICAL_METRICS = {
  // Performance
  wizardStepLoadTime: '< 2s',
  wizardCompleteTime: '< 3min',
  bundleSize: '< +20% from v1',
  
  // Funcionalidade  
  wizardSuccessRate: '> 95%',
  stepAbandonmentRate: '< 10%',
  errorRate: '< 2%',
  
  // Experiência
  userSatisfactionScore: '> 4.0/5',
  supportTicketsIncrease: '< +10%',
  completionRate: '> 90%'
};

// Alertas automáticos
const setupAlerts = () => {
  // Alerta crítico: success rate < 95%
  if (wizardSuccessRate < 0.95) {
    sendAlert('CRITICAL: Wizard success rate dropped below 95%');
  }
  
  // Alerta warning: performance degradation
  if (wizardStepLoadTime > 3000) {
    sendAlert('WARNING: Wizard performance degraded');
  }
  
  // Alerta info: abandonment increase
  if (stepAbandonmentRate > 0.15) {
    sendAlert('INFO: Step abandonment rate increased');
  }
};
```

### **Dashboard de Migração**

```typescript
// Real-time migration dashboard
const MigrationDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <MetricCard
        title="Rollout Progress"
        value={`${rolloutPercentage}%`}
        trend={rolloutTrend}
        status={rolloutStatus}
      />
      <MetricCard
        title="Success Rate"
        value={`${successRate}%`}
        trend={successTrend}
        status={successRate > 95 ? 'good' : 'warning'}
      />
      <MetricCard
        title="User Feedback"
        value={`${averageRating}/5`}
        trend={feedbackTrend}
        status={averageRating > 4 ? 'good' : 'needs-attention'}
      />
    </div>
  );
};
```

---

## ✅ **Checklist de Validação por Fase**

### **Fase 1 - Validação Crítica**
- [ ] **Funcionalidade**: Todos os fluxos de criação funcionando
- [ ] **Data Integrity**: Módulos criados corretamente no banco
- [ ] **Backward Compatibility**: Módulos V1 ainda funcionam
- [ ] **Performance**: Não há degradação > 10%
- [ ] **Tests**: 100% test coverage mantido

### **Fase 2 - Validação UX**
- [ ] **Usabilidade**: Steps condicionais funcionando corretamente
- [ ] **Interface**: Accordion e preview funcionais
- [ ] **Accessibility**: WCAG guidelines atendidas
- [ ] **Responsividade**: Funcional em mobile/tablet
- [ ] **Browser Compatibility**: Chrome, Firefox, Safari, Edge

### **Fase 3 - Validação Final**
- [ ] **Checklist Interativo**: Links e ações funcionando
- [ ] **Performance**: Métricas melhoradas vs V1
- [ ] **User Satisfaction**: > 4.0/5 em surveys
- [ ] **Documentation**: Guias atualizados
- [ ] **Training**: Equipe treinada no V2

---

## 📚 **Documentação de Rollback**

### **Comandos de Emergency Rollback**

```bash
#!/bin/bash
# emergency-rollback.sh - Script de rollback rápido

set -e  # Exit on any error

echo "🚨 INICIANDO EMERGENCY ROLLBACK WIZARD V2 → V1"
echo "Timestamp: $(date)"

# 1. Backup do estado atual V2
git tag emergency-rollback-$(date +%Y%m%d-%H%M%S)

# 2. Rollback para versão estável
git checkout v1.0-wizard-stable

# 3. Criar branch de rollback
git checkout -b emergency/rollback-$(date +%Y%m%d-%H%M%S)

# 4. Verificar integridade
npm run test:critical
if [ $? -ne 0 ]; then
    echo "❌ Testes críticos falhando após rollback!"
    exit 1
fi

# 5. Deploy de emergência
echo "🔄 Executando deploy de emergência..."
npm run build
npm run deploy:production:emergency

# 6. Validação pós-rollback
echo "✅ Rollback executado. Validando..."
curl -f https://app.exemplo.com/health-check/wizard
if [ $? -eq 0 ]; then
    echo "✅ Wizard V1 funcionando corretamente"
else
    echo "❌ Problema detectado após rollback!"
    exit 1
fi

# 7. Notificação
echo "📢 Notificando stakeholders..."
# Slack webhook ou email notification
curl -X POST https://hooks.slack.com/webhook -d '{"text": "🚨 Emergency rollback wizard V2→V1 executado com sucesso"}'

echo "✅ EMERGENCY ROLLBACK CONCLUÍDO"
```

### **Plano de Comunicação Rollback**

**Comunicação Imediata (< 30 min):**
- [ ] Slack/Teams: Notificação para equipe técnica
- [ ] Email: Stakeholders principais
- [ ] Dashboard: Status page update

**Comunicação Follow-up (< 2 horas):**
- [ ] Incident report detalhado
- [ ] Timeline de investigação
- [ ] Plano de recovery/retry

**Post-mortem (< 1 semana):**
- [ ] Root cause analysis
- [ ] Lessons learned
- [ ] Preventive measures
- [ ] Updated rollback procedures

---

## 🎯 **Success Criteria Final**

### **Migration Success = ALL criterias met:**

**Técnico:**
- [ ] ✅ 0 regressions identified
- [ ] ✅ 100% backward compatibility
- [ ] ✅ Performance maintained or improved
- [ ] ✅ All automated tests passing

**Funcional:**
- [ ] ✅ All wizard flows working correctly
- [ ] ✅ Module creation success rate > 95%
- [ ] ✅ Integration with existing server actions
- [ ] ✅ Data integrity maintained

**Experiência:**
- [ ] ✅ User satisfaction score > 4.0/5
- [ ] ✅ Completion time reduced by 30%+
- [ ] ✅ Abandonment rate < 10%
- [ ] ✅ Support tickets not increased

**Organizacional:**
- [ ] ✅ Team trained on V2
- [ ] ✅ Documentation updated
- [ ] ✅ Rollback procedures tested
- [ ] ✅ Monitoring and alerting active

---

**🎉 MIGRATION COMPLETE quando todos os critérios acima atendidos!**

---

**Contatos de Emergência:**
- **Tech Lead**: [nome] - [contato]
- **Product Owner**: [nome] - [contato]  
- **DevOps**: [nome] - [contato]
- **Emergency Hotline**: [telefone/slack]
// Script para testar a configuração de módulos
const testOrganization = {
  id: "test-org-123",
  company_trading_name: "Empresa Teste",
  company_legal_name: "Empresa Teste LTDA",
  slug: "empresa-teste",
  client_type: "custom",
  is_implementation_complete: true,
  implementation_config: {
    subscribed_modules: ["insights", "performance", "alerts", "inventory"],
    custom_modules: ["insights-advanced", "performance-advanced", "alerts-advanced", "inventory-advanced"],
    enabled_standard_modules: [],
    features: ["insights", "performance", "alerts", "inventory"]
  }
};

// Simular a função getSubscribedModules do UnifiedSidebar
function getSubscribedModules(implementationConfig) {
  console.log('🔍 getSubscribedModules - implementationConfig:', implementationConfig);
  
  if (!implementationConfig?.subscribed_modules) {
    console.warn('❌ Nenhum módulo assinado encontrado em implementation_config');
    return [];
  }

  const moduleNavItems = [];
  const subscribedModules = implementationConfig.subscribed_modules;
  
  console.log('📋 Módulos assinados encontrados:', subscribedModules);

  // Mapear módulos assinados para itens de navegação
  if (subscribedModules.includes('insights')) {
    moduleNavItems.push({
      title: 'Insights Avançados',
      icon: 'BarChart3',
      items: [
        { title: 'Dashboard', href: '/insights' },
        { title: 'Análises', href: '/insights/analytics' },
        { title: 'Relatórios', href: '/insights/reports' }
      ]
    });
  }

  if (subscribedModules.includes('performance')) {
    moduleNavItems.push({
      title: 'Performance',
      icon: 'Activity',
      items: [
        { title: 'Métricas', href: '/performance' },
        { title: 'KPIs', href: '/performance/kpis' },
        { title: 'Benchmarks', href: '/performance/benchmarks' }
      ]
    });
  }

  if (subscribedModules.includes('alerts')) {
    moduleNavItems.push({
      title: 'Alertas',
      icon: 'Bell',
      items: [
        { title: 'Alertas Ativos', href: '/alerts' },
        { title: 'Configurações', href: '/alerts/config' },
        { title: 'Histórico', href: '/alerts/history' }
      ]
    });
  }

  if (subscribedModules.includes('inventory')) {
    moduleNavItems.push({
      title: 'Gestão de Estoque',
      icon: 'Package',
      items: [
        { title: 'Visão Geral', href: '/inventory' },
        { title: 'Movimentações', href: '/inventory/movements' },
        { title: 'Ajustes', href: '/inventory/adjustments' }
      ]
    });
  }

  if (subscribedModules.includes('analytics')) {
    moduleNavItems.push({
      title: 'Analytics',
      icon: 'TrendingUp',
      items: [
        { title: 'Dashboard', href: '/analytics' },
        { title: 'Tendências', href: '/analytics/trends' },
        { title: 'Previsões', href: '/analytics/forecasts' }
      ]
    });
  }

  if (subscribedModules.includes('data-processing')) {
    moduleNavItems.push({
      title: 'Processamento de Dados',
      icon: 'Database',
      items: [
        { title: 'Status', href: '/data-processing' },
        { title: 'Logs', href: '/data-processing/logs' },
        { title: 'Configurações', href: '/data-processing/config' }
      ]
    });
  }

  console.log('✅ Módulos mapeados para navegação:', moduleNavItems.map(item => item.title));
  console.log('🎯 Total de itens de navegação criados:', moduleNavItems.length);
  return moduleNavItems;
}

// Testar a função
console.log('🧪 TESTE: Configuração de Módulos\n');
console.log('📋 Organização de teste:', {
  nome: testOrganization.company_trading_name,
  slug: testOrganization.slug,
  tipo: testOrganization.client_type,
  implementacao_completa: testOrganization.is_implementation_complete
});

console.log('\n🔧 Configuração de implementação:');
console.log(JSON.stringify(testOrganization.implementation_config, null, 2));

console.log('\n🧪 Executando getSubscribedModules...');
const navItems = getSubscribedModules(testOrganization.implementation_config);

console.log('\n✅ RESULTADO:');
console.log(`📊 ${navItems.length} módulos mapeados para a sidebar`);
navItems.forEach((item, index) => {
  console.log(`   ${index + 1}. ${item.title} (${item.items.length} subitens)`);
});

if (navItems.length === 0) {
  console.log('\n❌ PROBLEMA: Nenhum módulo foi mapeado!');
} else {
  console.log('\n✅ SUCCESS: Módulos configurados corretamente!');
  console.log(`🎯 Estes ${navItems.length} módulos deveriam aparecer na sidebar tenant`);
} 
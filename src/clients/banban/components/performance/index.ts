// Performance module components for Banban client
export { PerformancePage } from './PerformancePage';
export { default as PerformanceDashboard } from './PerformanceDashboard';

// New BI Dashboard Components
export { UnifiedFilters } from './filters/UnifiedFilters';
export { PerformanceKPICards } from './kpis/PerformanceKPICards';
export { SalesByCategoryChart } from './charts/SalesByCategoryChart';
export { TemporalAnalysis } from './temporal/TemporalAnalysis';
export { 
  DrillDownProvider, 
  DrillDownBreadcrumb, 
  useDrillDown, 
  useDrillDownActions 
} from './drill-down/DrillDownProvider';

// Legacy Components (maintained for backward compatibility)
export { PerformanceSection, SectionHeader } from './section-header';
export { KPICards, KPISummary } from './kpi-cards';
export { CriticalAlerts } from './critical-alerts';
export { FashionMetricsSection } from './fashion-metrics';
export { BrandPerformanceSection } from './brand-performance';
export { MarginAnalysisSection } from './margin-analysis';

// Types
export * from './types';

// Mock data exports
export * from './mock-data';
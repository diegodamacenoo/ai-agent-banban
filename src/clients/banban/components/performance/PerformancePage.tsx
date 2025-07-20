// AIDEV-NOTE: PerformancePage integrado com novo sistema BI - Ver performance-module-plan.md
import PerformanceDashboard from './PerformanceDashboard';

interface PerformancePageProps {
  params?: {
    slug: string;
    module: string;
  };
  organization?: {
    id: string;
    slug: string;
    client_type: string;
    company_trading_name?: string;
    company_legal_name?: string;
  };
}

export function PerformancePage(props: PerformancePageProps) {
  return <PerformanceDashboard {...props} />;
}
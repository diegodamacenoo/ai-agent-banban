'use client';

import { PerformanceHeader } from './performance-header';

interface PerformancePageWrapperProps {
  children: React.ReactNode;
}

export function PerformancePageWrapper({ children }: PerformancePageWrapperProps) {
  return (
    <div>
      <PerformanceHeader />
      {children}
    </div>
  );
} 

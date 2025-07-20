'use client';

import React from 'react';
import type { CustomDashboardProps } from '@/clients/registry';
import { DynamicTenantDashboard } from './dynamic-tenant-dashboard';

export function DefaultTenantDashboard({ slug, organization, activeModules = [] }: CustomDashboardProps) {
  // Simplesmente renderizar o dashboard dinâmico
  return (
    <DynamicTenantDashboard 
      slug={slug} 
      organization={organization} 
      activeModules={activeModules} 
    />
  );
}
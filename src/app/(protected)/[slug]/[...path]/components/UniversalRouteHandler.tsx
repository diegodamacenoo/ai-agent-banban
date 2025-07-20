/**
 * UniversalRouteHandler - Componente que manipula diferentes tipos de rota
 * Fase 4 - Route Simplification
 */

'use client';

import React, { Suspense } from 'react';
import { DynamicLayout } from '@/shared/components/DynamicLayout';
import { UniversalModuleLoader } from './UniversalModuleLoader';
import { UniversalHomePage } from './UniversalHomePage';
import { Organization } from '../lib/client-helpers';
import { ErrorBoundary } from '@/shared/ui/error-boundary';
import { LoadingFallback } from './LoadingFallback';

interface BaseRouteProps {
  organization: Organization;
  searchParams?: Record<string, string>;
}

interface HomeRouteProps extends BaseRouteProps {
  type: 'home';
}

interface ModuleRouteProps extends BaseRouteProps {
  type: 'module';
  moduleSlug: string;
  subPath?: string[];
  originalParams?: any;
}

type UniversalRouteHandlerProps = HomeRouteProps | ModuleRouteProps;

/**
 * Handler principal que decide como renderizar cada tipo de rota
 */
export const UniversalRouteHandler: React.FC<UniversalRouteHandlerProps> = (props) => {
  const { organization, searchParams } = props;

  return (
    <ErrorBoundary>
      <DynamicLayout
        organization={organization}
        enableModuleAccess={true}
        autoRefresh={true}
      >
        <Suspense fallback={<LoadingFallback type={props.type} />}>
          {props.type === 'home' ? (
            <UniversalHomePage
              organization={organization}
              searchParams={searchParams}
            />
          ) : (
            <UniversalModuleLoader
              organization={organization}
              moduleSlug={props.moduleSlug}
              subPath={props.subPath}
              searchParams={searchParams}
              originalParams={props.originalParams}
            />
          )}
        </Suspense>
      </DynamicLayout>
    </ErrorBoundary>
  );
};

export default UniversalRouteHandler;
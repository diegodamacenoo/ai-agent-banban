/**
 * LoadingFallback - Estados de carregamento para a rota universal
 * Fase 4 - Route Simplification
 */

'use client';

import React from 'react';
import { Skeleton } from '@/shared/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Loader2, Home, Package } from 'lucide-react';

interface LoadingFallbackProps {
  type: 'home' | 'module';
  moduleSlug?: string;
}

/**
 * Componente de loading adaptável ao tipo de conteúdo
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  type,
  moduleSlug
}) => {
  if (type === 'home') {
    return <HomeLoadingSkeleton />;
  }

  return <ModuleLoadingSkeleton moduleSlug={moduleSlug} />;
};

/**
 * Skeleton para página home
 */
const HomeLoadingSkeleton: React.FC = () => {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-60" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modules grid skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Skeleton para módulo específico
 */
const ModuleLoadingSkeleton: React.FC<{ moduleSlug?: string }> = ({ moduleSlug }) => {
  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* Loading indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 font-medium">
              Carregando módulo {moduleSlug ? `"${moduleSlug}"` : ''}...
            </span>
          </div>
        </div>
      </div>

      {/* Module header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Module content skeleton */}
      <div className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main content area */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>

        {/* Additional content blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;
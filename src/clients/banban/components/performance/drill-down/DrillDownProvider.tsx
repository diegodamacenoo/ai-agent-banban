'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';

// Tipos para o sistema de drill-down
export interface DrillDownLevel {
  id: string;
  title: string;
  type: 'kpi' | 'category' | 'brand' | 'product' | 'store' | 'period';
  value?: string;
  metadata?: Record<string, any>;
}

export interface DrillDownPath extends DrillDownLevel {
  children?: DrillDownLevel[];
}

interface DrillDownContextType {
  path: DrillDownPath[];
  currentLevel: DrillDownPath | null;
  breadcrumbs: DrillDownLevel[];
  isAtRoot: boolean;
  drillDown: (level: DrillDownLevel, data?: any) => void;
  drillUp: () => void;
  goToRoot: () => void;
  goToLevel: (levelIndex: number) => void;
  contextData: Record<string, any>;
  setContextData: (data: Record<string, any>) => void;
}

const DrillDownContext = createContext<DrillDownContextType | undefined>(undefined);

interface DrillDownProviderProps {
  children: ReactNode;
  onDrillChange?: (path: DrillDownPath[], level: DrillDownPath | null) => void;
}

export function DrillDownProvider({ 
  children, 
  onDrillChange 
}: DrillDownProviderProps) {
  const [path, setPath] = useState<DrillDownPath[]>([]);
  const [contextData, setContextData] = useState<Record<string, any>>({});

  const currentLevel = path.length > 0 ? path[path.length - 1] : null;
  const isAtRoot = path.length === 0;
  const breadcrumbs: DrillDownLevel[] = path.map(level => ({
    id: level.id,
    title: level.title,
    type: level.type,
    value: level.value,
    metadata: level.metadata
  }));

  const drillDown = (level: DrillDownLevel, data?: any) => {
    const newLevel: DrillDownPath = {
      ...level,
      children: []
    };
    
    const newPath = [...path, newLevel];
    setPath(newPath);
    
    if (data) {
      setContextData(prev => ({ ...prev, [level.id]: data }));
    }
    
    onDrillChange?.(newPath, newLevel);
  };

  const drillUp = () => {
    if (path.length > 0) {
      const newPath = path.slice(0, -1);
      setPath(newPath);
      
      const newCurrentLevel = newPath.length > 0 ? newPath[newPath.length - 1] : null;
      onDrillChange?.(newPath, newCurrentLevel);
    }
  };

  const goToRoot = () => {
    setPath([]);
    setContextData({});
    onDrillChange?.([], null);
  };

  const goToLevel = (levelIndex: number) => {
    if (levelIndex >= 0 && levelIndex < path.length) {
      const newPath = path.slice(0, levelIndex + 1);
      setPath(newPath);
      
      const newCurrentLevel = newPath[newPath.length - 1];
      onDrillChange?.(newPath, newCurrentLevel);
    }
  };

  return (
    <DrillDownContext.Provider
      value={{
        path,
        currentLevel,
        breadcrumbs,
        isAtRoot,
        drillDown,
        drillUp,
        goToRoot,
        goToLevel,
        contextData,
        setContextData
      }}
    >
      {children}
    </DrillDownContext.Provider>
  );
}

export function useDrillDown() {
  const context = useContext(DrillDownContext);
  if (context === undefined) {
    throw new Error('useDrillDown must be used within a DrillDownProvider');
  }
  return context;
}

// Componente de Breadcrumb
export function DrillDownBreadcrumb({ 
  className = "",
  showBackButton = true 
}: { 
  className?: string;
  showBackButton?: boolean;
}) {
  const { breadcrumbs, isAtRoot, drillUp, goToRoot, goToLevel } = useDrillDown();

  if (isAtRoot) return null;

  return (
    <div className={`flex items-center gap-2 mb-6 ${className}`}>
      {showBackButton && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={drillUp}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      )}
      
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToRoot}
          className="flex items-center gap-1 h-8 px-2"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Button>
        
        {breadcrumbs.map((level, index) => (
          <div key={level.id} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToLevel(index)}
              className="h-8 px-2 text-gray-700 hover:text-gray-900"
              disabled={index === breadcrumbs.length - 1}
            >
              {level.title}
              {level.value && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {level.value}
                </Badge>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook para drill-down automático em componentes
export function useDrillDownActions() {
  const { drillDown, contextData } = useDrillDown();

  const drillDownToCategory = (category: string, categoryData?: any) => {
    drillDown({
      id: `category-${category}`,
      title: `Categoria: ${category}`,
      type: 'category',
      value: category,
      metadata: { category }
    }, categoryData);
  };

  const drillDownToBrand = (brand: string, brandData?: any) => {
    drillDown({
      id: `brand-${brand}`,
      title: `Marca: ${brand}`,
      type: 'brand',
      value: brand,
      metadata: { brand }
    }, brandData);
  };

  const drillDownToProduct = (product: string, sku: string, productData?: any) => {
    drillDown({
      id: `product-${sku}`,
      title: `Produto: ${product}`,
      type: 'product',
      value: sku,
      metadata: { product, sku }
    }, productData);
  };

  const drillDownToStore = (store: string, storeData?: any) => {
    drillDown({
      id: `store-${store}`,
      title: `Loja: ${store}`,
      type: 'store',
      value: store,
      metadata: { store }
    }, storeData);
  };

  const drillDownToPeriod = (period: string, periodData?: any) => {
    drillDown({
      id: `period-${period}`,
      title: `Período: ${period}`,
      type: 'period',
      value: period,
      metadata: { period }
    }, periodData);
  };

  const drillDownToKPI = (kpi: string, kpiData?: any) => {
    drillDown({
      id: `kpi-${kpi}`,
      title: `KPI: ${kpi}`,
      type: 'kpi',
      value: kpi,
      metadata: { kpi }
    }, kpiData);
  };

  return {
    drillDownToCategory,
    drillDownToBrand,
    drillDownToProduct,
    drillDownToStore,
    drillDownToPeriod,
    drillDownToKPI,
    contextData
  };
}
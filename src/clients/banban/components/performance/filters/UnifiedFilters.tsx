'use client';

import { useState } from 'react';
import { Calendar, Filter, RotateCcw, Download } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { UnifiedFilters as UnifiedFiltersType } from '../types';

interface UnifiedFiltersProps {
  filters: UnifiedFiltersType;
  onFiltersChange: (filters: UnifiedFiltersType) => void;
  onExport?: () => void;
  isLoading?: boolean;
}

const PRESET_PERIODS = [
  { value: 'last_7_days', label: 'Últimos 7 dias' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
  { value: 'last_quarter', label: 'Último trimestre' },
  { value: 'ytd', label: 'Ano até agora' },
  { value: 'custom', label: 'Período personalizado' }
] as const;

const COMPARISON_PERIODS = [
  { value: 'previous_period', label: 'Período anterior' },
  { value: 'last_year', label: 'Ano passado' },
  { value: 'none', label: 'Sem comparação' }
] as const;

// Mock data para opções - em produção viria da API
const MOCK_OPTIONS = {
  categories: ['Calçados Femininos', 'Calçados Masculinos', 'Bolsas', 'Carteiras', 'Acessórios'],
  brands: ['Nike', 'Adidas', 'Melissa', 'Havaianas', 'Vizzano', 'Olympikus'],
  stores: ['Shopping Center Norte', 'Shopping Iguatemi', 'Rua Oscar Freire', 'Shopping Morumbi'],
  seasons: ['Verão 2024', 'Outono 2024', 'Inverno 2024', 'Primavera 2024'],
  collections: ['Verão Vibrante', 'Elegância Urbana', 'Beach Collection', 'Urban Style'],
  sizes: ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42'],
  colors: ['Preto', 'Branco', 'Nude', 'Vermelho', 'Azul', 'Rosa', 'Dourado', 'Prata']
};

export function UnifiedFilters({
  filters,
  onFiltersChange,
  onExport,
  isLoading = false
}: UnifiedFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (updates: Partial<UnifiedFiltersType>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const resetFilters = () => {
    const defaultFilters: UnifiedFiltersType = {
      date_range: {
        preset: 'last_30_days',
        start_date: '',
        end_date: '',
        comparison_period: 'previous_period'
      },
      categories: [],
      brands: [],
      stores: [],
      price_ranges: [],
      seasons: [],
      collections: [],
      sizes: [],
      colors: []
    };
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    return (
      filters.categories.length +
      filters.brands.length +
      filters.stores.length +
      filters.seasons.length +
      filters.collections.length +
      filters.sizes.length +
      filters.colors.length +
      (filters.performance_tier ? 1 : 0) +
      (filters.margin_threshold ? 1 : 0) +
      (filters.velocity_threshold ? 1 : 0)
    );
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {/* Filtros Principais - Sempre Visíveis */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Período */}
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Select
              value={filters.date_range.preset}
              onValueChange={(value) => 
                updateFilters({
                  date_range: { 
                    ...filters.date_range, 
                    preset: value as any 
                  }
                })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comparação */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-gray-500">vs</span>
            <Select
              value={filters.date_range.comparison_period || 'previous_period'}
              onValueChange={(value) => 
                updateFilters({
                  date_range: { 
                    ...filters.date_range, 
                    comparison_period: value as any 
                  }
                })
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPARISON_PERIODS.map((comparison) => (
                  <SelectItem key={comparison.value} value={comparison.value}>
                    {comparison.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6 hidden lg:block" />

          {/* Ações */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                disabled={isLoading}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filtros Avançados - Expansível */}
        {showAdvanced && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4">
              {/* Dimensões Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Categorias */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Categorias
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_OPTIONS.categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Marcas */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Marcas
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as marcas" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_OPTIONS.brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lojas */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Lojas
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as lojas" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_OPTIONS.stores.map((store) => (
                        <SelectItem key={store} value={store}>
                          {store}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Estações */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Estações
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as estações" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_OPTIONS.seasons.map((season) => (
                        <SelectItem key={season} value={season}>
                          {season}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Atributos Fashion */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Coleções */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Coleções
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as coleções" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_OPTIONS.collections.map((collection) => (
                        <SelectItem key={collection} value={collection}>
                          {collection}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tamanhos */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tamanhos
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tamanhos" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_OPTIONS.sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cores */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Cores
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as cores" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_OPTIONS.colors.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Performance Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tier de Performance */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tier de Performance
                  </label>
                  <Select
                    value={filters.performance_tier || ''}
                    onValueChange={(value) => 
                      updateFilters({
                        performance_tier: value ? value as any : undefined
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tiers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tiers</SelectItem>
                      <SelectItem value="A">Tier A (Excelente)</SelectItem>
                      <SelectItem value="B">Tier B (Bom)</SelectItem>
                      <SelectItem value="C">Tier C (Regular)</SelectItem>
                      <SelectItem value="D">Tier D (Crítico)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Placeholder para filtros futuros */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Faixa de Margem
                  </label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Em desenvolvimento" />
                    </SelectTrigger>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Velocidade de Venda
                  </label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Em desenvolvimento" />
                    </SelectTrigger>
                  </Select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Badge com Filtros Aplicados */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>{activeFiltersCount} filtros aplicados</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs p-1 h-auto"
              >
                Limpar todos
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
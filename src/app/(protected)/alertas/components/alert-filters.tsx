'use client';

import { useState } from 'react';
import { Search, Filter, SortAsc, Download, X, Settings } from 'lucide-react';
import { ThresholdSettingsModal } from './threshold-settings-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

interface AlertFiltersProps {
  onSearchChange: (search: string) => void;
  onTypeFilter: (types: string[]) => void;
  onSeverityFilter: (severities: string[]) => void;
  onSortChange: (sort: string) => void;
  onExport: () => void;
  totalAlerts: number;
  isExporting?: boolean;
}

const alertTypes = [
  { value: 'stagnant', label: 'Produtos Parados' },
  { value: 'replenishment', label: 'Reposição' },
  { value: 'divergence', label: 'Divergências' },
  { value: 'margin', label: 'Margem' },
  { value: 'returns', label: 'Devoluções' },
  { value: 'redistribution', label: 'Redistribuição' }
];

const severityLevels = [
  { value: 'critical', label: 'Crítico', color: 'destructive' },
  { value: 'high', label: 'Alto', color: 'secondary' },
  { value: 'medium', label: 'Médio', color: 'outline' },
  { value: 'low', label: 'Baixo', color: 'outline' }
];

const sortOptions = [
  { value: 'priority', label: 'Prioridade' },
  { value: 'date', label: 'Data' },
  { value: 'type', label: 'Tipo' },
  { value: 'impact', label: 'Impacto' }
];

export function AlertFilters({
  onSearchChange,
  onTypeFilter,
  onSeverityFilter,
  onSortChange,
  onExport,
  totalAlerts,
  isExporting = false
}: AlertFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('priority');
  const { toast } = useToast();

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange(value);
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newTypes);
    onTypeFilter(newTypes);
  };

  const handleSeverityToggle = (severity: string) => {
    const newSeverities = selectedSeverities.includes(severity)
      ? selectedSeverities.filter(s => s !== severity)
      : [...selectedSeverities, severity];
    
    setSelectedSeverities(newSeverities);
    onSeverityFilter(newSeverities);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onSortChange(value);
  };

  const handleExport = () => {
    try {
      onExport();
      toast({
        title: "Export iniciado",
        description: "O arquivo será baixado em breve.",
      });
    } catch (err) {
      toast({
        title: "Erro no export",
        description: "Não foi possível iniciar o export.",
        variant: "destructive",
      });
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedSeverities([]);
    setSortBy('priority');
    
    onSearchChange('');
    onTypeFilter([]);
    onSeverityFilter([]);
    onSortChange('priority');
  };

  const hasActiveFilters = searchTerm || selectedTypes.length > 0 || selectedSeverities.length > 0;

  return (
    <div className="space-y-4">
      {/* Linha Principal de Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        
        {/* Campo de Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar produtos, locais ou códigos..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro por Tipo */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Tipo
              {selectedTypes.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedTypes.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Tipos de Alerta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alertTypes.map((type) => (
              <DropdownMenuCheckboxItem
                key={type.value}
                checked={selectedTypes.includes(type.value)}
                onCheckedChange={() => handleTypeToggle(type.value)}
              >
                {type.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filtro por Severidade */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Severidade
              {selectedSeverities.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedSeverities.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Níveis de Severidade</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {severityLevels.map((severity) => (
              <DropdownMenuCheckboxItem
                key={severity.value}
                checked={selectedSeverities.includes(severity.value)}
                onCheckedChange={() => handleSeverityToggle(severity.value)}
              >
                <Badge variant={severity.color as any} className="mr-2">
                  {severity.label}
                </Badge>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Ordenação */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-auto">
            <SortAsc className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Botão de Configurações */}
        <ThresholdSettingsModal>
          <Button variant="outline" className="w-auto">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </ThresholdSettingsModal>

        {/* Botão de Export */}
        <Button 
          variant="outline" 
          onClick={handleExport}
          disabled={isExporting}
          className="w-auto"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>

      </div>

      {/* Linha de Badges Ativos e Limpar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          
          {/* Badge de busca */}
          {searchTerm && (
            <Badge variant="outline" className="gap-1">
              Busca: "{searchTerm}"
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => handleSearchChange('')}
              />
            </Badge>
          )}

          {/* Badges de tipos */}
          {selectedTypes.map((type) => {
            const typeLabel = alertTypes.find(t => t.value === type)?.label;
            return (
              <Badge key={type} variant="outline" className="gap-1">
                {typeLabel}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleTypeToggle(type)}
                />
              </Badge>
            );
          })}

          {/* Badges de severidades */}
          {selectedSeverities.map((severity) => {
            const severityData = severityLevels.find(s => s.value === severity);
            return (
              <Badge key={severity} variant="outline" className="gap-1">
                {severityData?.label}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleSeverityToggle(severity)}
                />
              </Badge>
            );
          })}

          {/* Botão Limpar Tudo */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="h-6 text-xs"
          >
            Limpar tudo
          </Button>
        </div>
      )}

      {/* Contador de Resultados */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          {totalAlerts} alertas encontrados
          {hasActiveFilters && ' (filtrados)'}
        </span>
        <span>
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </span>
      </div>
    </div>
  );
} 
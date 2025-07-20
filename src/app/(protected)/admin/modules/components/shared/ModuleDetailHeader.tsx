'use client';

import Link from 'next/link';
import { ArrowLeft, Settings, RefreshCw, Download, BarChart3, Home, Folder } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import type { ModuleDetail } from '../../types/module-details';

interface ModuleDetailHeaderProps {
  module: ModuleDetail;
}

export default function ModuleDetailHeader({ module }: ModuleDetailHeaderProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    // AIDEV-TODO: Implementar export de dados do módulo
    console.log('Export data for module:', module.id);
  };

  // Calcular estatísticas básicas
  const activeImplementations = module.implementations.filter(impl => impl.is_active).length;
  const activeTenants = module.tenant_assignments.filter(assignment => assignment.is_active).length;
  const totalTenants = module.tenant_assignments.length;

  // Calcular health score básico
  const healthScore = Math.round(
    (activeImplementations > 0 ? 40 : 0) + 
    (activeTenants > 0 ? 30 : 0) + 
    (module.is_active ? 20 : 0) + 
    (totalTenants > 0 ? 10 : 0)
  );

  return (
    <div className="space-y-4">
      {/* Header Principal */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          {/* Informações do Módulo */}
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {module.name}
            </h1>
            <Badge variant={module.is_active ? "default" : "secondary"}>
              {module.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
            
          
          <p className="text-gray-600 max-w-2xl">
            {module.description || "Módulo sem descrição disponível"}
          </p>

          {/* Estatísticas Rápidas */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span>
              <strong className="text-gray-900">{module.category}</strong> • categoria
            </span>
            <span>
              <strong className="text-gray-900">{activeImplementations}</strong> implementações ativas
            </span>
            <span>
              <strong className="text-gray-900">{activeTenants}/{totalTenants}</strong> tenants ativos
            </span>
            <span>
              <strong className={`${healthScore >= 80 ? 'text-green-600' : healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {healthScore}%
              </strong> saúde
            </span>
          </div>
        </div>

        {/* Ações do Header */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            className="text-gray-600 hover:text-gray-900"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Link href={`/admin/modules`}>
            <Button 
              variant="outline" 
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
          </Link>
        </div>
      </div>

      {/* Metadata adicional */}
      <div className="flex items-center space-x-6 text-xs text-gray-400 border-t pt-3">
        <span>
          <strong>Criado:</strong> {new Date(module.created_at).toLocaleDateString('pt-BR')}
        </span>
        <span>
          <strong>Atualizado:</strong> {new Date(module.updated_at).toLocaleDateString('pt-BR')}
        </span>
        <span>
          <strong>ID:</strong> {module.id.split('-')[0]}...
        </span>
        <span>
          <strong>Slug:</strong> /{module.slug}
        </span>
      </div>
    </div>
  );
}
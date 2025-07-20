'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Building2, 
  Calendar, 
  Globe, 
  CheckCircle, 
  Clock, 
  Edit, 
  Trash2,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import Link from 'next/link';
import { EditOrganizationSheet } from './EditOrganizationSheet';

interface Organization {
  id: string;
  company_legal_name: string;
  company_trading_name: string;
  client_type: 'standard' | 'custom';
  custom_backend_url?: string;
  is_implementation_complete: boolean;
  implementation_date?: string;
  implementation_team_notes?: string;
  created_at: string;
  updated_at: string;
}

interface OrganizationHeaderProps {
  organization: Organization;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function OrganizationHeader({ organization, onEdit, onDelete }: OrganizationHeaderProps) {
  const getImplementationStatusDisplay = () => {
    if (organization.is_implementation_complete) {
      return {
        badge: (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3 py-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Implementação Completa
          </Badge>
        ),
        description: "Organização totalmente configurada e operacional"
      };
    }
    return {
      badge: (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-sm px-3 py-1">
          <Clock className="h-4 w-4 mr-2" />
          Implementação Pendente
        </Badge>
      ),
      description: "Configuração ainda em andamento"
    };
  };

  const getTypeBadge = () => {
    return organization.client_type === 'custom' ? (
      <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
        <Building2 className="h-3 w-3 mr-1" />
        Cliente Custom
      </Badge>
    ) : (
      <Badge variant="outline" className="border-gray-200 text-gray-700 bg-gray-50">
        <Building2 className="h-3 w-3 mr-1" />
        Cliente Standard
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {organization.company_trading_name}
              </CardTitle>
              <p className="text-gray-600 mt-1">
                {organization.company_legal_name}
              </p>
            </div>
            
            {/* Status de Implementação em Destaque */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {getImplementationStatusDisplay().badge}
                <span className="text-sm text-gray-600">
                  {getImplementationStatusDisplay().description}
                </span>
              </div>
            </div>

            {/* Tipo de Cliente */}
            <div className="flex flex-wrap gap-2">
              {getTypeBadge()}
            </div>
          </div>

          <div className="flex gap-2">
            <EditOrganizationSheet
              organization={organization}
              onSuccess={onEdit}
              trigger={
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              }
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Ações
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações da Organização</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {organization.custom_backend_url && (
                  <DropdownMenuItem asChild>
                    <a 
                      href={organization.custom_backend_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Acessar Backend
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Organização
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Data de Criação
            </div>
            <p className="font-medium">
              {format(new Date(organization.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          {organization.implementation_date && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle className="h-4 w-4" />
                Data de Implementação
              </div>
              <p className="font-medium">
                {format(new Date(organization.implementation_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          )}

          {organization.custom_backend_url && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Globe className="h-4 w-4" />
                Backend Customizado
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {organization.custom_backend_url}
                </code>
                <Button size="sm" variant="ghost" asChild>
                  <a 
                    href={organization.custom_backend_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>

        {organization.implementation_team_notes && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Notas da Equipe de Implementação</h4>
            <p className="text-blue-800 text-sm">
              {organization.implementation_team_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
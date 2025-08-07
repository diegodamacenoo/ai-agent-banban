'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DrawerProvider,
  StandardDrawer,
  useDrawer,
} from '@/shared/providers/DrawerProvider/index';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import {
  Shield,
  Mail,
  Phone,
  Calendar,
  Building2,
  Clock,
  UserCheck,
  UserX,
  Edit,
  RefreshCw,
  MapPin,
  Globe,
  Activity,
  User as UserIcon
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'user';
  organization_id: string;
  organization_name: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
  profile_picture?: string;
  phone?: string;
}

interface UserProfileDrawerProps {
  trigger?: React.ReactNode;
  user?: User;
  onSuccess?: () => void;
}

interface UserProfileFormData {
  user: User | null;
}

// Mock data for additional profile details
const getMockUserDetails = (user: User) => ({
  department: user.role === 'admin' ? 'TI' : user.role === 'manager' ? 'Vendas' : 'Operacional',
  location: user.organization_name.includes('Banban') ? 'São Paulo, SP' :
    user.organization_name.includes('Riachuelo') ? 'Rio de Janeiro, RJ' : 'São Paulo, SP',
  timezone: 'America/Sao_Paulo',
  language: 'Português (Brasil)',
  last_password_change: '2024-12-15T10:30:00Z',
  login_count: Math.floor(Math.random() * 100) + 50,
  permissions: user.role === 'admin' ? ['Administração Total', 'Gestão de Usuários', 'Configurações'] :
    user.role === 'manager' ? ['Gestão de Equipe', 'Relatórios', 'Vendas'] :
      ['Operações Básicas', 'Visualização'],
  recent_activity: [
    { action: 'Login realizado', timestamp: user.last_login, type: 'login' },
    { action: 'Perfil atualizado', timestamp: '2025-01-23T14:30:00Z', type: 'profile' },
    { action: 'Senha alterada', timestamp: '2024-12-15T10:30:00Z', type: 'security' }
  ]
});

const getRoleBadge = (role: string) => {
  // AIDEV-NOTE: User-friendly role mapping with fallback pattern
  const roleMap: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'outline'; icon?: any }> = {
    'admin': { label: 'Administrador', variant: 'destructive', icon: Shield },
    'manager': { label: 'Gestor', variant: 'secondary' },
    'user': { label: 'Usuário', variant: 'outline' },
  };
  
  const roleConfig = roleMap[role] || { label: role, variant: 'outline' as const };
  
  return (
    <Badge variant={roleConfig.variant} icon={roleConfig.icon}>
      {roleConfig.label}
    </Badge>
  );
};

const getStatusBadge = (isActive: boolean) => {
  if (isActive) {
    return <Badge variant="success" icon={UserCheck}>Ativo</Badge>;
  }
  return <Badge variant="secondary" icon={UserX}>Inativo</Badge>;
};

// Componente de conteúdo do drawer
function UserProfileContent() {
  const { formData } = useDrawer<UserProfileFormData>();
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'permissions'>('profile');

  if (!formData.user) return <div>Carregando...</div>;

  const user = formData.user;
  const userDetails = getMockUserDetails(user);

  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-xl font-semibold text-gray-600">
            {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </span>
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold">{user.full_name}</h3>
          <div className="flex flex-col gap-1">
            {getRoleBadge(user.role)}
            {getStatusBadge(user.is_active)}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 text-sm py-2 px-3 rounded-md transition-colors ${activeTab === 'profile'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Perfil
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 text-sm py-2 px-3 rounded-md transition-colors ${activeTab === 'activity'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Atividade
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex-1 text-sm py-2 px-3 rounded-md transition-colors ${activeTab === 'permissions'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Permissões
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Informações Pessoais</h4>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Telefone</p>
                    <p className="text-sm text-gray-600">{user.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Organização</p>
                  <p className="text-sm text-gray-600">{user.organization_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Localização</p>
                  <p className="text-sm text-gray-600">{userDetails.location}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Detalhes da Conta</h4>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Membro desde</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Último login</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(user.last_login), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Idioma</p>
                  <p className="text-sm text-gray-600">{userDetails.language}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Atividade Recente</h4>

            <div className="space-y-3">
              {userDetails.recent_activity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Activity className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(activity.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Estatísticas</h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{userDetails.login_count}</p>
                <p className="text-xs text-gray-600">Total de logins</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">
                  {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                </p>
                <p className="text-xs text-gray-600">Dias como membro</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Permissões do Sistema</h4>

            <div className="space-y-2">
              {userDetails.permissions.map((permission, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{permission}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Configurações de Segurança</h4>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Última alteração de senha</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(userDetails.last_password_change), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function UserProfileDrawer({ user, trigger, onSuccess }: UserProfileDrawerProps) {
  if (!user) return null;

  const initialData: UserProfileFormData = { user };

  const handleSubmit = async (): Promise<void> => {
    // Não há submissão real, apenas visualização
  };

  return (
    <DrawerProvider
      initialData={initialData}
      config={{
        title: 'Perfil do Usuário',
        description: 'Informações detalhadas e histórico de atividades',
        icon: <UserIcon className="h-5 w-5" />,
        direction: 'right',
        resetOnClose: true,
        autoCloseOnSuccess: false,
      }}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
    >
      <StandardDrawer trigger={trigger}>
        <UserProfileContent />
      </StandardDrawer>
    </DrawerProvider>
  );
}
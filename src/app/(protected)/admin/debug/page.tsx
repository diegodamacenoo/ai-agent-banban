'use client';

import { useEffect, useState } from 'react';
import { debugUserInfo } from '@/app/actions/admin/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { AlertTriangle, RefreshCw, User } from 'lucide-react';

export default function AdminDebugPage() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await debugUserInfo();
      
      if (result.error) {
        setError(result.error);
        return;
      }

      setUserInfo(result.data);
    } catch (err) {
      console.error('Erro ao carregar informaÃ§Ãµes do usuÃ¡rio:', err);
      setError('Erro inesperado ao carregar informaÃ§Ãµes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Debug - InformaÃ§Ãµes do UsuÃ¡rio</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Carregando informaÃ§Ãµes do usuÃ¡rio...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Debug - InformaÃ§Ãµes do UsuÃ¡rio</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button onClick={loadUserInfo} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Debug - InformaÃ§Ãµes do UsuÃ¡rio</h1>
          <p className="text-gray-600 mt-1">VerificaÃ§Ã£o detalhada de autenticaÃ§Ã£o e permissÃµes</p>
        </div>
        <Button onClick={loadUserInfo} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* InformaÃ§Ãµes do Auth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados de AutenticaÃ§Ã£o (Supabase Auth)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">ID do UsuÃ¡rio:</label>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {userInfo?.auth_user?.id || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email:</label>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {userInfo?.auth_user?.email || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">App Metadata:</label>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(userInfo?.auth_user?.app_metadata, null, 2)}
              </pre>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">User Metadata:</label>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(userInfo?.auth_user?.user_metadata, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* InformaÃ§Ãµes do Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados do Perfil (Tabela profiles)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">MÃ©todo de Acesso:</label>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {userInfo?.method === 'admin_client' ? 'Cliente Admin (RLS Bypass)' : 'Cliente Normal'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role:</label>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {userInfo?.profile?.role || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status:</label>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {userInfo?.profile?.status || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Organization ID:</label>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {userInfo?.profile?.organization_id || 'N/A (Master Admin)'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Perfil Completo:</label>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(userInfo?.profile, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DiagnÃ³stico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            DiagnÃ³stico de PermissÃµes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>UsuÃ¡rio autenticado:</span>
              <span className={userInfo?.auth_user?.id ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {userInfo?.auth_user?.id ? 'âœ… Sim' : 'âŒ NÃ£o'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>Role no app_metadata:</span>
              <span className={userInfo?.auth_user?.app_metadata?.user_role === 'master_admin' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {userInfo?.auth_user?.app_metadata?.user_role === 'master_admin' ? 'âœ… master_admin' : `âŒ ${userInfo?.auth_user?.app_metadata?.user_role || 'NÃ£o definido'}`}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>Role na tabela profiles:</span>
              <span className={userInfo?.profile?.role === 'master_admin' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {userInfo?.profile?.role === 'master_admin' ? 'âœ… master_admin' : `âŒ ${userInfo?.profile?.role || 'NÃ£o definido'}`}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>Pode acessar admin:</span>
              <span className={userInfo?.auth_user?.app_metadata?.user_role === 'master_admin' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                {userInfo?.auth_user?.app_metadata?.user_role === 'master_admin' ? 'âœ… Sim' : 'âŒ NÃ£o'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 

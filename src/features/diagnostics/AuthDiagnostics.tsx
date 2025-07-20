'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';

export function AuthDiagnostics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<any>(null);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        return;
      }

      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        setError(`Erro ao buscar perfil: ${  profileError.message}`);
        return;
      }
      
      setAuthInfo({
        user,
        profile,
        lastVerified: new Date().toISOString()
      });

    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      setError('Erro inesperado ao verificar autenticação');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Verificando autenticação...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button
            onClick={checkAuth}
            variant="outline"
            className="mt-4"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Autenticação OK
        </CardTitle>
        <CardDescription>
          Usuário autenticado e com permissões corretas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Informações do Usuário</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Email</Badge>
                <span>{authInfo.user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Role</Badge>
                <span>{authInfo.profile.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Status</Badge>
                <span>{authInfo.profile.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Última Verificação</Badge>
                <span>{new Date(authInfo.lastVerified).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Dados do Usuário</h4>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(authInfo.user, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 

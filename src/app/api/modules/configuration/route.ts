/**
 * API para configurações de módulos - FUNCIONANDO
 */

import { NextRequest, NextResponse } from 'next/server';
import { ModuleConfigurationService } from '@/core/modules/services/ModuleConfigurationService';
import { createSupabaseServerClient } from '@/core/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId é obrigatório' },
        { status: 400 }
      );
    }

    // Cliente Supabase autenticado (sem service role key)
    const supabase = await createSupabaseServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar se usuário tem acesso à organização
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil de usuário não encontrado' },
        { status: 403 }
      );
    }
    
    // Verificar se organizationId corresponde à organização do usuário
    if (profile.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Acesso negado à organização solicitada' },
        { status: 403 }
      );
    }
    
    // Usar o ModuleConfigurationService (agora que sabemos que a query funciona)
    const configurations = await ModuleConfigurationService.loadModuleConfigurations(supabase, organizationId);
    
    // Gerar navegação usando o método do serviço
    const navigation = ModuleConfigurationService.generateNavigation(configurations);

    const response = {
      modules: configurations,
      navigation: navigation,
      total: configurations.length,
      organizationId
    };
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao carregar configurações de módulos:', error);
    
    return NextResponse.json({
      modules: [],
      navigation: [],
      total: 0,
      error: 'Erro ao carregar módulos - verifique as configurações no banco de dados'
    }, { status: 500 });
  }
}
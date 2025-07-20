/**
 * API para configurações de módulos - usado pelo DynamicModuleRegistryClient
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

    console.debug(`[API] Carregando configurações para organização: ${organizationId}`);

    // Criar cliente Supabase e passar para o serviço
    const supabase = await createSupabaseServerClient();
    
    // Refatorado: A lógica de determinar client_type foi removida.
    // O serviço agora lida com a busca de módulos de forma agnóstica.
    const configurations = await ModuleConfigurationService.loadModuleConfigurations(supabase, organizationId);
    
    // Gerar navegação usando o método do serviço
    const navigation = ModuleConfigurationService.generateNavigation(configurations);

    const response = {
      modules: configurations,
      navigation: navigation,
      total: configurations.length,
      organizationId
    };

    console.debug(`[API] Retornando ${configurations.length} módulos`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API] Erro ao carregar configurações de módulos:', error);
    
    // Retorna resposta de erro sem módulos fallback
    return NextResponse.json({
      modules: [],
      navigation: [],
      total: 0,
      error: 'Erro ao carregar módulos - verifique as configurações no banco de dados'
    }, { status: 500 });
  }
} 
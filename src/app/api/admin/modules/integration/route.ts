import { NextRequest, NextResponse } from 'next/server';
import { ModuleIntegrationService } from '@/core/services/ModuleIntegrationService';

/**
 * GET - Obtém status da integração dos módulos
 */
export async function GET() {
  try {
    const integrationService = new ModuleIntegrationService();
    const status = await integrationService.getIntegrationStatus();

    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro ao obter status de integração:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * POST - Executa integração dos módulos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'integrate_all';
    
    const integrationService = new ModuleIntegrationService();

    if (action === 'integrate_all') {
      // Integrar todos os módulos Banban
      const result = await integrationService.integrateBanbanModules();
      
      return NextResponse.json({
        success: result.success,
        data: {
          action: 'integrate_all',
          results: result.results,
          summary: {
            total: result.results.length,
            successful: result.results.filter(r => r.registered && r.versioned).length,
            failed: result.results.filter(r => !r.registered || !r.versioned).length,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'reintegrate_module') {
      // Re-integrar módulo específico
      const { moduleId } = body;
      
      if (!moduleId) {
        return NextResponse.json({
          success: false,
          error: 'moduleId é obrigatório para reintegração',
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }

      const result = await integrationService.reintegrateModule(moduleId);
      
      return NextResponse.json({
        success: result.success,
        data: {
          action: 'reintegrate_module',
          moduleId,
          message: result.message,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: false,
      error: `Ação não suportada: ${action}`,
      timestamp: new Date().toISOString(),
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Erro na integração de módulos:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 
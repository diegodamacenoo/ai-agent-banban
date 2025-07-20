import { NextRequest, NextResponse } from 'next/server';
import { moduleDeploymentService } from '@/core/services/ModuleDeploymentService';
import { z } from 'zod';

// Schema para deployment
const DeploymentSchema = z.object({
  organization_id: z.string().uuid(),
  module_id: z.string().uuid(),
  target_version: z.string(),
  deployment_type: z.enum(['install', 'upgrade', 'downgrade']),
  force_deploy: z.boolean().default(false),
  skip_validation: z.boolean().default(false),
  rollback_on_failure: z.boolean().default(true)
});

// Schema para plano de deployment
const DeploymentPlanSchema = z.object({
  organization_id: z.string().uuid(),
  module_id: z.string().uuid(),
  target_version: z.string()
});

// POST: Criar plano de deployment
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'plan') {
      return await handleCreatePlan(request);
    } else if (action === 'execute') {
      return await handleExecuteDeployment(request);
    } else if (action === 'validate') {
      return await handleValidateDeployment(request);
    } else {
      return NextResponse.json(
        { error: 'Ação inválida. Use: plan, execute, ou validate' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Erro na API de deployment:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Criar plano de deployment
async function handleCreatePlan(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, module_id, target_version } = DeploymentPlanSchema.parse(body);

    const plan = await moduleDeploymentService.createDeploymentPlan(
      organization_id,
      module_id,
      target_version
    );

    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Plano de deployment criado com sucesso'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Erro ao criar plano',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Executar deployment
async function handleExecuteDeployment(request: NextRequest) {
  try {
    const body = await request.json();
    const deploymentRequest = DeploymentSchema.parse(body);

    const result = await moduleDeploymentService.deployModule(deploymentRequest);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Deployment ${result.status === 'completed' ? 'concluído' : 'iniciado'} com sucesso`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Erro durante deployment',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Validar deployment
async function handleValidateDeployment(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, module_id, target_version } = DeploymentPlanSchema.parse(body);

    const validationResults = await moduleDeploymentService.validateDeployment(
      organization_id,
      module_id,
      target_version
    );

    const hasErrors = validationResults.some(r => r.type === 'error' && r.blocking);
    const hasWarnings = validationResults.some(r => r.type === 'warning');

    return NextResponse.json({
      success: true,
      data: {
        validation_results: validationResults,
        is_valid: !hasErrors,
        has_warnings: hasWarnings,
        summary: {
          total_checks: validationResults.length,
          errors: validationResults.filter(r => r.type === 'error').length,
          warnings: validationResults.filter(r => r.type === 'warning').length,
          info: validationResults.filter(r => r.type === 'info').length
        }
      },
      message: hasErrors 
        ? 'Validação falhou - deployment bloqueado'
        : hasWarnings 
          ? 'Validação passou com avisos'
          : 'Validação passou sem problemas'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Erro durante validação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// GET: Buscar histórico de deployments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const moduleId = searchParams.get('module_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Por enquanto, retornar dados mockados
    const mockDeployments = [
      {
        id: '1',
        organization_id: organizationId || 'uuid-1',
        module_id: moduleId || 'banban-insights',
        version: '2.1.0',
        status: 'completed',
        deployment_type: 'upgrade',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        validation_results: [],
        migration_logs: ['Migration completed successfully']
      }
    ];

    let filteredDeployments = mockDeployments;
    
    if (status) {
      filteredDeployments = filteredDeployments.filter(d => d.status === status);
    }

    return NextResponse.json({
      success: true,
      data: filteredDeployments.slice(0, limit),
      total: filteredDeployments.length,
      pagination: {
        limit,
        offset: 0,
        has_more: filteredDeployments.length > limit
      }
    });

  } catch (error) {
    console.error('Erro ao buscar deployments:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 
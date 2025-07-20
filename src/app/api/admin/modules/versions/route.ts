import { NextRequest, NextResponse } from 'next/server';
import { moduleVersioningService } from '@/core/services/ModuleVersioningService';
import { z } from 'zod';

// Schema para criação de versão
const CreateVersionSchema = z.object({
  module_id: z.string().uuid(),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/, 'Versão deve seguir formato semântico'),
  changelog: z.string().optional(),
  migration_scripts: z.array(z.string()).optional(),
  breaking_changes: z.boolean().default(false),
  status: z.enum(['draft', 'testing', 'released', 'deprecated']).default('draft'),
  is_stable: z.boolean().default(false),
  is_latest: z.boolean().default(false)
});

// GET: Listar versões de um módulo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('module_id');

    if (!moduleId) {
      return NextResponse.json(
        { error: 'module_id é obrigatório' },
        { status: 400 }
      );
    }

    const versions = await moduleVersioningService.getModuleVersions(moduleId);
    
    return NextResponse.json({
      success: true,
      data: versions,
      total: versions.length
    });

  } catch (error) {
    console.error('Erro ao buscar versões:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// POST: Criar nova versão
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateVersionSchema.parse(body);

    const newVersion = await moduleVersioningService.createVersion(validatedData);

    return NextResponse.json({
      success: true,
      data: newVersion,
      message: `Versão ${newVersion.version} criada com sucesso`
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar versão:', error);
    
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
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { token } = await params;
    const supabase = await createSupabaseServerClient();

    // Verificar se o token é válido
    const { data: deletionRequest, error: deletionError } = await supabase
      .from('deletion_requests')
      .select('*')
      .eq('token', token)
      .single();

    if (deletionError || !deletionRequest) {
      return NextResponse.json(
        { error: 'Token de confirmação inválido ou expirado' },
        { status: 400 }
      );
    }

    // Atualizar o status da solicitação de exclusão
    await supabase
      .from('deletion_requests')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('token', token);

    return NextResponse.json({ message: 'Exclusão confirmada com sucesso' });
  } catch (error) {
    console.error('Erro ao confirmar exclusão:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a confirmação de exclusão' },
      { status: 500 }
    );
  }
}

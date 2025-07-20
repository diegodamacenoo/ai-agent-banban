import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';

export async function GET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extrair a versão da API da URL
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const version = segments[2]; // /api/v1/route/[...segments]

    // Retornar informações sobre a versão da API
    return NextResponse.json({
      version,
      status: 'ACTIVE',
      user: user.email,
    });
  } catch (error) {
    console.error('Error handling API request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

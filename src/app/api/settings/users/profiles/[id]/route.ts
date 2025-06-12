import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const perfilSchema = z.object({
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  username: z.string().nullable(),
  role: z.enum(['organization_admin', 'editor', 'viewer', 'visitor']),
  job_title: z.string().nullable(),
  team: z.string().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']),
  is_2fa_enabled: z.boolean(),
  prefers_email_notifications: z.boolean(),
  prefers_push_notifications: z.boolean(),
  theme: z.string(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createRouteHandlerClient({ cookies: async () => await cookies() });

    // Verifica se o usuário está autenticado
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session.session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', session.session.user.id)
      .single();

    if (!userProfile || userProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userProfile.organization_id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createRouteHandlerClient({ cookies: async () => await cookies() });

    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session.session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', session.session.user.id)
      .single();

    if (!userProfile || userProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Obtém os dados do corpo da requisição
    const body = await request.json();
    // Valida os dados do corpo da requisição
    const validatedData = perfilSchema.parse(body);

    // Busca o perfil do usuário
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', id)
      .single();

    // Verifica se o perfil do usuário foi encontrado e se pertence ao mesmo organização
    if (!targetProfile || targetProfile.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Atualiza o perfil do usuário
    const { data, error } = await supabase
      .from('profiles')
      .update(validatedData)
      .eq('id', id)
      .eq('organization_id', userProfile.organization_id)
      .select()
      .single();

    // Verifica se houve um erro na atualização
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createRouteHandlerClient({ cookies: async () => await cookies() });

    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session.session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', session.session.user.id)
      .single();

    if (!userProfile || userProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!targetProfile || targetProfile.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', userProfile.organization_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
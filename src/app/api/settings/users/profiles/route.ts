import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseClient } from '@/lib/supabase/server';

const perfilSchema = z.object({
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  username: z.string().nullable(),
  role: z.enum(['organization_admin', 'standard_user']),
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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', sessionData.session.user.id)
      .single();

    if (!userProfile || userProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', userProfile.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profiles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', sessionData.session.user.id)
      .single();

    if (!userProfile || userProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = perfilSchema.parse(body);

    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          ...validatedData,
          organization_id: userProfile.organization_id,
        },
      ])
      .select()
      .single();

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

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', sessionData.session.user.id)
      .single();

    if (!userProfile || userProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const body = await request.json();
    const validatedData = perfilSchema.parse(body);

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!targetProfile || targetProfile.organization_id !== userProfile.organization_id) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(validatedData)
      .eq('id', id)
      .eq('organization_id', userProfile.organization_id)
      .select()
      .single();

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

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', sessionData.session.user.id)
      .single();

    if (!userProfile || userProfile.role !== 'organization_admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

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
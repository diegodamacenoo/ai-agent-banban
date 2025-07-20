import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/core/supabase/server';
import { withRateLimit } from '@/core/api/rate-limiter';

const perfilSchema = z.object({
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  username: z.string().nullable(),
  role: z.enum(['master_admin', 'organization_admin', 'standard_user']),
  job_title: z.string().nullable(),
  team: z.string().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'DELETED']),
  is_2fa_enabled: z.boolean(),
  prefers_email_notifications: z.boolean(),
  prefers_push_notifications: z.boolean(),
  theme: z.string(),
  phone: z.string().nullable(),
  location: z.string().nullable(),
});

export async function GET() {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'profiles-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[API /profiles] Unauthorized attempt: No user session found.');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.debug(`[API /profiles] Authenticated user: ${user.id}. Fetching profile...`);

    const { data: userProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .limit(1);

    if (profileError) {
      console.error(`[API /profiles] Supabase error fetching profile for user ${user.id}:`, profileError);
      return NextResponse.json({ error: 'Erro de banco de dados ao buscar perfil.' }, { status: 500 });
    }

    if (!userProfiles || userProfiles.length === 0) {
      console.error(`[API /profiles] CRITICAL: Profile not found for authenticated user ${user.id}.`);
      return NextResponse.json({ error: 'Perfil de usuário não encontrado.' }, { status: 404 });
    }

    // Se há múltiplos perfis, logar o problema e usar o primeiro
    if (userProfiles.length > 1) {
      console.warn(`[API /profiles] Multiple profiles found for user ${user.id}. Using first. Total: ${userProfiles.length}`);
    }

    const userProfile = userProfiles[0];
    console.debug(`[API /profiles] Profile data for user ${user.id}:`, userProfile);

    if (userProfile.role !== 'organization_admin') {
      console.warn(`[API /profiles] Access denied for user ${user.id} with role: ${userProfile.role}`);
      return NextResponse.json({ error: 'Acesso negado. Permissões insuficientes.' }, { status: 403 });
    }
    
    if (!userProfile.organization_id) {
        console.error(`[API /profiles] CRITICAL: User ${user.id} (role: ${userProfile.role}) has no organization_id.`);
        return NextResponse.json({ error: 'Usuário não está associado a uma organização.' }, { status: 500 });
    }

    console.debug(`[API /profiles] User ${user.id} authorized. Fetching profiles for org: ${userProfile.organization_id}`);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', userProfile.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`[API /profiles] Supabase error fetching profiles:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.debug(`[API /profiles] Successfully fetched ${profiles.length} profiles.`);
    return NextResponse.json(profiles);
  } catch (error: any) {
    console.error('[API /profiles] Unhandled exception in GET handler:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'profiles-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['master_admin', 'organization_admin'].includes(userProfile.role)) {
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
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'profiles-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['master_admin', 'organization_admin'].includes(userProfile.role)) {
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
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'profiles-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const supabase = await createSupabaseServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (!userProfile || !['master_admin', 'organization_admin'].includes(userProfile.role)) {
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
      .delete()
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

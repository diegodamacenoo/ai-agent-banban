'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { safeGetUser } from '@/core/supabase/auth-helpers';
import { SidebarProvider } from "@/shared/ui/sidebar";
import { AdminSidebar } from './components/admin-sidebar';
import { Skeleton } from '@/shared/ui/skeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const supabase = createSupabaseBrowserClient();

  // Verificar se o usuário é master admin
  useEffect(() => {
    const checkMasterAdmin = async () => {
      try {
        const { user, error: userError } = await safeGetUser();
        if (userError || !user) {
          router.push('/auth/login');
          return;
        }

        // Verificar se é master admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
          return;
        }

        const isMaster = profile?.role === 'master_admin';
        setIsMasterAdmin(isMaster);
        setLoading(false);

      } catch (error) {
        console.error('Erro ao verificar master admin:', error);
      }
    };

    checkMasterAdmin();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen">
        <AdminSidebar />
        <main className="w-full overflow-y-auto bg-[hsl(var(--background))]">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

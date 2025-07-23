'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { safeGetUser } from '@/core/supabase/auth-helpers';
import { SidebarProvider, SIDEBAR_WIDTH } from "@/shared/ui/sidebar";
import { AdminSidebar } from './components/admin-sidebar';
import { AdminNavbar } from './components/admin-navbar';
import { Skeleton } from '@/shared/ui/skeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);

  // Criar o cliente Supabase uma vez, fora do useEffect
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

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
          setLoading(false);
          return;
        }

        const isMaster = profile?.role === 'master_admin';
        setIsMasterAdmin(isMaster);

        // Master admin não precisa de organização
        if (!isMaster) {
          router.push('/');
          return;
        }

        setLoading(false);

      } catch (error) {
        console.error('Erro ao verificar master admin:', error);
        setLoading(false);
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

  if (!isMasterAdmin) {
    return null;
  }

  return (
    <div 
      className="h-screen bg-[hsl(var(--background))] overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateRows: '4rem 1fr',
        gridTemplateColumns: `${SIDEBAR_WIDTH} 1fr`
      }}
    >
      {/* Navbar Superior - ocupa ambas as colunas */}
      <header style={{ gridColumn: '1 / -1' }}>
        <AdminNavbar />
      </header>
      
      {/* Sidebar Lateral */}
      <aside 
        className="bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--border))] flex flex-col"
        style={{ height: '100%' }}
      >
        <AdminSidebar className="flex-1" />
      </aside>
      
      {/* Conteúdo Principal */}
      <main className="overflow-y-auto bg-[hsl(var(--background))]">
        {children}
      </main>
    </div>
  );
}
'use client';

import { usePathname } from 'next/navigation';
import { Crown, ChevronRight } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  userProfile: any;
}

export function AdminHeader({ userProfile }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: { label: string; href: string; isLast?: boolean }[] = [];

    if (segments.length === 1 && segments[0] === 'admin') {
      return [{ label: 'Dashboard', href: '/admin', isLast: true }];
    }

    // Mapear segmentos para labels mais amigÃ¡veis
    const segmentLabels: Record<string, string> = {
      admin: 'Admin',
      organizations: 'OrganizaÃ§Ãµes',
      users: 'UsuÃ¡rios',
      create: 'Criar',
      edit: 'Editar',
      analytics: 'Analytics',
      audit: 'Auditoria',
      settings: 'ConfiguraÃ§Ãµes'
    };

    let currentPath = '';
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;
      
      // Pular IDs (assumindo que sÃ£o UUIDs ou nÃºmeros)
      if (segment.match(/^[a-f0-9-]{36}$/) || segment.match(/^\d+$/)) {
        continue;
      }

      breadcrumbs.push({
        label: segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
        isLast: i === segments.length - 1
      });
    }

    return breadcrumbs;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm">
          <Crown className="h-4 w-4 text-red-600" />
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />}
              <span
                className={
                  crumb.isLast
                    ? "font-medium text-gray-900"
                    : "text-gray-500 hover:text-gray-700 cursor-pointer"
                }
              >
                {crumb.label}
              </span>
            </div>
          ))}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
            Admin Master
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 h-10 px-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback className="bg-red-100 text-red-700">
                    {userProfile?.first_name?.charAt(0)}{userProfile?.last_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-medium">
                    {userProfile?.first_name} {userProfile?.last_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {userProfile?.email}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                ConfiguraÃ§Ãµes Pessoais
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/')}>
                Voltar ao Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 

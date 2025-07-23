'use client';

import React, { useState, useCallback } from 'react';
import { useUser } from '@/shared/hooks/use-user';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/shared/utils/utils';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/shared/ui/breadcrumb';
import {
  Home,
  Package,
  Building2,
  BarChart3,
  Bell,
  Settings,
  User,
  LogOut,
  HelpCircle,
  ChevronDown,
  Sparkle
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { createSupabaseBrowserClient } from '@/core/supabase/client';

interface BreadcrumbItemDef {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string, strokeWidth?: number }>;
}

interface ProcessedUserData {
  displayName: string;
  displayEmail: string;
  avatarUrl: string | null;
  fullName: string;
}

function useUserData() {
  const { user, profile } = useUser();

  const processUserData = useCallback((user: any, profile: any): ProcessedUserData => {
    const displayName = profile?.first_name || user.email?.split('@')[0] || 'Usuário';
    const displayEmail = user.email || 'email@exemplo.com';
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
    const fullName = profile?.first_name && profile?.last_name 
      ? `${profile.first_name} ${profile.last_name}` 
      : displayName;

    return { displayName, displayEmail, avatarUrl, fullName };
  }, []);

  const userData = user ? processUserData(user, profile) : null;
  return { userData };
}

function generateBreadcrumbs(pathname: string): BreadcrumbItemDef[] {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length < 2 || segments[0] !== 'admin') {
    return [{ title: 'Dashboard', href: '/admin', icon: Home }];
  }

  const breadcrumbs: BreadcrumbItemDef[] = [
    { title: 'Dashboard', href: '/admin', icon: Home }
  ];

  if (segments[1] === 'modules') {
    breadcrumbs.push({ title: 'Módulos', icon: Package });
    
    if (segments[2] === 'management') {
      breadcrumbs.push({ title: 'Gestão de Módulos' });
    } else if (segments[2] === 'development') {
      breadcrumbs.push({ title: 'Desenvolvimento' });
    } else if (segments[2] === 'statistics') {
      breadcrumbs.push({ title: 'Estatísticas' });
    } else if (segments[2] === 'legacy') {
      breadcrumbs.push({ title: 'Versão Legacy' });
    }
  } else if (segments[1] === 'organizations') {
    breadcrumbs.push({ title: 'Organizações', icon: Building2 });
  } else if (segments[1] === 'analytics') {
    breadcrumbs.push({ title: 'Analytics', icon: BarChart3 });
  } else if (segments[1] === 'users') {
    breadcrumbs.push({ title: 'Usuários', icon: Building2 });
  }

  return breadcrumbs;
}

function AdminBreadcrumbs() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink href={item.href} className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]">
                  {item.icon && index === 0 && <item.icon className="h-4 w-4" strokeWidth={2.3} />}
                  {item.title}
                </BreadcrumbLink>
              ) : (
                <div className="flex items-center gap-2">
                  {item.icon && index === 0 && <item.icon className="h-4 w-4 text-[hsl(var(--foreground))]" strokeWidth={2.3} />}
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]/60">{item.title}</span>
                </div>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function UserDropdown({ userData, onLogout }: { userData: ProcessedUserData; onLogout: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 hover:bg-[hsl(var(--accent))]"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={userData.avatarUrl || undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
              {userData.fullName.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline">
            {userData.displayName}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <div className="text-sm font-medium">{userData.fullName}</div>
          <div className="text-xs text-muted-foreground">{userData.displayEmail}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={User}>
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem icon={HelpCircle}>
          Help & Support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} icon={LogOut} >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AdminNavbarProps {
  className?: string;
}

export function AdminNavbar({ className }: AdminNavbarProps) {
  const router = useRouter();
  const { userData } = useUserData();

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      router.push('/login');
    }
  };

  const displayData = userData || {
    displayName: 'Usuário',
    displayEmail: 'user@example.com',
    avatarUrl: null,
    fullName: 'Usuário'
  };

  return (
    <header className={cn(
      "h-16 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] px-4",
      className
    )}>
      <div className="flex items-center justify-between h-full">
        {/* Logo e Breadcrumbs */}
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkle className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-[hsl(var(--foreground))]">Axon</h1>
              <p className="text-xs text-muted-foreground">Painel de Controle</p>
            </div>
          </Link>
          
          <div className="h-6 w-px bg-[hsl(var(--border))] hidden md:block" />
          
          <div className="hidden md:block">
            <AdminBreadcrumbs />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <UserDropdown userData={displayData} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
}
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createSupabaseClient } from "@/lib/supabase/client";
import { BellIcon, ChevronDown, LogOutIcon, SettingsIcon, UserCircleIcon } from "lucide-react";
import { useRouter } from 'next/navigation';
import * as React from "react";
import { SettingsDialog } from "@/app/(protected)/settings/settings-dialog";

interface HeaderUserMenuProps {
    userData: {
        id: string;
        email: string;
        name: string | null;
        avatar: string | null;
    };
}

export function HeaderUserMenu({ userData }: HeaderUserMenuProps) {
    const router = useRouter();
    const supabase = createSupabaseClient();
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const userName = userData.name || 'Usuário';
    const userAvatar = userData.avatar || 'https://github.com/shadcn.png';
    const userFallback = userName.charAt(0).toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild >
                <Button
                    size="lg"
                    variant="ghost"
                    className="flex items-center gap-2 p-2 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-muted"
                >
                    <Avatar className="h-8 w-8 rounded-lg grayscale">
                        <AvatarImage src={userAvatar} alt={userName} />
                        <AvatarFallback className="rounded-lg">{userFallback}</AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{userName}</span>
                        <span className="truncate text-xs text-muted-foreground">
                            {userData.email}
                        </span>
                    </div>
                    <ChevronDown className="ml-auto size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-lg">
                <DropdownMenuLabel className="truncate">
                    <div className="font-medium">{userName}</div>
                    <div className="text-xs text-muted-foreground font-normal truncate">
                        {userData.email}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    {/* TODO: Implementar rotas/ações */}
                    <DropdownMenuItem>
                        <UserCircleIcon className="mr-2 h-4 w-4" />
                        <span>Conta</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setIsSettingsDialogOpen(true)}>
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        <span>Configurações</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            <SettingsDialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen} />
        </DropdownMenu>
    );
} 
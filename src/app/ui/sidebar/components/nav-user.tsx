"use client"

import * as React from "react";
import {
    BellIcon,
    LogOutIcon,
    SettingsIcon,
    UserCircleIcon,
    ChevronsUpDown,
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useState, memo, useCallback } from 'react';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { SettingsDialog } from "@/app/(protected)/settings/settings-dialog"
import { NavNotifications } from "./nav-notifications";

interface UserData {
    id: string;
    email: string;
    name: any;
    avatar: any;
}

interface NavUserProps {
    userData: UserData;
}

export const NavUser = memo(function NavUser({ userData }: NavUserProps) {
    const { isMobile } = useSidebar()
    const router = useRouter()
    const supabase = createSupabaseClient()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const handleLogout = useCallback(async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }, [supabase.auth, router])

    const handleSettingsOpen = useCallback(() => {
        setIsSettingsOpen(true)
    }, [])

    const handleSettingsClick = useCallback((e: Event) => {
        e.preventDefault()
        setIsSettingsOpen(true)
    }, [])

    return (
        <>
            <SidebarMenu>
                <SidebarMenuItem className="flex items-center gap-2">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <Avatar className="h-8 w-8 rounded-lg grayscale">
                                    <AvatarImage src={userData.avatar} alt={userData.name} />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{userData.name}</span>
                                </div>
                                <ChevronsUpDown className="ml-auto !size-4" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <UserCircleIcon />
                                    Account
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleSettingsClick}>
                                    <SettingsIcon />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <BellIcon />
                                    Notifications
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={handleLogout}>
                                <LogOutIcon className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <NavNotifications />
                </SidebarMenuItem>
            </SidebarMenu>
            <SettingsDialog 
                open={isSettingsOpen} 
                onOpenChange={setIsSettingsOpen} 
            />
        </>
    )
})

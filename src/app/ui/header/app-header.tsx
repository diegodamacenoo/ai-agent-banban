"use client"

import { Menu } from "lucide-react";
import { HeaderLogo } from "./components/header-logo";
import { HeaderMenu } from "./components/header-menu";
import { HeaderNotifications } from "./components/header-notifications";
import { HeaderUserMenu } from "./components/header-user-menu";

interface AppHeaderProps {
    userData: {
        id: string;
        email: string;
        name: string | null;
        avatar: string | null;
    };
}

export default function AppHeader({ userData }: AppHeaderProps) {

    return (
        <header className="flex items-center justify-between p-4 h-16 border-b bg-zinc-100 dark:bg-zinc-950">
            {/* Esquerda: Logo */}
            <HeaderLogo />

            {/* Centro: Menu */}
            <HeaderMenu />

            {/* Direita: NotificaÃ§Ãµes, Menu UsuÃ¡rio, BotÃ£o Mobile */}
            <div className="flex items-center gap-2">
                <HeaderNotifications />
                <HeaderUserMenu userData={userData} />

                {/* BotÃ£o de Menu para Mobile (opcional) */}
                {/* TODO: Implementar lÃ³gica para abrir/fechar menu mobile */}
                <button className="md:hidden p-2">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir menu</span>
                </button>
            </div>
        </header>
    );
}

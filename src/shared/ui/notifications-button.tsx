"use client";

import { Bell } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export function NotificationsButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Notificações</span>
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
            2
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Nova mensagem</p>
              <p className="text-xs text-muted-foreground">
                VocÃª recebeu uma nova mensagem
              </p>
              <p className="text-xs text-muted-foreground">Há 5 minutos</p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Alerta de sistema</p>
              <p className="text-xs text-muted-foreground">
                Atualização disponível
              </p>
              <p className="text-xs text-muted-foreground">Há 1 hora</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center">
          Ver todas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 

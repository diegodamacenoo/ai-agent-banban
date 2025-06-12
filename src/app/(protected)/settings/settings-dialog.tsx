import * as React from "react"
import {
  BellIcon,
  DatabaseIcon,
  ShieldIcon,
  UserIcon,
  UsersIcon,
  BuildingIcon,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SectionErrorBoundary } from "@/components/ui/error-boundary"

const data = {
  nav: [
    { name: "Conta", icon: UserIcon },
    { name: "Usuários", icon: UsersIcon },
    { name: "Segurança", icon: ShieldIcon },
    { name: "Notificações", icon: BellIcon },
    { name: "Controle de Dados", icon: DatabaseIcon },
    { name: "Organização", icon: BuildingIcon },
  ],
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import SettingsConta from "./components/settings-conta";
import SettingsUsuarios from "./components/settings-usuarios";
import SettingsSeguranca from "./components/settings-seguranca";
import SettingsNotificacoes from "./components/settings-notificacoes";
import SettingsControleDados from "./components/settings-controle-dados";
import { PerfilUsuarioProvider } from "./contexts/perfis-context";
import SettingsOrganizacao from "./components/settings-organizacao";

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  // Estado local para selecionar o item do menu
  const [selected, setSelected] = React.useState(data.nav[0].name);

  return (
    <PerfilUsuarioProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="overflow-hidden p-0 md:max-h-[700px] md:max-w-[700px] lg:max-w-[1080px] lg:rounded-xl">
          <DialogTitle className="sr-only">Configurações</DialogTitle>
          <DialogDescription className="sr-only">
            Configure as preferências do sistema.
          </DialogDescription>
          <SidebarProvider className="items-start">
            <Sidebar collapsible="none" className="hidden md:flex w-[200px] border-r">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {data.nav.map((item) => (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton
                            asChild
                            isActive={selected === item.name}
                            onClick={() => setSelected(item.name)}
                          >
                            <a href="#">
                              <item.icon />
                              <span>{item.name}</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
            <main className="flex h-[700px] flex-1 flex-col overflow-hidden bg-zinc-50">
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
                <SectionErrorBoundary sectionName="Configurações">
                  {(() => {
                    switch (selected) { 
                      case "Conta":
                        return <SettingsConta />;
                      case "Usuários":
                        return <SettingsUsuarios />;
                      case "Segurança":
                        return <SettingsSeguranca />;
                      case "Notificações":
                        return <SettingsNotificacoes />;
                      case "Controle de Dados":
                        return <SettingsControleDados />;
                      case "Organização":
                        return <SettingsOrganizacao />;
                      default:
                        return null;
                    }
                  })()}
                </SectionErrorBoundary>
              </div>
            </main>
          </SidebarProvider>
        </DialogContent>
      </Dialog>
    </PerfilUsuarioProvider>
  );
} 
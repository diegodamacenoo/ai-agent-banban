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
} from "@/shared/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/shared/ui/sidebar"
import { SectionErrorBoundary } from "@/shared/ui/error-boundary"
import { useUser } from "@/app/contexts/UserContext"

const data = {
  nav: [
    { name: "Conta", icon: UserIcon },
    { name: "UsuÃ¡rios", icon: UsersIcon },
    { name: "SeguranÃ§a", icon: ShieldIcon },
    { name: "NotificaÃ§Ãµes", icon: BellIcon },
    { name: "Controle de Dados", icon: DatabaseIcon },
    { name: "OrganizaÃ§Ã£o", icon: BuildingIcon },
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
  const { userData } = useUser();
  const [selected, setSelected] = React.useState(data.nav[0].name);

  const navItems = data.nav.filter(item => {
    if (item.name === "UsuÃ¡rios" && userData?.role === "master_admin") {
      return false;
    }
    return true;
  });

  React.useEffect(() => {
    if (userData?.role === "master_admin" && selected === "UsuÃ¡rios") {
      setSelected("Conta");
    }
  }, [userData, selected]);

  return (
    <PerfilUsuarioProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="overflow-hidden p-0 md:max-h-[700px] md:max-w-[700px] lg:max-w-[1080px] lg:rounded-xl">
          <DialogTitle className="sr-only">ConfiguraÃ§Ãµes</DialogTitle>
          <DialogDescription className="sr-only">
            Configure as preferÃªncias do sistema.
          </DialogDescription>
          <SidebarProvider className="items-start">
            <Sidebar collapsible="none" className="hidden md:flex w-[200px] border-r">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {navItems.map((item) => (
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
                <SectionErrorBoundary sectionName="ConfiguraÃ§Ãµes">
                  {(() => {
                    switch (selected) { 
                      case "Conta":
                        return <SettingsConta />;
                      case "UsuÃ¡rios":
                        return <SettingsUsuarios />;
                      case "SeguranÃ§a":
                        return <SettingsSeguranca />;
                      case "NotificaÃ§Ãµes":
                        return <SettingsNotificacoes />;
                      case "Controle de Dados":
                        return <SettingsControleDados />;
                      case "OrganizaÃ§Ã£o":
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

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar-provider"
import { AppSidebar } from "@/app/ui/sidebar/sidebar"
import { getCachedUserProps } from "@/lib/auth/getUserData"
import MFACheck from "@/app/auth/components/mfa-check"
// import { ChatDrawer } from "@/components/ChatDrawer" // Botão flutuante removido
import { TooltipProvider } from "@/components/ui/tooltip"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  await getCachedUserProps();

  return (
    // <><div className="flex flex-col h-screen">
    //   <AppHeader userData={await getCachedUserProps()} />
    //   <div className="flex-1 overflow-auto">
    //     {children}
    //   </div>
    // </div>
    <MFACheck>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar userData={await getCachedUserProps()} /> 
          <div className="flex-1 overflow-auto">
            {children}
          </div>
          {/* <ChatDrawer /> */}
        </SidebarProvider>
      </TooltipProvider>
    </MFACheck>
  )
}

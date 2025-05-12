import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/app/ui/sidebar/sidebar"
import { getCachedUserProps } from "@/lib/auth/getUserData"

export default async function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  await getCachedUserProps();

  return (
    <SidebarProvider>
      <AppSidebar userData={await getCachedUserProps()} />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

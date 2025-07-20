import { getCachedUserProps } from "@/core/auth/getUserData"
import MFACheck from "@/app/auth/components/mfa-check"
import { OrganizationProvider } from '@/core/contexts/OrganizationContext'
import ProtectedLayoutClient from "./ProtectedLayoutClient"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const userData = await getCachedUserProps();

  return (
    <MFACheck>
      <OrganizationProvider>
        <ProtectedLayoutClient userData={userData}>
          {children}
        </ProtectedLayoutClient>
      </OrganizationProvider>
    </MFACheck>
  )
}

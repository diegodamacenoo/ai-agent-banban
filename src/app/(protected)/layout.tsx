import { getCachedUserProps } from "@/core/auth/getUserData"
import MFACheck from "@/app/auth/components/mfa-check"
import ProtectedLayoutClient from "./ProtectedLayoutClient"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const userData = await getCachedUserProps();

  return (
    <MFACheck>
      <ProtectedLayoutClient userData={userData}>
        {children}
      </ProtectedLayoutClient>
    </MFACheck>
  )
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { UserProvider } from "@/app/contexts/UserContext";
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import InitDebug from "./init-debug";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Agente IA BanBan",
  description: "Agente IA BanBan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <UserProvider>
          <PageErrorBoundary>
            {children}
          </PageErrorBoundary>
          <Toaster />
          <SonnerToaster />
          <InitDebug />
        </UserProvider>
      </body>
    </html>
  );
}
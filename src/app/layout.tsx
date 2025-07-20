import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider, Toaster } from "@/shared/ui/toast";
import { UserProvider } from "@/app/contexts/UserContext";
import { PageErrorBoundary } from "@/shared/ui/error-boundary";
import { ThemeProvider } from "@/shared/ui/theme-provider";
import { OrganizationProvider } from "@/core/contexts/OrganizationContext";
import InitDebug from "./init-debug";
import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  weight: ['400', '500', '700'],
  variable: "--font-geist",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    template: "%s | Axon",
    default: "Axon - Plataforma de Agentes IA"
  },
  description: "Plataforma modular de agentes de IA para integraÃ§Ã£o com sistemas legados",
  applicationName: "Axon",
  authors: [{ name: "Axon Team" }],
  keywords: ["agentes ia", "automaÃ§Ã£o", "insights", "integraÃ§Ã£o", "sistemas legados"],
  robots: {
    index: false,
    follow: false
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
        >
          <ToastProvider>
            <UserProvider>
              <OrganizationProvider>
                <PageErrorBoundary>
                  {children}
                </PageErrorBoundary>
                <Toaster position="bottom-right" />
                <InitDebug />
              </OrganizationProvider>
            </UserProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

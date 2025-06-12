"use client";

import { SidebarProvider as SidebarProviderComponent, SidebarInset as SidebarInsetComponent } from "./sidebar";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <SidebarProviderComponent>{children}</SidebarProviderComponent>;
}

export function SidebarInset({ children }: { children: React.ReactNode }) {
  return <SidebarInsetComponent>{children}</SidebarInsetComponent>;
} 
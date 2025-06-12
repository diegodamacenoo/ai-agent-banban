"use client";

import React from "react";

// Este provider serve como um wrapper para notificações
// Por enquanto, só envolvemos os children já que estamos usando o toast do shadcn
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
} 
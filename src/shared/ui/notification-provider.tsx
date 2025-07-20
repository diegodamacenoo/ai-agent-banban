"use client";

import React from "react";

// Este provider serve como um wrapper para notificaÃ§Ãµes
// Por enquanto, sÃ³ envolvemos os children jÃ¡ que estamos usando o toast do shadcn
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
} 

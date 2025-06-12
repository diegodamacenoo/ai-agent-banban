"use client"

import { createContext, useContext, memo } from 'react'
import { usePathname } from 'next/navigation'

interface SidebarContextProps {
  pathname: string
}

const SidebarContext = createContext<SidebarContextProps | null>(null)

export const useSidebarContext = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarContextProvider')
  }
  return context
}

interface SidebarContextProviderProps {
  children: React.ReactNode
}

export const SidebarContextProvider = memo(function SidebarContextProvider({ 
  children 
}: SidebarContextProviderProps) {
  const pathname = usePathname()
  
  return (
    <SidebarContext.Provider value={{ pathname }}>
      {children}
    </SidebarContext.Provider>
  )
}) 
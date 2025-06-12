"use client"

import * as React from "react"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import clsx from "clsx"
import { memo, useMemo } from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { useSidebarContext } from "../contexts/sidebar-context"

interface NavItem {
  readonly title: string
  readonly url: string
}

interface NavSecondaryProps {
  items: readonly NavItem[]
}

export const NavSecondary = memo(function NavSecondary({
  items,
  ...props
}: NavSecondaryProps & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { pathname } = useSidebarContext()
  
  const renderedItems = useMemo(() => {
    return items.map((item) => {
      const isActive = pathname === item.url
      
      return (
        <SidebarMenuItem key={item.title}>
          <Link href={item.url} prefetch={true}>
            <SidebarMenuButton
              className={clsx({ 
                "bg-accent text-accent-foreground": isActive 
              })}
            >
              <span>{item.title}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      )
    })
  }, [items, pathname])

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {renderedItems}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
})

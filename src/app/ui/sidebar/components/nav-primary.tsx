"use client"

import Link from "next/link"
import { MailIcon, PlusCircleIcon, type LucideIcon } from "lucide-react"
import clsx from "clsx"
import { memo, useMemo } from "react"

import { Button } from "@/shared/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar"
import { useSidebarContext } from "../contexts/sidebar-context"

interface NavItem {
  readonly title: string
  readonly url: string
  readonly icon?: LucideIcon
}

interface NavPrimaryProps {
  items: readonly NavItem[]
}

export const NavPrimary = memo(function NavPrimary({ items }: NavPrimaryProps) {
  const { pathname } = useSidebarContext()

  const renderedItems = useMemo(() => {
    return items.map((item) => {
      const isActive = pathname === item.url
      
      return (
        <SidebarMenuItem key={item.title}>
          <Link href={item.url} prefetch={true}>
            <SidebarMenuButton
              tooltip={item.title}
              className={clsx({ 
                "bg-accent text-accent-foreground": isActive 
              })}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      )
    })
  }, [items, pathname])

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {renderedItems}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
})

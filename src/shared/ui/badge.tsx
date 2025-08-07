"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

const badgeVariants = cva(
  "flex items-center justify-center w-fit gap-1.5 rounded-[calc(var(--radius)-4px)] border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(var(--highlight))] text-[hsl(var(--secondary-foreground))] focus-visible:ring-[hsl(var(--ring))]",
        secondary:
          "border-transparent bg-[hsl(var(--card))] text-[hsl(var(--secondary-foreground))] focus-visible:ring-[hsl(var(--ring))]",
        destructive:
          "border-transparent bg-[hsl(var(--light-destructive))] focus-visible:ring-[hsl(var(--ring))] shadow-sm/2",
        outline:
          "border-[hsl(var(--border))] text-[hsl(var(--foreground))] focus-visible:ring-[hsl(var(--ring))] shadow-sm/2",
        ghost:
          "border-transparent text-[hsl(var(--foreground))] focus-visible:ring-[hsl(var(--ring))]",
        success:
          "border-transparent bg-[hsl(var(--light-success))] focus-visible:ring-[hsl(var(--ring))] shadow-sm/2",
        warning:
          "border-transparent bg-[hsl(var(--light-warning))] focus-visible:ring-[hsl(var(--ring))] shadow-sm/2",
        muted:
          "border-transparent bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] focus-visible:ring-[hsl(var(--ring))] shadow-sm/2",
        },
      size: {
        sm: "h-5 px-2",
        default: "h-6 px-2.5",
        lg: "h-7 px-3 text-sm",
        icon: "h-6 w-6 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
}

function Badge({
  className,
  variant,
  size,
  icon: Icon,
  iconPosition = "left",
  children,
  ...props
}: BadgeProps) {
  const iconSize = size === "sm" ? 12 : size === "lg" ? 14 : 12;

  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {Icon && iconPosition === "left" && (
        <Icon size={iconSize} className="shrink-0" />
      )}
      {children}
      {Icon && iconPosition === "right" && (
        <Icon size={iconSize} className="shrink-0" />
      )}
    </span>
  );
}

export { Badge, badgeVariants };

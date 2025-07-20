"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { type LucideIcon, X } from "lucide-react";

const chipVariants = cva(
  "inline-flex items-center justify-center rounded-full border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/80 focus-visible:ring-[hsl(var(--ring))] shadow-sm/2",
        secondary:
          "border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/80 focus-visible:ring-[hsl(var(--ring))]",
        destructive:
          "border-transparent bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/80 focus-visible:ring-[hsl(var(--destructive))] shadow-sm/2",
        outline:
          "border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] focus-visible:ring-[hsl(var(--ring))] shadow-sm/2",
        ghost:
          "border-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] focus-visible:ring-[hsl(var(--ring))]",
        success:
          "border-transparent bg-hu-success text-hu-success-foreground hover:bg-hu-success/80 focus-visible:ring-hu-success shadow-sm/2",
        light_success:
          "border-transparent bg-hu-light_success text-hu-light_success-foreground hover:bg-hu-light_success/80 focus-visible:ring-hu-light_success shadow-sm/2",
        soft_success:
          "border-transparent bg-hu-soft_success text-hu-soft_success-foreground hover:bg-hu-soft_success/80 focus-visible:ring-hu-soft_success shadow-sm/2",
        light_warning:
          "border-transparent bg-hu-light_warning text-hu-light_warning-foreground hover:bg-hu-light_warning/80 focus-visible:ring-hu-light_warning shadow-sm/2"
        },
      size: {
        sm: "h-6 px-2 gap-1 text-sm",
        default: "h-7 px-3 gap-1.5 text-sm",
        lg: "h-8 px-4 text-sm gap-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      className,
      variant,
      size,
      icon: Icon,
      iconPosition = "left",
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const iconSize = size === "sm" ? 12 : size === "lg" ? 14 : 12;
    const closeIconSize = size === "sm" ? 10 : size === "lg" ? 12 : 10;

    const handleDismiss = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDismiss?.();
    };

    return (
      <div
        ref={ref}
        className={cn(chipVariants({ variant, size }), className)}
        {...props}
      >
        {Icon && iconPosition === "left" && (
          <Icon size={iconSize} className="shrink-0" />
        )}
        {children}
        {Icon && iconPosition === "right" && !dismissible && (
          <Icon size={iconSize} className="shrink-0" />
        )}
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Remove"
          >
            <X size={closeIconSize} />
          </button>
        )}
      </div>
    );
  }
);

Chip.displayName = "Chip";

export { Chip, chipVariants };

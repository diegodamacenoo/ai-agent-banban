"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const kbdVariants = cva(
  "inline-flex items-center justify-center font-mono text-xs bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] rounded-md border-b-3 transition-all duration-75 cursor-pointer select-none active:translate-y-[1px] active:border-b-[1px]  hover:bg-[hsl(var(--muted))]/80 shadow-sm/2",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]",
        outline:
          "bg-transparent border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]",
        solid:
          "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] border-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground))]/90",
        secondary:
          "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))]/80",
      },
      size: {
        xs: "h-5 px-1.5 text-[10px] min-w-[1.25rem]",
        sm: "h-6 px-2 text-xs min-w-[1.5rem]",
        md: "h-7 px-2.5 text-sm min-w-[1.75rem]",
        lg: "h-8 px-3 text-sm min-w-[2rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

export interface KbdProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> {
  keys?: string[];
  onClick?: () => void;
}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, variant, size, keys, children, onClick, ...props }, ref) => {
    // If keys array is provided, render multiple kbd elements
    if (keys && keys.length > 0) {
      return (
        <span
          className="inline-flex items-center gap-1"
          ref={ref as React.Ref<HTMLSpanElement>}
          onClick={onClick}
        >
          {keys.map((key, index) => (
            <React.Fragment key={index}>
              <kbd
                className={cn(kbdVariants({ variant, size }), className)}
                {...props}
              >
                {key}
              </kbd>
              {index < keys.length - 1 && (
                <span className="text-[hsl(var(--muted-foreground))] text-xs px-1">
                  +
                </span>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    }

    // Single kbd element
    return (
      <kbd
        className={cn(kbdVariants({ variant, size }), className)}
        ref={ref}
        onClick={onClick}
        {...props}
      >
        {children}
      </kbd>
    );
  }
);

Kbd.displayName = "Kbd";

export { Kbd, kbdVariants };

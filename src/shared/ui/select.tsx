"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { type LucideIcon, ChevronDown, Check } from "lucide-react";
import { motion } from "motion/react";

const selectTriggerVariants = cva(
  "flex h-9 w-full items-center justify-between gap-3 rounded-[var(--radius)] bg-[hsl(var(--background))] px-3 py-2 text-sm transition-all placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 bg-[hsl(var(--input))]",
  {
    variants: {
      variant: {
        default:
          "hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] shadow-sm/2",
        outline: "shadow-sm/2",
        ghost:
          "hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]",
      },
      size: {
        sm: "h-8 p-2 text-xs gap-2",
        default: "h-9 p-3 gap-3",
        lg: "h-10 p-4 text-base gap-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const selectContentVariants = cva(
  "relative z-50 max-h-[300px] min-w-[8rem] overflow-hidden rounded-[var(--radius)] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      position: {
        popper:
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        "item-aligned": "",
      },
    },
    defaultVariants: {
      position: "popper",
    },
  }
);

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value> & {
    placeholder?: string;
  }
>(({ className, placeholder, ...props }, ref) => (
  <SelectPrimitive.Value
    ref={ref}
    className={cn("text-sm select-none", className)}
    placeholder={
      placeholder && (
        <span className="text-[hsl(var(--muted-foreground))] select-none">
          {placeholder}
        </span>
      )
    }
    {...props}
  />
));
SelectValue.displayName = SelectPrimitive.Value.displayName;

interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {
  icon?: LucideIcon;
  placeholder?: string;
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(
  (
    { className, children, variant, size, icon: Icon, placeholder, ...props },
    ref
  ) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "group",
        selectTriggerVariants({ variant, size }),
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {Icon && (
          <Icon
            size={16}
            className="shrink-0 text-[hsl(var(--muted-foreground))]"
          />
        )}
        <span className="truncate">{children}</span>
      </div>{" "}
      <SelectPrimitive.Icon asChild>
        <ChevronDown
          size={16}
          className="opacity-50 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  position?: "popper" | "item-aligned";
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(selectContentVariants({ position }), className)}
      position={position}
      {...props}
    >
      <div>
        <SelectPrimitive.Viewport
          className={cn(
            "p-1 space-y-[3px] max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-[hsl(var(--border))] scrollbar-track-transparent",
            position === "popper" &&
              "h-fit w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
      </div>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-2 text-xs font-semibold text-[hsl(var(--muted-foreground))]",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  icon?: LucideIcon;
}

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, children, icon: Icon, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-3 pr-8 text-sm outline-none focus:bg-[hsl(var(--secondary))] focus:text-[hsl(var(--accent-foreground))] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[disabled]:text-[hsl(var(--muted-foreground))] data-[state=checked]:bg-[hsl(var(--secondary))]",
      className
    )}
    {...props}
  >
    <div>
      {Icon && <Icon size={16} className="shrink-0" />}
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </div>
    <span className="absolute right-3 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <div>
          <Check size={16} />
        </div>
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[hsl(var(--muted))]", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  selectTriggerVariants,
};

"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight, Circle, type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Kbd } from "@/shared/ui/kbd";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// Motion wrapper for animations
const MotionContent = React.forwardRef<
  React.ElementRef<typeof motion.div>,
  React.ComponentPropsWithoutRef<typeof motion.div> & {
    side?: "top" | "right" | "bottom" | "left";
  }
>(({ children, side = "bottom", ...props }, ref) => {
  // Dynamic animation based on dropdown side
  const getInitialPosition = () => {
    switch (side) {
      case "top":
        return { y: 8 };
      case "right":
        return { x: -8 };
      case "left":
        return { x: 8 };
      default: // bottom
        return { y: -8 };
    }
  };

  return (
    <div
      ref={ref}
      initial={{
        opacity: 0,
        scale: 0.95,
        ...getInitialPosition(),
      }}
      animate={{
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
        ...getInitialPosition(),
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.2,
      }}
      {...props}
    >
      {children}
    </div>
  );
});
MotionContent.displayName = "MotionContent";

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
    icon?: LucideIcon;
  }
>(({ className, inset, children, icon: Icon, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default gap-2 select-none items-center rounded-[var(--radius)] px-3 py-2.5 sm:py-2 text-sm outline-none transition-colors touch-manipulation",
      "hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]",
      "focus:bg-[hsl(var(--secondary))] focus:text-[hsl(var(--accent-foreground))]",
      "data-[state=open]:bg-[hsl(var(--secondary))] data-[state=open]:text-[hsl(var(--accent-foreground))]",
      "active:bg-[hsl(var(--secondary))] active:text-[hsl(var(--accent-foreground))]",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    <div
      className="flex text-sm w-full items-center gap-2"
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      <span className="flex-1">{children}</span>
      <ChevronRight className="ml-auto h-4 w-4" />
    </div>
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] max-w-[95vw] sm:max-w-[280px] overflow-hidden rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 text-[hsl(var(--foreground))] shadow-lg",
      className
    )}
    asChild
    {...props}
  >
    <div>
      {children}
    </div>
  </DropdownMenuPrimitive.SubContent>
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <AnimatePresence>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 space-y-[3px] min-w-[8rem] max-w-[95vw] sm:max-w-[350px] overflow-hidden rounded-[var(--radius)] bg-[hsl(var(--card))] p-1 text-[hsl(var(--foreground))] shadow-xl",
          className
        )}
        asChild
        {...props}
      >
        <MotionContent>{children}</MotionContent>
      </DropdownMenuPrimitive.Content>
    </AnimatePresence>
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const dropdownMenuItemVariants = cva(
  "relative flex cursor-default select-none items-center gap-2 rounded-[calc(var(--radius)-4px)] px-3 py-2.5 sm:py-2 text-sm outline-none transition-colors touch-manipulation",
  {
    variants: {
      variant: {
        default:
          "hover:bg-[hsl(var(--highlight))] hover:text-[hsl(var(--accent-foreground))] focus:bg-[hsl(var(--secondary))] focus:text-[hsl(var(--accent-foreground))] active:bg-[hsl(var(--secondary))] active:text-[hsl(var(--accent-foreground))]",
        destructive:
          "text-[hsl(var(--primary))] hover:bg-[hsl(var(--light-destructive))] focus:bg-[hsl(var(--light-destructive))] active:bg-[hsl(var(--light-destructive))]",
        warning:
          "text-[hsl(var(--primary))] hover:bg-[hsl(var(--light-warning))] focus:bg-[hsl(var(--light-warning))] active:bg-[hsl(var(--light-warning))]",
        success:
          "text-[hsl(var(--primary))] hover:bg-[hsl(var(--light-success))] focus:bg-[hsl(var(--light-success))] active:bg-[hsl(var(--light-success))]",
        danger:
          "text-[hsl(var(--destructive))] hover:bg-[hsl(var(--light-destructive))] focus:bg-[hsl(var(--light-destructive))] active:bg-[hsl(var(--light-destructive))]",
      },
      disabled: {
        true: "pointer-events-none cursor-not-allowed text-muted-foreground",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      disabled: false,
    },
  }
);

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    icon?: LucideIcon;
    shortcut?: string;
    disabled?: boolean;
  } & VariantProps<typeof dropdownMenuItemVariants>
>(
  (
    { className, variant, inset, icon: Icon, shortcut, children, disabled = false, ...props },
    ref
  ) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      disabled={disabled}
      className={cn(
        dropdownMenuItemVariants({ variant, disabled }),
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      <div
        className="flex text-sm w-full items-center gap-2"
      >
        {Icon && <Icon size={16} className={cn("shrink-0", disabled && "opacity-50")} />}
        <span className={cn("flex-1 text-sm", disabled && "opacity-50")}>{children}</span>
        {shortcut && (
          <Kbd size="xs" className={cn("ml-auto text-xs tracking-widest opacity-60", disabled && "opacity-30")}>
            {shortcut}
          </Kbd>
        )}
      </div>
    </DropdownMenuPrimitive.Item>
  )
);
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & {
    icon?: LucideIcon;
  }
>(({ className, children, checked, icon: Icon, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-lg py-2.5 sm:py-2 pl-8 pr-3 text-sm outline-none transition-colors touch-manipulation",
      "data-[state=checked]:bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--accent-foreground))]",
      "focus:bg-[hsl(var(--secondary))] focus:text-[hsl(var(--accent-foreground))]",
      "active:bg-[hsl(var(--secondary))] active:text-[hsl(var(--accent-foreground))]",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <div>
          <Check className="h-4 w-4" />
        </div>
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    <div
      className="flex text-sm w-full items-center gap-2"
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      {children}
    </div>
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & {
    icon?: LucideIcon;
  }
>(({ className, children, icon: Icon, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-[calc(var(--radius)-4px)] py-2.5 sm:py-2 pl-8 pr-3 text-sm outline-none transition-colors touch-manipulation",
      "hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--accent-foreground))]",
      "focus:bg-[hsl(var(--secondary))] focus:text-[hsl(var(--accent-foreground))]",
      "active:bg-[hsl(var(--secondary))] active:text-[hsl(var(--accent-foreground))]",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.1 }}
        >
          <Circle className="h-2 w-2 fill-current" />
        </div>
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    <div
      className="flex text-sm w-full items-center gap-2"
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      {children}
    </div>
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
    icon?: LucideIcon;
  }
>(({ className, inset, icon: Icon, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-1.5 text-sm text-[hsl(var(--muted-foreground))] flex items-center gap-2",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {Icon && <Icon size={16} className="shrink-0" />}
    {children}
  </DropdownMenuPrimitive.Label>
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[hsl(var(--border))]", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  dropdownMenuItemVariants,
};

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CollapsibleContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

const useCollapsible = () => {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible component');
  }
  return context;
};

interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

const Collapsible = React.forwardRef<
  HTMLDivElement,
  CollapsibleProps
>(({ open: controlledOpen, onOpenChange, children, className, ...props }, ref) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  }, [isControlled, onOpenChange]);

  const contextValue = React.useMemo(() => ({
    open,
    onOpenChange: handleOpenChange
  }), [open, handleOpenChange]);

  return (
    <CollapsibleContext.Provider value={contextValue}>
      <div ref={ref} className={cn(className)} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
});
Collapsible.displayName = 'Collapsible';

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>(({ asChild, onClick, children, ...props }, ref) => {
  const { open, onOpenChange } = useCollapsible();
  
  const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    onOpenChange(!open);
  }, [onClick, open, onOpenChange]);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: handleClick,
      'aria-expanded': open,
      'data-state': open ? 'open' : 'closed',
      ref
    });
  }

  return (
    <button
      ref={ref}
      onClick={handleClick}
      aria-expanded={open}
      data-state={open ? 'open' : 'closed'}
      {...props}
    >
      {children}
    </button>
  );
});
CollapsibleTrigger.displayName = 'CollapsibleTrigger';

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ className, children, ...props }, ref) => {
  const { open } = useCollapsible();
  const [height, setHeight] = React.useState<number | undefined>(0);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (contentRef.current) {
      if (open) {
        setHeight(contentRef.current.scrollHeight);
      } else {
        setHeight(0);
      }
    }
  }, [open]);

  return (
    <div
      ref={ref}
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'overflow-hidden transition-all duration-200 ease-in-out',
        className
      )}
      style={{ height }}
      {...props}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
});
CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
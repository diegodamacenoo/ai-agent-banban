"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const textareaVariants = cva(
  "flex min-h-[60px] w-full rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical transition-all shadow-sm/2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground scrollbar-corner-transparent",
  {
    variants: {
      variant: {
        default: "border-transparent",
        destructive: "border-destructive focus-visible:ring-destructive",
        ghost:
          "border-transparent bg-accent focus-visible:bg-input focus-visible:border-border",
        search:
          "border-none bg-transparent outline-none field-sizing-content placeholder:text-[hsl(var(--muted-foreground))] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 focus-visible:outline-none transition-all shadow-sm/2 resize-none max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground scrollbar-corner-transparent",
      },
      size: {
        default: "min-h-[80px] px-3 py-2",
        sm: "min-h-[60px] px-3 py-2 text-xs",
        lg: "min-h-[100px] px-4 py-2",
        xl: "min-h-[120px] px-6 py-3 text-base",
        fixed: "h-[80px] px-3 py-2 resize-none",
        search: "!min-h-[20px] px-3 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof textareaVariants> {
  error?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, variant, size, error, clearable, onClear, value, ...props },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      props.defaultValue || "",
    );
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Combine external ref with internal ref
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Auto-resize logic for search variant
    React.useEffect(() => {
      if (variant === "search" && textareaRef.current) {
        const textarea = textareaRef.current;
        const adjustHeight = () => {
          // Reset to minimum height first
          textarea.style.height = "20px";
          // Calculate content height
          const contentHeight = Math.max(20, textarea.scrollHeight);
          // Set final height (capped at 200px)
          textarea.style.height = `${Math.min(contentHeight, 200)}px`;
        };
        
        adjustHeight();
        
        // Add input event listener for real-time adjustments
        textarea.addEventListener('input', adjustHeight);
        
        return () => {
          textarea.removeEventListener('input', adjustHeight);
        };
      }
    }, [variant]);

    // Adjust height when controlled value changes
    React.useEffect(() => {
      if (variant === "search" && textareaRef.current && value !== undefined) {
        const textarea = textareaRef.current;
        textarea.style.height = "20px";
        const contentHeight = Math.max(20, textarea.scrollHeight);
        textarea.style.height = `${Math.min(contentHeight, 200)}px`;
      }
    }, [variant, value]);

    const textareaVariant = error ? "destructive" : variant;

    // Determine if this is a controlled component
    const isControlled = value !== undefined;
    const textareaValue = isControlled ? value : internalValue;
    const showClearButton =
      clearable && textareaValue && String(textareaValue).length > 0;

    const handleTextareaChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
        
        // Adjust height for search variant
        if (variant === "search" && textareaRef.current) {
          const textarea = textareaRef.current;
          textarea.style.height = "20px";
          const contentHeight = Math.max(20, textarea.scrollHeight);
          textarea.style.height = `${Math.min(contentHeight, 200)}px`;
        }
      }
      props.onChange?.(e);
    };

    const handleClear = () => {
      // Clear the internal state for uncontrolled inputs
      if (!isControlled) {
        setInternalValue("");
      }

      // Call the onClear callback if provided
      onClear?.();

      // Create a synthetic event to trigger onChange with empty value
      if (textareaRef.current) {
        const textarea = textareaRef.current;

        // Set the textarea's value directly
        textarea.value = "";

        // Create a synthetic React ChangeEvent
        const syntheticEvent = {
          target: textarea,
          currentTarget: textarea,
          nativeEvent: new Event("input", { bubbles: true }),
          isDefaultPrevented: () => false,
          isPropagationStopped: () => false,
          persist: () => {},
          preventDefault: () => {},
          stopPropagation: () => {},
          bubbles: true,
          cancelable: true,
          defaultPrevented: false,
          eventPhase: 0,
          isTrusted: true,
          timeStamp: Date.now(),
          type: "change",
        } as React.ChangeEvent<HTMLTextAreaElement>;

        // Trigger the onChange handler
        props.onChange?.(syntheticEvent);

        // Focus the textarea after clearing
        textarea.focus();
      }
    };

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            textareaVariants({ variant: textareaVariant, size, className }),
            showClearButton && "pr-10",
          )}
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "hsl(var(--border)) transparent",
          }}
          ref={textareaRef}
          {...(isControlled
            ? { value: textareaValue }
            : { defaultValue: props.defaultValue })}
          onChange={handleTextareaChange}
          {...(({ defaultValue, ...rest }) => rest)(props)}
        />
        {/* Clear button */}
        {showClearButton && (
          <div className="absolute right-3 top-3 flex items-center gap-1 z-10">
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors [&_svg]:size-4 [&_svg]:shrink-0"
              tabIndex={-1}
            >
              <X />
            </button>
          </div>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
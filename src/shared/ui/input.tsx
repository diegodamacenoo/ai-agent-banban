"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, X } from "lucide-react";

const inputVariants = cva(
  "flex w-full rounded-[var(--radius)] border-transparent bg-[hsl(var(--input))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm/2",
  {
    variants: {
      variant: {
        default: "border-transparent",
        destructive: "border-transparent focus-visible:ring-destructive",
        ghost:
          "border-transparent bg-transparent focus-visible:bg-accent focus-visible:border-border",
      },
      size: {
        default: "h-9 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-10 px-4 py-2",
        xl: "h-12 px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textLeft?: React.ReactNode;
  textRight?: React.ReactNode;
  error?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      type = "text",
      leftIcon,
      rightIcon,
      textLeft,
      textRight,
      error,
      clearable,
      onClear,
      value,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(
      props.defaultValue || "",
    );
    const [textLeftWidth, setTextLeftWidth] = React.useState(0);
    const [textRightWidth, setTextRightWidth] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const textLeftRef = React.useRef<HTMLDivElement>(null);
    const textRightRef = React.useRef<HTMLDivElement>(null);

    // Combine external ref with internal ref
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Measure text width on mount and when text changes
    React.useEffect(() => {
      if (textLeft && textLeftRef.current) {
        const width = textLeftRef.current.offsetWidth;
        setTextLeftWidth(width);
      }
    }, [textLeft]);

    React.useEffect(() => {
      if (textRight && textRightRef.current) {
        const width = textRightRef.current.offsetWidth;
        setTextRightWidth(width);
      }
    }, [textRight]);

    const inputVariant = error ? "destructive" : variant;
    const isPassword = type === "password";
    const actualType = isPassword && showPassword ? "text" : type;

    // Determine if this is a controlled component
    const isControlled = value !== undefined;
    const inputValue = isControlled ? value : internalValue;
    const showClearButton =
      clearable && inputValue && String(inputValue).length > 0;

    // Calculate dynamic padding
    const leftPadding = leftIcon ? "ps-10" : textLeft ? `pl-[${textLeftWidth + 24}px]` : "";
    const rightPadding = (rightIcon || isPassword || showClearButton) ? "pe-10" : textRight ? `pr-[${textRightWidth + 24}px]` : "";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
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
      if (inputRef.current) {
        const input = inputRef.current;

        // Set the input's value directly
        input.value = "";

        // Create a synthetic React ChangeEvent
        const syntheticEvent = {
          target: input,
          currentTarget: input,
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
        } as React.ChangeEvent<HTMLInputElement>;

        // Trigger the onChange handler
        props.onChange?.(syntheticEvent);

        // Focus the input after clearing
        input.focus();
      }
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0 z-10">
            {leftIcon}
          </div>
        )}
        {textLeft && (
          <div 
            ref={textLeftRef}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm z-10 pointer-events-none"
          >
            {textLeft}
          </div>
        )}{" "}
        <input
          type={actualType}
          className={cn(
            inputVariants({ variant: inputVariant, size, className }),
            leftPadding,
            rightPadding,
          )}
          style={{
            paddingLeft: textLeft && !leftIcon ? `${textLeftWidth + 24}px` : undefined,
            paddingRight: textRight && !rightIcon && !isPassword && !showClearButton ? `${textRightWidth + 24}px` : undefined,
          }}
          ref={inputRef}
          {...(isControlled
            ? { value: inputValue }
            : { defaultValue: props.defaultValue })}
          onChange={handleInputChange}
          {...(({ defaultValue, ...rest }) => rest)(props)}
        />
        {/* Right side icons/text container */}
        {(rightIcon || textRight || isPassword || showClearButton) && (
          <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            {/* Custom right icon */}
            {rightIcon && (
              <div className="text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0">
                {rightIcon}
              </div>
            )}

            {/* Custom right text */}
            {textRight && (
              <div 
                ref={textRightRef}
                className="text-muted-foreground text-sm pointer-events-none"
              >
                {textRight}
              </div>
            )}

            {/* Clear button */}
            {showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground transition-colors [&_svg]:size-4 [&_svg]:shrink-0"
                tabIndex={-1}
              >
                <X />
              </button>
            )}

            {/* Password visibility toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-muted-foreground hover:text-foreground transition-colors [&_svg]:size-4 [&_svg]:shrink-0"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input, inputVariants };

import * as React from "react";
import InputMask from "react-input-mask";

import { cn } from "@gridix/utils/lib";

interface InputProps extends React.ComponentProps<"input"> {
  mask?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, mask, ...props }, ref) => {
    const inputClasses = cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background transition-[border-color,box-shadow,background-color] duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-ring/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-70 md:text-sm",
      className,
    );

    // If type is tel and no custom mask is provided, use a default phone mask
    const phoneMask = type === "tel" && !mask ? "+999 (999) 99-99-99" : mask;

    if (phoneMask) {
      return (
        <InputMask
          mask={phoneMask}
          value={props.value as string}
          onChange={props.onChange}
          disabled={props.disabled}
          {...props}
        >
          {/* @ts-ignore */}
          {(inputProps: any) => (
            <input
              {...inputProps}
              type={type}
              ref={ref}
              className={inputClasses}
            />
          )}
        </InputMask>
      );
    }

    return <input type={type} className={inputClasses} ref={ref} {...props} />;
  },
);
Input.displayName = "Input";

export { Input };

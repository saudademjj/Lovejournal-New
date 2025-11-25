import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white shadow-sm transition placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };

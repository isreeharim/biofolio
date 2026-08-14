import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#E4DFDA] bg-white px-3.5 py-2 text-sm text-[#14171A] placeholder:text-[#918C95] focus-visible:outline-none focus-visible:border-[#6E5DCD] focus-visible:ring-2 focus-visible:ring-[#6E5DCD]/15 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

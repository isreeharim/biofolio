import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#6E5DCD] text-white hover:bg-[#5C4BB7] shadow-sm hover:shadow",
        secondary:
          "bg-[#EDE9FE] text-[#6E5DCD] hover:bg-[#DDD6FE]",
        outline:
          "border border-[#E4DFDA] bg-white text-[#14171A] hover:bg-[#FAF6F0] hover:border-[#D1CBDC]",
        ghost:
          "text-[#6B6572] hover:text-[#14171A] hover:bg-black/5",
        destructive:
          "bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-sm",
        dark:
          "bg-[#14171A] text-white hover:bg-[#22272E] shadow-sm",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

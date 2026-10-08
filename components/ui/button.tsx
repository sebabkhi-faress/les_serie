import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-semibold transition-all duration-120 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.93] active:translate-y-[1px] hover:-translate-y-[0.5px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-[#0B1220] hover:bg-primary-hover shadow-xs border-0",
        destructive:
          "bg-danger text-white hover:bg-danger/90 shadow-xs border-0",
        outline:
          "border border-border bg-surface text-text hover:bg-surface-2",
        secondary:
          "bg-surface-2 text-text hover:bg-surface-2/80 shadow-xs border-0",
        ghost:
          "text-muted hover:text-text hover:bg-surface-2 border-0",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto border-0",
        accent:
          "bg-accent text-white hover:bg-accent/90 shadow-xs border-0",
      },
      size: {
        default: "h-9 px-3.5 py-1.5",
        sm: "h-8 rounded-lg px-2.5 text-[11px]",
        lg: "h-10 rounded-xl px-4 text-xs",
        icon: "h-9 w-9 p-0 rounded-xl",
        "icon-sm": "h-7 w-7 p-0 rounded-lg",
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

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors border-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary/20 text-primary",
        secondary:
          "bg-surface-2 text-muted",
        destructive:
          "bg-danger/20 text-danger",
        success:
          "bg-success/20 text-success",
        warning:
          "bg-warning/20 text-warning",
        outline:
          "bg-surface-2 text-text",
        accent:
          "bg-accent/20 text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

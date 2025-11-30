import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-badge-default text-badge-default-foreground hover:bg-badge-default/80",
        secondary:
          "border-transparent bg-badge-secondary text-badge-secondary-foreground hover:bg-badge-secondary/80",
        destructive:
          "border-transparent bg-badge-destructive text-badge-destructive-foreground hover:bg-badge-destructive/80",
        outline: "text-badge-outline-foreground border-badge-outline hover:bg-badge-outline-hover hover:text-badge-outline-hover-foreground",
        success: "border-transparent bg-badge-success text-badge-success-foreground hover:bg-badge-success/80",
        warning: "border-transparent bg-badge-warning text-badge-warning-foreground hover:bg-badge-warning/80",
        available: "border-transparent bg-badge-available text-badge-available-foreground hover:bg-badge-available/80",
        booked: "border-transparent bg-badge-booked text-badge-booked-foreground hover:bg-badge-booked/80",
        blocked: "border-transparent bg-badge-blocked text-badge-blocked-foreground hover:bg-badge-blocked/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }

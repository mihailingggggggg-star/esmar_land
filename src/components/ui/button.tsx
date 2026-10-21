import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-55 active:scale-[0.985]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-[0_18px_35px_-16px_rgba(15,59,44,0.75)] hover:bg-primary-soft hover:shadow-[0_22px_45px_-16px_rgba(15,59,44,0.7)]",
        bronze:
          "bg-bronze text-white shadow-[0_18px_35px_-16px_rgba(187,122,54,0.7)] hover:brightness-105",
        glass:
          "glass text-primary hover:bg-white/80",
        ghost: "text-primary hover:bg-primary/5",
        outline:
          "border border-primary/20 bg-white/60 text-primary backdrop-blur-md hover:border-primary/40",
      },
      size: {
        sm: "h-10 rounded-full px-4 text-[13px]",
        md: "h-12 rounded-2xl px-5 text-[15px]",
        lg: "h-14 rounded-[18px] px-6 text-[16px]",
        pill: "h-9 rounded-full px-3.5 text-[12.5px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };

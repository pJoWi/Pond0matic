"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  { variants: { variant: { default: "px-3 py-2 border bg-[var(--primary)] text-white shadow", outline: "px-3 py-2 border bg-transparent", success: "px-3 py-2 border bg-green-600 text-white", danger: "px-3 py-2 border bg-red-600 text-white" }, size: { default: "", sm: "text-xs px-2 py-1" } }, defaultVariants: { variant: "default", size: "default" } }
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => ( <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} /> ));
Button.displayName = "Button"; export { Button, buttonVariants };

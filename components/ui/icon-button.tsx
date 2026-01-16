"use client";

import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/utils";

type IconButtonProps = ComponentPropsWithRef<"button">;

export const IconButton = ({ className, ref, ...props }: IconButtonProps) => {
  return (
    <button
      className={cn(
        `
          inline-flex size-9 items-center justify-center rounded-md
          text-muted-foreground transition-colors
          hover:bg-muted hover:text-foreground
          focus-visible:ring-2 focus-visible:ring-accent
          focus-visible:ring-offset-2 focus-visible:outline-none
          disabled:pointer-events-none disabled:opacity-50
        `,
        className
      )}
      ref={ref}
      {...props}
    />
  );
};

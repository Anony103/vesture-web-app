import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "w-full max-w-md rounded-2xl border border-white/10 p-6",
        className,
      )}
      {...props}
    />
  );
}

"use client";
import { useId } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
export function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-5">
      <div>
        <label id={id} className="text-sm font-medium">
          {label}
        </label>
        {description && (
          <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
        )}
      </div>
      <Button
        role="switch"
        aria-labelledby={id}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        variant="ghost"
        className={cn(
          "relative h-6 min-h-6 w-11 shrink-0 rounded-full p-0",
          checked ? "bg-[#7954e9]" : "bg-[#515362]",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full bg-white transition-transform",
            checked ? "left-6" : "left-1",
          )}
        />
      </Button>
    </div>
  );
}

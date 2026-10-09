"use client";
import { Button } from "./button";
import { cn } from "@/lib/utils";
export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">{label}</legend>
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))`,
        }}
      >
        {options.map((option) => (
          <Button
            key={option.value}
            variant="secondary"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            size="sm"
            className={cn(
              "min-h-11 px-1 font-normal",
              value === option.value &&
                "border-[#7b55f0] bg-[#7b55f0] text-white",
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}

"use client";
import { useId, type SelectHTMLAttributes } from "react";
import { AssetIcon } from "./asset-icon";
import { cn } from "@/lib/utils";
export function Select({
  label,
  options,
  placeholder,
  id,
  required,
  variant = "pill",
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly string[];
  placeholder: string;
  variant?: "pill" | "filled";
}) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className="min-w-0 space-y-2.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-[#eaeaea]"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="text-red-400">
            {" "}
            *
          </span>
        )}
      </label>
      <div className="relative">
        <select
          id={inputId}
          required={required}
          className={cn(
            "h-[51px] w-full appearance-none border px-5 pr-12 text-sm text-ink focus:border-lilac",
            variant === "filled"
              ? "rounded-xl border-line bg-surface"
              : "rounded-full border-outline bg-canvas",
            className,
          )}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <AssetIcon
          name="chevron"
          className="pointer-events-none absolute top-[13px] right-4 size-6 rotate-180"
        />
      </div>
    </div>
  );
}

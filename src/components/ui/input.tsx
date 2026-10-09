"use client";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
export type InputProps = ComponentProps<"input"> & {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  variant?: "pill" | "filled";
  wrapperClassName?: string;
};
export function Input({
  label,
  hint,
  error,
  leading,
  trailing,
  variant = "pill",
  wrapperClassName,
  className,
  id,
  required,
  ...props
}: InputProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const description = error ?? hint;
  return (
    <div className={cn("min-w-0 space-y-2.5", wrapperClassName)}>
      {label && (
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
      )}
      <div
        className={cn(
          "flex h-[51px] items-center gap-3 border px-[18px] transition-colors focus-within:border-lilac",
          variant === "filled"
            ? "rounded-xl border-line bg-surface"
            : "rounded-full border-outline bg-canvas",
          error && "border-red-400",
        )}
      >
        {leading}
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={description ? `${inputId}-description` : undefined}
          className={cn(
            "h-full w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-[#ababab] focus-visible:outline-none",
            className,
          )}
          {...props}
        />
        {trailing}
      </div>
      {description && (
        <p
          id={`${inputId}-description`}
          role={error ? "alert" : undefined}
          className={cn(
            "text-[10px] leading-[18px]",
            error ? "text-red-300" : "text-[#e6e6e6]",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

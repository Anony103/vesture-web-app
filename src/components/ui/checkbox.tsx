"use client";
import { useId, type InputHTMLAttributes, type ReactNode } from "react";
export function Checkbox({
  children,
  id,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  children: ReactNode;
}) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <label
      htmlFor={inputId}
      className="flex cursor-pointer items-start gap-2 text-[10px] leading-[18px] text-[#e6e6e6]"
    >
      <input
        id={inputId}
        type="checkbox"
        className="mt-1 size-4 shrink-0 accent-lilac"
        {...props}
      />
      <span>{children}</span>
    </label>
  );
}

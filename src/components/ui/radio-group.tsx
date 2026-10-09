"use client";
import { useId } from "react";
export function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{label}</legend>
      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center justify-between gap-3 border-b border-line p-4 text-sm last:border-0"
          >
            <span>{option}</span>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="size-4 accent-lilac"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

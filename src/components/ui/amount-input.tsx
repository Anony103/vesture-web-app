"use client";
import { useEffect, useRef } from "react";
import { Input, type InputProps } from "./input";

// Display "150,000.50" while the parent keeps the raw "150000.50" - so existing
// Number(draft.amount) math and API payloads are unchanged.
function format(raw: string) {
  if (!raw) return "";
  const [whole, decimal] = raw.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimal === undefined ? grouped : `${grouped}.${decimal}`;
}

function sanitize(text: string) {
  const cleaned = text.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  const decimal = rest.join("").slice(0, 2);
  const trimmedWhole = whole.replace(/^0+(?=\d)/, "");
  return rest.length ? `${trimmedWhole}.${decimal}` : trimmedWhole;
}

export function AmountInput({
  value,
  onValueChange,
  min,
  max,
  ...props
}: Omit<InputProps, "value" | "onChange" | "type" | "min" | "max"> & {
  value: string;
  onValueChange: (raw: string) => void;
  min?: number;
  max?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  // type="text" drops the browser's native min/max checks, so re-create them as custom
  // validity messages - the surrounding <form> still blocks submission the same way.
  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    const amount = Number(value);
    if (value && min !== undefined && amount < min) {
      input.setCustomValidity(`Amount must be at least ${format(String(min))}.`);
    } else if (value && max !== undefined && amount > max) {
      input.setCustomValidity(`Amount can't be more than ${format(String(max))}.`);
    } else {
      input.setCustomValidity("");
    }
  }, [value, min, max]);
  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={format(value)}
      onChange={(event) => onValueChange(sanitize(event.target.value))}
    />
  );
}

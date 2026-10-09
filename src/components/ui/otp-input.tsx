"use client";
import { useRef } from "react";
export function OtpInput({
  value,
  onChange,
  length = 4,
  invalid = false,
  secret = false,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  invalid?: boolean;
  secret?: boolean;
  label?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) =>
    value[i] === " " ? "" : (value[i] ?? ""),
  );
  function update(index: number, text: string) {
    const incoming = text.replace(/\D/g, "").slice(0, length - index);
    const next = [...digits];
    if (!incoming) next[index] = "";
    else
      incoming.split("").forEach((digit, offset) => {
        next[index + offset] = digit;
      });
    onChange(
      next
        .map((d) => d || " ")
        .join("")
        .trimEnd(),
    );
    if (incoming)
      refs.current[Math.min(index + incoming.length, length - 1)]?.focus();
  }
  return (
    <fieldset className="flex justify-center gap-2 sm:gap-[13px]">
      <legend className="sr-only">
        {label ?? (secret ? "Transaction PIN" : "Verification code")}
      </legend>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          type={secret ? "password" : "text"}
          inputMode="numeric"
          pattern="[0-9]"
          autoComplete={!secret && index === 0 ? "one-time-code" : "off"}
          value={digit}
          placeholder="-"
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => update(index, event.target.value)}
          onPaste={(event) => {
            event.preventDefault();
            update(index, event.clipboardData.getData("text"));
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digit && index > 0)
              refs.current[index - 1]?.focus();
            if (event.key === "ArrowLeft")
              refs.current[Math.max(0, index - 1)]?.focus();
            if (event.key === "ArrowRight")
              refs.current[Math.min(length - 1, index + 1)]?.focus();
          }}
          className="h-[50px] w-[min(54px,11vw)] rounded-[13px] border border-muted bg-transparent text-center text-sm focus:border-lilac aria-invalid:border-red-400"
        />
      ))}
    </fieldset>
  );
}

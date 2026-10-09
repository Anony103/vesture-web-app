import type { ButtonHTMLAttributes, ComponentProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonStyleProps = {
  variant?: "primary" | "login" | "secondary" | "ghost" | "upload" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  fullWidth?: boolean;
  className?: string;
};

function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: ButtonStyleProps) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
    {
      primary:
        "rounded-xl bg-lilac text-[#080d1a] hover:bg-[#ecd0ff] shadow-[0_0_8px_#12e69015]",
      login: "rounded-2xl bg-lavender text-[#160a40] hover:bg-[#d3c3ff]",
      secondary:
        "rounded-xl border border-line bg-surface text-lavender hover:border-lavender/60",
      ghost: "rounded-md text-lavender hover:text-lilac",
      danger: "rounded-xl bg-[#cc2435] text-white hover:bg-[#e23749]",
      upload: "rounded bg-[#502b8c] text-white hover:bg-[#6838b5]",
    }[variant],
    {
      sm: "min-h-8 px-3 text-xs",
      md: "min-h-11 px-5 py-3 text-sm",
      lg: "min-h-14 px-6 py-4 text-base",
      icon: "size-8 p-1",
    }[size],
    fullWidth && "w-full",
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonStyleProps;
export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}

export function LinkButton({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonStyleProps) {
  return (
    <Link
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}

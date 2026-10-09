import type { AccountType } from "@/lib/onboarding";
import { AssetIcon } from "@/components/ui/asset-icon";
import { cn } from "@/lib/utils";
export function AccountOption({
  value,
  title,
  description,
  benefits,
  number,
  selected,
  onSelect,
}: {
  value: AccountType;
  title: string;
  description: string;
  benefits: string[];
  number: number;
  selected: boolean;
  onSelect: (value: AccountType) => void;
}) {
  return (
    <label
      className={cn(
        "relative flex min-h-[136px] cursor-pointer items-center gap-5 rounded-[15px] border bg-canvas px-5 py-3 transition-colors hover:border-lilac/70",
        selected ? "border-lilac" : "border-outline",
      )}
    >
      <input
        type="radio"
        name="accountType"
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-canvas peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-lilac",
          selected && "bg-lilac",
        )}
      >
        {number}
      </span>
      <span className="min-w-0">
        <span className="block text-sm leading-7 font-semibold">{title}</span>
        <span className="block text-[10px] leading-[15px] text-white">
          {description}
        </span>
        <span className="mt-1.5 block space-y-0.5">
          {benefits.map((benefit) => (
            <span
              key={benefit}
              className="flex items-center gap-1 text-[10px] leading-[14px]"
            >
              <AssetIcon name="check-circle" className="size-2" />
              {benefit}
            </span>
          ))}
        </span>
      </span>
    </label>
  );
}

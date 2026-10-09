import { cn } from "@/lib/utils";
const files = {
  home: "56fee.svg",
  plans: "dca3f.svg",
  transactions: "a1ecc.svg",
  settings: "f2d04.svg",
  logout: "050ab.svg",
  info: "1dea1.svg",
  growth: "ef403.svg",
  arrow: "0c456.svg",
  deposit: "4c36e.svg",
  empty: "58af4.svg",
  check: "1f722.svg",
  warning: "c2625.svg",
  back: "21aab.svg",
};
export type InvestmentIconName = keyof typeof files;
export function InvestmentIcon({
  name,
  className,
}: {
  name: InvestmentIconName;
  className?: string;
}) {
  return (
    <img
      src={`/figma/investments/${files[name]}`}
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      className={cn("size-5 shrink-0 object-contain", className)}
    />
  );
}

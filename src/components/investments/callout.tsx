import { InvestmentIcon } from "./investment-icon";
import { cn } from "@/lib/utils";
export function Callout({
  title,
  children,
  tone = "warning",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "warning" | "info";
}) {
  return (
    <aside
      className={cn(
        "flex gap-3 rounded-2xl border p-4",
        tone === "warning"
          ? "border-[#663300] bg-[#2b1400] text-[#e2a12c]"
          : "border-line bg-panel text-subtle",
      )}
    >
      <InvestmentIcon
        name={tone === "warning" ? "warning" : "info"}
        className="mt-0.5 size-4"
      />
      <div>
        <h2 className="text-xs font-semibold">{title}</h2>
        <div className="mt-1 text-xs leading-5">{children}</div>
      </div>
    </aside>
  );
}

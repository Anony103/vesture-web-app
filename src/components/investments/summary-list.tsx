import { cn } from "@/lib/utils";
export type SummaryItem = {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
};
export function SummaryList({
  items,
  className,
}: {
  items: SummaryItem[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "rounded-2xl border border-line bg-panel px-4 py-2",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start justify-between gap-6 border-b border-white/4 py-3 last:border-0"
        >
          <dt className="text-xs leading-5 text-subtle">{item.label}</dt>
          <dd
            className={cn(
              "max-w-[60%] text-right text-xs leading-5 font-semibold break-words",
              item.highlight && "text-lilac",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

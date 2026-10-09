import Link from "next/link";
import { InvestmentIcon } from "@/components/investments/investment-icon";
export function SectionHeading({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-bold">{title}</h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs text-lavender hover:underline"
        >
          See all
          <InvestmentIcon name="arrow" className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

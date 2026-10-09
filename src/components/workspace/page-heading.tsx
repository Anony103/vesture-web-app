import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InvestmentIcon } from "@/components/investments/investment-icon";
export function PageHeading({
  title,
  description,
  backHref,
  onBack,
}: {
  title: string;
  description?: string;
  backHref?: string;
  onBack?: () => void;
}) {
  return (
    <header className="mb-7">
      <div className="flex items-center gap-3">
        {onBack ? (
          <Button
            variant="secondary"
            size="icon"
            aria-label="Go back"
            className="rounded-full border-0 bg-panel"
            onClick={onBack}
          >
            <InvestmentIcon name="back" className="size-4" />
          </Button>
        ) : backHref ? (
          <Link
            href={backHref}
            aria-label="Go back"
            className="flex size-9 items-center justify-center rounded-full bg-panel"
          >
            <InvestmentIcon name="back" className="size-4" />
          </Link>
        ) : null}
        <h1 className="font-display text-xl font-semibold">{title}</h1>
      </div>
      {description && <p className="mt-5 text-sm text-subtle">{description}</p>}
    </header>
  );
}

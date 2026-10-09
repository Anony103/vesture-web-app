"use client";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/workspace/page-heading";
import { currency, type Product, type InvestmentDraft } from "@/lib/investments";
import { SummaryList } from "./summary-list";
import { Callout } from "./callout";
import { useSavingsQuote } from "./use-savings-quote";

export function InvestmentReview({
  product,
  draft,
  onBack,
  onContinue,
  onCancel,
}: {
  product: Product;
  draft: InvestmentDraft;
  onBack: () => void;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const { quote, loading } = useSavingsQuote(product, draft);
  const principal = Number(draft.amount) || 0;
  const date = new Date();
  date.setMonth(date.getMonth() + draft.months);
  const fromBackend = quote?.source === "backend";
  const details = [
    { label: "Goal", value: draft.goal },
    { label: "Product", value: product.name },
    { label: "Target Amount", value: currency(principal) },
    { label: "Duration", value: `${draft.months} months` },
    // Smart Lock is a lump sum with a payout schedule; the others contribute on a schedule.
    product.id === "smart-lock"
      ? { label: "Interest Frequency", value: draft.payout }
      : { label: "Contribution Frequency", value: draft.frequency },
    { label: "Maturity Date", value: date.toLocaleDateString("en-GB") },
    ...(quote
      ? [
          {
            label: "Withholding Tax (10%)",
            value: `−${currency(quote.withholding)}`,
          },
          {
            label: "Total Expected Value",
            value: currency(quote.total),
            highlight: true,
          },
        ]
      : []),
  ];
  return (
    <>
      <PageHeading
        title="Investment Summary"
        description="Confirm all details before creating"
        onBack={onBack}
      />
      <div className="space-y-4">
        <SummaryList items={details} />
        <section className="rounded-2xl border border-line bg-panel p-4">
          <h2 className="mb-2 text-xs font-semibold">Expected Returns</h2>
          {quote ? (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-subtle">Interest Rate</span>
                <span className="text-positive">
                  {fromBackend ? "" : "about "}
                  {quote.rate}% p.a.
                </span>
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-subtle">Estimated Interest</span>
                <span>{currency(quote.grossInterest)}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-subtle">
              {loading ? "Checking the current rate…" : "Rate unavailable."}
            </p>
          )}
        </section>
        <div className="grid grid-cols-2 gap-3">
          <Button fullWidth variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button fullWidth onClick={onContinue} disabled={loading}>
            Create Investment
          </Button>
        </div>
        <Callout title="Estimated returns" tone="info">
          {fromBackend
            ? "The rate shown is the one the platform would assign to this plan today; interest accrues on the amount you invest and tax is withheld on the interest."
            : "The platform couldn't confirm a rate for this plan right now, so this is an illustration using the product's indicative rate. The rate applied is confirmed when your plan is created."}
          {product.id === "smart-lock"
            ? " Smart Lock interest is worked out up front for the whole term."
            : " Figures cover your starting amount only; later contributions are excluded."}
        </Callout>
      </div>
    </>
  );
}

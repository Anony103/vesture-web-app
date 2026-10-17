"use client";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/workspace/page-heading";
import { currency, type Product, type InvestmentDraft } from "@/lib/investments";
import { SummaryList } from "./summary-list";
import { Callout } from "./callout";
import { Notice } from "@/components/ui/notice";
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
  const { quote, loading, unavailable } = useSavingsQuote(product, draft);
  const principal = Number(draft.amount) || 0;
  const date = new Date();
  date.setMonth(date.getMonth() + draft.months);
  const details = [
    { label: "Goal", value: draft.goal },
    { label: "Product", value: product.name },
    { label: "Target Amount", value: currency(principal) },
    { label: "Duration", value: `${draft.months} months` },
    // Smart Lock is a lump sum with a payout schedule. The Target Lock "Contribution Frequency" row is switched off for
    // now (its form section is too); to bring it back add `{ label: "Contribution Frequency", value: draft.frequency }`
    // for product.id === "target-lock". SmallVest has neither (any amount, any time).
    ...(product.id === "smart-lock" ? [{ label: "Interest Frequency", value: draft.payout }] : []),
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
                <span className="text-positive">{quote.rate}% p.a.</span>
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-subtle">Estimated Interest</span>
                <span>{currency(quote.grossInterest)}</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-subtle">
              {loading ? "Checking the current rate…" : "Interest rate isn't available for this product right now."}
            </p>
          )}
        </section>
        <div className="grid grid-cols-2 gap-3">
          <Button fullWidth variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button fullWidth onClick={onContinue} disabled={loading || unavailable}>
            Create Investment
          </Button>
        </div>
        {unavailable && !loading && (
          <Notice tone="error">
            We can&apos;t confirm an interest rate for this plan right now, so it can&apos;t be created yet. Please try again
            later, or go back and change the plan.
          </Notice>
        )}
        <Callout title="Estimated returns" tone="info">
          The rate shown is the one the platform would assign to this plan today; interest accrues on the amount you invest and tax is withheld on the interest.
          {product.id === "smart-lock"
            ? " Smart Lock interest is worked out up front for the whole term."
            : " Figures cover your starting amount only; later contributions are excluded."}
        </Callout>
      </div>
    </>
  );
}

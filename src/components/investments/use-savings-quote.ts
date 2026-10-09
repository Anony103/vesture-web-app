"use client";
import { useEffect, useState } from "react";
import {
  getProducts,
  getToken,
  previewSmartLock,
  previewSss,
  previewTargetSavings,
  type SavingsPreview,
} from "@/lib/api";
import {
  calculatePreview,
  completionDateFor,
  frequencyCode,
  interestPaymentCode,
  PRODUCT_TO_PRODUCT_CODE,
  type InvestmentDraft,
  type Product,
} from "@/lib/investments";

export type SavingsQuote = {
  // "backend" = the rate and interest come from the backend's own preview for this plan;
  // "estimate" = the preview was unavailable (or no rate is configured) so this is an
  // illustration using the product's indicative rate.
  source: "backend" | "estimate";
  rate: number;
  grossInterest: number;
  withholding: number;
  total: number;
};

let productIdCache: Record<string, string> | null = null;

async function resolveProductId(product: Product, token: string) {
  if (!productIdCache) {
    const catalog = await getProducts(token);
    productIdCache = Object.fromEntries(
      catalog.data.map((item) => [item.productCode, item.id]),
    );
  }
  return productIdCache[PRODUCT_TO_PRODUCT_CODE[product.id]];
}

// Turns the backend's preview into the figures the review screen shows. Smart Lock interest
// comes back already net of withholding tax (with the tax as a separate figure); for SmallVest
// the backend only gives the rate (interest accrues daily), so interest is projected from it.
function fromPreview(
  product: Product,
  draft: InvestmentDraft,
  preview: SavingsPreview,
): SavingsQuote | null {
  const principal = Number(draft.amount) || 0;
  const rate = preview.assignedInterestRate ?? 0;
  if (rate <= 0) return null;
  if (product.id === "smart-lock") {
    const withholding = preview.withholdingTax ?? 0;
    const gross = (preview.expectedInterestAmount ?? 0) + withholding;
    return { source: "backend", rate, grossInterest: gross, withholding, total: principal + gross - withholding };
  }
  const gross =
    product.id === "target-lock"
      ? (preview.expectedInterestAmount ?? 0)
      : (principal * (rate / 100) * draft.months) / 12;
  const withholding = gross * 0.1;
  return { source: "backend", rate, grossInterest: gross, withholding, total: principal + gross - withholding };
}

export function useSavingsQuote(product: Product, draft: InvestmentDraft) {
  const [quote, setQuote] = useState<SavingsQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    const fallback = (): SavingsQuote => {
      const local = calculatePreview(product, draft);
      return {
        source: "estimate",
        rate: product.rate,
        grossInterest: local.grossInterest,
        withholding: local.withholding,
        total: local.total,
      };
    };
    async function run() {
      if (!token || product.id === "bnpl") {
        setQuote(fallback());
        setLoading(false);
        return;
      }
      try {
        const productId = await resolveProductId(product, token);
        if (!productId) return setQuote(fallback());
        const base = {
          productId,
          name: draft.goal.trim() || product.name,
          amount: Number(draft.amount) || 0,
        };
        const date = completionDateFor(draft.months);
        const frequency = frequencyCode(draft.frequency);
        const response =
          product.id === "smart-lock"
            ? await previewSmartLock(
                {
                  ...base,
                  tenor: draft.months,
                  completionDate: date,
                  fundingType: "WALLET_DEBIT",
                  interestPaymentFrequency: interestPaymentCode(draft.payout),
                },
                token,
              )
            : product.id === "target-lock"
              ? await previewTargetSavings({ ...base, completionDate: date, frequency }, token)
              : await previewSss(
                  { ...base, tenor: draft.months, completionDate: `${date}T00:00:00`, frequency },
                  token,
                );
        if (!cancelled) setQuote(fromPreview(product, draft, response.data) ?? fallback());
      } catch {
        if (!cancelled) setQuote(fallback());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // Re-quote when the plan's inputs change; the draft object itself changes on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, draft.amount, draft.months, draft.frequency, draft.payout]);

  return { quote, loading };
}

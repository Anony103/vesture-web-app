"use client";
import { useEffect, useState } from "react";
import { getPublicRates } from "@/lib/api";
import type { ProductId } from "@/lib/investments";

// The backend names its rate tables by savings type; each product page shows the span of annual
// rates currently configured for its type.
const RATE_TYPE: Partial<Record<ProductId, string>> = {
  smallvest: "SSS",
  "target-lock": "TargetSavings",
  "smart-lock": "SmartLock",
};

export type RateRange = { min: number; max: number };

// "loading" until the backend answers; "ready" when at least one active rate exists for the product; "none" when it
// answered and there is none (the product cannot be invested in); "error" when the rates could not be loaded (the
// backend still refuses a plan without a rate, so the customer is not blocked by a flaky connection).
export type RateStatus = "loading" | "ready" | "none" | "error";

export function usePublicRates(productId: ProductId) {
  const [state, setState] = useState<{ range: RateRange | null; status: RateStatus }>({ range: null, status: "loading" });
  useEffect(() => {
    const type = RATE_TYPE[productId];
    if (!type) {
      setState({ range: null, status: "ready" });
      return;
    }
    let cancelled = false;
    getPublicRates()
      .then((response) => {
        // The endpoint lists active rates only. A rate an admin set to 0% on purpose still counts as available.
        const rates = response.data.filter((rate) => rate.savingsType === type).map((rate) => rate.annualRate);
        if (cancelled) return;
        setState(
          rates.length
            ? { range: { min: Math.min(...rates), max: Math.max(...rates) }, status: "ready" }
            : { range: null, status: "none" },
        );
      })
      .catch(() => {
        // No rates shown rather than made-up ones.
        if (!cancelled) setState({ range: null, status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);
  return state;
}

export function formatRateRange(range: RateRange | null, status: RateStatus = "ready") {
  if (status === "none") return "Not available right now";
  if (!range) return "Confirmed when you invest";
  return range.min === range.max
    ? `${range.min}% p.a.`
    : `${range.min}% – ${range.max}% p.a.`;
}

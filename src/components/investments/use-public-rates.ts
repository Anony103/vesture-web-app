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

export function usePublicRates(productId: ProductId) {
  const [range, setRange] = useState<RateRange | null>(null);
  useEffect(() => {
    const type = RATE_TYPE[productId];
    if (!type) return;
    let cancelled = false;
    getPublicRates()
      .then((response) => {
        const rates = response.data
          .filter((rate) => rate.savingsType === type && rate.annualRate > 0)
          .map((rate) => rate.annualRate);
        if (!cancelled && rates.length) {
          setRange({ min: Math.min(...rates), max: Math.max(...rates) });
        }
      })
      .catch(() => {
        // No rates shown rather than made-up ones.
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);
  return range;
}

export function formatRateRange(range: RateRange | null) {
  if (!range) return "Confirmed when you invest";
  return range.min === range.max
    ? `${range.min}% p.a.`
    : `${range.min}% – ${range.max}% p.a.`;
}

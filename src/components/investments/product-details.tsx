"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { BNPL_MIN_INITIAL_PAYMENT } from "@/lib/api";
import { useCurrentUser } from "@/components/auth/auth-guard";
import {
  currency,
  minimumInvestment,
  productFeatures,
  type Product,
} from "@/lib/investments";
import { ProductArt } from "./product-art";
import { InvestmentIcon } from "./investment-icon";
import { Callout } from "./callout";
import { formatRateRange, usePublicRates } from "./use-public-rates";
import { SetupChecklist, useInvestmentEligibility } from "./setup-checklist";
export function BenefitsList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 text-sm leading-5 text-subtle"
        >
          <InvestmentIcon name="check" className="mt-0.5 size-4" />
          {item}
        </li>
      ))}
    </ul>
  );
}
export function KeyDetail({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <p className="text-xs text-subtle">{label}</p>
      <p
        className={`mt-1 text-base font-bold ${positive ? "text-positive" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
export function ProductDetails({ product }: { product: Product }) {
  const { user } = useCurrentUser();
  const router = useRouter();
  // Every plan and Buy Now Pay Later needs identity verified and a withdrawal bank saved first. Starting one without
  // them opens a modal that sends the customer to finish; the backend refuses the purchase in any case.
  const eligibility = useInvestmentEligibility();
  const blocked = eligibility !== null && !eligibility.eligible;
  const [setupOpen, setSetupOpen] = useState(false);
  const rateRange = usePublicRates(product.id);
  return (
    <div className="mx-auto max-w-[800px]">
      <header
        className="relative flex h-44 flex-col justify-end overflow-hidden rounded-b-3xl border p-5 text-black"
        style={{ backgroundColor: product.color, borderColor: product.border }}
      >
        <Link
          href="/investments"
          aria-label="Back to investment plans"
          className="absolute top-5 left-5 flex size-9 items-center justify-center rounded-full bg-black/30"
        >
          <InvestmentIcon name="back" className="size-4" />
        </Link>
        <ProductArt
          productId={product.id}
          className="absolute -right-6 -bottom-8 size-40 opacity-40"
        />
        <h1 className="relative text-2xl font-bold">{product.name}</h1>
        <p className="relative mt-1 text-sm">
          {product.tagline}
          {product.id === "smallvest" ? "." : ""}
        </p>
      </header>
      <div className="space-y-7 px-4 pt-10 pb-8">
        <section>
          <h2 className="mb-2 text-base font-bold">About this product</h2>
          <p className="text-sm leading-6 text-subtle">{product.description}</p>
        </section>
        <section>
          <h2 className="mb-3 text-base font-bold">Key Details</h2>
          <div className="grid grid-cols-2 gap-3">
            {product.id === "bnpl" ? (
              <>
                <KeyDetail
                  label="Minimum Initial Payment"
                  value={currency(BNPL_MIN_INITIAL_PAYMENT)}
                />
                <KeyDetail label="Repayment" value="Up to the item's tenor" />
                <KeyDetail label="Paid from" value="Your wallet" />
                <KeyDetail label="Interest" value="0% on savings" positive />
              </>
            ) : (
              <>
                <KeyDetail
                  label="Minimum Investment"
                  value={currency(minimumInvestment(product, user.sectorPP))}
                />
                <KeyDetail
                  label="Current Rate"
                  value={formatRateRange(rateRange)}
                  positive
                />
              </>
            )}
          </div>
          {product.id !== "bnpl" && (
            <p className="mt-2 text-[10px] text-muted">
              *Note: Rates can change; the rate on your plan is shown when you
              review it.
            </p>
          )}
        </section>
        <section>
          <h2 className="mb-3 text-base font-bold">Features &amp; Benefits</h2>
          <BenefitsList items={productFeatures(product, user.sectorPP)} />
        </section>
        {product.id !== "bnpl" && (
          <Callout title="Early Liquidation Penalty">
            Early liquidation may attract adjusted returns and/or charges.
          </Callout>
        )}
        <Button
          fullWidth
          size="lg"
          variant={product.id === "smallvest" ? "primary" : "login"}
          onClick={() => (blocked ? setSetupOpen(true) : router.push(`/investments/${product.id}/create`))}
        >
          {product.id === "bnpl" ? "Browse Items" : `Start ${product.name}`}
        </Button>
        <Modal open={setupOpen} onClose={() => setSetupOpen(false)} title="Complete your setup to invest">
          <p className="mb-4 text-sm text-subtle">
            Two quick steps first. Your bank account is where your money is paid when a plan is liquidated.
          </p>
          {eligibility && <SetupChecklist status={eligibility} heading={false} />}
          <Button variant="secondary" fullWidth className="mt-4" onClick={() => setSetupOpen(false)}>
            Not now
          </Button>
        </Modal>
      </div>
    </div>
  );
}

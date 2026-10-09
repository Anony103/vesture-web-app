"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AmountInput } from "@/components/ui/amount-input";
import { Notice } from "@/components/ui/notice";
import { Select } from "@/components/ui/select";
import { PageHeading } from "@/components/workspace/page-heading";
import { useCurrentUser } from "@/components/auth/auth-guard";
import { currency } from "@/lib/investments";
import {
  ApiError,
  BNPL_MIN_INITIAL_PAYMENT,
  getAssetCategories,
  getAssetsByCategory,
  getToken,
  previewBnplPurchase,
  type BnplQuote,
  type CatalogAsset,
} from "@/lib/api";
import { Callout } from "./callout";
import { FundingAccountCard } from "./funding-account-card";
import { ProductArt } from "./product-art";
import { SummaryList } from "./summary-list";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8082";

export type BnplDraft = {
  asset: CatalogAsset | null;
  initialPayment: string;
  months: number;
};

export const emptyBnplDraft: BnplDraft = {
  asset: null,
  initialPayment: "",
  months: 6,
};

// The backend refuses an initial payment above the item's price and one below its own floor, so
// an item cheaper than the floor can't be bought on BuyNow PayLater at all.
function availability(asset: CatalogAsset) {
  if (asset.availableUnits !== null && asset.availableUnits <= 0) return "Out of stock";
  if (asset.amount < BNPL_MIN_INITIAL_PAYMENT)
    return `Below the ${currency(BNPL_MIN_INITIAL_PAYMENT)} minimum initial payment`;
  return null;
}

// Repayment lengths offered for an item: the usual steps, capped at the item's longest tenor.
function tenorOptions(asset: CatalogAsset) {
  const longest = asset.maxTenor ?? 12;
  const steps = [3, 6, 9, 12, 18, 24, 36, 48, 60].filter((m) => m <= longest);
  if (!steps.includes(longest)) steps.push(longest);
  return steps;
}

function defaultInitialPayment(asset: CatalogAsset) {
  const suggested = asset.initialAmount ?? BNPL_MIN_INITIAL_PAYMENT;
  return String(Math.min(Math.max(suggested, BNPL_MIN_INITIAL_PAYMENT), asset.amount));
}

function AssetImage({ asset, className }: { asset: CatalogAsset; className: string }) {
  if (!asset.imageUrl) return <ProductArt productId="bnpl" className={className} />;
  const src = asset.imageUrl.startsWith("http")
    ? asset.imageUrl
    : `${API_BASE_URL}${asset.imageUrl.startsWith("/") ? "" : "/"}${asset.imageUrl}`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={asset.name} className={`object-cover ${className}`} />;
}

export function BnplSelectedAsset({ asset }: { asset: CatalogAsset }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
      <AssetImage asset={asset} className="size-20 shrink-0 rounded-lg" />
      <div>
        <h2 className="text-sm font-semibold">{asset.name}</h2>
        <p className="mt-1 text-xs leading-4 text-subtle">{asset.description}</p>
        <p className="mt-1 text-sm font-bold">{currency(asset.amount)}</p>
      </div>
    </div>
  );
}

type Group = { id: string; name: string; assets: CatalogAsset[] };

export function BnplCatalog({
  onSelect,
  onBack,
}: {
  onSelect: (asset: CatalogAsset) => void;
  onBack: () => void;
}) {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const categories = (await getAssetCategories()).data;
        const loaded = await Promise.all(
          categories.map(async (category) => ({
            id: category.id,
            name: category.name,
            assets: (await getAssetsByCategory(category.id)).data,
          })),
        );
        if (!cancelled) setGroups(loaded.filter((group) => group.assets.length > 0));
      } catch (err) {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Could not load the items.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeading
        title="Choose an item"
        description="Select the product you want to pay for in instalments."
        onBack={onBack}
      />
      {error && <Notice tone="error">{error}</Notice>}
      {!groups && !error && <p className="text-sm text-subtle">Loading items…</p>}
      {groups && groups.length === 0 && (
        <p className="text-sm text-subtle">No items are available right now.</p>
      )}
      <div className="space-y-8">
        {groups?.map((group) => (
          <section key={group.id}>
            <h2 className="mb-4 text-lg font-semibold">
              {group.name}
              <span className="ml-2 rounded-full bg-lilac/15 px-2 py-1 align-middle text-[10px] font-normal text-lilac">
                {group.assets.length} items
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.assets.map((asset) => {
                const blocked = availability(asset);
                return (
                  <article
                    key={asset.id}
                    className="min-w-0 rounded-xl border border-outline bg-[#202024] p-3"
                  >
                    <AssetImage asset={asset} className="h-[150px] w-full rounded-md" />
                    <h3 className="mt-3 text-sm font-semibold">{asset.name}</h3>
                    <p className="mt-1 min-h-10 text-[10px] leading-4 text-subtle">
                      {asset.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{currency(asset.amount)}</p>
                      <Button
                        size="sm"
                        disabled={!!blocked}
                        onClick={() => onSelect(asset)}
                        aria-label={`Select ${asset.name}`}
                        className="min-h-9 rounded-md px-4"
                      >
                        Select
                      </Button>
                    </div>
                    {blocked && <p className="mt-2 text-[10px] text-amber-300">{blocked}</p>}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// Asks the backend what the plan would cost, so the numbers shown are the ones that will be
// applied (it also enforces the minimum initial payment and the item's longest tenor).
export function useBnplQuote(draft: BnplDraft) {
  const [quote, setQuote] = useState<BnplQuote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);

  useEffect(() => {
    const token = getToken();
    const asset = draft.asset;
    const initial = Number(draft.initialPayment);
    if (!token || !asset || !initial) {
      setQuote(null);
      setError("");
      return;
    }
    const ticket = ++latest.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await previewBnplPurchase(
          { assetId: asset.id, initialPayment: initial, installmentMonths: draft.months },
          token,
        );
        if (ticket === latest.current) {
          setQuote(response.data);
          setError("");
        }
      } catch (err) {
        if (ticket === latest.current) {
          setQuote(null);
          setError(err instanceof ApiError ? err.message : "Could not calculate this plan.");
        }
      } finally {
        if (ticket === latest.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [draft.asset, draft.initialPayment, draft.months]);

  return { quote, error, loading };
}

function quoteItems(quote: BnplQuote) {
  return [
    { label: "Item price", value: currency(quote.assetAmount) },
    { label: "Initial payment (today)", value: currency(quote.initialPayment) },
    { label: "Left to pay", value: currency(quote.remainingBalance) },
    { label: "Instalments", value: `${quote.installmentMonths} months` },
    { label: "Monthly payment", value: currency(quote.monthlyPayment), highlight: true },
    { label: "Total you will pay", value: currency(quote.totalRepayment) },
  ];
}

export function BnplConfigure({
  draft,
  onChange,
  onContinue,
  onBack,
}: {
  draft: BnplDraft;
  onChange: (draft: BnplDraft) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const asset = draft.asset!;
  const { quote, error, loading } = useBnplQuote(draft);
  return (
    <>
      <PageHeading
        title="Create Plan"
        description="Choose your initial payment and repayment period."
        onBack={onBack}
      />
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (quote) onContinue();
        }}
      >
        <BnplSelectedAsset asset={asset} />
        <AmountInput
          label="Initial payment"
          name="initialPayment"
          variant="filled"
          placeholder="Enter amount"
          value={draft.initialPayment}
          min={BNPL_MIN_INITIAL_PAYMENT}
          max={asset.amount}
          hint={`Minimum ${currency(BNPL_MIN_INITIAL_PAYMENT)}, taken from your wallet today`}
          onValueChange={(value) => onChange({ ...draft, initialPayment: value })}
          required
        />
        <Select
          label="Repayment period"
          name="months"
          variant="filled"
          placeholder="Choose period"
          options={tenorOptions(asset).map((m) => `${m} months`)}
          value={`${draft.months} months`}
          onChange={(event) =>
            onChange({ ...draft, months: Number.parseInt(event.target.value, 10) })
          }
        />
        {error && <Notice tone="error">{error}</Notice>}
        {quote && (
          <section>
            <h2 className="mb-2 text-[10px] tracking-widest text-subtle">PLAN BREAKDOWN</h2>
            <SummaryList items={quoteItems(quote)} />
          </section>
        )}
        <Button type="submit" fullWidth size="lg" variant="login" disabled={!quote || loading}>
          {loading ? "Calculating…" : "Continue"}
        </Button>
      </form>
    </>
  );
}

export function BnplReview({
  draft,
  onBack,
  onCancel,
  onContinue,
}: {
  draft: BnplDraft;
  onBack: () => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const asset = draft.asset!;
  const { quote, error } = useBnplQuote(draft);
  return (
    <>
      <PageHeading
        title="Review Your Plan"
        description="Review all details before creating your plan"
        onBack={onBack}
      />
      <div className="space-y-4">
        <BnplSelectedAsset asset={asset} />
        {error && <Notice tone="error">{error}</Notice>}
        {quote && (
          <SummaryList
            items={quoteItems(quote)}
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button fullWidth variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button fullWidth variant="login" disabled={!quote} onClick={onContinue}>
            Create Plan
          </Button>
        </div>
        <Callout title="How repayment works" tone="info">
          The initial payment is taken from your wallet now. Each later instalment is paid from
          your wallet too, and you can pay any amount up to what is left. The item is released once
          the balance reaches zero.
        </Callout>
      </div>
    </>
  );
}

// The initial payment can only come from the wallet, so this step checks the balance and, if it
// is short, shows where to transfer instead of letting the purchase fail at the end.
export function BnplWalletStep({
  amount,
  onBack,
  onContinue,
}: {
  amount: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { user } = useCurrentUser();
  const balance = user.balance ?? 0;
  const enough = balance >= amount;
  return (
    <>
      <PageHeading
        title="Pay your initial payment"
        description="The initial payment is taken from your wallet balance."
        onBack={onBack}
      />
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-2xl bg-[#431967] p-5">
          <div className="absolute -top-5 -right-5 size-20 rounded-full bg-lilac/30" />
          <p className="text-xs text-lilac">Your Wallet Balance</p>
          <p className="mt-2 text-xl font-semibold">{currency(balance)}</p>
        </section>
        <section className="rounded-2xl border border-line bg-panel p-4">
          <h2 className="text-xs text-subtle">Initial payment</h2>
          <p className="mt-1 text-2xl font-bold">{currency(amount)}</p>
        </section>
        {enough ? (
          <Callout title="Debited when you confirm">
            {currency(amount)} will be taken from your wallet as soon as you confirm.
          </Callout>
        ) : (
          <>
            <Notice tone="error">
              Your wallet is {currency(amount - balance)} short. Transfer to your account below,
              then come back.
            </Notice>
            <FundingAccountCard />
          </>
        )}
        <Button fullWidth size="lg" disabled={!enough} onClick={onContinue}>
          Confirm
        </Button>
      </div>
    </>
  );
}

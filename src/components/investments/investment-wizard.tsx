"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LinkButton } from "@/components/ui/button";
import {
  calculatePreview,
  completionDateFor,
  defaultDraft,
  frequencyCode,
  interestPaymentCode,
  PRODUCT_TO_PRODUCT_CODE,
  PRODUCT_TO_SAVINGS_TYPE,
  type Product,
  type InvestmentDraft,
} from "@/lib/investments";
import { useInvestments } from "./investment-provider";
import { useCurrentUser } from "@/components/auth/auth-guard";
import {
  BnplCatalog,
  BnplConfigure,
  BnplReview,
  BnplWalletStep,
  emptyBnplDraft,
  type BnplDraft,
} from "./bnpl-flow";
import { InvestmentForm } from "./investment-form";
import { InvestmentReview } from "./investment-review";
import { FundingStep, type FundingChoice } from "./funding-step";
import { TransactionAuthStep } from "./transaction-auth-step";
import { TransferInstructions, type PendingTransfer } from "./transfer-instructions";
import {
  ApiError,
  createPendingDeposit,
  createSmartLock,
  createSss,
  createTargetSavings,
  depositToSavings,
  getProducts,
  getToken,
  purchaseBnpl,
  type TransactionAuth,
} from "@/lib/api";

type Step =
  | "catalog"
  | "configure"
  | "review"
  | "funding"
  | "authorize"
  | "success";

export function InvestmentWizard({ product }: { product: Product }) {
  const router = useRouter();
  const { refresh } = useInvestments();
  const { refreshUser } = useCurrentUser();
  const [step, setStep] = useState<Step>(
    product.id === "bnpl" ? "catalog" : "configure",
  );
  const [draft, setDraft] = useState<InvestmentDraft>(defaultDraft);
  const [bnplDraft, setBnplDraft] = useState<BnplDraft>(emptyBnplDraft);
  const [funding, setFunding] = useState<FundingChoice>("WALLET");
  const [transfer, setTransfer] = useState<PendingTransfer | null>(null);
  const completed = useRef(false);
  // Remembers the plan row once it exists, so retrying after a failed funding call (the OTP is
  // already spent) funds the existing plan instead of creating a duplicate.
  const createdPlanId = useRef<string | null>(null);
  const bnpl = product.id === "bnpl";
  const p = calculatePreview(product, draft);
  function go(next: Step) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function finish(auth: TransactionAuth) {
    if (completed.current) {
      go("success");
      return;
    }
    const token = getToken();
    if (!token) return;
    // Completion date drives tenor on the backend for Target Lock/Smart Lock/BNPL.
    const completionDateStr = completionDateFor(draft.months);

    if (bnpl) {
      // A purchase is its own call: the initial payment comes out of the wallet and the plan is
      // created in the same step, so there is no separate funding call.
      await purchaseBnpl(
        {
          assetId: bnplDraft.asset!.id,
          initialPayment: Number(bnplDraft.initialPayment),
          installmentMonths: bnplDraft.months,
        },
        auth,
        token,
      );
      completed.current = true;
      await Promise.all([refresh(), refreshUser()]);
      go("success");
      return;
    }

    const catalog = await getProducts(token);
    const entry = catalog.data.find(
      (item) => item.productCode === PRODUCT_TO_PRODUCT_CODE[product.id],
    );
    if (!entry) {
      throw new ApiError(
        `Could not find the ${product.name} product on the backend.`,
      );
    }
    const productId = entry.id;
    const name = draft.goal.trim();
    const savingsType = PRODUCT_TO_SAVINGS_TYPE[product.id];

    if (product.id === "smart-lock") {
      const lock = await createSmartLock(
        {
          productId,
          name,
          amount: p.principal,
          tenor: draft.months,
          completionDate: completionDateStr,
          fundingType: funding === "WALLET" ? "WALLET_DEBIT" : "DIRECT_DEPOSIT",
          interestPaymentFrequency: interestPaymentCode(draft.payout),
        },
        auth,
        token,
      );
      if (funding === "BANK_TRANSFER") {
        setTransfer({
          planName: name,
          amount: p.principal,
          expiresAt: lock.data.fundingExpiryTime ?? "",
          smartLockId: lock.data.id,
        });
      }
    } else {
      if (!createdPlanId.current) {
        const createResponse =
          product.id === "target-lock"
            ? await createTargetSavings(
                {
                  productId,
                  name,
                  amount: p.principal,
                  completionDate: completionDateStr,
                  frequency: frequencyCode(draft.frequency),
                },
                auth,
                token,
              )
            : await createSss(
                {
                  productId,
                  name,
                  amount: p.principal,
                  tenor: draft.months,
                  completionDate: `${completionDateStr}T00:00:00`,
                  frequency: frequencyCode(draft.frequency),
                },
                auth,
                token,
              );
        createdPlanId.current = (createResponse.data as { id: string }).id;
      }
      // Both funding calls identify the plan by its own id, so a user can hold several plans of
      // the same product.
      if (funding === "WALLET") {
        await depositToSavings(
          createdPlanId.current,
          savingsType,
          p.principal,
          auth,
          token,
        );
      } else {
        const pending = await createPendingDeposit(
          createdPlanId.current,
          savingsType,
          p.principal,
          auth,
          token,
        );
        setTransfer({
          planName: name,
          amount: pending.data.expectedAmount,
          expiresAt: pending.data.expiryTime,
          referenceCode: pending.data.referenceCode,
        });
      }
    }

    completed.current = true;
    await Promise.all([refresh(), refreshUser()]);
    go("success");
  }
  const cancel = () => router.push(`/investments/${product.id}`);
  return (
    <div
      className={`mx-auto px-5 pt-10 pb-8 ${step === "catalog" ? "max-w-[1120px]" : "max-w-[680px]"}`}
    >
      {bnpl && step === "catalog" && (
        <BnplCatalog
          onBack={cancel}
          onSelect={(asset) => {
            const suggested = Math.min(
              Math.max(asset.initialAmount ?? 50000, 50000),
              asset.amount,
            );
            const longest = asset.maxTenor ?? 12;
            setBnplDraft({
              asset,
              initialPayment: String(suggested),
              months: Math.min(6, longest),
            });
            go("configure");
          }}
        />
      )}
      {bnpl && step === "configure" && (
        <BnplConfigure
          draft={bnplDraft}
          onChange={setBnplDraft}
          onContinue={() => go("review")}
          onBack={() => go("catalog")}
        />
      )}
      {bnpl && step === "review" && (
        <BnplReview
          draft={bnplDraft}
          onBack={() => go("configure")}
          onCancel={cancel}
          onContinue={() => go("funding")}
        />
      )}
      {bnpl && step === "funding" && (
        <BnplWalletStep
          amount={Number(bnplDraft.initialPayment)}
          onBack={() => go("review")}
          onContinue={() => go("authorize")}
        />
      )}
      {!bnpl && step === "configure" && (
        <InvestmentForm
          product={product}
          draft={draft}
          onChange={setDraft}
          onContinue={() => go("review")}
          onBack={cancel}
        />
      )}
      {!bnpl && step === "review" && (
        <InvestmentReview
          product={product}
          draft={draft}
          onBack={() => go("configure")}
          onCancel={cancel}
          onContinue={() => go("funding")}
        />
      )}
      {!bnpl && step === "funding" && (
        <FundingStep
          amount={p.principal}
          onBack={() => go("review")}
          onContinue={(choice) => {
            setFunding(choice);
            go("authorize");
          }}
        />
      )}
      {step === "authorize" && (
        <TransactionAuthStep
          amount={bnpl ? Number(bnplDraft.initialPayment) : p.principal}
          description={
            bnpl
              ? "Authorize this purchase with a one-time code."
              : undefined
          }
          submitLabel={bnpl ? "Verify & create plan" : undefined}
          onBack={() => go("funding")}
          onConfirm={finish}
        />
      )}
      {step === "success" && transfer && <TransferInstructions transfer={transfer} />}
      {step === "success" && !transfer && (
        <section className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
          <span className="text-7xl" role="img" aria-label="Celebration">
            🎉
          </span>
          <h1 className="mt-9 text-2xl font-bold">Successful</h1>
          <p className="mt-2 text-sm text-subtle">
            {bnpl
              ? "Your plan was created and your initial payment was taken from your wallet."
              : "Investment Plan Created Successfully"}
          </p>
          <LinkButton
            href="/dashboard"
            fullWidth
            className="mt-8 max-w-96"
            size="lg"
          >
            Back to Dashboard
          </LinkButton>
        </section>
      )}
    </div>
  );
}

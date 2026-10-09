"use client";
import { useState } from "react";
import { useCurrentUser } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/workspace/page-heading";
import { currency } from "@/lib/investments";
import { Callout } from "./callout";
import { FundingAccountCard } from "./funding-account-card";

export type FundingChoice = "WALLET" | "BANK_TRANSFER";

export function FundingStep({
  amount,
  onBack,
  onContinue,
}: {
  amount: number;
  onBack: () => void;
  onContinue: (choice: FundingChoice) => void;
}) {
  const { user } = useCurrentUser();
  const balance = user.balance ?? 0;
  const [choice, setChoice] = useState<FundingChoice>(
    balance >= amount ? "WALLET" : "BANK_TRANSFER",
  );
  return (
    <>
      <PageHeading
        title="Fund Your Investment"
        description="Choose how to fund your investment."
        onBack={onBack}
      />
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-2xl bg-[#431967] p-5">
          <div className="absolute -top-5 -right-5 size-20 rounded-full bg-lilac/30" />
          <p className="text-xs text-lilac">Your Wallet Balance</p>
          <p className="mt-2 text-xl font-semibold">{currency(balance)}</p>
        </section>
        <section className="rounded-2xl border border-line bg-panel p-4">
          <h2 className="text-xs text-subtle">
            Initial Investment
          </h2>
          <p className="mt-1 text-2xl font-bold">{currency(amount)}</p>
        </section>
      <>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setChoice("WALLET")}
            disabled={balance < amount}
            className={`w-full rounded-xl border p-4 text-left text-sm ${choice === "WALLET" ? "border-lilac bg-lilac/10" : "border-line bg-panel"} ${balance < amount ? "opacity-50" : ""}`}
          >
            <span className="font-semibold">Fund from wallet now</span>
            <p className="mt-1 text-xs text-subtle">
              {balance < amount
                ? "Insufficient wallet balance for this amount."
                : "Debited immediately from your wallet balance."}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setChoice("BANK_TRANSFER")}
            className={`w-full rounded-xl border p-4 text-left text-sm ${choice === "BANK_TRANSFER" ? "border-lilac bg-lilac/10" : "border-line bg-panel"}`}
          >
            <span className="font-semibold">Fund by bank transfer</span>
            <p className="mt-1 text-xs text-subtle">
              Transfer this amount to your account below - it&apos;s credited
              automatically once it lands.
            </p>
          </button>
        </div>
        {choice === "BANK_TRANSFER" ? (
          <>
            <FundingAccountCard />
            <Callout title="Transfer after you confirm">
              Confirm to create your plan - you&apos;ll then get the exact
              amount, reference and time limit for your transfer. It&apos;s
              credited automatically once it lands.
            </Callout>
          </>
        ) : (
          <Callout title="Funded immediately">
            The amount is debited from your wallet balance as soon as you
            confirm.
          </Callout>
        )}
      </>
        <Button fullWidth size="lg" onClick={() => onContinue(choice)}>
          Confirm
        </Button>
      </div>
    </>
  );
}

"use client";
import { PageHeading } from "@/components/workspace/page-heading";
import type { TransactionAuth } from "@/lib/api";
import { TransactionOtpForm } from "./transaction-otp-form";

export function TransactionAuthStep({
  amount,
  onBack,
  onConfirm,
  description = "Authorize this investment with a one-time code.",
  submitLabel = "Verify & create investment",
}: {
  // The amount the code is bound to - must equal what the create/fund calls send.
  amount: number;
  onBack: () => void;
  // Throws on failure (wrong code, or the create/fund call itself failing) - the step stays
  // visible with the real error message instead of advancing to "success".
  onConfirm: (auth: TransactionAuth) => Promise<void>;
  description?: string;
  submitLabel?: string;
}) {
  return (
    <>
      <PageHeading
        title="Confirm with a verification code"
        description={description}
        onBack={onBack}
      />
      <div className="mt-8">
        <TransactionOtpForm
          action="INVEST"
          amount={amount}
          onAuthorized={onConfirm}
          submitLabel={submitLabel}
        />
      </div>
    </>
  );
}

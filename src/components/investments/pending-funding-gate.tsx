"use client";
import { useEffect, useState, type ReactNode } from "react";
import { PageHeading } from "@/components/workspace/page-heading";
import { LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { TransferInstructions, type PendingTransfer } from "./transfer-instructions";
import { getPendingFunding, getToken, type PendingFundingItem } from "@/lib/api";

function toTransfer(item: PendingFundingItem): PendingTransfer {
  return {
    planName: item.planName || "Your investment",
    amount: Number(item.amount),
    expiresAt: item.expiresAt,
    ...(item.referenceCode ? { referenceCode: item.referenceCode } : { smartLockId: item.planId }),
  };
}

/**
 * Stops a customer starting a new investment while one is still waiting for its bank transfer: the
 * transfer is matched to a request by its exact amount, so two open requests cannot be credited reliably.
 * Instead of the form they see the open transfer's details and how to finish it. Checked once, when the
 * screen opens, so it never interrupts a wizard that is already under way.
 */
export function PendingFundingGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"checking" | "free" | "blocked">("checking");
  const [open, setOpen] = useState<PendingFundingItem[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setState("free");
      return;
    }
    getPendingFunding(token)
      .then((response) => {
        setOpen(response.data);
        setState(response.data.length ? "blocked" : "free");
      })
      // If the check itself fails the backend still refuses a second investment, so show the form.
      .catch(() => setState("free"));
  }, []);

  if (state === "checking") {
    return <p role="status" className="px-5 py-16 text-center text-sm text-subtle">Checking your account…</p>;
  }
  if (state === "free") return <>{children}</>;

  return (
    <div className="mx-auto max-w-[680px] space-y-5 px-5 py-10 pb-28">
      <PageHeading title="Finish your transfer first" backHref="/investments/active" />
      <Notice>
        You already have {open[0].planName ? `“${open[0].planName}”` : "an investment"} waiting for your bank transfer. You can
        start a new investment once it is paid, or after it expires
        {open.length > 1 ? ` (${open.length} are waiting)` : ""}.
      </Notice>
      <TransferInstructions transfer={toTransfer(open[0])} />
      <LinkButton href="/investments/active" variant="secondary" fullWidth>
        View my investment plans
      </LinkButton>
    </div>
  );
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LinkButton, Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useCurrentUser } from "@/components/auth/auth-guard";
import { useInvestments } from "./investment-provider";
import { FundingAccountCard, CopyButton } from "./funding-account-card";
import { Callout } from "./callout";
import { currency } from "@/lib/investments";
import {
  ApiError,
  claimPendingDeposit,
  getPendingDepositState,
  getToken,
  getUserProducts,
} from "@/lib/api";

// What the wizard hands over after creating a plan that is waiting on a bank transfer.
export type PendingTransfer = {
  planName: string;
  amount: number;
  expiresAt: string;
  // SmallVest / Target Lock: a pending deposit with a reference code we can poll.
  referenceCode?: string;
  // Smart Lock: no pending deposit - the lock itself sits in PENDING_FUNDING until it's credited.
  smartLockId?: string;
};

type State = "waiting" | "completed" | "expired";

const POLL_MS = 10_000;

export function TransferInstructions({ transfer }: { transfer: PendingTransfer }) {
  const { refreshUser } = useCurrentUser();
  const { refresh } = useInvestments();
  const [state, setState] = useState<State>("waiting");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const settled = useRef(false);

  const check = useCallback(async (manual = false) => {
    const token = getToken();
    if (!token || settled.current) return;
    setChecking(true);
    try {
      let next: State = "waiting";
      if (transfer.referenceCode) {
        // The button also looks for money that reached the wallet before this request existed; the
        // background poll only reads the status and never moves money.
        const result = manual
          ? await claimPendingDeposit(transfer.referenceCode, token)
          : await getPendingDepositState(transfer.referenceCode, token);
        next = result === "pending" ? "waiting" : result;
      } else if (transfer.smartLockId) {
        const products = (await getUserProducts(token)).data;
        const lock = products.find((p) => p.id === transfer.smartLockId);
        if (lock && lock.status.toLowerCase() !== "pending_funding") {
          next = "completed";
        } else if (new Date(transfer.expiresAt).getTime() < Date.now()) {
          next = "expired";
        }
      }
      setError("");
      setNotice(
        manual && next === "waiting"
          ? `We haven't found a payment of ${currency(transfer.amount)} yet. If you've already sent it, give it a few minutes - this page keeps checking automatically.`
          : "",
      );
      if (next !== "waiting") {
        settled.current = true;
        setState(next);
        if (next === "completed") await Promise.all([refresh(), refreshUser()]);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not check your payment.",
      );
    } finally {
      setChecking(false);
    }
  }, [transfer, refresh, refreshUser]);

  useEffect(() => {
    const id = setInterval(() => check(), POLL_MS);
    return () => clearInterval(id);
  }, [check]);

  const expiry = new Date(transfer.expiresAt);
  const expiryText = Number.isNaN(expiry.getTime())
    ? null
    : expiry.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <section className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {state === "completed"
            ? "Payment received"
            : state === "expired"
              ? "Transfer window expired"
              : "Complete your transfer"}
        </h1>
        <p className="mt-2 text-sm text-subtle">
          {state === "completed"
            ? `${transfer.planName} has been funded.`
            : state === "expired"
              ? "We didn't receive the transfer in time. Start a new funding request from your plan."
              : `${transfer.planName} was created and is waiting for your transfer.`}
        </p>
      </div>

      {state === "waiting" && (
        <>
          <div className="rounded-2xl border border-lilac/30 bg-lilac/10 p-4 text-center">
            <p className="text-xs text-subtle">Transfer exactly</p>
            <div className="mt-1 flex items-center justify-center gap-3">
              <p className="text-3xl font-bold">{currency(transfer.amount)}</p>
              <CopyButton value={String(transfer.amount)} label="amount" />
            </div>
            {expiryText && (
              <p className="mt-2 text-xs text-muted">Before {expiryText}</p>
            )}
          </div>
          <FundingAccountCard />
          {transfer.referenceCode && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel p-4">
              <div>
                <p className="text-xs text-subtle">Reference</p>
                <p className="mt-1 text-sm font-semibold">
                  {transfer.referenceCode}
                </p>
              </div>
              <CopyButton value={transfer.referenceCode} label="reference" />
            </div>
          )}
          <Callout title="Send the exact amount">
            Your payment is matched to this plan by the exact amount, so
            don&apos;t round it or split it into several transfers. It&apos;s
            credited automatically within a few minutes of landing - this page
            checks every few seconds.
          </Callout>
          {error && <Notice tone="error">{error}</Notice>}
          {notice && !error && <Notice>{notice}</Notice>}
          <Button
            fullWidth
            size="lg"
            onClick={() => check(true)}
            disabled={checking}
          >
            {checking ? "Checking…" : "I've made the payment"}
          </Button>
        </>
      )}

      <LinkButton
        href="/dashboard"
        fullWidth
        size="lg"
        variant={state === "waiting" ? "secondary" : "primary"}
      >
        Back to Dashboard
      </LinkButton>
    </section>
  );
}

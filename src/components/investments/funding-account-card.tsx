"use client";
import { useState } from "react";
import { useCurrentUser } from "@/components/auth/auth-guard";
import { Notice } from "@/components/ui/notice";
import { getFundingAccount } from "@/lib/funding";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard blocked (insecure origin / permissions) - the value is still selectable.
        }
      }}
      className="shrink-0 rounded-lg border border-lilac/40 px-2.5 py-1 text-xs text-lilac hover:bg-lilac/10"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// The user's own virtual account - the one their transfers must go to so the webhook can credit
// them. Never fabricates details: if the account doesn't exist yet it says so.
export function FundingAccountCard() {
  const { user } = useCurrentUser();
  const account = getFundingAccount(user);
  if (!account) {
    return (
      <Notice tone="error">
        Your funding account number isn&apos;t available yet. Please contact
        support if this persists - transfers can&apos;t be credited without it.
      </Notice>
    );
  }
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#431967] p-5">
      <div className="absolute -top-5 -right-5 size-20 rounded-full bg-lilac/30" />
      <p className="text-xs text-lilac">{account.bankName}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xl font-semibold tracking-[2px]">
          {account.accountNumber}
        </p>
        <CopyButton value={account.accountNumber} label="account number" />
      </div>
      <p className="mt-4 text-[10px] text-lilac">Account Name</p>
      <p className="mt-1 text-sm font-medium">{account.accountName}</p>
    </section>
  );
}

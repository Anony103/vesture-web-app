"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LinkButton } from "@/components/ui/button";
import { getInvestmentEligibility, getToken, type InvestmentEligibility } from "@/lib/api";

/**
 * Whether the customer may start a plan. `null` while it is being checked. If the check itself fails the backend
 * still refuses the plan, so a failed check is treated as "go ahead" rather than blocking everyone.
 */
export function useInvestmentEligibility(): InvestmentEligibility | null {
  const [status, setStatus] = useState<InvestmentEligibility | null>(null);
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus({ required: false, identityVerified: true, bankSet: true, eligible: true, missing: [] });
      return;
    }
    getInvestmentEligibility(token)
      .then((response) => setStatus(response.data))
      .catch(() => setStatus({ required: false, identityVerified: true, bankSet: true, eligible: true, missing: [] }));
  }, []);
  return status;
}

function Row({ done, title, detail, href, action }: { done: boolean; title: string; detail: string; href: string; action: string }) {
  // The settings screen's back arrow returns to this page, so the customer lands exactly where they left off.
  const here = usePathname();
  const target = here ? `${href}?from=${encodeURIComponent(here)}` : href;
  return (
    <li className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-0">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 ${done ? "border-[#7C2EBF] bg-[#7C2EBF] text-white" : "border-outline text-muted"}`}
        aria-hidden="true"
      >
        {done ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        ) : (
          <span className="size-2 rounded-full bg-current" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {title}
          <span className="sr-only"> - {done ? "done" : "not done yet"}</span>
        </p>
        <p className="mt-0.5 text-xs text-subtle">{detail}</p>
      </div>
      {!done && (
        <LinkButton href={target} variant="secondary" size="sm">
          {action}
        </LinkButton>
      )}
    </li>
  );
}

/** The two things to finish before investing, each with the button that goes to the right screen. */
export function SetupChecklist({ status, heading = true }: { status: InvestmentEligibility; heading?: boolean }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-panel" aria-labelledby={heading ? "setup-heading" : undefined}>
      {heading && (
        <div className="border-b border-line px-5 py-4">
          <h2 id="setup-heading" className="font-display text-base font-semibold">Complete your setup to invest</h2>
          <p className="mt-1 text-xs text-subtle">
            Two quick steps first. Your bank account is where your money is paid when a plan is liquidated.
          </p>
        </div>
      )}
      <ul>
        <Row
          done={status.identityVerified}
          title="Verify your identity"
          detail="A live selfie, your NIN and an ID."
          href="/settings/verification"
          action="Verify now"
        />
        <Row
          done={status.bankSet}
          title="Add your bank account"
          detail="The account we pay out to when you withdraw or a plan is liquidated."
          href="/settings/bank"
          action="Add account"
        />
      </ul>
    </section>
  );
}

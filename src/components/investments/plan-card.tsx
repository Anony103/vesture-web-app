"use client";
import { currency, type DemoPlan } from "@/lib/investments";
import { LinkButton } from "@/components/ui/button";
function planStatus(plan: DemoPlan) {
  if (plan.awaitingFunding) return { label: "Awaiting funding", tone: "text-amber-300 bg-amber-300/10" };
  if (plan.settingUp) return { label: plan.settingUp, tone: "text-amber-300 bg-amber-300/10" };
  if (plan.closed) return { label: "Closed", tone: "text-subtle bg-white/10" };
  if (plan.bnpl?.completed) return { label: "Completed", tone: "text-subtle bg-white/10" };
  return { label: "Active", tone: "text-positive bg-positive/12" };
}
export function PlanCard({ plan }: { plan: DemoPlan }) {
  const status = planStatus(plan);
  return (
    <>
      <LinkButton
        variant="secondary"
        fullWidth
        className="block rounded-2xl bg-panel p-4 text-left text-ink"
        href={`/investments/active/${plan.id}`}
        aria-label={`View ${plan.goal} plan`}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">{plan.goal}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs ${status.tone}`}>
            {status.label}
          </span>
        </span>
        <span className="mt-3 block text-xs font-normal text-muted">
          Started {new Date(plan.started).toLocaleDateString("en-GB")}
        </span>
        <span className="mt-3 flex items-end justify-between gap-5">
          <span>
            <span className="block text-xs font-normal text-subtle">
              {plan.bnpl ? "Paid so far" : "Amount locked"}
            </span>
            <span className="text-sm font-bold">{currency(plan.amount)}</span>
            {!plan.bnpl && !!plan.targetAmount && (
              <span className="ml-1 text-xs font-normal text-muted">
                of {currency(plan.targetAmount)}
              </span>
            )}
          </span>
          {plan.bnpl ? (
            <span className="text-right">
              <span className="block text-xs font-normal text-subtle">
                Still owed
              </span>
              <span className="text-sm font-bold">
                {currency(plan.bnpl.remaining)}
              </span>
            </span>
          ) : (
            <span className="text-right">
              <span className="block text-xs font-normal text-subtle">
                Accrued Interest
              </span>
              <span className="text-sm font-bold text-positive">
                +{currency(plan.interest)}
              </span>
            </span>
          )}
        </span>
      </LinkButton>
    </>
  );
}

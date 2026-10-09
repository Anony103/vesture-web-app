import type { DemoPlan, DemoTransaction } from "./investments";
// What a full withdrawal would cost today, mirroring the backend's rules (the exact figures are
// worked out by the backend when the withdrawal is submitted):
//  - SmallVest: tax on the interest;
//  - Target Lock: leaving before the goal date forfeits 30% of the interest, then tax on the rest;
//  - Smart Lock: its interest is already stored net of tax, so nothing more is taken (and before
//    maturity only the interest can be withdrawn - see canWithdrawPrincipal).
export function withdrawalQuote(plan: DemoPlan) {
  const interest = Math.max(0, plan.interest);
  const early =
    plan.productId === "target-lock" &&
    !!plan.maturityDate &&
    new Date(plan.maturityDate).getTime() > Date.now();
  const penalty = early ? interest * 0.3 : 0;
  const tax =
    plan.productId === "smallvest" || plan.productId === "target-lock"
      ? Math.max(0, interest - penalty) * 0.1
      : 0;
  return {
    penalty,
    tax,
    payout: Math.max(0, plan.amount + plan.interest - penalty - tax),
  };
}
// A Smart Lock's principal stays locked until it matures; only its interest can leave before then.
export function canWithdrawPrincipal(plan: DemoPlan) {
  if (plan.productId !== "smart-lock") return true;
  return !plan.maturityDate || new Date(plan.maturityDate).getTime() <= Date.now();
}
export function transactionTotals(transactions: DemoTransaction[]) {
  return transactions.reduce(
    (totals, t) => {
      if ((t.status ?? "Completed") !== "Completed") return totals;
      const kind = t.kind ?? "Deposit";
      if (kind === "Withdrawal") totals.outflow += t.amount;
      else totals.inflow += t.amount;
      totals.net = totals.inflow - totals.outflow;
      return totals;
    },
    { inflow: 0, outflow: 0, net: 0 },
  );
}

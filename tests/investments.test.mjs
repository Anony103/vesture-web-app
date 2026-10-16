import test from "node:test";
import assert from "node:assert/strict";
import {
  products,
  calculatePreview,
  defaultDraft,
} from "../src/lib/investments.ts";
for (const [id, interest, total] of [
  ["smallvest", 4500, 154050],
  ["smart-lock", 8250, 157425],
  ["target-lock", 7500, 156750],
]) {
  test(`${id} calculates three-month returns net of withholding`, () => {
    const result = calculatePreview(
      products.find((p) => p.id === id),
      { ...defaultDraft(), amount: "150000", months: 3 },
    );
    assert.equal(result.grossInterest, interest);
    assert.equal(result.withholding, interest * 0.1);
    assert.equal(result.total, total);
  });
}
import {
  withdrawalQuote,
  canWithdrawPrincipal,
  transactionTotals,
} from "../src/lib/activity.ts";
const future = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();
const past = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
test("SmallVest withdrawal only pays tax on the interest", () => {
  assert.deepEqual(
    withdrawalQuote({ amount: 150000, interest: 45000, productId: "smallvest" }),
    { penalty: 0, tax: 4500, payout: 190500 },
  );
});
test("Target Lock forfeits 30% of interest before the goal date, then pays tax", () => {
  assert.deepEqual(
    withdrawalQuote({ amount: 150000, interest: 45000, productId: "target-lock", maturityDate: future }),
    { penalty: 13500, tax: 3150, payout: 178350 },
  );
  assert.deepEqual(
    withdrawalQuote({ amount: 150000, interest: 45000, productId: "target-lock", maturityDate: past }),
    { penalty: 0, tax: 4500, payout: 190500 },
  );
});
test("Smart Lock interest is already net of tax, so nothing more is taken", () => {
  assert.deepEqual(
    withdrawalQuote({ amount: 100000, interest: 18000, productId: "smart-lock", maturityDate: past }),
    { penalty: 0, tax: 0, payout: 118000 },
  );
});
test("Smart Lock principal is locked until it matures", () => {
  assert.equal(canWithdrawPrincipal({ productId: "smart-lock", maturityDate: future }), false);
  assert.equal(canWithdrawPrincipal({ productId: "smart-lock", maturityDate: past }), true);
  assert.equal(canWithdrawPrincipal({ productId: "smallvest", maturityDate: future }), true);
});
test("activity summaries exclude pending and cancelled entries", () => {
  const totals = transactionTotals([
    { amount: 100, kind: "Deposit", status: "Completed" },
    { amount: 10, kind: "Interest", status: "Completed" },
    { amount: 30, kind: "Withdrawal", status: "Completed" },
    { amount: 999, status: "Pending" },
    { amount: 999, status: "Cancelled" },
  ]);
  assert.deepEqual(totals, { inflow: 110, outflow: 30, net: 80 });
  assert.deepEqual(transactionTotals([]), { inflow: 0, outflow: 0, net: 0 });
});

test("transaction text shows SmallVest and Target Lock instead of the backend's product names", async () => {
  const { productDisplayText } = await import("../src/lib/investments.ts");
  assert.equal(productDisplayText("Deposit to Save Small Small"), "Deposit to SmallVest");
  assert.equal(productDisplayText("Deposit to Target Savings"), "Deposit to Target Lock");
  assert.equal(
    productDisplayText("Direct deposit to Save Small Small - Ref: PAY-SAV-1"),
    "Direct deposit to SmallVest - Ref: PAY-SAV-1",
  );
  assert.equal(productDisplayText("Withdrawal from target savings to bank"), "Withdrawal from Target Lock to bank");
  assert.equal(productDisplayText("wallet funding"), "wallet funding");
});

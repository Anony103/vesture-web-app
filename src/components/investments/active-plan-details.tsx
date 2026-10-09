"use client";
import { useEffect, useState } from "react";
import { useInvestments } from "./investment-provider";
import { useCurrentUser } from "@/components/auth/auth-guard";
import {
  currency,
  getProduct,
  minimumInvestment,
  PRODUCT_TO_SAVINGS_TYPE,
  type DemoPlan,
} from "@/lib/investments";
import { canWithdrawPrincipal, withdrawalQuote } from "@/lib/activity";
import { SummaryList } from "./summary-list";
import { Callout } from "./callout";
import { PageHeading } from "@/components/workspace/page-heading";
import { Button, LinkButton } from "@/components/ui/button";
import { AmountInput } from "@/components/ui/amount-input";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { SuccessState } from "@/components/ui/success-state";
import { TransactionOtpForm } from "./transaction-otp-form";
import { FundingAccountCard } from "./funding-account-card";
import { TransferInstructions, type PendingTransfer } from "./transfer-instructions";
import {
  addFundsToSmartLock,
  createPendingDeposit,
  depositToSavings,
  getToken,
  getUserBankAccounts,
  payInstallment,
  withdrawFromSavings,
  type TransactionAuth,
  type UserBankAccountRecord,
} from "@/lib/api";

export function PlanValue({
  amount,
  interest = 0,
  target,
  targetLabel = "Target amount",
  progress,
}: {
  // What is locked in the plan right now.
  amount: number;
  interest?: number;
  // What the plan was set up for; shown next to what is locked, with how far along it is.
  target?: number;
  targetLabel?: string;
  // Share of the term that has passed.
  progress?: number;
}) {
  const funded =
    target && target > 0 ? Math.min(100, Math.round((amount / target) * 100)) : undefined;
  return (
    <section className="rounded-2xl border border-line bg-panel p-5">
      <p className="text-xs text-subtle">Amount locked</p>
      <p className="mt-2 text-3xl font-bold">{currency(amount)}</p>
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-xs">
        {target !== undefined && (
          <div>
            <p className="text-muted">{targetLabel}</p>
            <p className="mt-1 font-semibold">{currency(target)}</p>
          </div>
        )}
        <div>
          <p className="text-muted">Interest earned</p>
          <p className="mt-1 font-semibold text-positive">{currency(interest)}</p>
        </div>
        <div>
          <p className="text-muted">Total value</p>
          <p className="mt-1 font-semibold">{currency(amount + interest)}</p>
        </div>
      </div>
      {funded !== undefined && (
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs text-subtle">
            <span>
              {currency(amount)} of {currency(target!)} locked
            </span>
            <span>{funded}%</span>
          </div>
          <progress
            aria-label="Share of the target amount locked"
            max={100}
            value={funded}
            className="h-1.5 w-full overflow-hidden rounded-full accent-lilac"
          />
        </div>
      )}
      {progress !== undefined && (
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs text-subtle">
            <span>Term elapsed</span>
            <span>{progress}%</span>
          </div>
          <progress
            aria-label="Investment term elapsed"
            max={100}
            value={progress}
            className="h-1.5 w-full overflow-hidden rounded-full accent-lilac"
          />
        </div>
      )}
    </section>
  );
}

function BnplValue({ plan }: { plan: DemoPlan }) {
  const bnpl = plan.bnpl!;
  const percent = bnpl.price > 0 ? Math.round((plan.amount / bnpl.price) * 100) : 0;
  return (
    <section className="rounded-2xl border border-line bg-panel p-5">
      <p className="text-xs text-subtle">Still to pay</p>
      <p className="mt-2 text-3xl font-bold">{currency(bnpl.remaining)}</p>
      <div className="mt-4 flex gap-8 text-xs">
        <div>
          <p className="text-muted">Paid so far</p>
          <p className="mt-1 font-semibold">{currency(plan.amount)}</p>
        </div>
        <div>
          <p className="text-muted">Item price</p>
          <p className="mt-1 font-semibold">{currency(bnpl.price)}</p>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs text-subtle">
          <span>Paid off</span>
          <span>{percent}%</span>
        </div>
        <progress
          aria-label="Share of the item paid off"
          max={100}
          value={percent}
          className="h-1.5 w-full overflow-hidden rounded-full accent-lilac"
        />
      </div>
    </section>
  );
}

type Mode = "withdraw" | "topup" | "addfunds" | "pay" | null;
type Done = { title: string; description: string };

export function ActivePlanDetails({ id }: { id: string }) {
  const { plans, refresh } = useInvestments();
  const { user, refreshUser } = useCurrentUser();
  const plan = plans.find((p) => p.id === id);
  const [mode, setMode] = useState<Mode>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [transfer, setTransfer] = useState<PendingTransfer | null>(null);
  const [amount, setAmount] = useState("");
  const [fundSource, setFundSource] = useState<"WALLET" | "BANK_TRANSFER">("WALLET");
  const [bankAccount, setBankAccount] = useState<UserBankAccountRecord | null>(null);
  const [loadingBank, setLoadingBank] = useState(true);
  // Once the amount is confirmed the code request goes out (it is bound to that exact amount).
  const [amountLocked, setAmountLocked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getUserBankAccounts(token)
      .then((response) => setBankAccount(response.data[0] ?? null))
      .catch(() => setBankAccount(null))
      .finally(() => setLoadingBank(false));
  }, []);

  if (transfer) return <div className="mx-auto max-w-[680px] px-5 py-10"><TransferInstructions transfer={transfer} /></div>;
  if (done)
    return <SuccessState title={done.title} description={done.description} />;
  if (!plan)
    return (
      <div className="mx-auto max-w-[680px] px-5 py-10">
        <PageHeading title="Plan unavailable" backHref="/investments/active" />
        <p className="mb-6 text-sm text-muted">
          This plan no longer exists, or has already been withdrawn.
        </p>
        <LinkButton href="/investments/active">View active plans</LinkButton>
      </div>
    );

  const current = plan;
  const product = getProduct(current.productId)!;
  const bnpl = current.bnpl;
  const smartLock = current.productId === "smart-lock";
  const awaiting = !!current.awaitingFunding;
  const savingsType = PRODUCT_TO_SAVINGS_TYPE[current.productId];
  const targetLabel =
    current.productId === "target-lock"
      ? "Target amount"
      : smartLock
        ? "Lock amount"
        : "Plan amount";
  const quote = withdrawalQuote(current);
  const started = new Date(current.started);
  const maturity = current.maturityDate
    ? new Date(current.maturityDate)
    : (() => {
        const date = new Date(current.started);
        date.setMonth(date.getMonth() + current.months);
        return date;
      })();
  // Smart Lock principal is locked until maturity; before then only the interest can go.
  const principalLocked = smartLock && !canWithdrawPrincipal(current);
  const interestOnly = principalLocked;
  const withdrawAmount = interestOnly ? current.interest : current.amount + current.interest;
  const nothingToWithdraw = withdrawAmount <= 0;
  const typed = Number(amount) || 0;
  // The very first deposit into a plan has to meet the sector minimum; later top-ups can be any amount.
  const firstDepositMin = awaiting && !bnpl ? minimumInvestment(product, user.sectorPP) : 1;

  function close() {
    setMode(null);
    setAmount("");
    setAmountLocked(false);
  }
  function open(next: Mode, preset = "") {
    setAmount(preset);
    setAmountLocked(false);
    setFundSource("WALLET");
    setMode(next);
  }
  async function finishWith(result: Done) {
    close();
    setDone(result);
    await Promise.all([refresh(), refreshUser()]);
  }

  // ---- actions (each runs once the one-time code has been verified) ----
  async function submitWithdrawal(auth: TransactionAuth) {
    const token = getToken();
    if (!token || !bankAccount) return;
    const response = await withdrawFromSavings(
      {
        savingsId: current.id,
        savingsType: savingsType as "SAVE_SMALL_SMALL" | "TARGET_SAVINGS" | "SMART_LOCK",
        amount: withdrawAmount,
        withdrawalSource: interestOnly ? "INTEREST_ONLY" : "BOTH",
        bankAccountId: bankAccount.id,
      },
      auth,
      token,
    );
    // "pending": the bank hasn't confirmed the transfer yet but the money has left the plan.
    await finishWith(
      response.status === "pending"
        ? {
            title: "Withdrawal Processing",
            description:
              "The amount has been taken from your plan and sent to the bank, which hasn't confirmed it yet. Your transaction history shows it as pending and updates once the bank responds.",
          }
        : {
            title: "Withdrawal Submitted",
            description:
              "Your withdrawal has been processed and your transaction history updated.",
          },
    );
  }
  async function submitTopUp(auth: TransactionAuth) {
    const token = getToken();
    if (!token) return;
    if (fundSource === "WALLET") {
      await depositToSavings(current.id, savingsType, typed, auth, token);
      await finishWith({
        title: "Top-up Complete",
        description: `${currency(typed)} was added to ${current.goal} from your wallet.`,
      });
      return;
    }
    const pending = await createPendingDeposit(current.id, savingsType, typed, auth, token);
    close();
    setTransfer({
      planName: current.goal,
      amount: pending.data.expectedAmount,
      expiresAt: pending.data.expiryTime,
      referenceCode: pending.data.referenceCode,
    });
  }
  async function submitAddFunds(auth: TransactionAuth) {
    const token = getToken();
    if (!token) return;
    await addFundsToSmartLock(current.id, typed, auth, token);
    await finishWith({
      title: "Funds Added",
      description: `${currency(typed)} was added to ${current.goal} from your wallet.`,
    });
  }
  async function submitInstallment(auth: TransactionAuth) {
    const token = getToken();
    if (!token) return;
    const response = await payInstallment(current.id, typed, auth, token);
    const completed = response.data.status.trim().toUpperCase() === "COMPLETED";
    await finishWith({
      title: completed ? "Fully Paid" : "Payment Received",
      description: completed
        ? `${current.goal} is fully paid off.`
        : `${currency(typed)} was paid toward ${current.goal} from your wallet.`,
    });
  }

  // ---- amount step shared by top-up / add funds / instalment ----
  const balance = user.balance ?? 0;
  const walletNeeded = mode === "topup" ? fundSource === "WALLET" : true;
  const amountError =
    typed <= 0
      ? ""
      : bnpl && mode === "pay" && typed > bnpl.remaining
        ? `That is more than the ${currency(bnpl.remaining)} still owed.`
        : walletNeeded && typed > balance
          ? `Your wallet holds ${currency(balance)}. Fund it first, or ${mode === "topup" ? "pay by bank transfer" : "pay a smaller amount"}.`
          : "";
  const amountReady = typed > 0 && !amountError;
  const otpAction = "INVEST" as const;

  const maturityText = maturity.toLocaleDateString("en-GB");
  const progress = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        ((Date.now() - started.getTime()) / Math.max(1, maturity.getTime() - started.getTime())) * 100,
      ),
    ),
  );

  return (
    <div className="mx-auto max-w-[680px] space-y-5 px-5 py-10">
      <PageHeading title={product.name} backHref="/investments/active" />
      {bnpl ? (
        <BnplValue plan={current} />
      ) : (
        <PlanValue
          amount={current.amount}
          interest={current.interest}
          target={current.targetAmount}
          targetLabel={targetLabel}
          progress={awaiting ? undefined : progress}
        />
      )}
      <SummaryList
        items={[
          { label: bnpl ? "Item" : "Goal", value: current.goal },
          {
            label: "Status",
            value: awaiting ? (
              <span className="text-amber-300">Awaiting funding</span>
            ) : bnpl?.completed ? (
              <span>Completed</span>
            ) : (
              <span className="text-positive">Active</span>
            ),
          },
          ...(bnpl
            ? [
                { label: "Initial payment", value: currency(bnpl.initialPayment) },
                { label: "Monthly payment", value: currency(bnpl.monthlyPayment) },
                {
                  label: "Instalments paid",
                  value: `${bnpl.paidInstallments} of ${bnpl.totalInstallments}`,
                },
                ...(!bnpl.completed && bnpl.nextPaymentDate
                  ? [{ label: "Next payment due", value: new Date(bnpl.nextPaymentDate).toLocaleDateString("en-GB") }]
                  : []),
              ]
            : [
                { label: targetLabel, value: currency(current.targetAmount ?? 0) },
                { label: "Amount locked", value: currency(current.amount) },
                { label: "Duration", value: `${current.months} months` },
                { label: "Interest earned", value: currency(current.interest) },
                // A Smart Lock has no contribution schedule.
                ...(smartLock
                  ? []
                  : [{ label: "Contribution frequency", value: current.frequency }]),
                { label: "Maturity Date", value: maturityText },
              ]),
        ]}
      />

      {awaiting && smartLock && (
        <>
          <Callout title="Waiting for your transfer">
            Transfer exactly {currency(current.fundingAmount ?? 0)} to your account below. This
            Smart Lock activates automatically when the money lands, and is removed if it
            doesn&apos;t arrive within the hour.
          </Callout>
          <FundingAccountCard />
        </>
      )}
      {awaiting && !smartLock && (
        <>
          <Callout title="No money in this plan yet">
            This plan was created but hasn&apos;t received its first deposit, so it isn&apos;t earning
            anything. Fund it from your wallet, or by bank transfer (the transfer must match the
            amount exactly and is credited automatically).
          </Callout>
          <Button fullWidth onClick={() => open("topup")}>
            Fund this plan
          </Button>
        </>
      )}

      {!awaiting && bnpl && !bnpl.completed && (
        <Button fullWidth onClick={() => open("pay", String(Math.min(bnpl.monthlyPayment, bnpl.remaining)))}>
          Pay an instalment
        </Button>
      )}
      {!awaiting && bnpl?.completed && (
        <Callout title="Fully paid">This item is paid off. Thank you.</Callout>
      )}

      {!awaiting && !bnpl && (
        <>
          <Callout title="Withdrawal Information">
            {smartLock
              ? principalLocked
                ? `Your Smart Lock principal is locked until ${maturityText}. Until then you can withdraw only the interest.`
                : "Your Smart Lock has matured, so the principal and interest can be withdrawn."
              : current.productId === "target-lock"
                ? "Withdrawing before your goal date forfeits part of the interest earned. The exact amount is confirmed when you submit."
                : "Interest is taxed when withdrawn. The exact amount is confirmed when you submit."}
          </Callout>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => open(smartLock ? "addfunds" : "topup")}
            >
              {smartLock ? "Add funds" : "Top up"}
            </Button>
            <Button
              fullWidth
              variant="danger"
              disabled={nothingToWithdraw}
              onClick={() => open("withdraw")}
            >
              {interestOnly ? "Withdraw interest" : "Withdraw Savings"}
            </Button>
          </div>
          {nothingToWithdraw && (
            <p className="text-xs text-muted">
              {interestOnly
                ? "There is no interest to withdraw yet."
                : "There is nothing to withdraw yet."}
            </p>
          )}
        </>
      )}

      {/* ---------------- withdraw ---------------- */}
      <Modal
        open={mode === "withdraw"}
        onClose={close}
        title={interestOnly ? "Withdraw Interest" : "Withdraw Savings"}
      >
        {loadingBank ? (
          <p className="text-sm text-subtle">Loading your bank account…</p>
        ) : !bankAccount ? (
          <>
            <Notice tone="error">
              You need to link a bank account before you can withdraw.
            </Notice>
            <LinkButton href="/settings/bank" fullWidth className="mt-5">
              Link a bank account
            </LinkButton>
          </>
        ) : (
          <>
            <p className="mb-5 text-sm text-subtle">
              Withdrawing to {bankAccount.accountName} · {bankAccount.accountNumber}
            </p>
            <SummaryList
              items={
                interestOnly
                  ? [{ label: "Interest to withdraw", value: currency(withdrawAmount), highlight: true }]
                  : [
                      { label: "Principal and interest", value: currency(current.amount + current.interest) },
                      { label: "Estimated early withdrawal penalty", value: currency(quote.penalty) },
                      { label: "Estimated withholding tax", value: currency(quote.tax) },
                      { label: "Estimated payout", value: currency(quote.payout), highlight: true },
                    ]
              }
            />
            <div className="mt-6">
              {/* Mounted only while the modal is open: the form sends its code on mount. */}
              {mode === "withdraw" && (
                <TransactionOtpForm
                  action="WITHDRAW"
                  amount={withdrawAmount}
                  tone="danger"
                  submitLabel="Verify & withdraw"
                  onAuthorized={submitWithdrawal}
                />
              )}
            </div>
          </>
        )}
        <Button variant="secondary" fullWidth className="mt-3" onClick={close}>
          Cancel
        </Button>
      </Modal>

      {/* ---------------- top up / add funds / pay instalment ---------------- */}
      <Modal
        open={mode === "topup" || mode === "addfunds" || mode === "pay"}
        onClose={close}
        title={mode === "pay" ? "Pay an instalment" : mode === "addfunds" ? "Add funds" : "Top up"}
      >
        {!amountLocked ? (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (amountReady) setAmountLocked(true);
            }}
          >
            <AmountInput
              label="Amount"
              name="topup-amount"
              variant="filled"
              placeholder="Enter amount"
              value={amount}
              min={firstDepositMin}
              onValueChange={setAmount}
              hint={
                mode === "pay" && bnpl
                  ? `Monthly payment ${currency(bnpl.monthlyPayment)} · ${currency(bnpl.remaining)} left`
                  : awaiting && mode === "topup"
                    ? `First deposit: at least ${currency(firstDepositMin)}`
                    : `Wallet balance ${currency(balance)}`
              }
              required
            />
            {mode === "topup" && (
              <div className="space-y-2">
                {(
                  [
                    ["WALLET", "From my wallet", "Debited immediately."],
                    ["BANK_TRANSFER", "By bank transfer", "Credited automatically when it lands."],
                  ] as const
                ).map(([value, label, help]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFundSource(value)}
                    className={`w-full rounded-xl border p-4 text-left text-sm ${fundSource === value ? "border-lilac bg-lilac/10" : "border-line bg-panel"}`}
                  >
                    <span className="font-semibold">{label}</span>
                    <p className="mt-1 text-xs text-subtle">{help}</p>
                  </button>
                ))}
              </div>
            )}
            {amountError && <Notice tone="error">{amountError}</Notice>}
            <Button type="submit" fullWidth size="lg" disabled={!amountReady}>
              Continue
            </Button>
          </form>
        ) : (
          <>
            <p className="mb-5 text-center text-2xl font-bold">{currency(typed)}</p>
            {(mode === "topup" || mode === "addfunds" || mode === "pay") && (
              <TransactionOtpForm
                action={otpAction}
                amount={typed}
                submitLabel="Verify & confirm"
                onAuthorized={
                  mode === "pay"
                    ? submitInstallment
                    : mode === "addfunds"
                      ? submitAddFunds
                      : submitTopUp
                }
              />
            )}
            <Button
              variant="secondary"
              fullWidth
              className="mt-3"
              onClick={() => setAmountLocked(false)}
            >
              Change amount
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}

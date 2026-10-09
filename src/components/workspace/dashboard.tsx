"use client";
import { useAccount } from "@/components/settings/account-provider";
import { useCurrentUser } from "@/components/auth/auth-guard";
import { useState } from "react";
import { LinkButton, Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { AssetIcon } from "@/components/ui/asset-icon";
import { useInvestments } from "@/components/investments/investment-provider";
import { InvestmentIcon } from "@/components/investments/investment-icon";
import { PlanCard } from "@/components/investments/plan-card";
import { ProductCard } from "@/components/investments/product-card";
import { TransactionRow } from "@/components/investments/transaction-row";
import { products, currency } from "@/lib/investments";
import { SectionHeading } from "./section-heading";
import { CopyButton } from "@/components/investments/funding-account-card";
import { getFundingAccount } from "@/lib/funding";
export function Dashboard() {
  const { profile } = useAccount();
  const { user } = useCurrentUser();
  const { plans, transactions, profileComplete, loading, loadError } =
    useInvestments();
  const [visible, setVisible] = useState(true);
  const account = getFundingAccount(user);
  const total = plans.reduce((sum, plan) => sum + plan.amount, 0);
  return (
    <div className="mx-auto max-w-[800px] space-y-[30px] px-4 pt-9 pb-6 sm:pt-[50px]">
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold">
            {profile.name}
          </h1>
          <p
            className="mt-1 truncate font-display text-sm text-[#909399]"
            title={user.uniqueRef ?? undefined}
          >
            Customer ID: {user.uniqueRef ?? "---"}
          </p>
        </div>
        <InitialsAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          className="size-[49px] text-base"
        />
      </header>
      {loadError && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-400">
          {loadError}
        </p>
      )}
      {!profileComplete && (
        <section className="relative overflow-hidden rounded-2xl border border-lilac bg-[#431967] p-5">
          <span className="absolute -top-7 -right-6 size-[92px] rounded-full bg-lilac/20" />
          <div className="flex items-start gap-5">
            <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-lilac">
              <img
                src="/figma/investments/259fe.png"
                alt=""
                width={22}
                height={22}
                className="size-[22px]"
              />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Complete Your Profile</h2>
              <p className="mt-1 max-w-[545px] text-xs leading-[18px]">
                Set up your bank account for easy withdrawals and liquidations.
                This is required to access your funds when needed.
              </p>
              <LinkButton
                href="/settings/bank"
                size="sm"
                className="mt-4 min-h-8 rounded-lg bg-[#7b55f0] px-4 text-white hover:bg-[#926fff]"
              >
                Complete Profile
              </LinkButton>
            </div>
          </div>
        </section>
      )}
      <section className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-subtle">Wallet Balance</h2>
            <p className="mt-1 text-[24px] leading-8 font-bold">
              {visible ? currency(user.balance ?? 0) : "••••••"}
            </p>
          </div>
          <LinkButton
            href="/investments"
            size="sm"
            variant="secondary"
            className="shrink-0"
          >
            Invest
          </LinkButton>
        </div>
        <div className="mt-4 rounded-xl bg-surface p-4">
          <p className="text-xs text-subtle">
            Fund your wallet by transfer to your account
          </p>
          {account ? (
            <>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold tracking-[1.5px]">
                    {account.accountNumber}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {account.bankName} · {account.accountName}
                  </p>
                </div>
                <CopyButton
                  value={account.accountNumber}
                  label="account number"
                />
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-red-300">
              Your funding account number isn&apos;t available yet. Please
              contact support if this persists.
            </p>
          )}
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-subtle">
            Total Active Investments
          </h2>
          <InvestmentIcon name="info" className="size-3.5" />
        </div>
        <div className="mt-1 flex items-center gap-3">
          <p className="text-[30px] leading-9 font-bold">
            {visible ? currency(total) : "••••••"}
          </p>
          <Button
            size="icon"
            variant="ghost"
            aria-label={
              visible ? "Hide investment balance" : "Show investment balance"
            }
            aria-pressed={!visible}
            onClick={() => setVisible(!visible)}
          >
            <AssetIcon name={visible ? "eye" : "eye-off"} className="size-4" />
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted">
          The live value of all your active investments
        </p>
        <div className="mt-3 flex min-h-[185px] flex-col items-center justify-center rounded-xl bg-surface px-4 py-6 text-center">
          <InvestmentIcon name="empty" className="mb-3 size-9" />
          <h3 className="text-sm font-semibold">
            {loading
              ? "Loading your investments…"
              : plans.length
                ? "Your investments at a glance"
                : "No investments yet"}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {loading
              ? "Fetching your active plans and recent activity."
              : plans.length
                ? `${plans.length} active plans. Explore your balances and returns below.`
                : "Start your first investment to begin earning returns."}
          </p>
        </div>
      </section>
      <section>
        <SectionHeading
          title={`Active Plans (${plans.length})`}
          href="/investments/active"
        />
        <div className="space-y-3">
          {plans.slice(0, 4).map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>
      <section>
        <SectionHeading title="Investment Products (4)" href="/investments" />
        <div className="grid gap-6 sm:grid-cols-2">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      <section>
        <SectionHeading title="Transaction History" href="/transactions" />
        <ul className="space-y-2">
          {transactions.slice(0, 4).map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      </section>
    </div>
  );
}

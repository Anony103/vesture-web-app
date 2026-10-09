"use client";
import { useState } from "react";
import { PageHeading } from "./page-heading";
import { useInvestments } from "@/components/investments/investment-provider";
import { PlanCard } from "@/components/investments/plan-card";
import { PlanValue } from "@/components/investments/active-plan-details";
import { TransactionRow } from "@/components/investments/transaction-row";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LinkButton } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { transactionTotals } from "@/lib/activity";
import { currency } from "@/lib/investments";
export function ActivePlans() {
  const { plans } = useInvestments();
  return (
    <div className="mx-auto max-w-[680px] space-y-5 px-5 py-10">
      <PageHeading title="Active Plans" backHref="/dashboard" />
      <PlanValue
        amount={plans.reduce((sum, p) => sum + p.amount, 0)}
        interest={plans.reduce((sum, p) => sum + p.interest, 0)}
      />
      <h2 className="text-sm font-semibold">Your plans ({plans.length})</h2>
      <div className="space-y-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
      {!plans.length && (
        <p className="text-sm text-muted">
          No active plans. Create an investment to get started.
        </p>
      )}
      <LinkButton href="/investments" fullWidth>
        Create an investment
      </LinkButton>
    </div>
  );
}
export function Transactions() {
  const { transactions } = useInvestments();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [month, setMonth] = useState("All time");
  const monthKey = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  const months = [
    "All time",
    ...new Set(transactions.map((t) => monthKey(t.date))),
  ];
  const period = transactions.filter(
    (t) => month === "All time" || monthKey(t.date) === month,
  );
  const totals = transactionTotals(period);
  const sum = totals.inflow + totals.outflow;
  const split = sum ? (totals.inflow / sum) * 100 : 0;
  const filtered = period.filter(
    (t) =>
      (filter === "All" || (t.kind ?? "Deposit") === filter) &&
      t.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-[800px] px-5 py-10">
      <PageHeading
        title="Transaction"
        description="Track all your investment activities in one place."
        backHref="/dashboard"
      />
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        {[
          ["Total Inflow", totals.inflow],
          ["Total Outflow", totals.outflow],
          ["Net Position", totals.net],
        ].map(([label, value]) => (
          <section
            key={label}
            className="rounded-xl border border-line bg-panel p-4"
          >
            <h2 className="text-xs text-muted">{label}</h2>
            <p
              className={`mt-2 text-lg font-semibold ${label === "Total Outflow" || Number(value) < 0 ? "text-red-400" : "text-positive"}`}
            >
              {currency(Number(value))}
            </p>
          </section>
        ))}
      </div>
      <div className="my-10 flex flex-col items-center">
        <div
          role="img"
          aria-label={`Completed inflow ${currency(totals.inflow)}, outflow ${currency(totals.outflow)}`}
          className="flex size-[260px] items-center justify-center rounded-full p-3"
          style={{
            background: sum
              ? `conic-gradient(#8552df 0% ${split}%, #d93481 ${split}% 100%)`
              : "#252536",
          }}
        >
          <div className="flex size-full flex-col items-center justify-center rounded-full bg-workspace">
            <p className="text-xs text-muted">Total activity</p>
            <p className="mt-2 text-2xl font-bold">{currency(sum)}</p>
          </div>
        </div>
        <div className="mt-5 w-56">
          <Select
            label="Period"
            options={months}
            placeholder="Choose period"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            variant="filled"
          />
        </div>
        <div className="mt-4 flex gap-5 text-xs">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#8552df]" />
            Deposit & interest
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#d93481]" />
            Withdrawal
          </span>
        </div>
      </div>
      <Input
        label="Search transactions"
        placeholder="Search by investment name"
        variant="filled"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="my-5">
        <SegmentedControl
          label="Transaction type"
          options={["All", "Deposit", "Withdrawal", "Interest"].map(
            (value) => ({ label: value, value }),
          )}
          value={filter}
          onChange={setFilter}
        />
      </div>
      <h2 className="mb-4 text-sm font-semibold">Transaction History</h2>
      <ul className="space-y-3">
        {filtered.map((t) => (
          <TransactionRow key={t.id} transaction={t} />
        ))}
      </ul>
      {!filtered.length && (
        <p role="status" className="mt-8 text-center text-sm text-subtle">
          No matching transactions.
        </p>
      )}
      <p className="mt-5 text-xs text-muted">
        Summary totals include completed transactions only.
      </p>
    </div>
  );
}

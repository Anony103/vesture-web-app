import { currency, type DemoTransaction } from "@/lib/investments";
import { InvestmentIcon } from "./investment-icon";
export function TransactionRow({
  transaction,
}: {
  transaction: DemoTransaction;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-panel p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-positive/12">
        <InvestmentIcon name="deposit" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{transaction.title}</p>
        <p className="mt-0.5 text-xs text-muted">
          {new Date(transaction.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}{" "}
          ·{" "}
          {new Date(transaction.date).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <span
        className={`shrink-0 text-sm font-semibold ${transaction.kind === "Withdrawal" ? "text-red-400" : "text-positive"}`}
      >
        {transaction.kind === "Withdrawal" ? "−" : "+"}
        {currency(transaction.amount)}
      </span>
      <span
        className={`rounded-full px-2 py-1 text-[9px] ${(transaction.status ?? "Completed") === "Completed" ? "bg-positive/10 text-positive" : transaction.status === "Pending" ? "bg-amber-400/10 text-amber-300" : "bg-red-400/10 text-red-400"}`}
      >
        {transaction.status ?? "Completed"}
      </span>
    </li>
  );
}

import { Brand } from "./brand";
export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/4 px-4 py-3">
      <dt className="text-xs leading-4 text-muted">{label}</dt>
      <dd className="mt-1 text-sm leading-5 font-semibold">{value}</dd>
    </div>
  );
}
export function PortfolioPanel() {
  return (
    <aside
      aria-label="Illustrative portfolio"
      className="hidden min-h-dvh w-[44.444%] flex-col justify-between bg-[linear-gradient(135.15deg,#431967_0%,#09090e_56.05%,#431967_99.147%)] py-12 pr-12 pl-[4.514vw] font-body lg:flex"
    >
      <Brand mark />
      <div>
        <p className="text-sm font-medium tracking-[1.4px] text-lilac">
          PORTFOLIO VALUE
        </p>
        <p className="mt-2 font-portfolio text-5xl leading-none">$248,590</p>
        <p className="mt-2 text-sm text-muted">
          <span className="text-lilac">↑ +12.4%</span> over the last 30 days
        </p>
        <dl className="mt-6 flex flex-wrap gap-4">
          {[
            { label: "Active Plans", value: "6" },
            { label: "Avg. Return", value: "18.2%" },
            { label: "Risk Score", value: "Moderate" },
          ].map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </dl>
      </div>
      <p className="text-xs text-lilac">
        © 2026 Vesture Financial. All investments involve risk.
      </p>
    </aside>
  );
}

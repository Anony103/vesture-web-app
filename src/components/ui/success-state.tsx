import { LinkButton } from "./button";
import { InvestmentIcon } from "@/components/investments/investment-icon";
export function SuccessState({
  title,
  description,
  href = "/dashboard",
  action = "Back to Dashboard",
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[65dvh] max-w-md flex-col items-center justify-center px-5 py-12 text-center">
      <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-lilac/10">
        <InvestmentIcon name="check" className="size-8" />
      </span>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-subtle">{description}</p>
      <LinkButton href={href} className="mt-7" fullWidth>
        {action}
      </LinkButton>
    </div>
  );
}

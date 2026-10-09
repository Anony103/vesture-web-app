"use client";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/components/auth/auth-guard";
import { AmountInput } from "@/components/ui/amount-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/workspace/page-heading";
import {
  currency,
  INTEREST_PAYOUT_OPTIONS,
  minimumInvestment,
  type Product,
  type InvestmentDraft,
} from "@/lib/investments";
export function InvestmentForm({
  product,
  draft,
  onChange,
  onContinue,
  onBack,
}: {
  product: Product;
  draft: InvestmentDraft;
  onChange: (draft: InvestmentDraft) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const smartLock = product.id === "smart-lock";
  const { user } = useCurrentUser();
  const minimum = minimumInvestment(product, user.sectorPP);
  const change = (key: keyof InvestmentDraft, value: string | number) =>
    onChange({ ...draft, [key]: value });
  return (
    <>
      <PageHeading title="Create Investment" onBack={onBack} />
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.goal.trim()) return;
          onContinue();
        }}
      >
        <div>
          <label
            htmlFor="investment-goal"
            className="block text-sm font-semibold"
          >
            What’s your investment goal?
          </label>
          <p className="mt-1 mb-3 text-xs text-subtle">
            Give your investment plan a name
          </p>
          <Input
            id="investment-goal"
            name="goal"
            variant="filled"
            placeholder="e.g., Buy a car, Save for vacation..."
            value={draft.goal}
            onChange={(event) => change("goal", event.target.value)}
            maxLength={80}
            pattern=".*\S.*"
            title="Enter a name for your investment"
            required
          />
        </div>
        <AmountInput
          label="Amount"
          name="amount"
          variant="filled"
          placeholder="Enter Amount"
          value={draft.amount}
          min={minimum}
          max={1000000000}
          hint={`Minimum ${currency(minimum)}`}
          onValueChange={(value) => change("amount", value)}
          trailing={
            <Button
              variant="ghost"
              size="sm"
              className="px-0 text-xs"
              onClick={() => change("amount", "500000")}
            >
              MAX
            </Button>
          }
          required
        />
          <>
            <Select
              label="Investment Duration"
              name="duration"
              variant="filled"
              placeholder="Choose duration"
              options={["3 months", "6 months", "9 months", "12 months"]}
              value={`${draft.months} months`}
              onChange={(event) =>
                change("months", Number.parseInt(event.target.value, 10))
              }
            />
            {smartLock ? (
              // A Smart Lock is a one-off lump sum: no contribution schedule, just when its
              // interest is paid out (the only schedule field its backend accepts).
              <Select
                label="Interest frequency"
                name="payout"
                variant="filled"
                placeholder="Choose payout frequency"
                options={INTEREST_PAYOUT_OPTIONS.map((option) => option.label)}
                value={draft.payout}
                onChange={(event) => change("payout", event.target.value)}
              />
            ) : (
            <section className="space-y-3">
              <h2 className="text-sm font-medium">Set contribution details</h2>
              <p className="text-xs text-subtle">How often do you plan to contribute?</p>
              <Select
                label="Contribution frequency"
                name="frequency"
                variant="filled"
                placeholder="Choose frequency"
                options={["Daily", "Weekly", "Monthly"]}
                value={draft.frequency}
                onChange={(event) => change("frequency", event.target.value)}
              />
            </section>
            )}
          </>
        <Button
          type="submit"
          fullWidth
          size="lg"
          variant="primary"
        >
          Continue
        </Button>
      </form>
    </>
  );
}

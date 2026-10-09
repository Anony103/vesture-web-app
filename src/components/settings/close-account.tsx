"use client";
import { RadioGroup } from "@/components/ui/radio-group";
import { useState } from "react";
import { SettingsLayout } from "./settings-layout";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessState } from "@/components/ui/success-state";
const reasons = [
  "I no longer need the account",
  "I found a better alternative",
  "I have concerns about security",
  "Other reason",
];
export function CloseAccount() {
  const [reason, setReason] = useState("");
  const [stage, setStage] = useState<"reason" | "confirm" | "done">("reason");
  const [confirmation, setConfirmation] = useState("");
  if (stage === "done")
    return (
      <SuccessState
        title="Account Closure Submitted"
        description="Preview completed. No account was closed and no data was deleted. Your demo dashboard is still available."
      />
    );
  return (
    <SettingsLayout
      title={stage === "reason" ? "Close Account" : "Final Confirmation"}
    >
      {stage === "reason" ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-red-400/20 bg-red-950/20 p-5">
            <h2 className="text-sm font-semibold text-red-300">
              This action is irreversible on a live account
            </h2>
            <p className="mt-2 text-xs leading-5 text-subtle">
              Closing an account removes access to profile, savings history and
              investment data. This preview will not delete anything.
            </p>
          </div>
          <RadioGroup
            label="Reason for Closing Your Account"
            options={reasons}
            value={reason}
            onChange={setReason}
          />
          <Button
            variant="danger"
            disabled={!reason}
            fullWidth
            onClick={() => setStage("confirm")}
          >
            Continue
          </Button>
          <LinkButton href="/dashboard" variant="ghost" fullWidth>
            Back to Dashboard
          </LinkButton>
        </div>
      ) : (
        <form
          className="mx-auto max-w-lg space-y-5 text-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (confirmation === "DELETE") setStage("done");
          }}
        >
          <h2 className="text-lg font-semibold">Are you absolutely sure?</h2>
          <p className="text-xs leading-5 text-muted">
            This is the final account-closure preview. No request is sent and no
            data is erased.
          </p>
          <Input
            label="Type DELETE to confirm"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Type DELETE to confirm"
            variant="filled"
            autoComplete="off"
          />
          <Button
            fullWidth
            variant="danger"
            type="submit"
            disabled={confirmation !== "DELETE"}
          >
            Yes, close my account
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              setStage("reason");
              setConfirmation("");
            }}
          >
            Cancel
          </Button>
        </form>
      )}
    </SettingsLayout>
  );
}

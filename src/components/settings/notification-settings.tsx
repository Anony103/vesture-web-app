"use client";
import { useState } from "react";
import { useAccount } from "./account-provider";
import { SettingsLayout } from "./settings-layout";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
export function NotificationSettings() {
  const { preferences, updatePreferences } = useAccount();
  const [draft, setDraft] = useState(preferences);
  const [saved, setSaved] = useState(false);
  function update(key: keyof typeof draft, value: boolean) {
    setDraft({ ...draft, [key]: value });
    setSaved(false);
  }
  return (
    <SettingsLayout title="Notifications">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          updatePreferences(draft);
          setSaved(true);
        }}
      >
        {(
          [
            ["push", "Push Notifications"],
            ["email", "Email Notifications"],
          ] as const
        ).map(([key, title]) => (
          <section
            key={key}
            className="rounded-2xl border border-line bg-panel p-5"
          >
            <h2 className="mb-3 text-sm font-semibold">{title}</h2>
            <Switch
              label={`Enable ${title}`}
              checked={draft[key]}
              onChange={(value) => update(key, value)}
              description={
                draft[key]
                  ? "Enabled for this preview session."
                  : "Disabled. You can enable this preference anytime in Settings."
              }
            />
          </section>
        ))}
        <section className="space-y-3 rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-sm font-semibold">Email News & Updates</h2>
          <p className="text-xs text-muted">
            Choose the updates you would like to receive.
          </p>
          {(
            [
              ["offers", "Offers and Promotions"],
              ["investments", "Investment Opportunities"],
              ["tips", "Vesture: Best practices for loans and investments"],
            ] as const
          ).map(([key, label]) => (
            <Checkbox
              key={key}
              checked={draft[key]}
              onChange={(e) => update(key, e.target.checked)}
            >
              {label}
            </Checkbox>
          ))}
        </section>
        <Button fullWidth type="submit">
          Save Changes
        </Button>
        {saved && (
          <Notice>
            Notification preferences saved for this preview session. No
            subscription or device permissions were changed.
          </Notice>
        )}
      </form>
    </SettingsLayout>
  );
}

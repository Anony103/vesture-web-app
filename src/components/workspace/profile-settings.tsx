"use client";
import { useState } from "react";
import { PageHeading } from "./page-heading";
import { useInvestments } from "@/components/investments/investment-provider";
import { Input } from "@/components/ui/input";
import { Button, LinkButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
export function ProfileSettings() {
  const { profileComplete, completeProfile } = useInvestments();
  const [saved, setSaved] = useState(false);
  return (
    <div className="mx-auto max-w-[680px] px-5 py-10">
      <PageHeading
        title="Complete Your Profile"
        backHref="/dashboard"
        description="Preview your withdrawal account setup."
      />
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          completeProfile();
          setSaved(true);
        }}
      >
        <Input
          label="Bank"
          defaultValue="Demo Bank"
          variant="filled"
          required
        />
        <Input
          label="Account number"
          defaultValue="0000000000"
          pattern="[0-9]{10}"
          maxLength={10}
          inputMode="numeric"
          variant="filled"
          required
        />
        <Input
          label="Account name"
          defaultValue="Joy Oyeledun"
          variant="filled"
          required
        />
        <Notice>
          Use fictional details. This preview does not verify or save a bank
          account.
        </Notice>
        <Button fullWidth type="submit">
          Save preview profile
        </Button>
        {(saved || profileComplete) && (
          <Notice>Your preview profile is complete.</Notice>
        )}
        <LinkButton href="/dashboard" fullWidth variant="secondary">
          Back to Dashboard
        </LinkButton>
      </form>
    </div>
  );
}

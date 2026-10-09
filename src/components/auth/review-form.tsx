"use client";
import { useRouter } from "next/navigation";
import { FormHeading } from "@/components/ui/form-heading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AssetIcon } from "@/components/ui/asset-icon";
import { useOnboarding } from "./onboarding-provider";
export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-5 text-xs leading-5">
      <dt className="shrink-0">{label}:</dt>
      <dd className="min-w-0 break-words text-right">{value || "—"}</dd>
    </div>
  );
}
export function ReviewForm() {
  const { profile, accountType, consent, setConsent } = useOnboarding();
  const router = useRouter();
  return (
    <section className="w-full max-w-md">
      <FormHeading title="Review & Consent" />
      <p className="mt-1 text-[10px] leading-[17px] text-lilac">
        Please confirm your details are correct before creating your account.
      </p>
      <dl className="mt-10 space-y-2.5 px-4">
        <DetailRow
          label="Name"
          value={`${profile.firstName} ${profile.lastName}`.trim()}
        />
        <DetailRow label="Email" value={profile.email} />
        <DetailRow label="Phone" value={profile.phone} />
      </dl>
      <div className="mt-10">
        <Checkbox
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        >
          I accept VESTURE Terms of Service, Privacy Policy
          {accountType === "public"
            ? ", and consent to data sharing with IPPIS for payroll integration and salary deduction functionality."
            : ", and consent to processing my information for account registration."}
        </Checkbox>
      </div>
      <Button
        fullWidth
        variant="secondary"
        size="sm"
        className="mt-10 min-h-9 rounded-md text-[10px]"
        onClick={() => router.push("/signup/details")}
      >
        <AssetIcon name="edit" className="size-[14px]" />
        Edit Information
      </Button>
      <Button
        fullWidth
        className="mt-10 min-h-[53px] text-[15px]"
        disabled={!consent}
        onClick={() => router.push("/signup/password")}
      >
        Confirm
      </Button>
    </section>
  );
}

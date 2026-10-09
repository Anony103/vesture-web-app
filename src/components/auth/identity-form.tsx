"use client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FormHeading } from "@/components/ui/form-heading";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { AssetIcon } from "@/components/ui/asset-icon";
import { useOnboarding } from "./onboarding-provider";
export function IdentityForm() {
  const { identity, setIdentity, accountType } = useOnboarding();
  const router = useRouter();
  return (
    <Card>
      <FormHeading
        title="Identity Upload"
        description={
          accountType === "public"
            ? "Upload staff ID"
            : "Upload a valid identity document"
        }
      />
      <div className="mt-5">
        <FileUpload file={identity} onChange={setIdentity} />
      </div>
      <div className="mt-8 flex items-start gap-4 rounded bg-white/4 px-4 py-5">
        <AssetIcon name="security" className="mt-1 size-[29px]" />
        <p className="text-xs leading-[22px] text-muted">
          <span className="font-semibold">Your data is secure</span>
          <br />
          Your selected file stays in this browser preview and is not uploaded
          to a server.
        </p>
      </div>
      <Button
        fullWidth
        className="mt-5"
        disabled={!identity}
        onClick={() => router.push("/signup/review")}
      >
        Continue
      </Button>
    </Card>
  );
}

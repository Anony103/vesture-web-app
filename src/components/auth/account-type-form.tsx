"use client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { FormHeading } from "@/components/ui/form-heading";
import { Button } from "@/components/ui/button";
import { AccountOption } from "./account-option";
import { useOnboarding } from "./onboarding-provider";
export function AccountTypeForm() {
  const { accountType, setAccountType } = useOnboarding();
  const router = useRouter();
  return (
    <Card>
      <FormHeading
        title="Choose Account Type"
        description="Select the option that best describes you"
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (accountType) router.push("/signup/details");
        }}
      >
        <fieldset className="my-5 space-y-[15px] border-y border-white/6 pt-4 pb-0.5">
          <legend className="sr-only">Account type</legend>
          <AccountOption
            value="private"
            title="Private Sector Worker"
            description="For private sector employees or individuals. Fund your investments directly with flexible options."
            benefits={[
              "Flexible funding options",
              "Manual investment control",
              "Quick BVN verification",
            ]}
            number={1}
            selected={accountType === "private"}
            onSelect={setAccountType}
          />
          <AccountOption
            value="public"
            title="Public Sector Employee"
            description="For government employees. Enjoy salary deduction features and automated investments."
            benefits={[
              "Salary deduction at source",
              "Automated investment creation",
              "Eligibility checks",
            ]}
            number={2}
            selected={accountType === "public"}
            onSelect={setAccountType}
          />
        </fieldset>
        <Button fullWidth type="submit" disabled={!accountType}>
          Next
        </Button>
      </form>
    </Card>
  );
}

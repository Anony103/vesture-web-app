import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormHeading } from "@/components/ui/form-heading";
import { Brand } from "./brand";
export function CompletionCard() {
  return (
    <Card className="space-y-6 text-center">
      <div className="flex justify-center">
        <Brand />
      </div>
      <FormHeading
        title="You’re all set to get started"
        description="Your account has been created. Sign in to continue."
      />
      <LinkButton href="/" className="w-full">
        Sign in
      </LinkButton>
    </Card>
  );
}

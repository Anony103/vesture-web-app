import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Card } from "@/components/ui/card";
import { FormHeading } from "@/components/ui/form-heading";
export default function NotFound() {
  return (
    <AuthShell>
      <Card className="space-y-5 text-center">
        <FormHeading
          title="Page not found"
          description="The page you’re looking for doesn’t exist."
        />
        <Link href="/" className="text-sm text-lilac underline">
          Back to sign in
        </Link>
      </Card>
    </AuthShell>
  );
}

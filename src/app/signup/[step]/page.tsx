import { notFound } from "next/navigation";
import { SignupFlow } from "@/components/auth/signup-flow";
import { steps, type SignupStep } from "@/lib/onboarding";
export function generateStaticParams() {
  return steps.map((step) => ({ step }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  return {
    title: step
      .split("-")
      .map((word) => word[0]?.toUpperCase() + word.slice(1))
      .join(" "),
  };
}
export default async function SignupPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  if (!steps.includes(step as SignupStep)) notFound();
  return <SignupFlow step={step as SignupStep} />;
}

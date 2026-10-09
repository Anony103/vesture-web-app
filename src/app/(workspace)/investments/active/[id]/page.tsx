import { ActivePlanDetails } from "@/components/investments/active-plan-details";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ActivePlanDetails id={id} />;
}

export const metadata = { title: "Plan details" };

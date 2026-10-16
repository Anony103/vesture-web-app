import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/investments";
import { InvestmentWizard } from "@/components/investments/investment-wizard";
import { PendingFundingGate } from "@/components/investments/pending-funding-gate";
export function generateStaticParams() {
  return products.map((product) => ({ product: product.id }));
}
export const metadata = { title: "Create Investment" };
export default async function CreateInvestmentPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product: id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  // The form is open to everyone; the wizard asks for identity + a withdrawal bank only when the customer goes to pay.
  return (
    <PendingFundingGate>
      <InvestmentWizard key={product.id} product={product} />
    </PendingFundingGate>
  );
}

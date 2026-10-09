import { products } from "@/lib/investments";
import { ProductCard } from "@/components/investments/product-card";
import { PageHeading } from "@/components/workspace/page-heading";
export const metadata = { title: "Investment Plans" };
export default function InvestmentPlansPage() {
  return (
    <div className="mx-auto max-w-[680px] px-5 pt-10 pb-8">
      <PageHeading title="Investment Plans" backHref="/dashboard" />
      <div className="space-y-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            className="px-8 sm:px-14"
          />
        ))}
      </div>
    </div>
  );
}

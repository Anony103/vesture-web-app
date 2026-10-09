import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/investments";
import { ProductDetails } from "@/components/investments/product-details";
export function generateStaticParams() {
  return products.map((product) => ({ product: product.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product } = await params;
  return { title: getProduct(product)?.name ?? "Investment" };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product: id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  return <ProductDetails product={product} />;
}

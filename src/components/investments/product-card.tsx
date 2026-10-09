import Link from "next/link";
import type { Product } from "@/lib/investments";
import { ProductArt } from "./product-art";
import { cn } from "@/lib/utils";
export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  return (
    <Link
      href={`/investments/${product.id}`}
      className={cn(
        "group relative flex min-h-44 flex-col justify-end overflow-hidden rounded-[10px] border p-6 text-black shadow-lg transition-transform hover:-translate-y-1 focus-visible:outline-lilac",
        className,
      )}
      style={{ backgroundColor: product.color, borderColor: product.border }}
    >
      <img
        src={`/figma/investments/${product.arrow}`}
        alt=""
        width={30}
        height={30}
        className="absolute top-4 right-5 size-[30px] -scale-x-100 transition-transform group-hover:translate-x-1"
      />
      <ProductArt
        productId={product.id}
        className="absolute -right-7 -bottom-9"
      />
      <h2 className="relative text-[22px] font-semibold">{product.name}</h2>
      <p className="relative mt-2 text-sm font-medium">{product.tagline}</p>
    </Link>
  );
}

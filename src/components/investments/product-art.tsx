import layers from "@/lib/product-art.json";
import type { ProductId } from "@/lib/investments";
import { cn } from "@/lib/utils";
export function ProductArt({
  productId,
  className,
}: {
  productId: ProductId;
  className?: string;
}) {
  const kind =
    productId === "target-lock"
      ? "target"
      : productId === "smart-lock"
        ? "smart"
        : "coins";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative h-32 w-32 shrink-0 opacity-30 mix-blend-luminosity",
        className,
      )}
    >
      {productId === "smallvest" ? (
        <img
          src="/figma/investments/7cde3.svg"
          alt=""
          width={128}
          height={128}
          className="size-full object-contain"
        />
      ) : (
        <div
          className={cn(
            "relative size-full",
            kind === "target" && "-scale-x-100",
            kind === "smart" && "-rotate-90",
          )}
        >
          {layers[kind].map((layer, index) => (
            <div
              key={index}
              className="absolute"
              style={{ inset: layer.inset }}
            >
              <img
                src={`/figma/investments/${layer.file}`}
                alt=""
                className="absolute size-full"
                style={{
                  transform: "transform" in layer ? layer.transform : undefined,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

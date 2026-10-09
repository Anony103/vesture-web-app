import { cn } from "@/lib/utils";
export function Brand({
  mark = false,
  className,
}: {
  mark?: boolean;
  className?: string;
}) {
  return (
    <img
      src={`/figma/brand-${mark ? "mark" : "wordmark"}.png`}
      alt="Vesture"
      width={mark ? 64 : 100}
      height={mark ? 84 : 38}
      className={cn(
        "object-contain",
        mark ? "h-[84px] w-16" : "h-[38px] w-[100px]",
        className,
      )}
    />
  );
}

import { cn } from "@/lib/utils";
export type IconName =
  | "mail"
  | "lock"
  | "eye"
  | "eye-off"
  | "google"
  | "facebook"
  | "check-circle"
  | "chevron"
  | "calendar"
  | "upload"
  | "security"
  | "edit";
export function AssetIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  // Exact exported Figma assets, stored locally so they do not expire.
  return (
    <img
      src={`/figma/${name}.svg`}
      alt=""
      aria-hidden="true"
      width={18}
      height={18}
      className={cn("size-[18px] shrink-0 object-contain", className)}
    />
  );
}

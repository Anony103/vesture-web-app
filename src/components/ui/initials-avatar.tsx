import { cn } from "@/lib/utils";

// The customer's initials in a circle. There is no stock photo: every account gets the same
// treatment, and a real picture can replace this once the backend serves one.
export function InitialsAvatar({
  firstName,
  lastName,
  className,
}: {
  firstName?: string | null;
  lastName?: string | null;
  className?: string;
}) {
  const initials =
    `${firstName?.trim()[0] ?? ""}${lastName?.trim()[0] ?? ""}`.toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[#431967] font-bold text-white",
        className,
      )}
    >
      {initials}
    </span>
  );
}

import { cn } from "@/lib/utils";
export function FormHeading({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("space-y-0.5", className)}>
      <h1 className="font-display text-lg leading-7 font-semibold">{title}</h1>
      {description && (
        <p className="text-sm leading-5 text-muted">{description}</p>
      )}
    </header>
  );
}

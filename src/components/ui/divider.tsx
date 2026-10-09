export function Divider({ children = "Or" }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs text-lilac">
      <span className="h-px flex-1 bg-line" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

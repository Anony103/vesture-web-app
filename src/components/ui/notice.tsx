export function Notice({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "error";
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border p-3 text-xs leading-5 ${tone === "error" ? "border-red-400/30 bg-red-400/5 text-red-200" : "border-lilac/20 bg-lilac/5 text-lilac"}`}
    >
      {children}
    </p>
  );
}

import { PageHeading } from "@/components/workspace/page-heading";
export function SettingsLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[680px] px-5 py-10">
      <PageHeading
        title={title}
        description={description}
        backHref="/settings"
      />
      {children}
    </div>
  );
}

import { Link } from "@/i18n/routing";
import VltPageShell from "./VltPageShell";
import { VltNavItem, VltResourceItem } from "./_shared";

export default function VltPdfDetailPage({
  locale,
  activeKey,
  item,
  metadataRows,
  backHref,
  backLabel,
}: {
  locale: string;
  activeKey: VltNavItem["key"];
  item: VltResourceItem;
  metadataRows: Array<{ label: string; value?: string | null }>;
  backHref: string;
  backLabel: string;
}) {
  return (
    <VltPageShell locale={locale} activeKey={activeKey}>
      <div className="space-y-6">
        <Link
          href={backHref}
          className="text-sm text-branding-brown hover:underline inline-block"
        >
          ← {backLabel}
        </Link>

        <h2 className="font-['Helvetica Neue'] text-2xl md:text-4xl text-branding-black font-bold">
          {item.title}
        </h2>
        <p className="text-base md:text-lg text-muted-foreground font-light">
          {item.summary}
        </p>

        <div className="rounded-xl border border-branding-black/10 overflow-hidden bg-white">
          {item.pdfUrl ? (
            <iframe
              src={item.pdfUrl}
              title={`${item.title} PDF`}
              className="w-full h-[900px]"
            />
          ) : (
            <div className="p-8 text-sm md:text-base text-[#666]">
              PDF URL is not available for this item yet.
              {item.url && (
                <>
                  {" "}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-branding-brown hover:underline"
                  >
                    Open source file
                  </a>
                </>
              )}
            </div>
          )}
        </div>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 mt-8 gap-x-6">
            {metadataRows
              .filter((row) => row.value)
              .map((row) => (
                <div
                  key={row.label}
                  className="items-center gap-3 mt-4"
                >
                  <div className="text-[#777777] text-base font-normal font-['Helvetica Neue']">
                    {row.label}:
                  </div>
                  <div className="text-branding-black text-base font-light font-['Helvetica Neue']">
                    {row.value}
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </VltPageShell>
  );
}

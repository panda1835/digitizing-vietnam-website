import VltPageShell from "../VltPageShell";
import { getTranslations } from "next-intl/server";

export default async function DirectoryPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("PedagogyVlt");

  return (
    <VltPageShell locale={params.locale} activeKey="directory">
      <section>
        <h2 className="font-['Helvetica Neue'] text-2xl md:text-5xl text-branding-black font-bold mb-6 leading-tight">
          {t("sections.directory.title")}
        </h2>
        <p className="text-lg text-muted-foreground font-light leading-relaxed mb-8">
          {t("sections.directory.description")}
        </p>
      </section>

      <section>
        <div className="w-full rounded-xl border border-branding-black/10 overflow-hidden bg-branding-white">
          <iframe
            src="https://openvietnamese.com/vnmGlobalDirectory.html"
            title={t("sections.directory.iframeTitle")}
            className="w-full h-[900px]"
            loading="lazy"
          />
        </div>
      </section>
    </VltPageShell>
  );
}

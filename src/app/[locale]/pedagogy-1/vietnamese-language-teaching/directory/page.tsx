import VltPageShell from "../VltPageShell";

export default async function DirectoryPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <VltPageShell locale={params.locale} activeKey="directory">
      <section>
        <h2 className="font-['Helvetica Neue'] text-2xl md:text-5xl text-branding-black font-bold mb-6 leading-tight">
          Directory
        </h2>
        <p className="text-lg text-muted-foreground font-light leading-relaxed mb-8">
          Browse the external Vietnamese language teaching directory.
        </p>
      </section>

      <section>
        <div className="w-full rounded-xl border border-branding-black/10 overflow-hidden bg-branding-white">
          <iframe
            src="https://openvietnamese.com/vnmGlobalDirectory.html"
            title="Vietnamese Language Teaching Resource Directory"
            className="w-full h-[900px]"
            loading="lazy"
          />
        </div>
      </section>
    </VltPageShell>
  );
}

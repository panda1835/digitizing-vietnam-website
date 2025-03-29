import FrequencyTable from "../FrequencyTable";

export default function KieuCharacterFrequency({
  params,
}: {
  params: { version: string; locale: string };
}) {
  const { version, locale } = params;
  return (
    <main className="">
      <FrequencyTable version={version} locale={locale} />
    </main>
  );
}

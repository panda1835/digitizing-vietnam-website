import FrequencyTable from "../FrequencyTable";

export default function KieuCharacterFrequency({
  params,
}: {
  params: { version: string };
}) {
  const { version } = params;
  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <FrequencyTable version={version} />
    </main>
  );
}

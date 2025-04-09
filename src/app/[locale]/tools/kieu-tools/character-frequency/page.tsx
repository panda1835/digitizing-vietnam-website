import FrequencyTable from "./FrequencyTable";

export default function KieuCharacterFrequency({ params: { locale } }) {
  return (
    <main className="">
      <FrequencyTable version={"1866"} locale={locale} />
    </main>
  );
}

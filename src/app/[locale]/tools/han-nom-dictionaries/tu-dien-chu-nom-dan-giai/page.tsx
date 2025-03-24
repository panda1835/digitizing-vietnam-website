import Lookup from "./Lookup";

export default async function DictionaryPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"; // Fallback to localhost during development
  const res = await fetch(
    `${baseUrl}/api/dictionary?dictionary=tu-dien-chu-nom-dan-giai`
  );
  const data = await res.json();

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Lookup entries={data.dictionary} refs={data.ref} />
    </div>
  );
}

import DictionaryIndex from "./DictionaryIndex";
import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const groupByInitial = (items: { item: string; location: number[] }[]) => {
  const grouped: Record<string, { item: string; location: number[] }[]> = {};

  for (const entry of items) {
    const firstChar = entry.item.trim()[0].toUpperCase();
    if (!grouped[firstChar]) {
      grouped[firstChar] = [];
    }
    grouped[firstChar].push(entry);
  }

  return grouped;
};

export default async function Introduction({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
  const data = await fetch(
    `${apiUrl}/han-nom-dictionary/nguyen-trai-quoc-am-tu-dien/index`
  );

  const list = await data.json();
  const grouped = groupByInitial(list);

  const sortedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  return (
    <div>
      <div>
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {locale === "en" ? "Index" : "Sách dẫn"}
        </div>
        <div className="mt-10 font-[Helvetica Neue] text-lg">
          {sortedKeys.map((letter) => (
            <div key={letter} className="mb-6">
              <div className="font-semibold text-lg text-black">{letter}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {grouped[letter].map((entry) => (
                  <div key={entry.item} className="">
                    <DictionaryIndex indexEntry={entry} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

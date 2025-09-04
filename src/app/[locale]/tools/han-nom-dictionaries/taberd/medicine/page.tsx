import { Merriweather } from "next/font/google";
import { Link } from "@/i18n/routing";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

interface MedicineItem {
  id: number;
  han_nom: string;
  quoc_ngu: string;
  trang: number;
  ma_tu: number;
}

interface GroupedData {
  [key: string]: MedicineItem[];
}

async function fetchMedicineData(): Promise<MedicineItem[]> {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const response = await fetch(
      `${apiUrl}/han-nom-dictionary/taberd/medicine`,
      {
        cache: "force-cache", // or 'force-cache' depending on your needs
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching medicine data:", error);
    return [];
  }
}

function groupDataByFirstLetter(data: MedicineItem[]): GroupedData {
  return data.reduce((acc: GroupedData, item) => {
    const maTu = item.ma_tu.toString();
    if (!acc[maTu]) {
      acc[maTu] = [];
    }
    acc[maTu].push(item);
    return acc;
  }, {});
}

export default async function TOC({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const medicineData = await fetchMedicineData();
  const groupedData = groupDataByFirstLetter(medicineData);
  return (
    <div>
      <div className={`${merriweather.className} text-branding-black text-4xl`}>
        {locale === "en" ? "List of botanical words" : "Danh mục thực vật học"}
      </div>
      <div className="mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(groupedData)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([maTu, items]) => {
              const firstItem = items[0];
              return (
                <div
                  key={maTu}
                  className="border border-gray-400 rounded-lg p-3 hover:bg-gray-200"
                >
                  <div className="text-center ">
                    <Link href={`medicine/${firstItem.ma_tu}`}>
                      <div className="font-bold text-branding-brown text-lg">
                        <LookupableHanNomText text={firstItem.han_nom} />
                      </div>
                      <div className="text-base font-light font-['Helvetica Neue'] text-gray-800 mt-1">
                        {firstItem.quoc_ngu}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        ({items.length} {locale === "en" ? "items" : "mục"})
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

import { Merriweather } from "next/font/google";
import { Link } from "@/i18n/routing";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import MedicineInteractiveTable from "../MedicineInteractiveTable";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

interface MedicineItem {
  id: number;
  han_nom: string;
  quoc_ngu: string;
  trang: number;
  ma_tu: number;
}

async function fetchMedicineByMaTu(maTu: string): Promise<MedicineItem[]> {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const response = await fetch(
      `${apiUrl}/han-nom-dictionary/taberd/medicine?ma_tu=${maTu}`,
      {
        cache: "force-cache",
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

export default async function MedicineDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const medicineItems = await fetchMedicineByMaTu(slug);

  if (medicineItems.length === 0) {
    return (
      <div>
        <div
          className={`${merriweather.className} text-branding-black text-4xl mb-8`}
        >
          {locale === "en" ? "Medicine not found" : "Không tìm thấy"}
        </div>
        <Link
          href="/tools/han-nom-dictionaries/taberd/medicine"
          className="text-branding-brown hover:underline"
        >
          {locale === "en" ? "← Back to list" : "← Quay lại danh sách"}
        </Link>
      </div>
    );
  }

  const firstItem = medicineItems[0];

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/tools/han-nom-dictionaries/taberd/medicine"
          className="text-branding-brown hover:underline text-sm"
        >
          {locale === "en"
            ? "← Back to botanical words list"
            : "← Quay lại danh mục thực vật học"}
        </Link>
      </div>

      <div className="mb-8">
        <MedicineInteractiveTable data={medicineItems} locale={locale} />
      </div>
    </div>
  );
}

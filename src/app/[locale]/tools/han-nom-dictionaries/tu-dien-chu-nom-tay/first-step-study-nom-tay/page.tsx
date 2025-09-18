import { fetcher } from "@/lib/api";
import { renderHtml } from "@/utils/renderHtml";
import { Merriweather } from "next/font/google";
import localFont from "next/font/local";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
const NomNaTong = localFont({
  src: "../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default async function Abbreviations({
  params: { locale },
}: {
  params: { locale: string };
}) {
  let data = [];

  try {
    const queryParams = {
      fields: "*",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/tu-dien-chu-nom-tay?${queryString}`;

    const result = await fetcher(url);
    data = result.data;
  } catch (error) {
    console.error("Error fetching online resources:", error);
  }
  // console.log("Explanatory Notes data:", data);
  return (
    <div>
      <div className={`${merriweather.className} text-branding-black text-4xl`}>
        {locale === "en"
          ? "First Steps in the Study of the Nôm Tày Script"
          : "Bước đầu khảo cứu chữ Nôm Tày"}
      </div>
      <div className="mt-10">
        <div
          className={`md:col-span-2 ${NomNaTong.className} font-light text-lg text-branding-black`}
          dangerouslySetInnerHTML={renderHtml(data["first_step_study_nom_tay"])}
        />
      </div>
    </div>
  );
}

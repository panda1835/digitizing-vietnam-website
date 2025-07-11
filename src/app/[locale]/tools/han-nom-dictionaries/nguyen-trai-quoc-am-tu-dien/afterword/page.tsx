import { fetcher } from "@/lib/api";
import { renderHtml } from "@/utils/renderHtml";
import { Merriweather } from "next/font/google";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

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

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/nguyen-trai-quoc-am-tu-dien?${queryString}`;

    const result = await fetcher(url);
    data = result.data;
  } catch (error) {
    console.error("Error fetching online resources:", error);
  }

  return (
    <div>
      <div className={`${merriweather.className} text-branding-black text-4xl`}>
        {locale === "en" ? "Afterword" : "Lời bạt"}
      </div>
      <div className="mt-10">
        <div
          className="md:col-span-2 font-['Helvetica Neue'] font-light text-lg text-branding-black"
          dangerouslySetInnerHTML={renderHtml(data["afterword"])}
        />
      </div>
    </div>
  );
}

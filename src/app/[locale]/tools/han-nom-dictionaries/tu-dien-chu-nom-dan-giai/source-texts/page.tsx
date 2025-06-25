import fs from "fs/promises";
import { parseStringPromise } from "xml2js";
import path from "path";

import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

import localFont from "next/font/local";
const NomNaTong = localFont({
  src: "../../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default async function SourceTexts({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const xmlRefData = await fs.readFile(
    path.join(
      process.cwd(),
      "data/dictionaries/tu-dien-chu-nom-dan-giai/tdcndg_refs.xml"
    ),
    "utf-8"
  );
  const jsonRefData = await parseStringPromise(
    xmlRefData.replace(/<\/?i>/g, "")
  );

  const refs = jsonRefData.reference_list.reference;

  return (
    <div className={``}>
      <div className={`${merriweather.className} text-branding-black text-4xl`}>
        {locale === "en" ? "Source Texts" : "Nguồn dẫn chữ Nôm"}
      </div>
      <table className="relative z-50 font-['Helvetica Neue'] font-light table-auto w-full border-collapse mt-10">
        <thead>
          <tr>
            <th className="bg-branding-brown text-white text-lg  border-b-2 px-4 py-2">
              {locale === "en" ? "Short Title" : "Tiêu đề ngắn"}
            </th>
            <th className="bg-branding-brown text-white text-lg border-b-2 px-4 py-2">
              {locale === "en" ? "Full Title" : "Tiêu đề đầy đủ"}
            </th>
            <th className="bg-branding-brown text-white text-lg border-b-2 px-4 py-2">
              {locale === "en" ? "Description" : "Mô tả"}
            </th>
          </tr>
        </thead>
        <tbody>
          {refs.map((ref: any, index: number) => (
            <tr
              key={index}
              className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
            >
              <td className="border border-gray-300 px-4 py-2 md:w-40 font-bold">
                {ref.short_title[0]}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <div className="flex flex-col gap-2">
                  <div>{ref.details[0].full_title[0]}</div>
                  <div className={`${NomNaTong.className} text-lg`}>
                    {ref.details[0].hn_title[0]}
                  </div>
                </div>
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {ref.details[0].desc[0]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

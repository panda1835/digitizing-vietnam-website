import SelectVersion from "./SelectVersion";

import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

import glossaryData1866 from "./1866_glossary.json";
import glossaryData1870 from "./1870_glossary.json";
import glossaryData1871 from "./1871_glossary.json";
import glossaryData1872 from "./1872_glossary.json";
import glossaryData1902 from "./1902_glossary.json";

export default function FrequencyTable({ version }: { version: string }) {
  let glossaryData;
  if (version == "1866") {
    glossaryData = glossaryData1866;
  } else if (version == "1870") {
    glossaryData = glossaryData1870;
  } else if (version == "1871") {
    glossaryData = glossaryData1871;
  } else if (version == "1872") {
    glossaryData = glossaryData1872;
  } else if (version == "1902") {
    glossaryData = glossaryData1902;
  } else {
    return <div className="">Version not found</div>;
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-red-800 mb-4">
          Glossary of Nôm characters
        </h1>
        <p className="text-lg mb-6">
          This page lists occurrences of all Nôm characters and their
          frequencies
          <br />
          in a selected version of Kiều.
        </p>

        <SelectVersion currentVersion={version} />

        {glossaryData && (
          <h2 className="text-3xl font-bold text-red-800 mb-6">
            Version {glossaryData.summary.version}:{" "}
            {glossaryData.summary.total_entries} entries
          </h2>
        )}
      </div>

      {glossaryData && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-blue-500 text-white p-3 text-xl">Nôm</th>
                <th className="bg-blue-500 text-white p-3 text-xl">Quốc ngữ</th>
                <th className="bg-blue-500 text-white p-3 text-xl">
                  Frequency
                </th>
              </tr>
            </thead>
            <tbody>
              {glossaryData.data.map((entry, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                >
                  <td
                    className={`${NomNaTong.className} border p-4 text-2xl text-center`}
                  >
                    {entry.character}
                  </td>
                  <td className="border p-4">{entry.meaning.join(", ")}</td>
                  <td className="border p-4 text-right">{entry.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

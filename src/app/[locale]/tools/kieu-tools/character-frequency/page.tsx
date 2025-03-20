"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sample data for version 1866
const data1866 = [
  { character: "𱥺", meaning: "một, mốt, miệt", frequency: 210 },
  { character: "㐌", meaning: "đã, đà, vã", frequency: 205 },
  { character: "𠊛", meaning: "người", frequency: 157 },
  { character: "娘", meaning: "nàng, nương", frequency: 151 },
  { character: "朱", meaning: "cho, tống, châu", frequency: 129 },
  { character: "𱺵", meaning: "là, la", frequency: 127 },
  { character: "𢚸", meaning: "lòng, trời", frequency: 127 },
  { character: "𠳒", meaning: "lời", frequency: 122 },
  { character: "固", meaning: "có", frequency: 121 },
  { character: "拱", meaning: "cũng, cùng", frequency: 121 },
  { character: "吏", meaning: "lại, dễ, cũng", frequency: 113 },
  { character: "浪", meaning: "rằng, dằng, là", frequency: 107 },
  { character: "尼", meaning: "nơi, này, nì, ni", frequency: 105 },
  { character: "𦋦", meaning: "ra", frequency: 103 },
  { character: "情", meaning: "tình, tành, rình", frequency: 102 },
  { character: "花", meaning: "hoa", frequency: 101 },
  { character: "買", meaning: "mới, mãi", frequency: 97 },
  { character: "之", meaning: "gì, chi", frequency: 92 },
  { character: "時", meaning: "thì, thời", frequency: 89 },
  { character: "強", meaning: "càng, gượng, cường", frequency: 88 },
  { character: "埃", meaning: "ai", frequency: 82 },
  { character: "兜", meaning: "đâu", frequency: 81 },
];

// Mock function to simulate loading data for different versions
const loadVersionData = (version: string) => {
  // In a real app, this would fetch data from an API or file
  if (version === "1866") {
    return {
      version: "1866",
      total: 2506,
      entries: data1866,
    };
  }

  // Default to 1866 data for demo
  return {
    version: "1866",
    total: 2506,
    entries: data1866,
  };
};

export default function KieuCharacterFrequency() {
  const [version, setVersion] = useState("1866");
  const [glossaryData, setGlossaryData] = useState<{
    version: string;
    total: number;
    entries: { character: string; meaning: string; frequency: number }[];
  } | null>(null);

  useEffect(() => {
    const data = loadVersionData(version);
    setGlossaryData(data);
  }, [version]);

  const handleVersionChange = (newVersion: string) => {
    setVersion(newVersion);
  };

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

        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl text-blue-600 font-bold">Version:</span>
          <div className="w-32">
            <Select value={version} onValueChange={handleVersionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1866">1866</SelectItem>
                <SelectItem value="1870">1870</SelectItem>
                <SelectItem value="1902">1902</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>GO</Button>
        </div>

        {glossaryData && (
          <h2 className="text-3xl font-bold text-red-800 mb-6">
            Version {glossaryData.version}: {glossaryData.total} entries
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
              {glossaryData.entries.map((entry, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                >
                  <td className="border p-4 text-2xl text-center">
                    {entry.character}
                  </td>
                  <td className="border p-4">{entry.meaning}</td>
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

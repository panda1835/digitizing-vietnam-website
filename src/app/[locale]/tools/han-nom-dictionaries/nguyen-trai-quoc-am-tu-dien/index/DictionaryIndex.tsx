"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Entry from "../Entry";

export default function DictionaryIndex({
  indexEntry,
}: {
  indexEntry: { item: string; location: number[] };
}) {
  const [entryData, setEntryData] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const fetchEntry = async (id: string, item: string) => {
    try {
      const res = await fetch(
        `/api/han-nom-dictionary/nguyen-trai-quoc-am-tu-dien?id=${id}`
      );
      const data = await res.json();
      setEntryData(data);
      setSelectedItem(item);
    } catch (error) {
      console.error("Failed to fetch entry", error);
    }
  };

  return (
    <div className="font-[Helvetica Neue] text-lg">
      <div className="flex flex-wrap gap-2 mt-2">
        <div>
          <Dialog>
            <DialogTrigger>
              <button
                onClick={() =>
                  fetchEntry(indexEntry.location.join(","), indexEntry.item)
                }
                className="text-blue-600 hover:underline"
              >
                {indexEntry.item},
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-[Helvetica Neue] text-xl mb-5">
                  {selectedItem}
                </DialogTitle>
                <DialogDescription>
                  <ScrollArea className="h-[500px] w-full">
                    {entryData ? (
                      entryData.map((entry, index) => (
                        <Entry key={index} entry={entry} />
                      ))
                    ) : (
                      <div>
                        <div className="flex justify-center items-center h-48">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-branding-brown"></div>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

import MiradorViewer from "@/components/mirador/MiradorViewer";
import fs from "fs/promises";
import path from "path";
import { cache } from "react";
import PhilippheBinhAnnotations from "./PhilippheBinhAnnotations";

const MANIFEST_BY_DOCUMENT_ID: Record<string, string> = {
  "thu-ban-borg-tonch-17":
    "https://digi.vatlib.it/iiif/MSS_Borg.tonch.17/manifest.json",
  "borg-tonch-18": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.18/manifest.json",
  "borg-tonch-34": "https://digi.vatlib.it/iiif/MSS_Borg.tonch.34/manifest.json",
};

const TRANSCRIPTION_FILES_BY_DOCUMENT_ID: Record<
  string,
  { nom?: string; qn?: string }
> = {
  "borg-tonch-18": {
    nom: "borg-tonch-18-nom.txt",
    qn: "borg-tonch-18-qn.txt",
  },
};

type ParsedPages = Record<string, string[]>;

function parseTranscript(raw: string): ParsedPages {
  const normalized = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const pages: ParsedPages = {};
  let currentPage = "";

  for (const line of lines) {
    const pageMatch = line.trim().match(/^\[([^\]]+)\]$/);
    if (pageMatch) {
      currentPage = pageMatch[1].trim().toLowerCase();
      if (!pages[currentPage]) {
        pages[currentPage] = [];
      }
      continue;
    }

    if (!currentPage) {
      continue;
    }

    const content = line.trim();
    if (content) {
      pages[currentPage].push(content);
    }
  }

  return pages;
}

const loadTranscript = cache(
  async (documentId: string, transcriptType: "nom" | "qn") => {
    const fileConfig = TRANSCRIPTION_FILES_BY_DOCUMENT_ID[documentId];
    const fileName = fileConfig?.[transcriptType];
    if (!fileName) {
      return {} as ParsedPages;
    }

    const filePath = path.join(
      process.cwd(),
      "src/app/[locale]/our-collections/[collectionid]/[documentid]/searchable-text/the-han-nom-catholic-prayer-philipphe-binh",
      fileName
    );

    try {
      const fileContent = await fs.readFile(filePath, "utf8");
      return parseTranscript(fileContent);
    } catch {
      return {} as ParsedPages;
    }
  }
);

export default async function PhilippheBinh({
  documentId,
  canvasId,
  locale,
}: {
  documentId: string;
  canvasId?: string;
  locale: string;
}) {
  const manifestUrl = MANIFEST_BY_DOCUMENT_ID[documentId];

  if (!manifestUrl) {
    return null;
  }

  const [nomByPage, qnByPage] = await Promise.all([
    loadTranscript(documentId, "nom"),
    loadTranscript(documentId, "qn"),
  ]);

  const hasTranscriptionFiles = Boolean(
    TRANSCRIPTION_FILES_BY_DOCUMENT_ID[documentId]
  );

  return (
    <div className="w-full">
      <div className="flex flex-row mt-10">
        <div className="w-full relative">
          <MiradorViewer manifestUrl={manifestUrl} canvasId={canvasId || ""} />
        </div>
      </div>

      {hasTranscriptionFiles && (
        <PhilippheBinhAnnotations
          locale={locale}
          initialCanvasId={canvasId}
          nomByPage={nomByPage}
          qnByPage={qnByPage}
        />
      )}
    </div>
  );
}

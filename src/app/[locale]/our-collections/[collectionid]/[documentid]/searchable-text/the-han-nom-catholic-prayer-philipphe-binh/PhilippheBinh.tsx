import MiradorViewer from "@/components/mirador/MiradorViewer";
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
          documentId={documentId}
          initialCanvasId={canvasId}
        />
      )}
    </div>
  );
}

import MiradorViewer from "@/components/mirador/MiradorViewer";

const MANIFEST_BY_DOCUMENT_ID: Record<string, string> = {
  "thu-ban-borg-tonch-17":
    "https://digi.vatlib.it/iiif/MSS_Borg.tonch.17/manifest.json",
  "borg-tonch-18":
    "https://digi.vatlib.it/iiif/MSS_Borg.tonch.18/manifest.json",
  "borg-tonch-34":
    "https://digi.vatlib.it/iiif/MSS_Borg.tonch.34/manifest.json",
};

export default function PhilippheBinh({
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

  return (
    <div className="flex flex-row mt-10">
      <div className="w-full relative">
        <MiradorViewer manifestUrl={manifestUrl} canvasId={canvasId || ""} />
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseOcrClient } from "@/lib/supabase";
import { Database, OcrTableRows } from "@/types/supabase";

export const dynamic = "force-dynamic";

type OcrDocument = Pick<
  OcrTableRows<"documents">,
  "id" | "manifest_url" | "source_url" | "title"
>;
type OcrPage = Pick<
  OcrTableRows<"pages">,
  "id" | "document_id" | "image_url" | "ocr_status" | "page_number"
>;
type OcrRun = OcrTableRows<"ocr_runs">;
type OcrTextUnit = Pick<
  OcrTableRows<"text_units">,
  | "bbox_x1"
  | "bbox_x2"
  | "bbox_x3"
  | "bbox_x4"
  | "bbox_y1"
  | "bbox_y2"
  | "bbox_y3"
  | "bbox_y4"
  | "id"
  | "offset"
  | "page_id"
  | "ocr_run_id"
>;
type OcrTextVersion = Pick<
  OcrTableRows<"text_versions">,
  | "id"
  | "confidence"
  | "created_at"
  | "ocr_run_id"
  | "source"
  | "text"
  | "text_unit_id"
>;
type OcrTextCandidate = Pick<
  OcrTableRows<"text_candidates">,
  "rank" | "source" | "text" | "text_unit_id"
>;
type OcrSupabaseClient = SupabaseClient<Database, "ocr">;

const PAGE_SIZE = 1000;
const VERSION_BATCH_SIZE = 200;

function normalizeUrl(value?: string | null) {
  return (value || "").trim().replace(/\/$/, "");
}

function getManifestDoi(manifestUrl: string) {
  const match = manifestUrl.match(/presentation\/([^/]+\/[^/]+)\/manifest/i);
  return match?.[1] || "";
}

function getItemId(manifestUrl: string) {
  const doi = getManifestDoi(manifestUrl);
  return doi.split("/").pop() || "";
}

function isSameOrContainedUrl(value: string | null, candidates: string[]) {
  const normalizedValue = normalizeUrl(value);

  if (!normalizedValue) {
    return false;
  }

  return candidates.some((candidate) => {
    const normalizedCandidate = normalizeUrl(candidate);
    return (
      normalizedCandidate &&
      (normalizedValue === normalizedCandidate ||
        normalizedValue.includes(normalizedCandidate) ||
        normalizedCandidate.includes(normalizedValue))
    );
  });
}

async function findDocument(
  supabase: OcrSupabaseClient,
  manifestUrl: string,
  title: string
) {
  const doi = getManifestDoi(manifestUrl);
  const itemId = getItemId(manifestUrl);
  const sourceCandidates = [
    manifestUrl,
    doi ? `https://doi.org/${doi}` : "",
    doi ? `doi:${doi}` : "",
  ].filter(Boolean);

  for (const candidate of sourceCandidates) {
    const { data, error } = await supabase
      .from("documents")
      .select("id,manifest_url,source_url,title")
      .or(`manifest_url.eq.${candidate},source_url.eq.${candidate}`)
      .limit(1);

    if (error) {
      throw error;
    }

    if (data?.[0]) {
      return data[0] as OcrDocument;
    }
  }

  if (itemId) {
    const { data, error } = await supabase
      .from("documents")
      .select("id,manifest_url,source_url,title")
      .or(`manifest_url.ilike.%${itemId}%,source_url.ilike.%${itemId}%`)
      .limit(1);

    if (error) {
      throw error;
    }

    if (data?.[0]) {
      return data[0] as OcrDocument;
    }
  }

  if (title) {
    const { data, error } = await supabase
      .from("documents")
      .select("id,manifest_url,source_url,title")
      .eq("title", title)
      .limit(1);

    if (error) {
      throw error;
    }

    if (data?.[0]) {
      return data[0] as OcrDocument;
    }
  }

  return null;
}

async function fetchPages(supabase: OcrSupabaseClient, documentId: string) {
  const { data, error } = await supabase
    .from("pages")
    .select("id,document_id,image_url,ocr_status,page_number")
    .eq("document_id", documentId)
    .order("page_number", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as OcrPage[];
}

function findPageForCanvas({
  pages,
  canvasId,
  imageUrl,
  imageServiceId,
  pageNumber,
}: {
  pages: OcrPage[];
  canvasId: string;
  imageUrl: string;
  imageServiceId: string;
  pageNumber: number | null;
}) {
  const urlCandidates = [canvasId, imageUrl, imageServiceId].filter(Boolean);
  const urlMatch = pages.find((page) =>
    isSameOrContainedUrl(page.image_url, urlCandidates)
  );

  if (urlMatch) {
    return urlMatch;
  }

  if (pageNumber !== null) {
    const numberMatch = pages.find((page) => page.page_number === pageNumber);

    if (numberMatch) {
      return numberMatch;
    }
  }

  return null;
}

async function fetchLatestRun(supabase: OcrSupabaseClient, pageId: string) {
  const { data, error } = await supabase
    .from("ocr_runs")
    .select("*")
    .eq("page_id", pageId)
    .order("started_at", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  const runs = (data || []) as OcrRun[];
  return (
    runs.find((run) =>
      ["complete", "completed"].includes(run.status.toLowerCase())
    ) ||
    runs[0] ||
    null
  );
}

async function fetchAllTextUnits(
  supabase: OcrSupabaseClient,
  pageId: string,
  ocrRunId: string
) {
  const units: OcrTextUnit[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("text_units")
      .select(
        "bbox_x1,bbox_x2,bbox_x3,bbox_x4,bbox_y1,bbox_y2,bbox_y3,bbox_y4,id,offset,page_id,ocr_run_id"
      )
      .eq("page_id", pageId)
      .eq("ocr_run_id", ocrRunId)
      .order("offset", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const batch = (data || []) as OcrTextUnit[];
    units.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return units;
}

async function fetchTextVersions(
  supabase: OcrSupabaseClient,
  ocrRunId: string,
  textUnitIds: string[]
) {
  const versions: OcrTextVersion[] = [];

  if (textUnitIds.length === 0) {
    return versions;
  }

  for (let index = 0; index < textUnitIds.length; index += VERSION_BATCH_SIZE) {
    const ids = textUnitIds.slice(index, index + VERSION_BATCH_SIZE);
    const { data, error } = await supabase
      .from("text_versions")
      .select("id,confidence,created_at,ocr_run_id,source,text,text_unit_id")
      .eq("ocr_run_id", ocrRunId)
      .in("text_unit_id", ids)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    versions.push(...((data || []) as OcrTextVersion[]));
  }

  return versions;
}

async function fetchRankZeroOcrCandidates(
  supabase: OcrSupabaseClient,
  textUnitIds: string[]
) {
  const candidates: OcrTextCandidate[] = [];

  if (textUnitIds.length === 0) {
    return candidates;
  }

  for (let index = 0; index < textUnitIds.length; index += VERSION_BATCH_SIZE) {
    const ids = textUnitIds.slice(index, index + VERSION_BATCH_SIZE);
    const { data, error } = await supabase
      .from("text_candidates")
      .select("rank,source,text,text_unit_id")
      .eq("source", "ocr")
      .eq("rank", 0)
      .in("text_unit_id", ids);

    if (error) {
      throw error;
    }

    candidates.push(...((data || []) as OcrTextCandidate[]));
  }

  return candidates;
}

function selectLatestHumanVersion(versions: OcrTextVersion[]) {
  const byCreatedAtDesc = [...versions].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return byCreatedAtDesc.find(
    (version) => version.source.toLowerCase() === "human"
  );
}

function selectLatestOcrVersion(versions: OcrTextVersion[]) {
  return [...versions]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .find((version) => version.source.toLowerCase() === "ocr");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const manifestUrl = searchParams.get("manifestUrl") || "";
  const canvasId = searchParams.get("canvasId") || "";
  const imageUrl = searchParams.get("imageUrl") || "";
  const imageServiceId = searchParams.get("imageServiceId") || "";
  const title = searchParams.get("title") || "";
  const pageNumberParam = searchParams.get("pageNumber");
  const pageNumber = pageNumberParam ? Number(pageNumberParam) : null;
  const supabase = createSupabaseOcrClient();

  if (!supabase) {
    return NextResponse.json({
      available: false,
      reason: "Supabase OCR environment variables are not configured.",
    });
  }

  if (!manifestUrl || !canvasId) {
    return NextResponse.json({
      available: false,
      reason: "Missing manifestUrl or canvasId.",
    });
  }

  try {
    const document = await findDocument(supabase, manifestUrl, title);

    if (!document) {
      return NextResponse.json({
        available: false,
        reason: "No OCR document matched this IIIF manifest.",
      });
    }

    const pages = await fetchPages(supabase, document.id);
    const page = findPageForCanvas({
      pages,
      canvasId,
      imageUrl,
      imageServiceId,
      pageNumber:
        pageNumber !== null && Number.isFinite(pageNumber) ? pageNumber : null,
    });

    if (!page) {
      return NextResponse.json({
        available: false,
        document,
        reason: "No OCR page matched this IIIF canvas.",
      });
    }

    const ocrRun = await fetchLatestRun(supabase, page.id);

    if (!ocrRun) {
      return NextResponse.json({
        available: false,
        document,
        page,
        reason: "No OCR run is available for this page.",
      });
    }

    const textUnits = await fetchAllTextUnits(supabase, page.id, ocrRun.id);
    const textUnitIds = textUnits.map((unit) => unit.id);
    const [textVersions, rankZeroOcrCandidates] = await Promise.all([
      fetchTextVersions(supabase, ocrRun.id, textUnitIds),
      fetchRankZeroOcrCandidates(supabase, textUnitIds),
    ]);
    const versionsByUnitId = new Map<string, OcrTextVersion[]>();
    const ocrCandidateByUnitId = new Map<string, OcrTextCandidate>();

    for (const version of textVersions) {
      const existing = versionsByUnitId.get(version.text_unit_id) || [];
      existing.push(version);
      versionsByUnitId.set(version.text_unit_id, existing);
    }

    for (const candidate of rankZeroOcrCandidates) {
      ocrCandidateByUnitId.set(candidate.text_unit_id, candidate);
    }

    const units = textUnits.map((unit) => {
      const versions = versionsByUnitId.get(unit.id) || [];
      const humanVersion = selectLatestHumanVersion(versions);
      const ocrCandidate = ocrCandidateByUnitId.get(unit.id);
      const ocrVersion = selectLatestOcrVersion(versions);
      const selectedText =
        humanVersion?.text || ocrCandidate?.text || ocrVersion?.text || "";
      const selectedSource = humanVersion
        ? humanVersion.source
        : ocrCandidate
        ? ocrCandidate.source
        : ocrVersion?.source || null;
      const selectedConfidence = humanVersion
        ? humanVersion.confidence
        : ocrVersion?.confidence || null;

      return {
        id: unit.id,
        offset: unit.offset,
        bbox: {
          x1: unit.bbox_x1,
          x2: unit.bbox_x2,
          x3: unit.bbox_x3,
          x4: unit.bbox_x4,
          y1: unit.bbox_y1,
          y2: unit.bbox_y2,
          y3: unit.bbox_y3,
          y4: unit.bbox_y4,
        },
        text: selectedText,
        source: selectedSource,
        confidence: selectedConfidence,
      };
    });

    return NextResponse.json({
      available: units.length > 0,
      canvasId,
      document,
      page,
      ocrRun: {
        id: ocrRun.id,
        modelName: ocrRun.model_name,
        modelVersion: ocrRun.model_version,
        startedAt: ocrRun.started_at,
        status: ocrRun.status,
      },
      text: units.map((unit) => unit.text).join(""),
      units,
      reason: units.length > 0 ? null : "OCR run has no text units.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch OCR data.";

    return NextResponse.json(
      {
        available: false,
        reason: message,
      },
      { status: 500 }
    );
  }
}

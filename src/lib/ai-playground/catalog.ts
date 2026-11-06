import { z } from "zod";
import {
  getFallbackCatalog,
  PLAYGROUND_PROVIDERS,
  type PlaygroundCatalog,
  type PlaygroundProvider,
} from "./contracts";

const CATALOG_URL = "https://ai-gateway.vercel.sh/v1/models";
const CACHE_MS = 60 * 60 * 1000;
const RETRY_MS = 60 * 1000;
const entrySchema = z.object({
  id: z.string().max(200),
  name: z.string().trim().min(1).max(200).optional(),
  type: z.string(),
  tags: z.array(z.string()).default([]),
  supported_parameters: z.array(z.string()).default([]),
  modalities: z.object({
    input: z.array(z.string()),
    output: z.array(z.string()),
  }),
  released: z.number().optional(),
  created: z.number().optional(),
});

// Gateway creator IDs differ from the direct provider IDs in a few places.
function directModelId(
  provider: PlaygroundProvider,
  id: string
): string | null {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(id)) return null;
  if (/(?:-fast|-batch)$/.test(id)) return null;
  if (provider === "anthropic") return id.replace(/(\d)\.(\d)/g, "$1-$2");
  if (provider === "openai") {
    // These open-weight models are served by third parties, not OpenAI's API.
    if (id.startsWith("gpt-oss")) return null;
    if (id === "gpt-5.1-thinking") return "gpt-5.1";
  }
  if (provider === "google") {
    if (!id.startsWith("gemini-")) return null;
    if (id === "gemini-3-flash") return "gemini-3-flash-preview";
    if (id === "gemini-3.1-flash-lite") return "gemini-3.1-flash-lite-preview";
  }
  // Old DeepSeek V3/R1 Gateway entries are third-party hosted, retired direct models.
  if (provider === "deepseek" && !/^deepseek-v[4-9]/.test(id)) return null;
  if (provider === "xai" && id.includes("multi-agent")) return null;
  return id;
}

export function parseModelCatalog(value: unknown): PlaygroundCatalog {
  const envelope = z
    .object({ data: z.array(z.unknown()).max(10000) })
    .parse(value);
  const catalog = Object.fromEntries(
    PLAYGROUND_PROVIDERS.map(({ id }) => [
      id,
      [] as PlaygroundCatalog[typeof id],
    ])
  ) as PlaygroundCatalog;
  const seen = new Set<string>();
  const entries = envelope.data
    .flatMap((entry) => {
      const parsed = entrySchema.safeParse(entry);
      return parsed.success ? [parsed.data] : [];
    })
    .sort(
      (a, b) => (b.released ?? b.created ?? 0) - (a.released ?? a.created ?? 0)
    );
  for (const entry of entries) {
    const [creator, ...parts] = entry.id.split("/");
    const providerId = creator === "spacexai" ? "xai" : creator;
    const provider = PLAYGROUND_PROVIDERS.find(
      ({ id }) => id === providerId
    )?.id;
    if (
      !provider ||
      entry.type !== "language" ||
      !entry.modalities.input.includes("text") ||
      !entry.modalities.output.includes("text") ||
      !(
        entry.tags.includes("tool-use") ||
        entry.supported_parameters.includes("tools")
      )
    )
      continue;
    const id = directModelId(provider, parts.join("/"));
    if (!id || seen.has(`${provider}/${id}`)) continue;
    seen.add(`${provider}/${id}`);
    catalog[provider].push({ id, name: entry.name ?? id });
  }
  // Reject incomplete responses rather than replacing working options with empty lists.
  if (PLAYGROUND_PROVIDERS.some(({ id }) => catalog[id].length === 0)) {
    throw new Error("Incomplete model catalog");
  }
  return catalog;
}

export function createCatalogLoader(
  fetchCatalog: typeof fetch = fetch,
  now: () => number = Date.now
) {
  let cached: PlaygroundCatalog | undefined;
  let refreshAt = 0;
  let pending: Promise<PlaygroundCatalog> | undefined;
  return async function load(): Promise<PlaygroundCatalog> {
    if (cached && now() < refreshAt) return cached;
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetchCatalog(CATALOG_URL, {
          signal: AbortSignal.timeout(5000),
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Catalog unavailable");
        cached = parseModelCatalog(await response.json());
        refreshAt = now() + CACHE_MS;
      } catch {
        // Preserve the last successful catalog, or use bundled options on a cold start.
        cached ??= getFallbackCatalog();
        refreshAt = now() + RETRY_MS;
      }
      return cached;
    })();
    try {
      return await pending;
    } finally {
      pending = undefined;
    }
  };
}

export const getModelCatalog = createCatalogLoader();

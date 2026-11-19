import type { ReportedTokenUsage } from "./usage";
import type { ResearchReport } from "./agent-contracts";
import { z } from "zod";

export const KIEU_VERSIONS = ["1866", "1870", "1871", "1872", "1902"] as const;
export const versionSchema = z.enum(KIEU_VERSIONS);
export type KieuVersion = z.infer<typeof versionSchema>;
export type KieuLine = { number: string; nom: string; quocNgu: string };
export type KieuPage = {
  version: KieuVersion;
  page: number;
  pageLabel: string;
  totalPages: number;
  lines: KieuLine[];
  sourceUrl: string;
};
export type KieuEdition = {
  version: KieuVersion;
  title: string;
  totalPages: number;
};
export type KieuSnapshot = Record<KieuVersion, KieuPage[]>;

export const dataRequestSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("listVersions") }).strict(),
  z
    .object({
      method: z.literal("getPage"),
      version: versionSchema,
      page: z.number().int().min(1).max(1000),
    })
    .strict(),
  z
    .object({
      method: z.literal("search"),
      version: versionSchema,
      query: z.string().trim().min(1).max(100),
    })
    .strict(),
]);
export type DataRequest = z.infer<typeof dataRequestSchema>;

// Text and tool-capable providers from https://ai-sdk.dev/providers/ai-sdk-providers.
// Bundled fallback for catalog outages. Live options come from the cached catalog route.
export const PLAYGROUND_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    models: [
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-5.4-mini",
      "gpt-5.2",
      "gpt-6.1-sol",
      "gpt-6-astra",
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      "claude-sonnet-4-6",
      "claude-opus-4-6",
      "claude-haiku-4-5",
      "claude-fable-5-1",
    ],
  },
  {
    id: "google",
    name: "Google Generative AI",
    models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3.1-pro-preview"],
  },
  {
    id: "xai",
    name: "xAI",
    models: ["grok-4", "grok-4-fast-reasoning", "grok-3-mini"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    models: ["deepseek-v4-flash", "deepseek-v4-pro"],
  },
] as const;
export type PlaygroundProvider = typeof PLAYGROUND_PROVIDERS[number]["id"];

export type PlaygroundModel = { id: string; name: string };
export type PlaygroundCatalog = Record<PlaygroundProvider, PlaygroundModel[]>;

export function getFallbackCatalog(): PlaygroundCatalog {
  return Object.fromEntries(
    PLAYGROUND_PROVIDERS.map((provider) => [
      provider.id,
      provider.models.map((id) => ({
        id,
        name: getModelDisplayName(provider.id, id),
      })),
    ])
  ) as PlaygroundCatalog;
}

// Display names from Vercel's public model catalog (2026-11-04).
// https://ai-gateway.vercel.sh/v1/models
// Anthropic uses dotted versions in Gateway and hyphenated versions in its direct API.
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "openai/gpt-6-astra": "GPT-6 Astra",
  "anthropic/claude-fable-5-1": "Claude Fable 5.1",
  "openai/gpt-4.1": "GPT-4.1",
  "openai/gpt-4.1-mini": "GPT-4.1 mini",
  "openai/gpt-5.4-mini": "GPT 5.4 Mini",
  "openai/gpt-5.2": "GPT 5.2",
  "openai/gpt-6.1-sol": "GPT-6.1 Sol",
  "anthropic/claude-sonnet-4-6": "Claude Sonnet 4.6",
  "anthropic/claude-opus-4-6": "Claude Opus 4.6",
  "anthropic/claude-haiku-4-5": "Claude Haiku 4.5",
  "google/gemini-2.5-flash": "Gemini 2.5 Flash",
  "google/gemini-2.5-pro": "Gemini 2.5 Pro",
  "google/gemini-3.1-pro-preview": "Gemini 3.1 Pro Preview",
  "deepseek/deepseek-v4-flash": "DeepSeek V4 Flash",
  "deepseek/deepseek-v4-pro": "DeepSeek V4 Pro",
};

export function getModelDisplayName(
  provider: PlaygroundProvider,
  model: string
): string {
  return MODEL_DISPLAY_NAMES[`${provider}/${model}`] ?? model;
}

export const scopeSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    summary: z.string().trim().min(1).max(1000),
    features: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
    limitations: z.array(z.string().trim().min(1).max(300)).max(8),
  })
  .strict();
export type PlaygroundScope = z.infer<typeof scopeSchema>;

export const discussionMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(10000),
  })
  .strict();
export type DiscussionMessage = z.infer<typeof discussionMessageSchema>;

export const discussionResponseSchema = z
  .object({
    reply: z
      .string()
      .trim()
      .min(1)
      .max(5000)
      .describe("A helpful, plain-language reply, without technical jargon."),
    scope: scopeSchema
      .nullable()
      .describe(
        "A feasible plan the user can choose to build, or null if clarification is still needed."
      ),
  })
  .strict();
export type DiscussionResponse = z.infer<typeof discussionResponseSchema>;

const requestSettings = z.object({
  provider: z
    .enum(["openai", "anthropic", "google", "xai", "deepseek"])
    .default("openai"),
  model: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,99}$/),
  html: z.string().max(180000).default(""),
  locale: z.enum(["en", "vi"]).default("en"),
});

export const generationSchema = z.discriminatedUnion("mode", [
  requestSettings
    .extend({
      mode: z.literal("research"),
      prompt: z.string().trim().min(1).max(4000),
      messages: z.array(discussionMessageSchema).max(14).default([]),
    })
    .strict(),
  requestSettings
    .extend({
      mode: z.literal("discuss"),
      prompt: z.string().trim().min(1).max(4000),
      messages: z.array(discussionMessageSchema).max(14).default([]),
    })
    .strict(),
  requestSettings
    .extend({
      mode: z.literal("build"),
      scope: scopeSchema,
    })
    .strict(),
]);

export type PlaygroundEvent =
  | ({ type: "usage" } & ReportedTokenUsage)
  | { type: "research"; report: ResearchReport }
  | {
      type: "activity";
      operation: string;
      state: "running" | "complete" | "failed";
      evidenceId?: string;
    }
  | { type: "step" }
  | { type: "status"; tool: string }
  | { type: "delta"; text: string }
  | {
      type: "done";
      html: string;
      baseRevision?: string;
      revision?: string;
      updateKind?: "patch" | "replace";
    }
  | ({ type: "discussion" } & DiscussionResponse)
  | { type: "error"; code: string };

export function extractHtml(value: string): string | null {
  const start = value.search(/<!doctype\s+html\b|<html\b/i);
  const end = value.toLowerCase().lastIndexOf("</html>");
  if (start < 0 || end < start) return null;
  const html = value.slice(start, end + 7);
  return html.length <= 180000 ? html : null;
}

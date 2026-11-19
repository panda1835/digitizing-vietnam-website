import { createTokenUsageTracker } from "@/lib/ai-playground/usage";
import {
  applyWebsiteUpdate,
  validateWebsite,
  websiteUpdateSchema,
  websiteContext,
  websiteRevision,
  readWebsiteSchema,
  readWebsiteSource,
  WebsiteUpdateError,
} from "@/lib/ai-playground/website";
import {
  inspectEvidenceSchema,
  researchAnswerSchema,
  validateEvidence,
} from "@/lib/ai-playground/agent-contracts";
import { createResearchRunner } from "@/lib/ai-playground/agent";
import { researchRequestSchema } from "@/lib/kieu/schemas";
import { executeResearch } from "@/lib/kieu/research";
import { getModelCatalog } from "@/lib/ai-playground/catalog";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createXai } from "@ai-sdk/xai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, isStepCount, Output, streamText, tool } from "ai";
import { z } from "zod";
import {
  extractHtml,
  generationSchema,
  discussionResponseSchema,
  versionSchema,
  type PlaygroundEvent,
} from "@/lib/ai-playground/contracts";
import {
  executeDataRequest,
  getPage,
  listVersions,
} from "@/lib/ai-playground/kieu";
import {
  RESEARCH_SYSTEM_PROMPT,
  DISCUSSION_SYSTEM_PROMPT,
  PLAYGROUND_SYSTEM_PROMPT,
  WEBSITE_REVISION_SYSTEM_PROMPT,
} from "@/lib/ai-playground/prompt";

export const runtime = "nodejs";
export const maxDuration = 120;

function errorCode(error: unknown) {
  // Never return provider messages, request headers, bodies, or stack traces: they may contain secrets.
  if (error instanceof WebsiteUpdateError) return error.code;
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 401 || error.statusCode === 403)
      return "authentication";
    if (error.statusCode === 429) return "rate-limit";
    if (error.statusCode === 404 || error.statusCode === 400) return "model";
  }
  return "generation";
}

export async function POST(request: Request) {
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const fail = (code: string, status: number) =>
    Response.json(
      {
        error: code,
        usage: { inputTokens: 0, outputTokens: 0, complete: true },
      },
      { status, headers }
    );
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      // Next's internal URL may use localhost behind a reverse proxy. The browser's
      // Host header identifies the public origin without trusting a forwarded URL.
      const host = request.headers.get("host") ?? new URL(request.url).host;
      if (new URL(origin).host !== host) return fail("invalid-request", 403);
    } catch {
      return fail("invalid-request", 403);
    }
  }
  if (!request.headers.get("content-type")?.includes("application/json"))
    return fail("invalid-request", 415);
  const authorization = request.headers.get("authorization") ?? "";
  const apiKey = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
  if (!apiKey || apiKey.length > 512 || /\s/.test(apiKey))
    return fail("authentication", 401);

  let body: unknown;
  try {
    // Bound decoded request size even when Content-Length is absent or dishonest.
    const reader = request.body?.getReader();
    if (!reader) return fail("invalid-request", 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 800000) {
        await reader.cancel();
        return fail("invalid-request", 413);
      }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return fail("invalid-request", 400);
  }
  const parsed = generationSchema.safeParse(body);
  if (!parsed.success) return fail("invalid-request", 400);
  const input = parsed.data;
  const { mode, html, model, provider, locale } = input;
  const catalog = await getModelCatalog();
  if (!catalog[provider].some((entry) => entry.id === model))
    return fail("model", 400);
  const abort = new AbortController();
  let disconnected = false;
  const cancel = () => abort.abort();
  request.signal.addEventListener("abort", cancel, { once: true });
  if (request.signal.aborted) abort.abort();
  const timeout = setTimeout(cancel, 110000);
  const cleanup = () => {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", cancel);
  };
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const tokenUsage = createTokenUsageTracker();
      const send = (event: PlaygroundEvent) => {
        if (!request.signal.aborted && !disconnected) {
          // Usage precedes the terminal event, including failures: clients stop on errors.
          if (["done", "discussion", "research", "error"].includes(event.type))
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "usage", ...tokenUsage.snapshot() }) +
                  "\n"
              )
            );
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }
      };
      try {
        // Direct adapters receive only the visitor's key; no environment fallback or custom URLs.
        const providers = {
          openai: () =>
            createOpenAI({ apiKey, baseURL: "https://api.openai.com/v1" })(
              model
            ),
          anthropic: () => createAnthropic({ apiKey })(model),
          google: () => createGoogleGenerativeAI({ apiKey })(model),
          xai: () => createXai({ apiKey })(model),
          deepseek: () => createDeepSeek({ apiKey })(model),
        };
        const runner = createResearchRunner(send, abort.signal);
        const revising = mode === "build" && !!html;
        let sourceReads = 0,
          sourceCharacters = 0;
        const stepBudget = mode === "research" ? 8 : 3;
        const result = streamText({
          model: providers[provider](),
          system:
            mode === "research"
              ? RESEARCH_SYSTEM_PROMPT
              : mode === "discuss"
              ? DISCUSSION_SYSTEM_PROMPT
              : revising
              ? WEBSITE_REVISION_SYSTEM_PROMPT
              : PLAYGROUND_SYSTEM_PROMPT,
          output:
            mode === "research"
              ? Output.object({ schema: researchAnswerSchema })
              : mode === "discuss"
              ? Output.object({ schema: discussionResponseSchema })
              : revising
              ? Output.object({ schema: websiteUpdateSchema })
              : undefined,
          messages: [
            ...(html && mode !== "research"
              ? [
                  {
                    role: "user" as const,
                    content: websiteContext(html, mode as "discuss" | "build"),
                  },
                ]
              : []),
            ...(input.mode !== "build" ? input.messages : []),
            {
              role: "user",
              content: `Visitor language: ${
                locale === "vi" ? "Vietnamese" : "English"
              }.\n${
                input.mode !== "build"
                  ? input.prompt
                  : "The visitor explicitly chose to build this agreed plan. Implement only this scope; respect its limitations.\n" +
                    JSON.stringify(input.scope)
              }`,
            },
          ],
          tools: {
            ...(html && mode !== "research"
              ? {
                  read_website_source: tool({
                    description:
                      "Read the exact current website source by literal search or UTF-16 range. Use source snippets to inspect related HTML/CSS/JavaScript and copy unique original find targets for patches. This never executes website code.",
                    inputSchema: readWebsiteSchema,
                    execute: (args) => {
                      if (abort.signal.aborted) throw new Error("Cancelled");
                      if (++sourceReads > 8)
                        return { error: "website-source-budget-exhausted" };
                      const source = readWebsiteSource(html, args);
                      const size = source.snippets
                        ? source.snippets.reduce(
                            (sum, snippet) => sum + snippet.source.length,
                            0
                          )
                        : 0;
                      if (sourceCharacters + size > 48000)
                        return {
                          error: "website-source-budget-exhausted",
                          guidance:
                            "Use the source already inspected or a smaller requested length.",
                        };
                      sourceCharacters += size;
                      return source;
                    },
                  }),
                }
              : {}),
            research_kieu: tool({
              description:
                "Investigate Truyện Kiều using real data: automatic whole-range Nôm spelling variants for shared Vietnamese syllables, concordances and counts, frequencies, passages, notes, and provisional verse comparisons.",
              inputSchema: z
                .object({ request: researchRequestSchema })
                .strict(),
              execute: ({ request }) =>
                mode === "research"
                  ? runner.execute(request)
                  : executeResearch(request),
            }),
            ...(mode === "research"
              ? {
                  inspect_evidence: tool({
                    description:
                      "Inspect additional loaded dataset rows or source passages/notes from evidence already collected, without rerunning the corpus analysis. Use only IDs returned by research_kieu.",
                    inputSchema: inspectEvidenceSchema,
                    execute: (input) => runner.inspect(input),
                  }),
                }
              : {
                  list_versions: tool({
                    description:
                      "List the five Truyện Kiều editions and page counts.",
                    inputSchema: z.object({}),
                    execute: listVersions,
                  }),
                  get_page: tool({
                    description: "Read one page of a Truyện Kiều edition.",
                    inputSchema: z.object({
                      version: versionSchema,
                      page: z.number().int().min(1).max(1000),
                    }),
                    execute: ({ version, page }) => getPage(version, page),
                  }),
                  search_kieu: tool({
                    description:
                      "Find up to 30 literal text matches in one Truyện Kiều edition.",
                    inputSchema: z.object({
                      version: versionSchema,
                      query: z.string().trim().min(1).max(100),
                    }),
                    execute: ({ version, query }) =>
                      executeDataRequest({ method: "search", version, query }),
                  }),
                }),
          },
          stopWhen: isStepCount(stepBudget),
          prepareStep: ({ stepNumber }) =>
            stepNumber >= stepBudget - 1 ? { toolChoice: "none" as const } : {},
          maxOutputTokens:
            mode === "research" ? 6000 : mode === "discuss" ? 3000 : 14000,
          maxRetries: 0,
          abortSignal: abort.signal,
          providerOptions:
            provider === "openai" ? { openai: { store: false } } : undefined,
          telemetry: {
            isEnabled: false,
            recordInputs: false,
            recordOutputs: false,
          },
          onError: () => {},
        });
        let output = "";
        let finishReason: string | undefined;
        for await (const part of result.fullStream) {
          if (part.type === "start-step") {
            tokenUsage.startStep();
            send({ type: "usage", ...tokenUsage.snapshot() });
            output = "";
            send({ type: "step" });
          }
          if (part.type === "tool-call")
            send({ type: "status", tool: part.toolName });
          if (part.type === "text-delta") {
            output += part.text;
            if (
              output.length >
              (revising ? 400000 : mode === "build" ? 190000 : 50000)
            )
              throw new Error("Output too large");
            if (mode === "build" && !revising)
              send({ type: "delta", text: part.text });
          }
          if (part.type === "finish-step") {
            tokenUsage.finishStep(part.usage);
            send({ type: "usage", ...tokenUsage.snapshot() });
          }
          if (part.type === "error") throw part.error;
          if (part.type === "finish") {
            tokenUsage.finish(part.totalUsage);
            finishReason = part.finishReason;
          }
        }
        if (abort.signal.aborted) {
          send({ type: "error", code: "timeout" });
        } else if (finishReason !== "stop") {
          send({
            type: "error",
            code: "incomplete",
          });
        } else if (mode === "research") {
          const answer = researchAnswerSchema.parse(await result.output);
          send({
            type: "research",
            report: validateEvidence(answer, runner.evidence),
          });
        } else if (mode === "discuss") {
          const discussion = discussionResponseSchema.parse(
            await result.output
          );
          send({ type: "discussion", ...discussion });
        } else if (revising) {
          let updateOutput: unknown;
          try {
            updateOutput = await result.output;
          } catch {
            throw new WebsiteUpdateError("invalid-update");
          }
          const update = websiteUpdateSchema.safeParse(updateOutput);
          if (!update.success) throw new WebsiteUpdateError("invalid-update");
          const document = applyWebsiteUpdate(html, update.data);
          send({
            type: "done",
            html: document,
            baseRevision: websiteRevision(html),
            revision: websiteRevision(document),
            updateKind: update.data.kind,
          });
        } else {
          const document = extractHtml(output);
          if (document) {
            validateWebsite(document);
            send({ type: "done", html: document });
          } else send({ type: "error", code: "incomplete" });
        }
      } catch (error) {
        send({
          type: "error",
          code: abort.signal.aborted
            ? "timeout"
            : mode === "build" && !html && error instanceof WebsiteUpdateError
            ? "incomplete"
            : errorCode(error),
        });
      } finally {
        cleanup();
        abort.abort();
        try {
          controller.close();
        } catch {
          /* Client already disconnected. */
        }
      }
    },
    cancel() {
      disconnected = true;
      abort.abort();
      cleanup();
    },
  });
  return new Response(stream, {
    headers: {
      ...headers,
      "Content-Type": "application/x-ndjson; charset=utf-8",
    },
  });
}

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
  DISCUSSION_SYSTEM_PROMPT,
  PLAYGROUND_SYSTEM_PROMPT,
} from "@/lib/ai-playground/prompt";

export const runtime = "nodejs";
export const maxDuration = 120;

function errorCode(error: unknown) {
  // Never return provider messages, request headers, bodies, or stack traces: they may contain secrets.
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
    Response.json({ error: code }, { status, headers });
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
      const send = (event: PlaygroundEvent) => {
        if (!request.signal.aborted && !disconnected)
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
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
        const result = streamText({
          model: providers[provider](),
          system:
            mode === "discuss"
              ? DISCUSSION_SYSTEM_PROMPT
              : PLAYGROUND_SYSTEM_PROMPT,
          output:
            mode === "discuss"
              ? Output.object({ schema: discussionResponseSchema })
              : undefined,
          messages: [
            ...(html
              ? [
                  {
                    role: "user" as const,
                    content: "Previous website to revise:\n" + html,
                  },
                ]
              : []),
            ...(input.mode === "discuss" ? input.messages : []),
            {
              role: "user",
              content: `Visitor language: ${
                locale === "vi" ? "Vietnamese" : "English"
              }.\n${
                input.mode === "discuss"
                  ? input.prompt
                  : "The visitor explicitly chose to build this agreed plan. Implement only this scope; respect its limitations.\n" +
                    JSON.stringify(input.scope)
              }`,
            },
          ],
          tools: {
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
          },
          stopWhen: isStepCount(3),
          prepareStep: ({ stepNumber }) =>
            stepNumber >= 2 ? { toolChoice: "none" as const } : {},
          maxOutputTokens: mode === "discuss" ? 3000 : 14000,
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
            output = "";
            send({ type: "step" });
          }
          if (part.type === "tool-call")
            send({ type: "status", tool: part.toolName });
          if (part.type === "text-delta") {
            output += part.text;
            if (output.length > (mode === "discuss" ? 25000 : 190000))
              throw new Error("Output too large");
            if (mode === "build") send({ type: "delta", text: part.text });
          }
          if (part.type === "error") throw part.error;
          if (part.type === "finish") {
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
        } else if (mode === "discuss") {
          const discussion = discussionResponseSchema.parse(
            await result.output
          );
          send({ type: "discussion", ...discussion });
        } else {
          const document = extractHtml(output);
          if (document) send({ type: "done", html: document });
          else send({ type: "error", code: "incomplete" });
        }
      } catch (error) {
        send({
          type: "error",
          code: abort.signal.aborted ? "timeout" : errorCode(error),
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

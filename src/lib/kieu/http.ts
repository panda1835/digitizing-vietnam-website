import { z } from "zod";
import { ResearchError } from "./research";

export async function researchResponse(work: () => Promise<unknown>) {
  try {
    const result = await work();
    return result instanceof Response ? result : Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError)
      return Response.json(
        { error: "invalid-request", issues: error.issues },
        { status: 400 }
      );
    if (error instanceof ResearchError)
      return Response.json({ error: error.code }, { status: error.status });
    return Response.json({ error: "data-unavailable" }, { status: 503 });
  }
}
export function queryInput(request: Request) {
  const params = new URL(request.url).searchParams;
  const input: Record<string, unknown> = {};
  for (const [key, value] of Array.from(params.entries())) {
    if (key in input) throw new ResearchError("duplicate-query-parameter");
    if (["from", "to", "pageSize", "minCount"].includes(key))
      input[key] = value.trim() ? Number(value) : NaN;
    else if (["caseSensitive", "diacriticSensitive"].includes(key)) {
      if (!["true", "false"].includes(value))
        throw new ResearchError("invalid-boolean");
      input[key] = value === "true";
    } else input[key] = value;
  }
  return input;
}
export async function readBody(request: Request) {
  const limit = 16384;
  if (Number(request.headers.get("content-length")) > limit)
    throw new ResearchError("request-too-large", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ResearchError("invalid-json");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new ResearchError("request-too-large", 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ResearchError("invalid-json");
  }
}

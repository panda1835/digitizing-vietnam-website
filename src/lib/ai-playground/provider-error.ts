import { APICallError } from "ai";

const knownCodes = new Set([
  "invalid_json_schema",
  "invalid_function_parameters",
  "model_not_found",
  "unsupported_parameter",
  "unsupported_value",
  "invalid_parameter",
  "invalid_request_error",
  "context_length_exceeded",
  "insufficient_quota",
]);

// Return only finite diagnostic categories. Never forward provider messages,
// arbitrary codes/parameters, request bodies, response bodies, or headers.
export function providerErrorDetails(error: unknown) {
  if (!APICallError.isInstance(error)) return undefined;
  const parsed = error.data as
    | { error?: { code?: unknown; param?: unknown } }
    | undefined;
  const code = parsed?.error?.code;
  const param = parsed?.error?.param;
  return {
    status: error.statusCode,
    code: typeof code === "string" && knownCodes.has(code) ? code : "unknown",
    parameter:
      typeof param !== "string" ? "unknown"
      : param === "model" ? "model"
      : param === "tools" || param.startsWith("tools[") ? "tools"
      : param === "text.format" || param.startsWith("text.format.") ||
        param === "response_format" || param.startsWith("response_format.")
      ? "output-schema"
      : param === "max_output_tokens" || param === "max_completion_tokens" ? "output-tokens"
      : "unknown",
  };
}

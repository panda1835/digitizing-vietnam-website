# AI playground

Available at `/en/tools/ai-playground` and `/vi/tools/ai-playground`, linked from Research/Tools and Kiều tools.

Requires Node.js 22+ (AI SDK 7). Install with `npm install` and run with `npm run dev`. No server API key or Gateway setup is required. Visitors provide their own provider API key, held in React memory and sent in the Authorization header to the generation route. The route creates a direct AI SDK provider, disables OpenAI response storage and generation telemetry, does not log requests or raw provider errors, and never falls back to environment credentials. Infrastructure operators should also ensure request headers/bodies are excluded from logs and tracing.

The workflow starts with a discussion. The assistant helps the visitor develop an idea using the available collection, asks focused questions, and explains unsupported requests in everyday language. It must not use implementation terminology in its replies or proposed plans. A feasible proposal includes a title, summary, concrete features, and limitations. The visitor explicitly chooses **Build this plan**; sending a message never starts a build. Sending another message withdraws the current proposal until a new reply arrives, and unsent changes disable the build action. Existing websites remain available while discussing revisions.

`POST /api/ai-playground/generate` returns NDJSON events and requires an explicit mode:

- `mode: "discuss"` accepts `{prompt, messages, provider, model, html, locale}`. History is bounded to 14 user/assistant messages, and structured output is validated before a `discussion` event is returned. `scope: null` means the assistant needs clarification or has no feasible proposal. No HTML event or raw structured output is sent during discussion.
- `mode: "build"` accepts `{scope, provider, model, html, locale}`. `scope` contains `{title, summary, features, limitations}` and is required; a free-form prompt cannot bypass this gate. The browser sends it only after the visitor approves the proposal. `html` supplies the previous website for revisions. Successful builds return a `done` event with complete HTML.

Both modes have a 110-second timeout, a three-step tool budget, a forced final step without tools, bounded request/output sizes, disabled telemetry, and no automatic retries. Discussion has a 3,000-token output limit; building has a 14,000-token limit. Both use the visitor's supplied key and consume their selected provider's credits. The default model is `gpt-4.1`; visitors select a supported model for OpenAI, Anthropic, Google Generative AI, xAI, or DeepSeek. Provider changes clear the entered key. Deployments must permit streaming responses and a 120-second route duration. Conversation and proposed plans remain only in page memory.

Model options load from `GET /api/ai-playground/models`, backed by Vercel's public, unauthenticated `https://ai-gateway.vercel.sh/v1/models` catalog. The server refreshes hourly and shares concurrent refreshes. A failed refresh keeps the last successful catalog (or bundled defaults on cold start) and retries after one minute. The browser fetches once on mount and keeps bundled options if that request fails. The generation route validates selected models against the same cached catalog. No visitor key is sent to the catalog endpoint.

Only text-in/text-out language models with tool support are included, newest releases first. Gateway-only Fast/Batch variants, third-party hosted OpenAI OSS and retired DeepSeek entries, Google Gemma entries, and xAI multi-agent models are excluded. Anthropic version separators and known Google/OpenAI aliases are mapped to direct API IDs; catalog display names are preserved, with raw IDs as the fallback. This catalog describes model capabilities, not the visitor's account permissions. New provider naming conventions may need mapping updates.

The model and preview use the same read-only adapter over the existing Truyện Kiều XML files. The original API is unchanged. File tracing includes the corpus in both new server routes.

Generated websites receive this interface before their scripts run:

```js
await kieu.listVersions();
// [{version: "1866", title: "Truyện Kiều 1866", totalPages: number}, ...]
await kieu.getPage("1866", 1);
// {version, page, pageLabel, totalPages, sourceUrl,
//  lines: [{number: string, nom: string, quocNgu: string}]}
await kieu.search("1866", "Trăm năm");
// Up to 30 matching lines, each with version, page, number, nom, quocNgu, sourceUrl.
```

Edition page boundaries differ. Comparison tools should use independent page controls or align by line number, rather than assuming equal page numbers represent equal passages. Search is literal, case-insensitive, NFC-normalized; it searches Nôm and quốc ngữ body lines, excluding notes.

Preview code runs in an inner opaque-origin iframe inside a trusted outer sandbox. The outer document restricts inner navigation; the inner document's CSP restricts network access, embedded frames, forms, workers, and external scripts. Generated event attributes, resource links, and embedded frames are removed. Use `addEventListener` in inline scripts. The host validates message source, channel, method, edition, page, query, concurrency, and request rate before servicing data requests. No API key is sent to either frame. Sandboxing does not impose a CPU budget: generated JavaScript can still stall its renderer.

Only completed HTML becomes a preview. Stopped, failed, or truncated generations preserve the previous website. Up to five successful versions remain in tab memory. Copy exports the raw source, which expects the `kieu` interface; Download HTML exports the sandbox wrapper with all five editions embedded for offline use. Downloads need no key and make no provider calls. Rare Nôm glyph rendering depends on fonts installed on the device.

To add a provider, install its AI SDK adapter, extend the shared provider/model allowlist and schema, and construct that provider with the visitor's key. Keep the data tools, generation contract, and preview bridge shared. Never accept an arbitrary API base URL from the browser.

Run server tests with `node --test --test-name-pattern='generation|provider|discussion' tests/ai-playground.test.cjs`. UI checks are intentionally excluded at the user's request.

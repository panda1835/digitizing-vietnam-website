# AI playground

Available at `/en/tools/ai-playground` and `/vi/tools/ai-playground`, linked from Research/Tools and Kiều tools.

Requires Node.js 22+ (AI SDK 7). Install with `npm install` and run with `npm run dev`. No server API key or Gateway setup is required. Visitors provide their own provider API key, held in React memory and sent in the Authorization header to the generation route. The route creates a direct AI SDK provider, disables OpenAI response storage and generation telemetry, does not log requests or raw provider errors, and never falls back to environment credentials. Infrastructure operators should also ensure request headers/bodies are excluded from logs and tracing.

The default workflow is **Research a question**. A message starts a bounded investigation immediately: the assistant selects analyses, executes them against the source corpus, and presents findings with computed tables, source passages, coverage counts, and limitations. Follow-up messages refine the research and carry prior query settings/pagination, while collecting fresh evidence for the new turn. Research does not require a website proposal or build confirmation.

**Build a website** remains a separate workflow with its own conversation. The assistant discusses an idea and proposes a scope; the visitor must explicitly choose **Build this plan** before HTML is generated. Switching workflows preserves previous research and websites.

`POST /api/ai-playground/generate` returns NDJSON events and requires an explicit mode:

- `mode: "research"` accepts `{prompt, messages, provider, model, locale}` and returns activity events plus a validated `research` event containing `{report}`. The report contains `{status, title, blocks, evidence, presentationWarnings}`. The model chooses and orders narrative sections, tables, charts, source passages, and methodological notes. Completed reports require cited evidence from this turn. The host attaches actual computed results rather than accepting model-authored data rows or plot values. No HTML or build scope is returned.
- `mode: "discuss"` accepts `{prompt, messages, provider, model, html, locale}`. History is bounded to 14 user/assistant messages, and structured output is validated before a `discussion` event is returned. `scope: null` means the assistant needs clarification or has no feasible proposal. No HTML event or raw structured output is sent during discussion.
- `mode: "build"` accepts `{scope, provider, model, html, locale}`. `scope` contains `{title, summary, features, limitations}` and is required; a free-form prompt cannot bypass this gate. The browser sends it only after the visitor approves the proposal. `html` supplies the previous website for revisions. First builds request full HTML; revisions request a validated patch or an explicit complete replacement. Successful builds always return a `done` event with complete assembled HTML, so previews and downloads retain a normal document.

All modes have a 110-second timeout, a forced final step without tools, bounded request/output sizes, disabled telemetry, and no automatic retries. Research permits eight model steps, sixteen tool calls, and 6,000 output tokens per step; each successful result is limited to 150,000 characters and a turn to 600,000 result characters. Oversized or failed analyses are not recorded as evidence. Website discussion/building retain their three-step budget and 3,000/14,000-token limits. Stop aborts the request and preserves previous successful output and the unsent retry question.

The visitor supplies the selected provider's key for every workflow. The default model remains `gpt-4.1`; OpenAI, Anthropic, Google, xAI, and DeepSeek use the existing direct adapters. No local or shared credential is introduced. Provider changes clear the key. Deployments must permit streaming responses and a 120-second route duration. Conversations, reports, proposed plans, and websites remain only in page memory. Research tools are read-only application functions; provider-generated code is not executed on the server.

## Token usage

Every generation request has a row in the token-usage panel, including research, website discussion, initial builds, and revisions. Rows identify the request type/title, provider/model, result status, input/output tokens, reported combined total, and reporting completeness. Session input/output totals combine these rows across workflow and provider switches. Restoring website history, viewing charts/tables, and downloading results make no model requests and do not add usage rows.

The route observes SDK `finish-step.usage` events and reconciles the final `finish.totalUsage` aggregate, counting every model step once. Cumulative `usage` NDJSON events are sent after completed steps and before terminal success/error events so reported counts survive validation failures. The client replaces a request's cumulative counters rather than adding each event again. Counts are provider-reported tokens, not text-length estimates or prices; cached input and reasoning output follow the SDK/provider's input/output definitions.

Missing counts remain `null`, displayed as unavailable or partial. The SDK can zero-fill missing step counts in its aggregate; explicit missing-step flags prevent those aggregates from being presented as complete. Interrupted connections and user cancellation can prevent final usage delivery: last-known counts remain visible and session totals are marked incomplete rather than guessing the missing usage. Requests rejected by this route before invoking a provider return known-zero usage in the error body. A failed application result may still have complete model usage if the provider finished before output validation failed.

Usage stays in page memory, independent of the bounded message/history lists. It is not sent back into model context, logged, or persisted. **Start a new session** and page reload reset it; changing model/provider/workflow does not. Downloads and rendering do not consume model tokens. The usage panel adds no provider request.

## Website revisions

The initial website is still generated as a complete HTML document. When `html` contains an existing site, the same build route uses structured output:

```json
{
  "kind": "patch",
  "baseRevision": "<SHA-256 of the exact submitted HTML>",
  "edits": [{"find":".reader-text { font-size: 16px; }","replace":".reader-text { font-size: 18px; }"}],
  "html": null
}
```

Each `find` must match exactly once in the original source. All edits address that same immutable baseline; overlapping, missing, ambiguous, empty, and no-op targets are rejected. Applying one edit never changes the targets of another. String replacements preserve all untouched bytes, Nôm characters, original Unicode normalization, whitespace, and literal replacement text. Up to 40 edits are allowed, with 20,000-character targets, 40,000-character replacements, and 180,000 total edit characters. The assembled document must fit the existing 180,000-character limit.

For major redesigns the model may explicitly choose `{kind:"replace",baseRevision,edits:[],html:"<complete document>"}`. Both paths verify the baseline hash and basic document structure before committing anything. The scanner ignores comments, quoted attributes, and raw script/style/textarea/title content while checking document boundaries and balanced head/script/style tags. These checks do not prove JavaScript correctness or complete HTML conformance. Generated code is never executed on the server; the existing sandbox remains responsible for preview isolation.

Successful revisions return `{type:"done",html,baseRevision,revision,updateKind}`. Patch JSON is not streamed into the Code tab. The current complete source remains visible until the validated replacement snapshot is ready. The browser also checks that its current source still equals the submitted snapshot before accepting the result. Restoring history changes this local baseline. Invalid or stale updates return `invalid-update` or `stale-revision`, preserving the previous website without an automatic repair or full-rewrite request.

To reduce model input, website discussion receives a bounded structural outline. Revision builds include the complete source only for sites up to 12,000 UTF-16 code units; larger sites receive an outline capped at 6,000 serialized characters plus metadata. `read_website_source` retrieves exact source by literal search or UTF-16 offset, without executing it. Range reads return up to 12,000 characters; searches return up to three bounded contexts (up to 6,000 characters each), skipping matches already covered. Unicode boundaries may add a code unit to preserve supplementary characters. Reads share a per-request budget of eight calls and 48,000 returned source characters, within the existing three model steps. Outlines are not evidence of runtime behavior, so the assistant must inspect related markup, styles, and scripts when necessary.

The browser still submits its complete current HTML to the application server so patches can be verified and assembled without server-side project persistence. Selective retrieval reduces what is passed to the model, not this browser-to-server payload. Patch output usually reduces repeated code generation for localized changes; actual provider token usage depends on document size, edits, and source reads. Existing provider caching settings are unchanged.

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

The research interface is also available in live previews through `kieu.research(...)`, and to the model through `research_kieu`. It supports exhaustive paginated concordances with context and counts, verse ranges with notes and scan references, character/syllable frequency tables, and provisional cross-edition comparisons, and automatic candidate Nôm spelling comparisons. See [the research API documentation](../../../api/kieu/README.md) for schemas, endpoints, and export examples. Research calls require the live playground; offline downloads retain only the original reading and capped-search interface.

Edition page boundaries differ. Comparison tools should use independent page controls or align by line number, rather than assuming equal page numbers represent equal passages. Search is literal, case-insensitive, NFC-normalized; it searches Nôm and quốc ngữ body lines, excluding notes. Research verse retrieval separately preserves source annotations and notes.

Preview code runs in an inner opaque-origin iframe inside a trusted outer sandbox. The outer document restricts inner navigation; the inner document's CSP restricts network access, embedded frames, forms, workers, and external scripts. Generated event attributes, resource links, and embedded frames are removed. Use `addEventListener` in inline scripts. The host validates message source, channel, method, edition, page, query, concurrency, and request rate before servicing data requests. No API key is sent to either frame. Sandboxing does not impose a CPU budget: generated JavaScript can still stall its renderer.

Only completed HTML becomes a preview. Stopped, failed, or truncated generations preserve the previous website. Up to five successful versions remain in tab memory. Copy exports the raw source, which expects the `kieu` interface; Download HTML exports the sandbox wrapper with all five editions embedded for offline use. Downloads need no key and make no provider calls. Rare Nôm glyph rendering depends on fonts installed on the device.

To add a provider, install its AI SDK adapter, extend the shared provider/model allowlist and schema, and construct that provider with the visitor's key. Keep the data tools, generation contract, and preview bridge shared. Never accept an arbitrary API base URL from the browser.

Research reports download locally as Markdown or JSON (including the evidence and corpus revisions), with per-table CSV downloads. They require no provider call or live data fetch. A table download contains the displayed result page, source references, settings, coverage counts, and methodology; complete aggregate counts are distinguished from sampled/paginated examples. Source links and scans are clickable in the trusted report renderer, outside the generated website sandbox.

The flexible presentation contract supports:

- `section`: optional heading, narrative text, and evidence IDs. Paragraphs, lists, emphasis, and inline code are rendered as a small safe Markdown subset; HTML and model-authored links remain text.
- `note`: a titled qualification or method note, placed wherever it belongs in the argument.
- `table`: dataset reference, selected columns, optional deterministic sorting, and initial page size. Loaded-row pagination is local.
- `chart`: dataset reference, `bar`, `line`, or `scatter`, field mappings, sorting, and a point limit. Charts use native SVG with keyboard-focusable marks, exact-value feedback, explicit coverage, and the plotted values as an accessible table. Changing the point limit is local. Line/scatter axes require numeric fields; bars require numeric values, and bars/lines require unambiguous category/x values.
- `passage`: exact source IDs and script selection. The renderer quotes original text with source links rather than accepting model-rewritten quotations.

Reports allow up to 16 blocks; tables up to 100 rows per local page and charts up to 50 points. Dataset IDs are `E#.rows`, `E#.counts`, and, where available, `E#.editions`. The model supplies no data arrays, HTML, JavaScript, CSS, or chart-library code. Unknown evidence/dataset/source references fail validation. Incompatible fields or chart axes fall back to the known source table with an explicit notice, without a repair call. Evidence, coverage, source notes, and methods remain available in a collapsible appendix.

To reduce model input, `research_kieu` returns typed dataset descriptions, complete aggregate counts, five sample rows per dataset, and up to three source passages. Full loaded results stay in the per-request evidence ledger and are attached to the final report for local rendering. `inspect_evidence` reads additional loaded rows or exact source notes from this ledger without rerunning the analysis; it shares the sixteen-call budget. Inspection returns at most 20 rows and six sources, with a 20,000-character response cap. It does not fetch an unloaded corpus page: use `research_kieu` with its cursor for that. No display-planning model request is added. These changes reduce repeated data/code generation; actual token usage and cost still depend on the question, model, and tool sequence.

Displayed chart/table views can also be downloaded as CSV with their selected fields, displayed rows, view settings, corpus revision, coverage counts, and source references. Markdown exports follow the selected section order and include charts' numeric data as tables; JSON preserves the complete report and retained evidence.

Run checks with:

```sh
node --test tests/kieu-research.test.cjs tests/ai-playground.test.cjs tests/ai-playground-catalog.test.cjs tests/playground-agent.test.cjs tests/flexible-reports.test.cjs tests/website-updates.test.cjs tests/token-usage.test.cjs tests/ai-playground-ui.test.cjs
npx tsc --noEmit --incremental false
```

These cover deterministic corpus analyses, a real AI SDK tool/structured-output loop using a mock model, research UI interactions in English/Vietnamese, downloads, follow-up context, cancellation, and the separate website build gate. They require no provider request or real key. Browser visual inspection and live provider testing are separate checks.

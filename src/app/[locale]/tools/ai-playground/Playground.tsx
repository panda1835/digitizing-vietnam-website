"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Monitor,
  MessagesSquare,
  RotateCcw,
  Smartphone,
  Square,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  dataRequestSchema,
  PLAYGROUND_PROVIDERS,
  getFallbackCatalog,
  type PlaygroundCatalog,
  type PlaygroundProvider,
  type KieuSnapshot,
  type PlaygroundEvent,
  type PlaygroundScope,
  type DiscussionMessage,
} from "@/lib/ai-playground/contracts";
import { researchBridgeSchema } from "@/lib/kieu/schemas";
import { createPreviewDocument } from "@/lib/ai-playground/preview";
import type { ResearchReport } from "@/lib/ai-playground/agent-contracts";
import {
  reportMarkdown,
  reportSummary,
  reportFollowupContext,
} from "@/lib/ai-playground/report";
import TokenUsage from "./TokenUsage";
import { normalizeTokenUsage, type UsageTurn } from "@/lib/ai-playground/usage";
import ResearchResults, { saveResearchFile } from "./ResearchResults";
import styles from "./playground.module.css";

type Revision = { prompt: string; html: string };
type IdeaMessage = DiscussionMessage & {
  scope?: PlaygroundScope | null;
  report?: ResearchReport;
};

const API_KEY_PAGES: Record<PlaygroundProvider, string> = {
  openai: "https://platform.openai.com/api-keys",
  anthropic: "https://platform.claude.com/settings/keys",
  google: "https://aistudio.google.com/api-keys",
  xai: "https://console.x.ai/",
  deepseek: "https://platform.deepseek.com/api_keys",
};

const API_KEY_PLACEHOLDERS: Partial<Record<PlaygroundProvider, string>> = {
  openai: "sk-proj-...",
  anthropic: "sk-ant-api03-...",
  xai: "xai-...",
};

export default function Playground() {
  const t = useTranslations("AIPlayground");
  const locale = useLocale();
  const [workflow, setWorkflow] = useState<"research" | "website">("research");
  const [researchMessages, setResearchMessages] = useState<IdeaMessage[]>([]);
  const [usageTurns, setUsageTurns] = useState<UsageTurn[]>([]);
  const [activity, setActivity] = useState<
    { operation: string; state: string; evidenceId?: string }[]
  >([]);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<PlaygroundProvider>("openai");
  const [modelCatalog, setModelCatalog] =
    useState<PlaygroundCatalog>(getFallbackCatalog);
  const [model, setModel] = useState("gpt-4.1");
  const [prompt, setPrompt] = useState("");
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [html, setHtml] = useState("");
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState<"results" | "idea" | "preview" | "code">(
    "results"
  );
  const [messages, setMessages] = useState<IdeaMessage[]>([]);
  const [scope, setScope] = useState<PlaygroundScope | null>(null);
  const [scopeBuilt, setScopeBuilt] = useState(false);
  const [operation, setOperation] = useState<
    "research" | "discuss" | "build" | null
  >(null);
  const [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [reload, setReload] = useState(0);
  const htmlSnapshot = useRef("");
  const frame = useRef<HTMLIFrameElement>(null);
  const abort = useRef<AbortController | null>(null);
  const promptInput = useRef<HTMLTextAreaElement>(null);
  const discussionPanel = useRef<HTMLDivElement>(null);
  const active = useRef(true);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>();
  const preview = useMemo(() => {
    if (!html) return null;
    const channel = `${crypto.randomUUID()}-${reload}`;
    return { channel, document: createPreviewDocument(html, channel) };
    // Reload intentionally creates a new sandbox and message channel.
  }, [html, reload]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai-playground/models", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("catalog");
        return response.json();
      })
      .then((catalog: PlaygroundCatalog) => {
        if (
          !controller.signal.aborted &&
          PLAYGROUND_PROVIDERS.every(
            ({ id }) =>
              Array.isArray(catalog[id]) &&
              catalog[id].length > 0 &&
              catalog[id].every(
                (entry) =>
                  typeof entry.id === "string" && typeof entry.name === "string"
              )
          )
        )
          setModelCatalog(catalog);
      })
      .catch(() => {
        /* Bundled options remain available if the catalog cannot load. */
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!busy && !modelCatalog[provider].some((entry) => entry.id === model)) {
      setModel(modelCatalog[provider][0].id);
    }
  }, [modelCatalog, provider, model, busy]);

  useEffect(() => {
    if (discussionPanel.current)
      discussionPanel.current.scrollTop = discussionPanel.current.scrollHeight;
  }, [messages, scope, busy]);

  useEffect(() => {
    active.current = true;
    const clearSession = () => {
      setApiKey("");
      setShowKey(false);
      abort.current?.abort();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) clearSession();
    };
    window.addEventListener("pagehide", clearSession);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      active.current = false;
      abort.current?.abort();
      clearTimeout(copyTimer.current);
      window.removeEventListener("pagehide", clearSession);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => {
    if (!preview) return;
    const requests = new AbortController();
    let inFlight = 0;
    let count = 0;
    let windowStarted = Date.now();
    const cache = new Map<string, unknown>();
    setPreviewError(false);
    const onMessage = async (event: MessageEvent) => {
      const message = event.data;
      if (
        event.source !== frame.current?.contentWindow ||
        !message ||
        message.channel !== preview.channel ||
        message.type !== "kieu-request"
      )
        return;
      if (typeof message.id !== "string" || message.id.length > 30) return;
      const respond = (result: unknown, failed = false) => {
        if (!requests.signal.aborted)
          frame.current?.contentWindow?.postMessage(
            {
              type: "kieu-result",
              channel: preview.channel,
              id: message.id,
              result,
              error: failed,
            },
            "*"
          );
      };
      const parsed = dataRequestSchema
        .or(researchBridgeSchema)
        .safeParse(message.input);
      if (!parsed.success) {
        respond(null, true);
        return;
      }
      if (Date.now() - windowStarted > 60000) {
        count = 0;
        windowStarted = Date.now();
      }
      if (inFlight >= 10 || ++count > 120) {
        respond(null, true);
        return;
      }
      const research =
        parsed.data.method === "research" ? parsed.data.request : null;
      const query = new URLSearchParams(
        Object.entries(parsed.data).map(([key, value]) => [key, String(value)])
      );
      const cacheKey = research ? JSON.stringify(research) : query.toString();
      if (cache.has(cacheKey)) {
        respond(cache.get(cacheKey));
        return;
      }
      inFlight++;
      try {
        const response = await fetch(
          research
            ? "/api/ai-playground/research"
            : `/api/ai-playground/kieu?${query}`,
          {
            signal: requests.signal,
            ...(research
              ? {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(research),
                }
              : {}),
          }
        );
        if (!response.ok) throw new Error("data");
        const data = await response.json();
        if (cache.size < 100) cache.set(cacheKey, data);
        respond(data);
      } catch {
        respond(null, true);
        if (!requests.signal.aborted) setPreviewError(true);
      } finally {
        inFlight--;
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      requests.abort();
      window.removeEventListener("message", onMessage);
    };
  }, [preview]);

  function commitHtml(value: string) {
    htmlSnapshot.current = value;
    setHtml(value);
  }

  function scopeText(plan: PlaygroundScope) {
    return [
      plan.title,
      plan.summary,
      ...plan.features.map((feature) => `- ${feature}`),
      ...(plan.limitations.length
        ? [t("planLimits"), ...plan.limitations.map((limit) => `- ${limit}`)]
        : []),
    ].join("\n");
  }

  async function discuss(event: FormEvent) {
    event.preventDefault();
    await run(workflow === "research" ? "research" : "discuss");
  }

  async function build() {
    if (!scope || scopeBuilt || prompt.trim()) return;
    await run("build", scope);
  }

  async function run(
    mode: "research" | "discuss" | "build",
    approvedScope?: PlaygroundScope
  ) {
    if (
      busy ||
      abort.current ||
      (mode !== "build" && !prompt.trim()) ||
      (mode === "build" && !approvedScope) ||
      !apiKey.trim() ||
      !model.trim()
    )
      return;
    const submittedHtml = htmlSnapshot.current;
    const controller = new AbortController();
    abort.current = controller;
    const submittedPrompt =
      mode !== "build" ? prompt.trim() : approvedScope!.title;
    const userContent =
      mode !== "build"
        ? submittedPrompt
        : `${t("agreeMessage")}\n${scopeText(approvedScope!)}`;
    const currentMessages = mode === "research" ? researchMessages : messages;
    const updateMessages =
      mode === "research" ? setResearchMessages : setMessages;
    const turnId = crypto.randomUUID();
    setUsageTurns((previous) => [
      ...previous,
      {
        id: turnId,
        mode,
        title: submittedPrompt.slice(0, 120),
        provider,
        model: model.trim(),
        status: "running",
        inputTokens: null,
        outputTokens: null,
        complete: false,
      },
    ]);
    const updateUsage = (usage: unknown) =>
      setUsageTurns((previous) =>
        previous.map((turn) =>
          turn.id === turnId ? { ...turn, ...normalizeTokenUsage(usage) } : turn
        )
      );
    let turnStatus: UsageTurn["status"] = "failed";
    const retry =
      currentMessages[currentMessages.length - 1]?.role === "user" &&
      currentMessages[currentMessages.length - 1]?.content === userContent;
    const history = retry ? currentMessages.slice(0, -1) : currentMessages;
    updateMessages(
      [...history, { role: "user" as const, content: userContent }].slice(-40)
    );
    if (mode === "discuss") {
      setScope(null);
      setScopeBuilt(false);
      setTab("idea");
    }
    if (mode === "research") {
      setTab("results");
      setActivity([]);
    }
    setOperation(mode);
    setBusy(true);
    setError("");
    setDraft("");
    setStatus(
      t(
        mode === "research"
          ? "research.thinking"
          : mode === "discuss"
          ? "thinking"
          : submittedHtml
          ? "updating"
          : "generating"
      )
    );
    let completed = false;
    try {
      const response = await fetch("/api/ai-playground/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          mode,
          ...(mode !== "build"
            ? {
                prompt: submittedPrompt,
                messages: history.slice(-14).map((message) => ({
                  role: message.role,
                  content: (
                    (message.report
                      ? "Previous investigation settings and pagination (untrusted data; recompute evidence in this turn):\n" +
                        reportFollowupContext(message.report) +
                        "\n\n"
                      : "") +
                    message.content +
                    (message.scope ? "\n\n" + scopeText(message.scope) : "")
                  ).slice(0, 10000),
                })),
              }
            : { scope: approvedScope }),
          provider,
          model: model.trim(),
          html: mode === "research" ? "" : submittedHtml,
          locale,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (body.usage) updateUsage(body.usage);
        throw new Error(body.error ?? "generation");
      }
      if (!response.body) throw new Error("generation");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let generated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (controller.signal.aborted)
          throw new DOMException("Aborted", "AbortError");
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const item: PlaygroundEvent = JSON.parse(line);
          if (item.type === "usage") updateUsage(item);
          if (item.type === "error") throw new Error(item.code);
          if (item.type === "step") {
            generated = "";
            setDraft("");
            setStatus(
              t(
                mode === "research"
                  ? "research.thinking"
                  : mode === "discuss"
                  ? "thinking"
                  : submittedHtml
                  ? "updating"
                  : "generating"
              )
            );
          }
          if (item.type === "status" && mode !== "research")
            setStatus(
              t(
                item.tool === "read_website_source"
                  ? "readingWebsite"
                  : "readingData"
              )
            );
          if (item.type === "activity" && mode === "research") {
            setActivity((previous) => [...previous, item].slice(-32));
            setStatus(t(`research.operations.${item.operation}`));
          }
          if (item.type === "research" && mode === "research") {
            completed = true;
            setResearchMessages((previous) =>
              [
                ...previous,
                {
                  role: "assistant" as const,
                  content: reportSummary(item.report),
                  report: item.report,
                },
              ].slice(-40)
            );
            setPrompt("");
            setStatus(
              t(
                item.report.status === "needs-clarification"
                  ? "research.needsClarification"
                  : item.report.status === "unavailable"
                  ? "research.unavailable"
                  : "research.ready"
              )
            );
          }
          if (item.type === "delta" && mode === "build") {
            generated += item.text;
            setDraft(generated);
            setStatus(t("writing"));
          }
          if (item.type === "discussion" && mode === "discuss") {
            completed = true;
            setMessages((previous) =>
              [
                ...previous,
                {
                  role: "assistant" as const,
                  content: item.reply,
                  scope: item.scope,
                },
              ].slice(-40)
            );
            setScope(item.scope);
            setPrompt("");
            setStatus("");
          }
          if (item.type === "done" && mode === "build") {
            if (
              !active.current ||
              abort.current !== controller ||
              htmlSnapshot.current !== submittedHtml
            )
              throw new Error("stale-revision");
            completed = true;
            commitHtml(item.html);
            setRevisions((previous) =>
              [...previous, { prompt: submittedPrompt, html: item.html }].slice(
                -5
              )
            );
            setPrompt("");
            setScopeBuilt(true);
            setMessages((previous) =>
              [
                ...previous,
                { role: "assistant" as const, content: t("builtMessage") },
              ].slice(-40)
            );
            setTab("preview");
            setStatus(t("ready"));
          }
        }
        if (done) break;
      }
      if (!completed) throw new Error("incomplete");
      turnStatus = "complete";
    } catch (caught) {
      if (controller.signal.aborted) {
        turnStatus = "stopped";
        setStatus(t("stopped"));
      } else {
        const code = caught instanceof Error ? caught.message : "generation";
        const known = [
          "authentication",
          "rate-limit",
          "model",
          "incomplete",
          "timeout",
          "invalid-request",
          "invalid-update",
          "stale-revision",
        ];
        const errorKey =
          mode === "research" &&
          (!known.includes(code) || code === "incomplete")
            ? "research"
            : mode === "discuss" &&
              (!known.includes(code) || code === "incomplete")
            ? "discussion"
            : known.includes(code)
            ? code
            : "generation";
        setError(t(`errors.${errorKey}`));
        setStatus("");
      }
    } finally {
      if (active.current && abort.current === controller) {
        setUsageTurns((previous) =>
          previous.map((turn) =>
            turn.id === turnId
              ? {
                  ...turn,
                  status: turnStatus,
                  complete: turnStatus === "stopped" ? false : turn.complete,
                }
              : turn
          )
        );
        setBusy(false);
        setDraft("");
        setOperation(null);
      }
      if (abort.current === controller) abort.current = null;
    }
  }

  async function download() {
    if (tab === "results" && latestReport) {
      try {
        saveResearchFile(
          reportMarkdown(latestReport),
          "truyen-kieu-research.md",
          "text/markdown;charset=utf-8"
        );
      } catch {
        setError(t("errors.researchDownload"));
      }
      return;
    }
    setExporting(true);
    setError("");
    try {
      const response = await fetch("/api/ai-playground/kieu?method=snapshot");
      if (!response.ok) throw new Error("data");
      const snapshot: KieuSnapshot = await response.json();
      const document = createPreviewDocument(
        html,
        crypto.randomUUID(),
        snapshot
      );
      const url = URL.createObjectURL(
        new Blob([document], { type: "text/html;charset=utf-8" })
      );
      const link = window.document.createElement("a");
      link.href = url;
      link.download = "truyen-kieu-playground.html";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError(t("errors.download"));
    } finally {
      if (active.current) setExporting(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        tab === "results" && latestReport ? reportMarkdown(latestReport) : html
      );
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t(tab === "results" ? "errors.researchCopy" : "errors.copy"));
    }
  }

  function startOver() {
    commitHtml("");
    setRevisions([]);
    setUsageTurns([]);
    setPrompt("");
    setError("");
    setStatus("");
    setDraft("");
    setMessages([]);
    setResearchMessages([]);
    setActivity([]);
    setScope(null);
    setScopeBuilt(false);
    setTab(workflow === "research" ? "results" : "idea");
    promptInput.current?.focus();
  }

  const conversation = workflow === "research" ? researchMessages : messages;
  const latestReport = [...researchMessages]
    .reverse()
    .find((message) => message.report)?.report;
  const examples =
    workflow === "research"
      ? ["variants", "concordance", "frequency"]
      : ["reader", "compare", "search"];
  const code = busy && operation === "build" && !html ? draft : html;

  function moveTab(event: KeyboardEvent<HTMLButtonElement>) {
    const tabs: ("results" | "idea" | "preview" | "code")[] =
      workflow === "research" ? ["results"] : ["idea", "preview", "code"];
    const index = tabs.indexOf(tab);
    const next =
      event.key === "ArrowRight"
        ? tabs[(index + 1) % tabs.length]
        : event.key === "ArrowLeft"
        ? tabs[(index + tabs.length - 1) % tabs.length]
        : event.key === "Home"
        ? tabs[0]
        : event.key === "End"
        ? tabs[2]
        : null;
    if (!next) return;
    event.preventDefault();
    setTab(next);
    document.getElementById(`${next}-tab`)?.focus();
  }
  return (
    <div className={styles.playground}>
      <div className={styles.workspace}>
        <section className={styles.controls} aria-label={t("setup")}>
          <form onSubmit={discuss} className={styles.form}>
            <div className={styles.sectionHeading}>
              <h2>
                {t(workflow === "research" ? "research.setup" : "ideaSetup")}
              </h2>
            </div>
            <fieldset className={styles.workflowChoice} disabled={busy}>
              <legend>{t("research.workflow")}</legend>
              {(["research", "website"] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="playground-workflow"
                    value={value}
                    checked={workflow === value}
                    onChange={() => {
                      setWorkflow(value);
                      setTab(value === "research" ? "results" : "idea");
                      setPrompt("");
                      setError("");
                      setStatus("");
                    }}
                  />
                  <span>{t(`research.workflows.${value}`)}</span>
                </label>
              ))}
            </fieldset>
            <div className={styles.field}>
              <label htmlFor="playground-provider">{t("provider")}</label>
              <Select
                value={provider}
                disabled={busy}
                onValueChange={(value) => {
                  const next = PLAYGROUND_PROVIDERS.find(
                    (entry) => entry.id === value
                  )!;
                  setProvider(next.id);
                  setModel(modelCatalog[next.id][0].id);
                  setApiKey("");
                  setShowKey(false);
                  setError("");
                }}
              >
                <SelectTrigger
                  id="playground-provider"
                  className={styles.selectTrigger}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAYGROUND_PROVIDERS.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={styles.field}>
              <label htmlFor="playground-key">{t("apiKey")}</label>
              <div className={styles.keyField}>
                <input
                  id="playground-key"
                  aria-describedby="playground-key-help"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={512}
                  placeholder={API_KEY_PLACEHOLDERS[provider] ?? ""}
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? t("hideKey") : t("showKey")}
                  aria-pressed={showKey}
                  className={styles.keyToggle}
                >
                  {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p id="playground-key-help" className="text-sm leading-relaxed">
                {t(`apiKeyInstructions.${provider}`)}{" "}
                <a
                  href={API_KEY_PAGES[provider]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  {t("apiKeyLink")}
                </a>
              </p>
            </div>
            <div className={styles.field}>
              <label htmlFor="playground-model">{t("model")}</label>
              <Select value={model} onValueChange={setModel} disabled={busy}>
                <SelectTrigger
                  id="playground-model"
                  className={styles.selectTrigger}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelCatalog[provider].map(({ id, name }) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={styles.dataNote}>
              <BookOpen size={18} aria-hidden="true" />
              <div>
                <h3>{t("dataTitle")}</h3>
                <p>{t("dataDescription")}</p>
                <p className={styles.editions}>
                  1866 · 1870 · 1871 · 1872 · 1902
                </p>
              </div>
            </div>
            <div className={styles.promptField}>
              <label htmlFor="playground-prompt">
                {workflow === "research"
                  ? t(
                      conversation.length
                        ? "research.followup"
                        : "research.prompt"
                    )
                  : conversation.length
                  ? t("discussionFollowup")
                  : t("discussionPrompt")}
              </label>
              <textarea
                ref={promptInput}
                id="playground-prompt"
                rows={6}
                maxLength={4000}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                disabled={busy}
                placeholder={
                  workflow === "research"
                    ? t(
                        conversation.length
                          ? "research.followupPlaceholder"
                          : "research.placeholder"
                      )
                    : conversation.length
                    ? t("discussionFollowupPlaceholder")
                    : t("discussionPlaceholder")
                }
                aria-describedby="prompt-help"
              />
              <div id="prompt-help" className={styles.promptHelp}>
                <span>{prompt.length}/4000</span>
              </div>
            </div>
            {!conversation.length && (
              <div className={styles.examples}>
                <p>
                  {t(
                    workflow === "research"
                      ? "research.tryExample"
                      : "tryExample"
                  )}
                </p>
                {examples.map((example) => (
                  <button
                    type="button"
                    key={example}
                    disabled={busy}
                    onClick={() => {
                      setPrompt(
                        t(
                          `${
                            workflow === "research"
                              ? "research.examples"
                              : "examples"
                          }.${example}.prompt`
                        )
                      );
                      promptInput.current?.focus();
                    }}
                  >
                    <span>
                      {t(
                        `${
                          workflow === "research"
                            ? "research.examples"
                            : "examples"
                        }.${example}.label`
                      )}
                    </span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <div className={styles.actions}>
              {busy ? (
                <Button
                  key="stop"
                  type="button"
                  onClick={(event) => {
                    // The settled request switches this control back to a submit button.
                    // Cancel the click's default action before aborting to prevent a new submission.
                    event.preventDefault();
                    abort.current?.abort();
                  }}
                  className="w-full"
                >
                  <Square size={14} />
                  {t("stop")}
                </Button>
              ) : (
                <Button
                  key="generate"
                  type="submit"
                  disabled={!apiKey.trim() || !prompt.trim() || !model.trim()}
                  className="w-full"
                >
                  {workflow === "research"
                    ? t(
                        conversation.length
                          ? "research.continue"
                          : "research.run"
                      )
                    : conversation.length
                    ? t("sendMessage")
                    : t("discussIdea")}
                  <ArrowRight size={16} />
                </Button>
              )}
              <p className={styles.help}>{t("costHelp")}</p>
            </div>
          </form>
          {workflow === "website" && revisions.length > 0 && (
            <div className={styles.history}>
              <h3>{t("history")}</h3>
              {revisions.map((revision, index) => (
                <div key={index} className={styles.revision}>
                  <p title={revision.prompt}>{revision.prompt}</p>
                  <button
                    type="button"
                    disabled={busy || html === revision.html}
                    onClick={() => {
                      commitHtml(revision.html);
                      setTab("preview");
                      setError("");
                      setStatus(t("ready"));
                    }}
                  >
                    {html === revision.html ? t("current") : t("restore")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          className={styles.output}
          aria-label={t("output")}
          aria-busy={busy}
        >
          <div className={styles.toolbar}>
            <div
              className={styles.tabs}
              role="tablist"
              aria-label={t("output")}
            >
              {workflow === "research" ? (
                <button
                  id="results-tab"
                  role="tab"
                  aria-selected={tab === "results"}
                  aria-controls="playground-results"
                  tabIndex={tab === "results" ? 0 : -1}
                  onClick={() => setTab("results")}
                  onKeyDown={moveTab}
                >
                  <BookOpen size={16} />
                  {t("research.results")}
                </button>
              ) : (
                <>
                  <button
                    id="idea-tab"
                    role="tab"
                    aria-selected={tab === "idea"}
                    aria-controls="playground-idea"
                    tabIndex={tab === "idea" ? 0 : -1}
                    onClick={() => setTab("idea")}
                    onKeyDown={moveTab}
                  >
                    <MessagesSquare size={16} />
                    {t("ideaTab")}
                  </button>
                  <button
                    id="preview-tab"
                    role="tab"
                    aria-selected={tab === "preview"}
                    aria-controls="playground-preview"
                    tabIndex={tab === "preview" ? 0 : -1}
                    onClick={() => setTab("preview")}
                    onKeyDown={moveTab}
                  >
                    <Eye size={16} />
                    {t("preview")}
                  </button>
                  <button
                    id="code-tab"
                    role="tab"
                    aria-selected={tab === "code"}
                    aria-controls="playground-code"
                    tabIndex={tab === "code" ? 0 : -1}
                    onClick={() => setTab("code")}
                    onKeyDown={moveTab}
                  >
                    <Code2 size={16} />
                    {t("code")}
                  </button>
                </>
              )}
            </div>
            <div className={styles.tools}>
              {tab === "preview" && (
                <>
                  <button
                    type="button"
                    onClick={() => setMobile(false)}
                    aria-label={t("desktop")}
                    title={t("desktop")}
                    aria-pressed={!mobile}
                  >
                    <Monitor size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobile(true)}
                    aria-label={t("mobile")}
                    title={t("mobile")}
                    aria-pressed={mobile}
                  >
                    <Smartphone size={17} />
                  </button>
                  <span className={styles.toolDivider} />
                </>
              )}
              <button
                type="button"
                onClick={() => setReload((value) => value + 1)}
                disabled={!html || busy || tab === "results"}
                aria-label={t("reload")}
                title={t("reload")}
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={copy}
                disabled={busy || (tab === "results" ? !latestReport : !html)}
                aria-label={t(tab === "results" ? "research.copy" : "copy")}
                title={t(tab === "results" ? "research.copy" : "copy")}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <button
                type="button"
                onClick={startOver}
                disabled={
                  (!html && !messages.length && !researchMessages.length) ||
                  busy ||
                  exporting
                }
                aria-label={t("reset")}
                title={t("reset")}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className={styles.previewArea}>
            <div
              id="playground-results"
              role="tabpanel"
              aria-labelledby="results-tab"
              hidden={tab !== "results"}
              className={styles.researchPanel}
            >
              {!researchMessages.length && (
                <div className={styles.discussionIntro}>
                  <h2>{t("research.introTitle")}</h2>
                  <p>{t("research.intro")}</p>
                </div>
              )}
              {researchMessages.map((message, index) =>
                message.role === "user" ? (
                  <div key={index} className={styles.researchQuestion}>
                    <h3>{t("you")}</h3>
                    <p>{message.content}</p>
                  </div>
                ) : message.report ? (
                  <ResearchResults
                    key={index}
                    report={message.report}
                    prefix={`research-${index}`}
                    onError={() => setError(t("errors.researchDownload"))}
                  />
                ) : null
              )}
              {activity.length > 0 && (
                <details
                  className={styles.activityLog}
                  open={busy && operation === "research"}
                >
                  <summary>{t("research.activity")}</summary>
                  <ol>
                    {activity.map((item, index) => (
                      <li key={index}>
                        {t(`research.operations.${item.operation}`)} ·{" "}
                        {t(`research.states.${item.state}`)}
                        {item.evidenceId ? ` (${item.evidenceId})` : ""}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
              {busy && operation === "research" && (
                <p role="status" className={styles.discussionThinking}>
                  {t("research.thinking")}
                </p>
              )}
            </div>
            <div
              id="playground-idea"
              role="tabpanel"
              aria-labelledby="idea-tab"
              hidden={tab !== "idea"}
              className={styles.discussionPanel}
              ref={discussionPanel}
            >
              {!messages.length ? (
                <div className={styles.discussionIntro}>
                  <h2>{t("discussionTitle")}</h2>
                  <p>{t("discussionIntro")}</p>
                </div>
              ) : (
                <div
                  role="log"
                  aria-live="polite"
                  aria-relevant="additions"
                  aria-label={t("ideaTab")}
                  className={styles.messages}
                >
                  {messages.map((message, index) => (
                    <div key={index} className={styles.message}>
                      <h3>
                        {t(message.role === "user" ? "you" : "ideaPartner")}
                      </h3>
                      <p>{message.content}</p>
                    </div>
                  ))}
                </div>
              )}
              {busy && operation === "discuss" && (
                <p className={styles.discussionThinking}>{t("thinking")}</p>
              )}
              {scope && (
                <section
                  className={styles.proposedScope}
                  aria-label={t("proposedPlan")}
                >
                  <h2>
                    {t("proposedPlan")}: {scope.title}
                  </h2>
                  <p>{scope.summary}</p>
                  <ul>
                    {scope.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                  {scope.limitations.length > 0 && (
                    <>
                      <h3>{t("planLimits")}</h3>
                      <ul>
                        {scope.limitations.map((limit, index) => (
                          <li key={index}>{limit}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  <p className={styles.help}>
                    {scopeBuilt ? t("planBuilt") : t("buildAgreement")}
                  </p>
                  <Button
                    type="button"
                    onClick={build}
                    disabled={
                      busy ||
                      scopeBuilt ||
                      !!prompt.trim() ||
                      !apiKey.trim() ||
                      exporting
                    }
                  >
                    {t(
                      scopeBuilt
                        ? "planBuiltButton"
                        : html
                        ? "buildChanges"
                        : "buildPlan"
                    )}
                    <ArrowRight size={16} />
                  </Button>
                  {!!prompt.trim() && !scopeBuilt && (
                    <p className={styles.help}>{t("sendChangesFirst")}</p>
                  )}
                </section>
              )}
            </div>
            {tab === "idea" || tab === "results" ? null : !html &&
              !(busy && operation === "build" && tab === "code") ? (
              <div className={styles.empty}>
                <h2>{t("emptyTitle")}</h2>
                <p>{t("emptyDescription")}</p>
                <span className={styles.emptyCaption}>{t("emptyCaption")}</span>
              </div>
            ) : (
              <>
                <div
                  id="playground-preview"
                  role="tabpanel"
                  aria-labelledby="preview-tab"
                  hidden={tab !== "preview"}
                  className={styles.previewPanel}
                >
                  {preview && (
                    <iframe
                      key={preview.channel}
                      ref={frame}
                      title={t("frameTitle")}
                      srcDoc={preview.document}
                      sandbox="allow-scripts"
                      referrerPolicy="no-referrer"
                      className={`${styles.frame} ${
                        mobile ? styles.mobileFrame : ""
                      }`}
                    />
                  )}
                </div>
                <div
                  id="playground-code"
                  role="tabpanel"
                  aria-labelledby="code-tab"
                  hidden={tab !== "code"}
                  className={styles.codePanel}
                >
                  <pre tabIndex={0}>
                    <code>{code || t("waitingCode")}</code>
                  </pre>
                </div>
              </>
            )}
          </div>
          {previewError && workflow === "website" && (
            <p role="alert" className={styles.previewWarning}>
              {t("previewError")}
            </p>
          )}
          <div className={styles.outputFooter}>
            <p role="status" aria-live="polite">
              {busy && (
                <Loader2
                  size={15}
                  className={styles.spinner}
                  aria-hidden="true"
                />
              )}
              {copied ? t("copied") : status}
            </p>
            {tab === "results" && latestReport && (
              <button
                type="button"
                className={styles.jsonDownload}
                disabled={busy}
                onClick={() => {
                  try {
                    saveResearchFile(
                      JSON.stringify(latestReport, null, 2),
                      "truyen-kieu-research.json",
                      "application/json;charset=utf-8"
                    );
                  } catch {
                    setError(t("errors.researchDownload"));
                  }
                }}
              >
                {t("research.downloadEvidence")}
              </button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                busy || exporting || (tab === "results" ? !latestReport : !html)
              }
              onClick={download}
            >
              {exporting ? (
                <Loader2 className={styles.spinner} size={15} />
              ) : (
                <Download size={15} />
              )}
              {exporting
                ? t("exporting")
                : t(tab === "results" ? "research.downloadReport" : "download")}
            </Button>
          </div>
          <TokenUsage turns={usageTurns} />
        </section>
      </div>
    </div>
  );
}

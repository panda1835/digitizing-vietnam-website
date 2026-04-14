"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  BookOpen,
  ChevronDown,
  RotateCcw,
  Send,
  Settings2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useOptionalMirador } from "@/components/mirador/MiradorContext";
import { useTranslations } from "next-intl";

interface Source {
  text: string;
  title?: string;
  page?: string;
  section?: string;
  source?: string;
  slug?: string;
  markdownPage?: number;
  canvasId?: string;
  score: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface ChatbotProps {
  documentId: string;
  collectionSlug?: string;
  collectionItemSlugs?: string[];
  documentMetadata?: Record<string, unknown>;
}

type ChatMode = "specific" | "general";

interface SourcesEvent {
  type: "sources";
  sources: Source[];
}

interface TextEvent {
  type: "text";
  content: string;
}

interface DoneEvent {
  type: "done";
}

interface ErrorEvent {
  type: "error";
  message?: string;
}

type StreamEvent = SourcesEvent | TextEvent | DoneEvent | ErrorEvent;

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const MAX_HISTORY_MESSAGES = 14;
const MAX_HISTORY_CHARS = 9000;
const MAX_HISTORY_MEMORY_CHARS = 3200;
const CHATBOT_VISIBLE_COLLECTION_SLUG = "ngon-ngu-van-tu-ngu-van";
const CHATBOT_VISIBLE_DOCUMENT_SLUGS = new Set([
  "am-tiet-tieng-viet-va-ngon-tu-thi-ca",
  "ngon-ngu-van-tu-ngu-van",
  "am-tiet-va-loai-hinh-ngon-ngu",
  "khai-luan-van-tu-hoc-chu-nom",
]);
const SUPPORTED_LOCALES = new Set(["en", "vi"]);

function compactText(text: string, maxChars: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, maxChars).trim()}...`;
}

function optimizeHistoryForRequest(
  messages: Message[],
  historyMemory: string
): {
  history: Array<{ role: "user" | "assistant"; content: string }>;
  nextHistoryMemory: string;
} {
  const normalized = messages
    .filter((message) => message.role !== "assistant" || message.content.trim())
    .map((message) => ({
      role: message.role,
      content: compactText(message.content, 1500),
    }));

  let history = [...normalized];
  let nextMemory = historyMemory;
  let totalChars = history.reduce(
    (sum, message) => sum + message.content.length,
    0
  );

  while (
    history.length > MAX_HISTORY_MESSAGES ||
    totalChars > MAX_HISTORY_CHARS
  ) {
    const moved = history.shift();
    if (!moved) {
      break;
    }

    const memoryLine = `${
      moved.role === "user" ? "User" : "Assistant"
    }: ${compactText(moved.content, 260)}`;
    nextMemory = nextMemory ? `${nextMemory}\n${memoryLine}` : memoryLine;

    if (nextMemory.length > MAX_HISTORY_MEMORY_CHARS) {
      nextMemory = nextMemory.slice(
        nextMemory.length - MAX_HISTORY_MEMORY_CHARS
      );
    }

    totalChars = history.reduce(
      (sum, message) => sum + message.content.length,
      0
    );
  }

  return { history, nextHistoryMemory: nextMemory };
}

export default function Chatbot({
  documentId,
  collectionSlug,
  collectionItemSlugs = [],
  documentMetadata,
}: ChatbotProps) {
  const t = useTranslations("Chatbot");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mirador = useOptionalMirador();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const assistantMessageRefs = useRef<Record<string, HTMLDivElement | null>>(
    {}
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [expandedSources, setExpandedSources] = useState<
    Record<string, boolean>
  >({});
  const [historyMemory, setHistoryMemory] = useState("");
  const [chatMode, setChatMode] = useState<ChatMode>("specific");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForFirstToken, setIsWaitingForFirstToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const historyMemoryStorageKey = `chatbot-history-memory:${documentId}:${chatMode}`;
  const documentTitle =
    typeof documentMetadata?.title === "string" ? documentMetadata.title : "";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const cachedMemory = window.sessionStorage.getItem(historyMemoryStorageKey);
    if (cachedMemory) {
      setHistoryMemory(cachedMemory);
    }
  }, [historyMemoryStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (historyMemory) {
      window.sessionStorage.setItem(historyMemoryStorageKey, historyMemory);
    } else {
      window.sessionStorage.removeItem(historyMemoryStorageKey);
    }
  }, [historyMemory, historyMemoryStorageKey]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;

    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isOpen, isStreaming, isWaitingForFirstToken]);

  const isDocumentLevel = !collectionSlug;
  const isChatbotVisible = isDocumentLevel
    ? CHATBOT_VISIBLE_DOCUMENT_SLUGS.has(documentId)
    : collectionSlug === CHATBOT_VISIBLE_COLLECTION_SLUG;
  if (!isChatbotVisible) {
    return null;
  }

  const updateAssistantMessage = (
    assistantMessageId: string,
    updater: (previous: Message) => Message
  ) => {
    setMessages((previousMessages) =>
      previousMessages.map((message) =>
        message.id === assistantMessageId ? updater(message) : message
      )
    );
  };

  const scrollToAssistantAnswer = (assistantMessageId: string) => {
    const node = assistantMessageRefs.current[assistantMessageId];
    if (!node) {
      return;
    }

    node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleReset = () => {
    setMessages([]);
    setExpandedSources({});
    setHistoryMemory("");
    setError(null);
    setInputValue("");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(historyMemoryStorageKey);
    }
  };

  const handleSourceClick = (source: Source, canvasId?: string) => {
    if (collectionSlug && source.slug) {
      const pathSegments = pathname.split("/").filter(Boolean);
      const localePrefix = SUPPORTED_LOCALES.has(pathSegments[0])
        ? `/${pathSegments[0]}`
        : "";
      const params = new URLSearchParams();
      const inferredCanvas = inferCanvasFromBookPage(source.page, source.slug);
      if (inferredCanvas) {
        params.set("canvas", String(inferredCanvas));
      }

      const targetPath = `${localePrefix}/our-collections/${collectionSlug}/${source.slug}`;
      const targetUrl = params.toString()
        ? `${targetPath}?${params.toString()}`
        : targetPath;
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (!canvasId) {
      return;
    }

    mirador?.setCanvasId(canvasId);

    const params = new URLSearchParams(searchParams.toString());
    params.set("canvasId", canvasId);
    window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
  };

  const inferCanvasFromBookPage = (
    page?: string,
    sourceSlug?: string
  ): number | undefined => {
    if (!page) {
      return undefined;
    }

    const match = page.match(/\d+/);
    if (!match) {
      return undefined;
    }

    const pageStart = Number(match[0]);
    if (!Number.isFinite(pageStart)) {
      return undefined;
    }

    const targetSlug = sourceSlug || documentId;
    let canvas: number | undefined;
    if (targetSlug === "am-tiet-tieng-viet-va-ngon-tu-thi-ca") {
      canvas = (pageStart + 4) / 2;
    } else if (targetSlug === "ngon-ngu-van-tu-ngu-van") {
      canvas = (pageStart + 6) / 2;
    } else if (targetSlug === "am-tiet-va-loai-hinh-ngon-ngu") {
      canvas = (pageStart + 4) / 2;
    } else if (targetSlug === "khai-luan-van-tu-hoc-chu-nom") {
      canvas = (pageStart + 4) / 2;
    }

    if (!canvas || !Number.isInteger(canvas) || canvas < 1) {
      return undefined;
    }

    return canvas;
  };

  const resolveCanvasId = (source: Source): string | undefined => {
    if (source.canvasId) {
      return source.canvasId;
    }

    const currentCanvasId = searchParams.get("canvasId");
    if (!currentCanvasId) {
      return undefined;
    }

    const decodedCanvasId = decodeURIComponent(currentCanvasId);
    const match = decodedCanvasId.match(/^(.*)\.canvas\d+$/);
    if (!match) {
      return undefined;
    }

    const inferredCanvas = inferCanvasFromBookPage(source.page, source.slug);
    if (inferredCanvas) {
      return `${match[1]}.canvas${inferredCanvas}`;
    }

    if (typeof source.markdownPage !== "number") {
      return undefined;
    }

    return `${match[1]}.canvas${source.markdownPage}`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) {
      return;
    }

    const question = inputValue.trim();
    const userMessageId = createMessageId();
    const assistantMessageId = createMessageId();

    setError(null);
    setInputValue("");
    setIsStreaming(true);
    setIsWaitingForFirstToken(true);
    const nextMessages: Message[] = [
      ...messages,
      { id: userMessageId, role: "user", content: question },
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        sources: [],
      },
    ];
    setMessages(nextMessages);

    const { history, nextHistoryMemory } = optimizeHistoryForRequest(
      messages,
      historyMemory
    );
    if (nextHistoryMemory !== historyMemory) {
      setHistoryMemory(nextHistoryMemory);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          chatMode,
          documentId,
          collectionSlug,
          collectionItemSlugs,
          history,
          historyMemory: nextHistoryMemory,
          documentMetadata: documentMetadata || {},
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start chat stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) {
            continue;
          }

          const event = JSON.parse(line.slice(6)) as StreamEvent;

          if (event.type === "sources") {
            updateAssistantMessage(assistantMessageId, (previousMessage) => ({
              ...previousMessage,
              sources: event.sources || [],
            }));
            continue;
          }

          if (event.type === "text") {
            setIsWaitingForFirstToken(false);
            updateAssistantMessage(assistantMessageId, (previousMessage) => ({
              ...previousMessage,
              content: `${previousMessage.content}${event.content || ""}`,
            }));
            continue;
          }

          if (event.type === "error") {
            throw new Error(event.message || "Stream failed.");
          }

          if (event.type === "done") {
            setTimeout(() => scrollToAssistantAnswer(assistantMessageId), 80);
          }
        }
      }
    } catch (streamError) {
      console.error(streamError);
      setError(t("error-generic"));
      updateAssistantMessage(assistantMessageId, (previousMessage) => ({
        ...previousMessage,
        content: previousMessage.content || t("error-fallback-answer"),
      }));
    } finally {
      setIsStreaming(false);
      setIsWaitingForFirstToken(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <div className="relative">
          <Button
            size="icon"
            onClick={() => setIsOpen(true)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-branding-brown shadow-lg hover:scale-105 hover:bg-branding-brown/90"
          >
            <Image
              unoptimized
              src="/ai-mascot/AI-mascot-left.png"
              alt={t("title")}
              width={64}
              height={64}
            />
          </Button>

          {isHovering && (
            <div className="fixed bottom-10 right-24 z-50 rounded-md bg-branding-brown px-3 py-2 text-sm text-white shadow-lg">
              {t("launcher-tooltip")}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[340px] flex-col border-branding-brown/20 shadow-2xl sm:w-[400px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 rounded-t-lg bg-branding-brown py-3 text-white">
            <CardTitle className="text-base font-semibold">
              {t("title")}
            </CardTitle>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                disabled={isStreaming}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-72 border-branding-brown/20 p-3"
                >
                  <div className="text-xs font-semibold text-branding-brown mb-2">
                    {t("settings-title")}
                  </div>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="chat-mode"
                        value="specific"
                        checked={chatMode === "specific"}
                        onChange={() => setChatMode("specific")}
                        disabled={isStreaming}
                        className="mt-0.5"
                      />
                      <span>
                        {t("mode-specific")}
                        {documentTitle ? ` (${documentTitle})` : ""}
                      </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="chat-mode"
                        value="general"
                        checked={chatMode === "general"}
                        onChange={() => setChatMode("general")}
                        disabled={isStreaming}
                        className="mt-0.5"
                      />
                      <span>{t("mode-general")}</span>
                    </label>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea ref={scrollAreaRef} className="h-full px-4 py-3">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="rounded-md border border-branding-brown/20 bg-branding-white p-3 text-sm text-branding-black/70">
                    {chatMode === "specific"
                      ? t("empty-specific")
                      : t("empty-general")}
                  </div>
                )}

                {messages.map((message, index) => {
                  const isPendingAssistant =
                    message.role === "assistant" &&
                    !message.content &&
                    isStreaming &&
                    index === messages.length - 1;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex max-w-[88%] flex-col gap-2",
                        message.role === "user"
                          ? "ml-auto items-end"
                          : "mr-auto items-start"
                      )}
                    >
                      <div
                        className="flex items-start gap-2"
                        ref={
                          message.role === "assistant"
                            ? (node) => {
                                assistantMessageRefs.current[message.id] = node;
                              }
                            : undefined
                        }
                      >
                        {message.role === "assistant" && (
                          <Image
                            unoptimized
                            src="/ai-mascot/AI-mascot-right.png"
                            alt={t("assistant-alt")}
                            width={32}
                            height={32}
                          />
                        )}
                        <div
                          className={cn(
                            "rounded-xl px-3 py-2 text-sm leading-relaxed",
                            message.role === "user"
                              ? "bg-branding-brown text-white"
                              : "border border-branding-brown/20 bg-white text-branding-black"
                          )}
                        >
                          {isPendingAssistant ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-branding-brown [animation-delay:-0.2s]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-branding-brown [animation-delay:-0.1s]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-branding-brown" />
                            </span>
                          ) : (
                            message.content
                          )}
                        </div>
                      </div>

                      {message.role === "assistant" &&
                        message.sources &&
                        message.sources.length > 0 && (
                          <div className="ml-8 w-full space-y-2">
                            <div className="flex items-center gap-1 text-xs font-semibold text-branding-brown">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSources((previous) => ({
                                    ...previous,
                                    [message.id]: !previous[message.id],
                                  }))
                                }
                                className="inline-flex items-center gap-1"
                              >
                                <BookOpen className="h-3 w-3" />
                                {t("sources")} ({message.sources.length})
                                <ChevronDown
                                  className={cn(
                                    "h-3 w-3 transition-transform",
                                    expandedSources[message.id]
                                      ? "rotate-180"
                                      : ""
                                  )}
                                />
                              </button>
                            </div>
                            {expandedSources[message.id] && (
                              <div className="space-y-2">
                                {message.sources.map((source, sourceIndex) =>
                                  (() => {
                                    const resolvedCanvasId =
                                      resolveCanvasId(source);
                                    const canOpenSource = collectionSlug
                                      ? Boolean(source.slug)
                                      : Boolean(resolvedCanvasId);
                                    const sourceMetadataLine = [
                                      source.title || source.slug || "",
                                      source.section || "",
                                      source.page ? `p.${source.page}` : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" • ");
                                    return (
                                      <button
                                        key={`${message.id}-source-${sourceIndex}`}
                                        type="button"
                                        onClick={() =>
                                          handleSourceClick(
                                            source,
                                            resolvedCanvasId
                                          )
                                        }
                                        disabled={!canOpenSource}
                                        className={cn(
                                          "w-full rounded-md border border-branding-brown/20 bg-branding-white p-2 text-left text-xs transition-colors",
                                          canOpenSource
                                            ? "hover:bg-branding-brown/5"
                                            : "cursor-not-allowed opacity-70"
                                        )}
                                      >
                                        <div className="text-branding-black/80">
                                          ...{source.text}...
                                        </div>
                                        {sourceMetadataLine && (
                                          <div className="mt-1 text-[11px] text-branding-brown">
                                            {sourceMetadataLine}
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })()
                                )}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  );
                })}

                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t border-branding-brown/20 p-3">
            <div className="flex w-full items-center gap-2">
              <Input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={t("input-placeholder")}
                className="rounded-full"
                disabled={isStreaming}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={isStreaming || !inputValue.trim()}
                className="rounded-full bg-branding-brown hover:bg-branding-brown/90 p-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, Send, RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMirador } from "@/components/mirador/MiradorContext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Image from "next/image";
const ALLOWED_DOCUMENT_IDS = [
  {
    id: "khai-luan-van-tu-hoc-chu-nom",
    name: {
      vi: "Khái luận Văn tự học Chữ Nôm",
      en: "An Introduction to Chu Nom Grammatology",
    },
    canvas:
      "https://digitizingvietnam.com/iiif/dca6b2762bb68a0919bba49e25602b5b",
    canvasOffset: 9,
    pageOffset: 14,
  },
  //   {
  //     id: "ngon-ngu-van-tu-ngu-van",
  //     name: {
  //       vi: "Ngôn ngữ. Văn tự. Ngữ văn",
  //       en: "Language. Writing. Philology",
  //     },
  //     canvas:
  //       "https://digitizingvietnam.com/iiif/cfe913ea0e13e1afb889bee8cfcc0a3a",
  //     canvasOffset: 11,
  //     pageOffset: 16,
  //   },
];

const ALLOWED_DOCUMENTS = [
  "khai-luan-van-tu-hoc-chu-nom",
  //   "ngon-ngu-van-tu-ngu-van",
];

interface Source {
  label: string;
  page_number: number;
  chapter: string;
  book_title: string;
  file_name: string;
  source_path: string;
  text: string;
  viewer_url: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  citations?: string[];
}

interface ChatbotProps {
  documentId: string;
}

export default function Chatbot({ documentId }: ChatbotProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { setCanvasId } = useMirador();

  const currentDocument = ALLOWED_DOCUMENT_IDS.find(
    (doc) => doc.id === documentId
  );

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setError(null);

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("https://nasharkie-nomsense.hf.space/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage,
          top_k: 10,
          pool_size: 20,
          rerank: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          citations: data.citations,
        },
      ]);
    } catch (err) {
      console.error(err);
      setError("Sorry, something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSourceClick = (source: Source) => {
    if (!currentDocument) return;

    const canvasIndex =
      Math.floor(source.page_number / 2) + currentDocument.canvasOffset;
    const newCanvasId = `${currentDocument.canvas}.canvas${canvasIndex}`;

    setCanvasId(newCanvasId);

    const params = new URLSearchParams(searchParams.toString());
    params.set("canvasId", newCanvasId);

    // Update URL without triggering full navigation
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  };

  if (!ALLOWED_DOCUMENTS.includes(documentId)) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <div className="relative">
          <Button
            onClick={() => setIsOpen(true)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="fixed bottom-1/2 right-4 h-18 w-18 rounded-full shadow-lg z-50 bg-branding-brown hover:bg-branding-brown/80 hover:scale-110 text-white transition-all duration-300"
            size="icon"
          >
            <Image
              unoptimized
              src="/ai-mascot/AI-mascot-left.png"
              alt="Chatbot Icon"
              width={70}
              height={70}
            />
          </Button>

          {isHovering && (
            <div className="fixed bottom-1/2 right-24 z-50 animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="bg-branding-brown text-white px-4 py-2 rounded-lg shadow-xl whitespace-nowrap font-['Helvetica Neue'] font-medium text-sm">
                Ask me anything about this document!
              </div>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <Card className="fixed bottom-4 right-4 w-[300px] sm:w-[400px] h-[500px] shadow-xl z-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 border-2 border-branding-brown/20">
          <CardHeader
            onClick={() => setIsOpen(false)}
            className="flex cursor-pointer flex-row rounded-t-lg items-center justify-between space-y-0 pb-3 border-b-2 border-branding-brown/20 bg-branding-brown"
          >
            <CardTitle className="text-lg font-bold text-white font-['Helvetica Neue']">
              Ask Lê Quý Đôn AI
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden bg-branding-white">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-branding-brown/60 mt-10">
                    <p className="font-['Helvetica Neue']">
                      Ask the Polymath&apos;s Lê Quý Đôn AI any question about
                      this document.
                    </p>
                  </div>
                )}

                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col space-y-2 max-w-[85%]",
                      msg.role === "user"
                        ? "ml-auto items-end"
                        : "mr-auto items-start"
                    )}
                  >
                    <div className="flex gap-2 ">
                      {index % 2 === 1 && (
                        <Image
                          unoptimized
                          src="/ai-mascot/AI-mascot-right.png"
                          alt="Chatbot Icon"
                          width={28}
                          height={28}
                          className="h-full"
                        />
                      )}
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2 text-sm font-['Helvetica Neue']",
                          msg.role === "user"
                            ? "bg-branding-brown text-white shadow-md"
                            : "bg-white border border-branding-brown/20 text-branding-black shadow-sm"
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>

                    {msg.role === "assistant" && (
                      <>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="w-full mt-2 space-y-2 ml-8">
                            <p className="text-xs font-semibold text-branding-brown flex items-center gap-1 font-['Helvetica Neue']">
                              <BookOpen className="h-3 w-3" /> Sources
                            </p>
                            <div className="space-y-2">
                              {msg.sources
                                .filter((source) =>
                                  currentDocument
                                    ? source.book_title
                                        .toLowerCase()
                                        .includes(
                                          currentDocument.name.vi.toLowerCase()
                                        )
                                    : true
                                )
                                .slice(0, 3)
                                .map((source, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs bg-branding-white border border-branding-brown/20 p-2 rounded cursor-pointer hover:bg-branding-brown/5 hover:border-branding-brown/40 transition-all duration-200 shadow-sm"
                                    onClick={() => handleSourceClick(source)}
                                  >
                                    {/* <div
                                      className="font-medium truncate"
                                      title={source.label}
                                    >
                                      {source.label}
                                    </div> */}
                                    <div className="text-branding-black/70 line-clamp-2 my-1 font-['Helvetica Neue']">
                                      &quot;{source.text}&quot;
                                    </div>
                                    <div className="text-[10px] text-branding-brown font-medium font-['Helvetica Neue']">
                                      p.{" "}
                                      {source.page_number +
                                        currentDocument!.pageOffset}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center space-x-2 text-branding-brown">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-['Helvetica Neue']">
                      Thinking...
                    </span>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded border border-destructive/20">
                    <p className="font-['Helvetica Neue']">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendMessage}
                      className="h-6 text-xs border-branding-brown text-branding-brown hover:bg-branding-brown hover:text-white"
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-3 border-t-2 border-branding-brown/20 bg-white">
            <div className="flex w-full items-center space-x-2">
              <Input
                placeholder="Type your question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-1 border-branding-brown/30 focus:border-branding-brown focus:ring-branding-brown font-['Helvetica Neue']"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-branding-brown text-white transition-all duration-300"
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

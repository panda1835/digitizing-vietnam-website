import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";


type Source = {
  text: string;
  page?: string;
  section?: string;
  source?: string;
  markdownPage?: number;
  canvasId?: string;
  score: number;
};

type PineconeMatch = {
  id?: string;
  score?: number;
  metadata?: Record<string, unknown>;
};

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type RetrievalDecision = {
  useBookRetrieval: boolean;
  reason: string;
};

type ChatMode = "specific" | "general";
type RetrievalRewriteResult = {
  query: string;
};

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function stripMarkdownHeadlines(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^\s{0,3}#{1,6}\s+/.test(line))
    .join("\n")
    .trim();
}

function extractMarkdownPage(recordId?: string): number | undefined {
  if (!recordId) {
    return undefined;
  }

  const match = recordId.match(/-p(\d+)-c\d+$/);
  if (!match) {
    return undefined;
  }

  const page = Number(match[1]);
  return Number.isFinite(page) ? page : undefined;
}

function extractCanvasId(
  metadata: Record<string, unknown>,
  markdownPage?: number
): string | undefined {
  const directCanvasId =
    asOptionalString(metadata.canvasId) || asOptionalString(metadata.canvas_id);
  if (directCanvasId) {
    return directCanvasId;
  }

  const manifestId =
    asOptionalString(metadata.manifestId) || asOptionalString(metadata.manifest_id);
  if (manifestId && markdownPage) {
    return `https://digitizingvietnam.com/iiif/${manifestId}.canvas${markdownPage}`;
  }

  return undefined;
}

function mapMatchToSource(match: PineconeMatch): Source | null {
  const metadata = match.metadata || {};
  const rawText = asOptionalString(metadata.chunk_text);
  const text = rawText ? stripMarkdownHeadlines(rawText) : undefined;

  if (!text) {
    return null;
  }

  const markdownPage = extractMarkdownPage(match.id);

  return {
    text,
    page: asOptionalString(metadata.page),
    section: asOptionalString(metadata.section),
    source: asOptionalString(metadata.source),
    markdownPage,
    canvasId: extractCanvasId(metadata, markdownPage),
    score: typeof match.score === "number" ? match.score : 0,
  };
}

function buildContext(sources: Source[]): string {
  if (!sources.length) {
    return "No relevant source passages were retrieved.";
  }

  return sources
    .map((source, index) => {
      const section = source.section || "Unknown section";
      const page = source.page || "Unknown page";
      return `[Source ${index + 1}] (${section}) p.${page}:\n${source.text}`;
    })
    .join("\n\n");
}

function normalizeHistory(value: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const role = item?.role;
      const content =
        typeof item?.content === "string" ? item.content.trim() : "";
      if (!content || (role !== "user" && role !== "assistant")) {
        return null;
      }
      return { role, content };
    })
    .filter(Boolean)
    .slice(-24) as ChatHistoryMessage[];
}

function stringifyDocumentMetadata(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "No document metadata provided.";
  }

  return JSON.stringify(value, null, 2);
}

function extractDocumentLanguage(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "same as user question";
  }

  const metadata = value as Record<string, unknown>;
  const languageValue = metadata.language;

  if (typeof languageValue === "string" && languageValue.trim()) {
    return languageValue.trim();
  }

  if (Array.isArray(languageValue)) {
    const first = languageValue.find(
      (entry) => typeof entry === "string" && entry.trim().length > 0
    ) as string | undefined;
    if (first) {
      return first.trim();
    }
  }

  return "same as user question";
}

function getRetrievalConfidence(score: number): "high" | "medium" | "low" {
  if (score >= 0.75) {
    return "high";
  }
  if (score >= 0.55) {
    return "medium";
  }
  return "low";
}

function formatSseData(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function shouldForceRetrievalForFollowUp(
  question: string,
  history: ChatHistoryMessage[]
): boolean {
  if (!history.length) {
    return false;
  }

  const normalized = question.trim().toLowerCase();
  const isShortFollowUp = normalized.split(/\s+/).length <= 10;
  const hasCoreference =
    /\b(him|her|them|he|she|his|their|that|this)\b/.test(normalized) ||
    /\b(ông ấy|bà ấy|họ|anh ấy|chị ấy|người đó|điều đó)\b/.test(normalized);
  const asksToElaborate =
    /^(tell me|say more|more|elaborate|expand|go on|can you explain)/.test(
      normalized
    ) ||
    /^(nói thêm|nói rõ hơn|giải thích thêm|mở rộng|kể thêm)/.test(normalized);

  return isShortFollowUp && (hasCoreference || asksToElaborate);
}

function isLikelyVietnamese(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/.test(
      lower
    ) ||
    /\b(là|của|và|trong|không|được|văn|ngữ|sách|tác giả)\b/.test(lower)
  );
}

function getInsufficientContextRefusal(question: string): string {
  if (isLikelyVietnamese(question)) {
    return "Sách không đề cập đến nội dung này trong ngữ cảnh đã truy xuất. Tôi không thể trả lời đáng tin cậy chỉ từ ngữ cảnh đã cung cấp.";
  }

  return "The book does not mention this in the retrieved context. I can’t answer this reliably from the provided context.";
}

async function decideRetrievalMode(params: {
  openai: OpenAI;
  model: string;
  question: string;
  history: ChatHistoryMessage[];
  historyMemory: string;
  documentMetadata: string;
}): Promise<RetrievalDecision> {
  const { openai, model, question, history, historyMemory, documentMetadata } =
    params;

  try {
    const decisionResponse = await openai.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Decide whether the assistant needs document-content retrieval for the user question. Return JSON only with keys: {"useBookRetrieval": boolean, "reason": string}. Use retrieval when the user asks about the document\'s internal claims, passages, arguments, chapter content, quotes, page-specific information, or asks for more details about an entity already mentioned in the conversation. Do NOT use retrieval for general-world questions or pure bibliographic metadata questions answerable from provided metadata.',
        },
        {
          role: "user",
          content: `Question:\n${question}\n\nRecent history:\n${history
            .map((item) => `${item.role}: ${item.content}`)
            .join("\n")}\n\nCompressed older history:\n${
            historyMemory || "None"
          }\n\nDocument metadata:\n${documentMetadata}`,
        },
      ],
    });

    const content = decisionResponse.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(content) as Partial<RetrievalDecision>;
    return {
      useBookRetrieval: Boolean(parsed.useBookRetrieval),
      reason: typeof parsed.reason === "string" ? parsed.reason : "N/A",
    };
  } catch (error) {
    console.error("Retrieval decision failed, defaulting to retrieval:", error);
    return {
      useBookRetrieval: true,
      reason: "Fallback to retrieval due to routing error.",
    };
  }
}

async function rewriteQueryForRetrieval(params: {
  openai: OpenAI;
  model: string;
  question: string;
  history: ChatHistoryMessage[];
  historyMemory: string;
  documentMetadata: string;
  documentLanguage: string;
}): Promise<RetrievalRewriteResult> {
  const {
    openai,
    model,
    question,
    history,
    historyMemory,
    documentMetadata,
    documentLanguage,
  } = params;

  try {
    const rewriteResponse = await openai.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Rewrite the user question into a standalone semantic-search query for document retrieval. Resolve references (e.g., pronouns like "him", "that", "this") using conversation context and metadata. Keep the rewritten query in the document language. Return JSON only with key: {"query": string}.',
        },
        {
          role: "user",
          content: `Document language: ${documentLanguage}

Original question:
${question}

Recent history:
${history.map((item) => `${item.role}: ${item.content}`).join("\n")}

Compressed older history:
${historyMemory || "None"}

Document metadata:
${documentMetadata}`,
        },
      ],
    });

    const content = rewriteResponse.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(content) as Partial<RetrievalRewriteResult>;
    const query = typeof parsed.query === "string" ? parsed.query.trim() : "";

    if (!query) {
      return { query: question };
    }

    return { query };
  } catch (error) {
    console.error("Retrieval query rewrite failed, using raw question:", error);
    return { query: question };
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const pineconeIndex = process.env.PINECONE_INDEX;
  const pineconeEmbedModel = process.env.PINECONE_EMBED_MODEL;
  const openAiModel = process.env.OPENAI_MODEL;

  if (!pineconeApiKey) {
    return NextResponse.json(
      { error: "PINECONE_API_KEY is not configured." },
      { status: 500 }
    );
  }

  if (!openAiApiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 }
    );
  }
  if (!pineconeIndex) {
    return NextResponse.json(
      { error: "PINECONE_INDEX is not configured." },
      { status: 500 }
    );
  }
  if (!pineconeEmbedModel) {
    return NextResponse.json(
      { error: "PINECONE_EMBED_MODEL is not configured." },
      { status: 500 }
    );
  }
  if (!openAiModel) {
    return NextResponse.json(
      { error: "OPENAI_MODEL is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const question =
      typeof body?.question === "string" ? body.question.trim() : "";
    const chatMode: ChatMode =
      body?.chatMode === "general" ? "general" : "specific";
    const documentId =
      typeof body?.documentId === "string" ? body.documentId : "";
    const history = normalizeHistory(body?.history);
    const historyMemory =
      typeof body?.historyMemory === "string" ? body.historyMemory.trim() : "";
    const rawDocumentMetadata = body?.documentMetadata;
    const documentMetadata = stringifyDocumentMetadata(rawDocumentMetadata);
    const documentLanguage = extractDocumentLanguage(rawDocumentMetadata);

    if (!question) {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }

    const pinecone = new Pinecone({ apiKey: pineconeApiKey });
    const openai = new OpenAI({ apiKey: openAiApiKey });

    const retrievalDecision =
      chatMode === "specific"
        ? shouldForceRetrievalForFollowUp(question, history)
          ? {
              useBookRetrieval: true,
              reason:
                "Forced retrieval for short follow-up/coreference question in specific mode.",
            }
          : await decideRetrievalMode({
              openai,
              model: openAiModel,
              question,
              history,
              historyMemory,
              documentMetadata,
            })
        : { useBookRetrieval: false, reason: "General mode (no retrieval)." };

    let sources: Source[] = [];
    if (retrievalDecision.useBookRetrieval) {
      const rewritten = await rewriteQueryForRetrieval({
        openai,
        model: openAiModel,
        question,
        history,
        historyMemory,
        documentMetadata,
        documentLanguage,
      });

      const embeddingResponse = await pinecone.inference.embed(
        pineconeEmbedModel,
        [rewritten.query],
        { inputType: "query" }
      );
      const queryVector = embeddingResponse.data?.[0]?.values;

      if (!queryVector?.length) {
        return NextResponse.json(
          { error: "Failed to embed question." },
          { status: 500 }
        );
      }

      const index = pinecone.index(pineconeIndex);
      const queryResponse = await index.query({
        vector: queryVector,
        topK: 5,
        includeMetadata: true,
        ...(documentId
          ? {
              filter: {
                item_type: { $eq: "collections" },
                slug: { $eq: documentId },
              },
            }
          : {}),
      });

      sources = (queryResponse.matches || [])
        .map((match) => mapMatchToSource(match as PineconeMatch))
        .filter(Boolean) as Source[];
    }

    const topScore = sources[0]?.score || 0;
    const retrievalInsufficient =
      retrievalDecision.useBookRetrieval &&
      (sources.length === 0 || topScore < 0.45);
    const retrievalConfidence = getRetrievalConfidence(topScore);
    const context = buildContext(sources);

    if (retrievalInsufficient) {
      const refusal = getInsufficientContextRefusal(question);
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(formatSseData({ type: "sources", sources }))
          );
          controller.enqueue(
            encoder.encode(formatSseData({ type: "text", content: refusal }))
          );
          controller.enqueue(encoder.encode(formatSseData({ type: "done" })));
          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const specificSystemPrompt = `You are an assistant for strict book-grounded QA.

Hard grounding rules:
1) Use only BOOK_CONTEXT as factual evidence for content claims.
2) Do not use your own background/world knowledge to fill gaps.
3) Use DOCUMENT_METADATA only for bibliographic/descriptive metadata (title, author, language, year, etc.), not for invented content claims.
4) If the answer is not explicitly supported by BOOK_CONTEXT, say clearly that the book does not mention it.
5) If BOOK_CONTEXT is missing/insufficient for the user request, explicitly state insufficient book evidence and do not guess.

Output requirements:
- Respond in the same language as the user.
- Be concise and accurate.
- For unsupported requests, explicitly say: "The book does not mention this." (or natural equivalent in the user language).

Routing decision for this turn:
- useBookRetrieval: ${retrievalDecision.useBookRetrieval}
- reason: ${retrievalDecision.reason}
- retrieval confidence: ${retrievalConfidence} (top score: ${topScore.toFixed(
      3
    )})

DOCUMENT_METADATA (full JSON):
${documentMetadata}

BOOK_CONTEXT:
${context}

CONVERSATION_MEMORY (compressed older turns):
${historyMemory || "None"}`;

    const generalSystemPrompt = `You are a general-purpose assistant.

Answer using broad knowledge only. Do not rely on document metadata or document retrieval context in this mode.

Output requirements:
- Respond in the same language as the user.
- Be concise, accurate, and clear.
- If uncertain, state uncertainty instead of guessing.

Current user question:
${question}`;

    const stream = await openai.chat.completions.create({
      model: openAiModel,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            chatMode === "specific" ? specificSystemPrompt : generalSystemPrompt,
        },
        ...history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
        { role: "user", content: question },
      ],
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        const send = (payload: unknown) => {
          controller.enqueue(encoder.encode(formatSseData(payload)));
        };

        try {
          send({ type: "sources", sources });

          for await (const chunk of stream) {
            const token = chunk.choices?.[0]?.delta?.content;
            if (token) {
              send({ type: "text", content: token });
            }
          }

          send({ type: "done" });
        } catch (error) {
          console.error("Error while streaming chat response:", error);
          send({
            type: "error",
            message: "Failed to stream the chat response.",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("POST /api/chat failed:", error);
    return NextResponse.json(
      { error: "Failed to process chat request." },
      { status: 500 }
    );
  }
}

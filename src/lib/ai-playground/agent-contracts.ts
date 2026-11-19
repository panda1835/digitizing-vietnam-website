import { z } from "zod";
import { validatePresentation } from "./presentation";

const evidenceId = z.string().regex(/^E\d+$/);
const datasetId = z.string().regex(/^E\d+\.(rows|counts|editions)$/);
const title = z.string().trim().min(1).max(160);
const sort = z
  .object({
    field: z.string().min(1).max(80),
    direction: z.enum(["asc", "desc"]),
  })
  .strict()
  .nullable();
export const reportBlockSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("section"),
      title: title.nullable(),
      text: z.string().trim().min(1).max(6000),
      evidenceIds: z.array(evidenceId).max(16),
    })
    .strict(),
  z
    .object({
      type: z.literal("note"),
      title,
      text: z.string().trim().min(1).max(2000),
      evidenceIds: z.array(evidenceId).max(16),
    })
    .strict(),
  z
    .object({
      type: z.literal("table"),
      title,
      dataset: datasetId,
      columns: z.array(z.string().min(1).max(80)).min(1).max(12),
      sort,
      limit: z.number().int().min(1).max(100),
    })
    .strict(),
  z
    .object({
      type: z.literal("chart"),
      title,
      dataset: datasetId,
      chartType: z.enum(["bar", "line", "scatter"]),
      x: z.string().min(1).max(80),
      y: z.string().min(1).max(80),
      sort,
      limit: z.number().int().min(1).max(50),
    })
    .strict(),
  z
    .object({
      type: z.literal("passage"),
      title,
      evidenceId,
      sourceIds: z.array(z.string().min(1).max(160)).min(1).max(6),
      script: z.enum(["nom", "quocNgu", "both"]),
    })
    .strict(),
]);
export type ReportBlock = z.infer<typeof reportBlockSchema>;
export const researchAnswerSchema = z
  .object({
    status: z.enum(["complete", "needs-clarification", "unavailable"]),
    title,
    blocks: z.array(reportBlockSchema).min(1).max(16),
  })
  .strict();
export type ResearchAnswer = z.infer<typeof researchAnswerSchema>;
export type ResearchEvidence = {
  id: string;
  request: { operation: string; edition?: string; input?: unknown };
  result: Record<string, any>;
};
export type PresentationWarning = {
  block: number;
  reason:
    | "invalid-fields"
    | "numeric-chart-required"
    | "empty-chart"
    | "ambiguous-axis";
};
export type ResearchReport = ResearchAnswer & {
  evidence: ResearchEvidence[];
  presentationWarnings: PresentationWarning[];
};

export const inspectEvidenceSchema = z
  .object({
    evidenceId,
    dataset: datasetId.nullable().default(null),
    offset: z.number().int().min(0).max(10000).default(0),
    limit: z.number().int().min(1).max(20).default(5),
    sourceIds: z.array(z.string().min(1).max(160)).max(6).default([]),
  })
  .strict();
export type InspectEvidenceInput = z.infer<typeof inspectEvidenceSchema>;
export function validateEvidence(
  answer: ResearchAnswer,
  evidence: ResearchEvidence[]
): ResearchReport {
  const { blocks, presentationWarnings } = validatePresentation(
    answer.blocks,
    evidence
  );
  const cited = blocks.some(
    (block) =>
      block.type === "chart" ||
      block.type === "table" ||
      block.type === "passage" ||
      block.evidenceIds.length > 0
  );
  if (answer.status === "complete" && (!evidence.length || !cited))
    throw new Error("Completed research needs evidence-backed findings");
  return { ...answer, blocks, evidence, presentationWarnings };
}

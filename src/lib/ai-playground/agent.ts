import { compactEvidence, inspectEvidence } from "./presentation";
import {
  inspectEvidenceSchema,
  type InspectEvidenceInput,
} from "./agent-contracts";
import {
  researchRequestSchema,
  type ResearchRequest,
} from "@/lib/kieu/schemas";
import { executeResearch } from "@/lib/kieu/research";
import type { PlaygroundEvent } from "./contracts";
import type { ResearchEvidence } from "./agent-contracts";

// A bounded, read-only investigation. Provider-generated code never runs on the server.
export function createResearchRunner(
  send: (event: PlaygroundEvent) => void,
  signal: AbortSignal
) {
  const evidence: ResearchEvidence[] = [];
  let calls = 0,
    resultCharacters = 0;
  return {
    evidence,
    async inspect(raw: InspectEvidenceInput) {
      const input = inspectEvidenceSchema.parse(raw);
      if (signal.aborted) throw new Error("Investigation cancelled");
      if (++calls > 16)
        return {
          error: "tool-budget-exhausted",
          guidance: "Finish with the evidence already collected.",
        };
      send({
        type: "activity",
        operation: "inspect_evidence",
        state: "running",
      });
      try {
        const result = inspectEvidence(evidence, input);
        if (JSON.stringify(result).length > 20000)
          throw new Error("Inspection too large");
        send({
          type: "activity",
          operation: "inspect_evidence",
          state: "complete",
          evidenceId: input.evidenceId,
        });
        return result;
      } catch {
        send({
          type: "activity",
          operation: "inspect_evidence",
          state: "failed",
        });
        return {
          error: "inspection-unavailable",
          guidance:
            "Use an existing evidence/dataset/source ID, fewer sourceIds, or a smaller row limit.",
        };
      }
    },
    async execute(raw: ResearchRequest) {
      const request = researchRequestSchema.parse(raw);
      if (signal.aborted) throw new Error("Investigation cancelled");
      if (++calls > 16)
        return {
          error: "tool-budget-exhausted",
          guidance: "Finish with the evidence already collected.",
        };
      send({
        type: "activity",
        operation: request.operation,
        state: "running",
      });
      try {
        const result = (await executeResearch(request)) as Record<string, any>;
        if (signal.aborted) throw new Error("Investigation cancelled");
        const size = JSON.stringify(result).length;
        if (size > 150000 || resultCharacters + size > 600000) {
          send({
            type: "activity",
            operation: request.operation,
            state: "failed",
          });
          return {
            error: "result-too-large",
            guidance:
              "Use a smaller verse range, pageSize, contextVerses, or examplesPerVariant. Do not claim to have inspected this result.",
          };
        }
        resultCharacters += size;
        const id = `E${evidence.length + 1}`;
        evidence.push({ id, request, result });
        send({
          type: "activity",
          operation: request.operation,
          state: "complete",
          evidenceId: id,
        });
        return compactEvidence(evidence[evidence.length - 1]);
      } catch {
        if (signal.aborted) throw new Error("Investigation cancelled");
        send({
          type: "activity",
          operation: request.operation,
          state: "failed",
        });
        return {
          error: "research-tool-failed",
          guidance:
            "Try a supported query or explain that this analysis could not be completed. Do not fabricate its result.",
        };
      }
    },
  };
}

export type ReportedTokenUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  complete: boolean;
};
export type UsageTurn = ReportedTokenUsage & {
  id: string;
  mode: "research" | "discuss" | "build";
  title: string;
  provider: string;
  model: string;
  status: "running" | "complete" | "failed" | "stopped";
};
const count = (value: unknown): number | null =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
export function normalizeTokenUsage(value: unknown): ReportedTokenUsage {
  const usage = value as Partial<ReportedTokenUsage> | null;
  const inputTokens = count(usage?.inputTokens),
    outputTokens = count(usage?.outputTokens);
  return {
    inputTokens,
    outputTokens,
    complete:
      usage?.complete === true && inputTokens !== null && outputTokens !== null,
  };
}
export function createTokenUsageTracker() {
  let input: number | null = null,
    output: number | null = null;
  let missingInput = false,
    missingOutput = false,
    finished = false,
    started = 0,
    ended = 0;
  const add = (previous: number | null, next: number | null) =>
    next === null ? previous : (previous ?? 0) + next;
  return {
    startStep() {
      started++;
      finished = false;
    },
    finishStep(value: unknown) {
      const usage = normalizeTokenUsage(value);
      ended++;
      input = add(input, usage.inputTokens);
      output = add(output, usage.outputTokens);
      missingInput ||= usage.inputTokens === null;
      missingOutput ||= usage.outputTokens === null;
    },
    finish(value: unknown) {
      const aggregate = normalizeTokenUsage(value);
      // SDK aggregate counts may zero-fill unknown step usage. Keep missing-step flags.
      if (aggregate.inputTokens !== null) {
        if (input !== null && aggregate.inputTokens < input)
          missingInput = true;
        else input = aggregate.inputTokens;
      }
      if (aggregate.outputTokens !== null) {
        if (output !== null && aggregate.outputTokens < output)
          missingOutput = true;
        else output = aggregate.outputTokens;
      }
      const aggregateAvailable =
        aggregate.inputTokens !== null && aggregate.outputTokens !== null;
      finished = (aggregateAvailable || ended > 0) && started <= ended;
    },
    snapshot(): ReportedTokenUsage {
      return {
        inputTokens: input,
        outputTokens: output,
        complete:
          finished &&
          !missingInput &&
          !missingOutput &&
          input !== null &&
          output !== null,
      };
    },
  };
}
export function sessionTokenUsage(turns: UsageTurn[]): ReportedTokenUsage {
  const sum = (key: "inputTokens" | "outputTokens") => {
    const known = turns
      .map((t) => t[key])
      .filter((value): value is number => value !== null);
    return !turns.length
      ? 0
      : known.length
      ? known.reduce((a, b) => a + b, 0)
      : null;
  };
  return {
    inputTokens: sum("inputTokens"),
    outputTokens: sum("outputTokens"),
    complete: turns.every((t) => t.complete),
  };
}

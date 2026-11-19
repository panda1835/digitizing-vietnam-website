import { z } from "zod";

export const editions = ["1866", "1870", "1871", "1872", "1902"] as const;
export const editionSchema = z.enum(editions);
export type Edition = z.infer<typeof editionSchema>;
const selectedEditions = z
  .array(editionSchema)
  .min(1)
  .max(5)
  .refine(
    (values) => new Set(values).size === values.length,
    "Editions must be unique"
  )
  .default([...editions]);
const verseRange = {
  from: z.number().int().min(1).max(10000),
  to: z.number().int().min(1).max(10000),
};
const validRange = (v: { from: number; to: number }) =>
  v.to >= v.from && v.to - v.from < 500;
export const versesSchema = z
  .object(verseRange)
  .strict()
  .refine(validRange, "Use an ascending range of at most 500 verse numbers");
export const concordanceSchema = z
  .object({
    query: z.string().trim().min(1).max(100),
    variants: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
    editions: selectedEditions,
    script: z.enum(["nom", "quocNgu"]).default("quocNgu"),
    match: z
      .enum(["substring", "exact_phrase", "token"])
      .default("exact_phrase"),
    caseSensitive: z.boolean().default(false),
    diacriticSensitive: z.boolean().default(true),
    contextVerses: z.number().int().min(0).max(5).default(1),
    pageSize: z.number().int().min(1).max(200).default(50),
    cursor: z.string().min(1).max(512).nullable().default(null),
  })
  .strict()
  .refine(
    (v) =>
      v.match !== "token" ||
      [v.query, ...v.variants].every((q) =>
        new RegExp("^[\\p{L}\\p{M}\\p{N}]+$", "u").test(q)
      ),
    "Token queries must contain a single letter/number token"
  );
export type ConcordanceInput = z.infer<typeof concordanceSchema>;
export const frequenciesSchema = z
  .object({
    script: z.enum(["nom", "quocNgu"]).default("quocNgu"),
    unit: z.enum(["character", "syllable"]).default("syllable"),
    caseSensitive: z.boolean().default(false),
    diacriticSensitive: z.boolean().default(true),
    minCount: z.number().int().min(1).max(100000).default(1),
    pageSize: z.number().int().min(1).max(200).default(50),
    cursor: z.string().min(1).max(512).nullable().default(null),
  })
  .strict()
  .refine(
    (v) => v.script !== "nom" || v.unit === "character",
    "Nôm supports character frequencies only"
  );
export type FrequencyInput = z.infer<typeof frequenciesSchema>;
export const compareSchema = z
  .object({
    ...verseRange,
    editions: selectedEditions,
    script: z.enum(["nom", "quocNgu"]).default("quocNgu"),
  })
  .strict()
  .refine(validRange, "Use an ascending range of at most 500 verse numbers");
export type CompareInput = z.infer<typeof compareSchema>;
export const nomVariantsSchema = z
  .object({
    left: editionSchema,
    right: editionSchema,
    from: z.number().int().min(1).max(10000).default(1),
    to: z.number().int().min(1).max(10000).default(10000),
    term: z.string().trim().min(1).max(100).nullable().default(null),
    minOccurrences: z.number().int().min(1).max(10000).default(1),
    examplesPerVariant: z.number().int().min(1).max(5).default(2),
    pageSize: z.number().int().min(1).max(100).default(30),
    cursor: z.string().min(1).max(512).nullable().default(null),
  })
  .strict()
  .refine((v) => v.left !== v.right, "Select two different editions")
  .refine((v) => v.to >= v.from, "Use an ascending verse range")
  .refine(
    (v) => v.term === null || new RegExp("^[\\p{L}\\p{M}]+$", "u").test(v.term),
    "Use one Vietnamese syllable"
  );
export type NomVariantsInput = z.infer<typeof nomVariantsSchema>;

// This schema is also sent as a model tool parameter. Use anyOf-compatible
// unions; the literal operation fields preserve unambiguous validation.
export const researchRequestSchema = z.union([
  z.object({ operation: z.literal("editions") }).strict(),
  z
    .object({
      operation: z.literal("verses"),
      edition: editionSchema,
      input: versesSchema,
    })
    .strict(),
  z
    .object({ operation: z.literal("concordance"), input: concordanceSchema })
    .strict(),
  z
    .object({
      operation: z.literal("frequencies"),
      edition: editionSchema,
      input: frequenciesSchema,
    })
    .strict(),
  z.object({ operation: z.literal("compare"), input: compareSchema }).strict(),
  z
    .object({ operation: z.literal("nom_variants"), input: nomVariantsSchema })
    .strict(),
]);
export type ResearchRequest = z.infer<typeof researchRequestSchema>;
export const exportSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("verses"),
      edition: editionSchema,
      input: versesSchema,
      format: z.enum(["json", "csv"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("concordance"),
      input: concordanceSchema,
      format: z.enum(["json", "csv"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("frequencies"),
      edition: editionSchema,
      input: frequenciesSchema,
      format: z.enum(["json", "csv"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("compare"),
      input: compareSchema,
      format: z.enum(["json", "csv"]),
    })
    .strict(),
  z
    .object({
      kind: z.literal("edition"),
      edition: editionSchema,
      format: z.enum(["json", "csv", "tei"]),
    })
    .strict(),
]);

export const researchBridgeSchema = z
  .object({ method: z.literal("research"), request: researchRequestSchema })
  .strict();

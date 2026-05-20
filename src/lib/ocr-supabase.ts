// lib/ocr-supabase.ts
//
// Server-side Supabase client for the admin OCR pipeline (project
// "NomFlow"-style schema: documents → pages → ocr_runs → text_units →
// text_versions / text_candidates / comments).
//
// ⚠️ SERVER ONLY. This uses the service_role key, which bypasses RLS and
// has full read/write on the database. It must never be imported into a
// client component or any bundle shipped to the browser. The key is read
// from a non-NEXT_PUBLIC_ env var so it is not exposed even if misused,
// but keep the import boundary clean regardless.
//
// Auth is intentionally deferred (see project plan): until Supabase Auth
// + RLS policies land, every admin/OCR route talks to the DB through this
// single service-role client.
//
// TODO(schema): once the real CREATE TABLE DDL is in, generate types and
// replace `any` below with the generated `Database` type:
//   npx supabase gen types typescript --project-id cpvlderoberfzmafelqm
// then: createClient<Database>(...) and export typed helpers.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Placeholder until the generated schema types exist. Swap for the
// generated `Database` interface — call sites stay the same.
type Database = any;

// Loose client type. The schema is chosen at runtime (OCR_DB_SCHEMA),
// so the supabase-js schema generic can't be the "public" literal;
// until generated `Database` types land these generics add no safety.
type OcrClient = SupabaseClient<any, any, any>;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Which Postgres schema the OCR tables live in. Defaults to "ocr"
// (production). Point at a sandbox schema in the SAME project for
// testing by setting OCR_DB_SCHEMA=ocr_test. Whatever value is used
// must also be in the project's PostgREST "Exposed schemas".
const OCR_DB_SCHEMA = process.env.OCR_DB_SCHEMA ?? "ocr";

// Cache the client across hot-reloads / serverless invocations in the
// same process so we don't spin up a new connection pool per request.
const globalForOcrSupabase = globalThis as unknown as {
  __ocrSupabase?: OcrClient;
};

function createOcrSupabaseClient(): OcrClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "ocr-supabase: client imported in the browser. This module is " +
        "server-only — it uses the service_role key."
    );
  }
  if (!SUPABASE_URL) {
    throw new Error(
      "ocr-supabase: NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env."
    );
  }
  if (!SERVICE_ROLE_KEY) {
    throw new Error(
      "ocr-supabase: SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env " +
        "(server-only — do NOT prefix it NEXT_PUBLIC_)."
    );
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    // OCR tables live in a dedicated `ocr` schema (isolated from any
    // other app sharing the project). Every .from() resolves there, so
    // the store layer needs no per-call .schema() calls.
    // NOTE: this schema must be in the project's PostgREST "Exposed
    // schemas" (Settings → API) or these calls return schema errors.
    db: { schema: OCR_DB_SCHEMA },
    auth: {
      // Service-role client has no user session to persist or refresh.
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      // ⚠️ Next.js patches the global `fetch` and caches it by default
      // in Server Components and Route Handlers. supabase-js issues all
      // its requests through `fetch`, so without this every OCR read is
      // a *live admin DB query being served from a stale static cache* —
      // the first response for a page/doc gets frozen and keeps coming
      // back even after OCR has written new rows. (Symptom: data only
      // appears after a manual hard refresh.) These are never cacheable,
      // so force every request past Next's Data Cache.
      fetch: (input, init) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  }) as OcrClient;
}

/**
 * The shared server-side OCR Supabase client (service_role, RLS-bypassing).
 * Lazily constructed so importing this module doesn't throw at build time
 * when env vars are absent — it only throws when first actually used.
 */
export function ocrSupabase(): OcrClient {
  if (!globalForOcrSupabase.__ocrSupabase) {
    globalForOcrSupabase.__ocrSupabase = createOcrSupabaseClient();
  }
  return globalForOcrSupabase.__ocrSupabase;
}

// src/lib/corpus/storage.ts
//
// Resolves page images through a driver, so the reader never links a file path
// or a bucket URL directly. `corpus.pages.image_key` stores a logical key like
// "my-book/0042.webp"; moving from local disk to Supabase Storage is then an
// env var plus one migration script, with no schema or UI change.
//
// Local disk works only where the files are — Netlify functions have no
// persistent disk — so CORPUS_STORAGE_DRIVER must be flipped to "supabase"
// before this is deployed publicly.

import fs from "node:fs";
import path from "node:path";

export type StorageDriver = "local" | "supabase";

const LOCAL_ROOT = path.join(process.cwd(), "data", "corpus", "pages");

export function activeDriver(): StorageDriver {
  return (process.env.CORPUS_STORAGE_DRIVER as StorageDriver) || "local";
}

export function imageKey(slug: string, pageNumber: number, thumb = false): string {
  const name = `${String(pageNumber).padStart(4, "0")}.webp`;
  return thumb ? `${slug}/thumbs/${name}` : `${slug}/${name}`;
}

/** Rejects keys that try to escape the storage root. */
function safeKey(key: string): string | null {
  if (!key || key.includes("..") || path.isAbsolute(key)) return null;
  return key.replace(/\\/g, "/");
}

export async function readImage(key: string): Promise<Buffer | null> {
  const safe = safeKey(key);
  if (!safe) return null;

  if (activeDriver() === "local") {
    const file = path.join(LOCAL_ROOT, safe);
    if (!file.startsWith(LOCAL_ROOT)) return null;
    return fs.existsSync(file) ? fs.readFileSync(file) : null;
  }

  // Supabase Storage driver lands here once the project exists.
  throw new Error("The supabase storage driver is not wired up yet");
}

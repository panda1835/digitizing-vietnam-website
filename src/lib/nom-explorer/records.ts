import { readFileSync } from "fs";
import { join } from "path";

// The explorer's index of Tự điển chữ Nôm dẫn giải structures, read at
// request time (next.config.mjs ships it with the tool's routes).
export function loadRecords(): unknown[] {
  return JSON.parse(readFileSync(join(process.cwd(), "data/nom-explorer/index.json"), "utf-8"));
}

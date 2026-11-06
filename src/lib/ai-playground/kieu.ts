import fs from "fs/promises";
import path from "path";
import { parseStringPromise } from "xml2js";
import {
  KIEU_VERSIONS,
  versionSchema,
  type DataRequest,
  type KieuPage,
  type KieuVersion,
} from "./contracts";

// Use the same XML corpus as /api/searchable-text/truyen-kieu. Never accept a path or URL.
const editions = new Map<KieuVersion, Promise<KieuPage[]>>();

async function readEdition(version: KieuVersion): Promise<KieuPage[]> {
  versionSchema.parse(version);
  if (!editions.has(version)) {
    const promise = (async () => {
      const xml = await fs.readFile(
        path.join(process.cwd(), "data/truyen-kieu", `Kieu${version}.xml`),
        "utf8"
      );
      // Flatten annotation spans before parsing so mixed Vietnamese text retains its order.
      const parsed = await parseStringPromise(
        xml.replace(/<\/?seg\b[^>]*>/g, "")
      );
      const pages = parsed.TEI.text[0].body[0].page;
      return pages.map((page: any, index: number) => {
        const getLines = (type: string) =>
          (page.div ?? [])
            .filter((div: any) => div.$?.type === type)
            .flatMap((div: any) =>
              (div.lg ?? []).flatMap((group: any) => group.l ?? [])
            );
        const original = getLines("text");
        const translated = getLines("transliteration");
        const text = (line: any) =>
          (typeof line === "string" ? line : line?._ ?? "").trim();
        const numbers = Array.from(
          new Set<string>(
            [...original, ...translated].map(
              (line: any, i: number) => line.$?.n ?? String(i + 1)
            )
          )
        );
        const byNumber = (lines: any[], number: string) =>
          text(
            lines.find((line, i) => (line.$?.n ?? String(i + 1)) === number)
          );
        return {
          version,
          page: index + 1,
          pageLabel: page.$?.n ?? String(index + 1),
          totalPages: pages.length,
          lines: numbers.map((number) => ({
            number,
            nom: byNumber(original, number),
            quocNgu: byNumber(translated, number),
          })),
          sourceUrl: `/en/our-collections/truyen-kieu/truyen-kieu-${version}?page=${
            index + 1
          }`,
        };
      });
    })();
    editions.set(version, promise);
    promise.catch(() => editions.delete(version));
  }
  return editions.get(version)!;
}

export async function listVersions() {
  return Promise.all(
    KIEU_VERSIONS.map(async (version) => ({
      version,
      title: `Truyện Kiều ${version}`,
      totalPages: (await readEdition(version)).length,
    }))
  );
}

export async function getPage(version: KieuVersion, page: number) {
  const pages = await readEdition(version);
  if (!Number.isInteger(page) || page < 1 || page > pages.length)
    throw new RangeError("Invalid page");
  return pages[page - 1];
}

export function searchPages(pages: KieuPage[], query: string) {
  const needle = query.normalize("NFC").toLocaleLowerCase("vi");
  return pages
    .flatMap((page) =>
      page.lines
        .filter((line) =>
          `${line.nom} ${line.quocNgu}`
            .normalize("NFC")
            .toLocaleLowerCase("vi")
            .includes(needle)
        )
        .map((line) => ({
          version: page.version,
          page: page.page,
          ...line,
          sourceUrl: page.sourceUrl,
        }))
    )
    .slice(0, 30);
}

export async function executeDataRequest(request: DataRequest) {
  switch (request.method) {
    case "listVersions":
      return listVersions();
    case "getPage":
      return getPage(request.version, request.page);
    case "search":
      return searchPages(await readEdition(request.version), request.query);
  }
}

export async function getSnapshot() {
  return Object.fromEntries(
    await Promise.all(
      KIEU_VERSIONS.map(async (version) => [
        version,
        await readEdition(version),
      ])
    )
  );
}

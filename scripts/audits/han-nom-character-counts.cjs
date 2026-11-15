// Read-only audit. Counts source text without using the application's counting helper.
// Usage: node scripts/audits/han-nom-character-counts.cjs [output.json] [--refresh]
// Cached public API responses in /tmp allow an interrupted audit to resume.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const ts = require("typescript");
const vm = require("node:vm");
const { parseStringPromise } = require("xml2js");
const base = "src/app/[locale]/research/han-nom/search-database/_data/";
const cache = "/tmp/han-nom-character-audit";
const refresh = process.argv.includes("--refresh");
const output =
  process.argv.slice(2).find((arg) => !arg.startsWith("--")) ||
  "/tmp/han-nom-character-audit.json";
fs.mkdirSync(cache, { recursive: true });
function load(file) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  vm.runInThisContext(`(function(exports){${code}\n})`)(exports);
  return exports;
}
const utils = load(
  "src/app/[locale]/our-collections/[collectionid]/[documentid]/searchable-text/dai-viet-su-ky-toan-thu/utils.ts"
);
const constantsSource = fs.readFileSync(base + "corpus.ts", "utf8");
const constants = Object.fromEntries(
  [...constantsSource.matchAll(/"([a-z0-9-]+)": (\d+),/g)].map((m) => [
    m[1],
    Number(m[2]),
  ])
);
const report = {
  auditedAt: new Date().toISOString(),
  methodology:
    "Count Han-script and private-use code points in original text only; exclude markup, notes, transliterations, punctuation, spaces and variation selectors. XML is parsed independently. Distinct original language layers are reported separately. Repeated glyphs count repeatedly.",
  results: [],
  failures: [],
};
function count(text) {
  const chars = Array.from(text || "");
  return {
    characters: chars.filter((c) => /\p{Script=Han}|\p{Private_Use}/u.test(c))
      .length,
    privateUse: chars.filter((c) => /\p{Private_Use}/u.test(c)).length,
  };
}
function nodeText(node) {
  if (typeof node === "string") return node;
  if (!node || typeof node !== "object") return "";
  if (Array.isArray(node)) return node.map(nodeText).join("");
  return Object.entries(node)
    .filter(([key]) => !["$", "note", "noteg", "teiHeader"].includes(key))
    .map(([, value]) => nodeText(value))
    .join("");
}
function originalLayers(node, layers = {}) {
  if (!node || typeof node !== "object") return layers;
  if (Array.isArray(node)) {
    node.forEach((n) => originalLayers(n, layers));
    return layers;
  }
  if (node.$?.type === "text") {
    const lang = node.$.lang || "unspecified";
    // Concatenate only original verse lines when present, excluding notes and metadata.
    const text = nodeText(node.lg || node);
    const numbers = count(text);
    layers[lang] ||= { characters: 0, privateUse: 0, lines: 0 };
    layers[lang].characters += numbers.characters;
    layers[lang].privateUse += numbers.privateUse;
    layers[lang].lines += (node.lg || []).reduce(
      (n, group) => n + (group.l || []).length,
      0
    );
    return layers;
  }
  Object.entries(node)
    .filter(([key]) => !["$", "note", "noteg", "teiHeader"].includes(key))
    .forEach(([, value]) => originalLayers(value, layers));
  return layers;
}
async function plainOriginal(source) {
  if (!source) return "";
  if (!source.includes("<")) return source;
  // HTML/XML fragments in the database: wrap to accept multiple sibling elements.
  const parsed = await parseStringPromise(
    "<audit>" + source.replace(/<\?xml[^>]*>/g, "") + "</audit>"
  );
  return nodeText(parsed);
}
function record(slug, data) {
  const audited =
    data.characters ??
    Object.values(data.layers).reduce((n, layer) => n + layer.characters, 0);
  const complete = !(data.coverageWarnings || []).length;
  const result = {
    slug,
    saved: constants[slug],
    audited: complete ? audited : null,
    observedCharacters: audited,
    delta: complete ? audited - constants[slug] : null,
    status: !complete
      ? "incomplete source coverage"
      : audited === constants[slug]
      ? "match"
      : "mismatch",
    ...data,
  };
  report.results.push(result);
  console.log(JSON.stringify(result));
}
async function get(route, allowMissing = false) {
  const file = path.join(
    cache,
    crypto.createHash("sha256").update(route).digest("hex") + ".json"
  );
  if (!refresh && fs.existsSync(file))
    return JSON.parse(fs.readFileSync(file, "utf8"));
  let error;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(
        "https://digitizingvietnam.com/api/" +
          (route.startsWith("research/") ? route : "searchable-text/" + route),
        { signal: AbortSignal.timeout(30000) }
      );
      if (allowMissing && response.status === 404) {
        const missing = { auditNotFound: true };
        fs.writeFileSync(file, JSON.stringify(missing));
        return missing;
      }
      if (!response.ok) throw Error(`HTTP ${response.status} ${route}`);
      const json = await response.json();
      if (json.error) throw Error(json.error);
      fs.writeFileSync(file, JSON.stringify(json));
      return json;
    } catch (e) {
      error = e;
    }
  }
  throw error;
}
async function mapLimit(items, callback, limit = 4) {
  let next = 0;
  const results = [];
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await callback(items[index], index);
      }
    })
  );
  return results;
}
async function auditXmlPages(slug, route, pages) {
  const responses = await mapLimit(
    Array.from({ length: pages }, (_, i) => i + 1),
    (page) => get(`${route}?page=${page}`)
  );
  const layers = {};
  responses.forEach((r, index) => {
    if (!r.rawText) throw Error(`${slug} missing page ${index + 1}`);
    originalLayers(r.rawText, layers);
  });
  record(slug, {
    source: `live API: ${route}`,
    pages: responses.length,
    layers,
  });
}
async function auditPoems() {
  const first = await get("quoc-am-thi-tap?topicId=1");
  const ids = [...new Set(first.all_ids)];
  const poems = await mapLimit(ids, (id) =>
    get("quoc-am-thi-tap?topicId=" + id)
  );
  const texts = poems.map((p) => nodeText(p.hn_body));
  record("quoc-am-thi-tap", {
    source: "live API: qatt hn_body",
    poems: poems.length,
    ...count(texts.join("")),
  });
  const hxh = await get(
    "tinh-hoa-mua-xuan?topic=" + encodeURIComponent("Cảnh thu")
  );
  const topics = [...new Set(hxh.all_qn_topic)];
  const hxhPoems = await mapLimit(topics, (topic) =>
    get("tinh-hoa-mua-xuan?topic=" + encodeURIComponent(topic))
  );
  const originals = await Promise.all(
    hxhPoems.map((p) => plainOriginal(p.nom))
  );
  record("tinh-hoa-mua-xuan", {
    source: "live API: tho_hxh nom",
    poems: hxhPoems.length,
    ...count(originals.join("")),
  });
}
async function researchChapter(slug, book, topic) {
  const texts = [];
  let pages = 0;
  for (let start = 1; start <= 1000; start += 4) {
    const batch = await mapLimit(
      [start, start + 1, start + 2, start + 3],
      (page) =>
        get(
          `research/han-nom/search-database/${slug}?book=${book}&topic=${topic}&page=${page}`,
          true
        )
    );
    for (const response of batch) {
      if (response.auditNotFound) return { pages, ...count(texts.join("")) };
      if (!Array.isArray(response.hanNom))
        throw Error(`Unexpected research page ${slug}/${topic}`);
      texts.push(response.hanNom.map((line) => line.text).join(""));
      pages++;
    }
  }
  throw Error(`No end-of-chapter found for ${slug}/${topic}`);
}
async function auditHistory() {
  const slugs = [
    "quyen-thu",
    "ngoai-ky",
    "ban-ky-toan-thu",
    "ban-ky-thuc-luc",
    "ban-ky-tuc-bien",
  ];
  const aliases = [
    "Phụ: Mạc Phúc Nguyên",
    "Phụ: Mạc Phúc Nguyên ",
    "Phụ: Mạc Hậu Hợp",
    "Phụ: Mặc Đăng Doanh, Mạc Phúc Nguyên",
  ];
  for (let book = 0; book < slugs.length; book++) {
    const topics = utils.flattenItems(utils.titles[book].children);
    const seen = new Set();
    const result = {
      source: `live API: ĐVSKTT book ${book}`,
      pages: 0,
      characters: 0,
      privateUse: 0,
      topics: [],
      skippedAliases: [],
      coverageWarnings: [],
    };
    for (let i = 0; i < topics.length; i++) {
      const title = aliases.includes(topics[i].title)
        ? topics[i - 1].title
        : topics[i].title;
      const topicId = book === 0 ? i + 1 : utils.titleToTopicId(title);
      if (seen.has(topicId)) {
        if (book === 3 && topicId === 0) {
          const supplemental = await researchChapter(slugs[book], book, i + 1);
          if (supplemental.characters > 0) {
            result.pages += supplemental.pages;
            result.characters += supplemental.characters;
            result.privateUse += supplemental.privateUse;
            result.topics.push({
              topic: i + 1,
              title,
              topicId: 61,
              source: "research reader API",
              ...supplemental,
            });
            continue;
          }
        }
        const entry = { topic: i + 1, title: topics[i].title, topicId };
        result.skippedAliases.push(entry);
        if (!aliases.includes(topics[i].title))
          result.coverageWarnings.push({
            ...entry,
            reason: "Distinct chapter maps to an already counted chapter ID",
          });
        continue;
      }
      seen.add(topicId);
      const route = `dai-viet-su-ky-toan-thu?book=${book}&topic=${i + 1}&page=`;
      const first = await get(route + 1);
      if (!Number.isInteger(first.count) || first.count <= 0) {
        if (book === 3 && topicId === 0) {
          const supplemental = await researchChapter(slugs[book], book, i + 1);
          if (supplemental.characters > 0) {
            result.pages += supplemental.pages;
            result.characters += supplemental.characters;
            result.privateUse += supplemental.privateUse;
            result.topics.push({
              topic: i + 1,
              title,
              topicId: 60,
              source: "research reader API",
              ...supplemental,
            });
            continue;
          }
        }
        result.coverageWarnings.push({
          topic: i + 1,
          title,
          topicId,
          reason: "Reader API exposes no source rows for this chapter",
        });
        continue;
      }
      const rest = await mapLimit(
        Array.from({ length: first.count - 1 }, (_, j) => j + 2),
        (page) => get(route + page)
      );
      const rows = [first, ...rest];
      const texts = await Promise.all(rows.map((r) => plainOriginal(r.nom)));
      const numbers = count(texts.join(""));
      result.pages += rows.length;
      result.characters += numbers.characters;
      result.privateUse += numbers.privateUse;
      result.topics.push({
        topic: i + 1,
        title,
        topicId,
        pages: rows.length,
        ...numbers,
      });
      console.log(
        `Progress ${slugs[book]}: topic ${i + 1}/${topics.length}, ${
          result.characters
        } characters`
      );
    }
    record(slugs[book], result);
  }
}
(async () => {
  for (const year of ["1866", "1870", "1871", "1872", "1902"]) {
    const filename = `data/truyen-kieu/Kieu${year}.xml`;
    const xml = fs.readFileSync(filename, "utf8");
    const parsed = await parseStringPromise(xml);
    const pages = parsed.TEI.text[0].body[0].page;
    const emptyPages = pages
      .filter(
        (page) =>
          !(page.div || []).some(
            (div) =>
              div.$?.type === "text" &&
              (div.lg || []).some((group) => (group.l || []).length)
          )
      )
      .map((page) => page.$.n);
    record(`truyen-kieu-${year}`, {
      source: filename,
      pagesWithoutOriginalVerse: emptyPages,
      sha256: crypto.createHash("sha256").update(xml).digest("hex"),
      pages: parsed.TEI.text[0].body[0].page.length,
      layers: originalLayers(parsed),
    });
  }
  const tasks = [
    [
      "chinh-phu-ngam-khuc",
      () => auditXmlPages("chinh-phu-ngam-khuc", "chinh-phu-ngam-khuc", 64),
    ],
    [
      "van-tien-co-tich-tan-truyen",
      () => auditXmlPages("van-tien-co-tich-tan-truyen", "luc-van-tien", 104),
    ],
    ["poems", auditPoems],
    ["history", auditHistory],
  ];
  for (const [task, run] of tasks) {
    try {
      await run();
    } catch (error) {
      report.failures.push({ task, error: error.message });
      console.error(task, error.message);
    }
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  }
  if (
    report.failures.length ||
    report.results.length !== 14 ||
    report.results.some((result) => result.status !== "match")
  )
    process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

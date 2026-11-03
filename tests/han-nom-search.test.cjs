const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const root = "src/app/[locale]/research/han-nom/search-database/_data/";
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(root + file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInThisContext(`(function(require, exports) {${code}\n})`)(
    (name) => dependencies[name] ?? require(name),
    exports
  );
  return exports;
}
const helpers = load("text-statistics.ts");
const { countHanNom, countOccurrences, searchText } = helpers;
const page = `<page><div type="text"><lg><l>不不𠊛</l></lg></div>
<div type="transliteration"><lg><l>Gieo Thái Sơn bằng tơ hồng mao.</l>
<l>Cỏ xanh thơm dạ nhớ <seg>không</seg> quên, không quên.</l></lg></div>
<div type="notes"><note>không không 不不不</note></div></page>`;

test("counts original characters, supplementary Nôm and private-use glyphs once; excludes notes and transliteration", () => {
  assert.equal(countHanNom(page), 3);
  assert.equal(countHanNom("人 人，𠊛\u{F0001}\u{E0100} a 123"), 4);
  assert.equal(
    countHanNom('<div type="text"><l>&#x20000;人<note>不</note></l></div>'),
    2
  );
});
test("counts repeated occurrences, Unicode boundaries, decomposed Vietnamese and literal queries", () => {
  assert.equal(countOccurrences("không không, không!", "không", "qn"), 3);
  assert.equal(countOccurrences("khôngkhông không_không", "không", "qn"), 0);
  assert.equal(countOccurrences("không".normalize("NFD"), "không", "qn"), 1);
  assert.equal(countOccurrences("人人人", "人", "nom"), 3);
  assert.equal(countOccurrences("a+b aab a+b", "a+b", "qn"), 2);
  assert.equal(countOccurrences("text", "", "qn"), 0);
});
test("XML matches only body lines; matching notes cannot produce irrelevant snippets", () => {
  assert.equal(searchText(page, "không", "qn").occurrences, 2);
  assert.equal(
    searchText(page, "không", "qn").text,
    "Cỏ xanh thơm dạ nhớ không quên, không quên."
  );
  const notesOnly = page.replace(
    "không</seg> quên, không",
    "chưa</seg> quên, chưa"
  );
  assert.deepEqual(searchText(notesOnly, "không", "qn"), {
    occurrences: 0,
    text: "",
  });
  assert.equal(searchText(page, "不", "nom").occurrences, 2);
});
test("real Kiều XML counts only original text and retains supplementary characters", () => {
  const xml = fs.readFileSync("data/truyen-kieu/Kieu1866.xml", "utf8");
  const original = [...xml.matchAll(/<div type="text"[^>]*>([\s\S]*?)<\/div>/g)]
    .map((m) => m[1])
    .join("");
  assert.equal(countHanNom(xml), countHanNom(original));
  assert.ok(countHanNom(xml) > 10000);
});
test("search returns complete occurrence totals, omits note-only pages and separates major works", async () => {
  const queries = [];
  const pool = {
    query: async (sql) => {
      queries.push(sql);
      if (sql.includes("FROM chinh_phu_ngam"))
        return [
          [
            { textNo: 5, text: page },
            {
              textNo: 4,
              text: page.replaceAll(
                "không</seg> quên, không",
                "chưa</seg> quên, chưa"
              ),
            },
          ],
        ];
      if (sql.includes("FROM luc_van_tien"))
        return [[{ textNo: 1, text: page }]];
      if (sql.includes("FROM 1866data"))
        return [
          Array.from({ length: 250 }, (_, id) => ({
            id,
            page: 1,
            qn: "không không",
            unicode: "",
            special: "",
          })),
        ];
      return [[]];
    },
  };
  const corpus = load("corpus.ts", {
    "@/lib/db": pool,
    "./text-statistics": helpers,
    "./dvsktt-utils": load("dvsktt-utils.ts"),
  });
  const results = await corpus.searchCorpus("không");
  assert.equal(
    results.reduce((sum, r) => sum + r.occurrences, 0),
    504
  );
  assert.ok(results.every((r) => r.text.includes("<mark") && r.slug));
  assert.ok(results.every((r) => (r.text.match(/<mark /g) || []).length === r.occurrences));
  assert.equal(
    results.filter((r) => r.slug === "chinh-phu-ngam-khuc").length,
    1
  );
  assert.ok(results.some((r) => r.slug === "van-tien-co-tich-tan-truyen"));
  assert.ok(queries.every((sql) => !/LIMIT\s+\d+/i.test(sql)));
  const queriesBeforeStatistics = queries.length;
  const registry = await corpus.getCorpusRegistryWithStatistics();
  assert.equal(queries.length, queriesBeforeStatistics);
  assert.equal(registry.length, 14);
  assert.equal(registry.filter((work) => work.hanNomCharacters > 0).length, 13);
  assert.equal(registry.find((work) => work.slug === "ban-ky-toan-thu").hanNomCharacters, null);
  assert.equal(registry.find((work) => work.slug === "ngoai-ky").hanNomCharacters, 28575);
  assert.equal(registry.find((work) => work.slug === "truyen-kieu-1866").hanNomCharacters, 16715);
  assert.equal(
    registry.find((w) => w.slug === "chinh-phu-ngam-khuc").hanNomCharacters,
    6005
  );
  assert.equal(
    registry.find((w) => w.slug === "quyen-thu").hanNomCharacters,
    12052
  );
});


test("all counted matches remain visible across multiple and long lines", async () => {
  const source = `<div type="transliteration"><lg><l>không quên.</l><l>${"lời ".repeat(100)}không, không.</l></lg></div>`;
  const corpus = load("corpus.ts", {
    "@/lib/db": { query: async (sql) => [sql.includes("FROM chinh_phu_ngam") ? [{ textNo: 1, text: source }] : []] },
    "./text-statistics": helpers,
    "./dvsktt-utils": load("dvsktt-utils.ts"),
  });
  const results = await corpus.searchCorpus("không");
  assert.equal(results.length, 1);
  assert.equal(results[0].occurrences, 3);
  assert.equal((results[0].text.match(/<mark /g) || []).length, 3);
  assert.ok(results[0].text.includes("<br />"));
});

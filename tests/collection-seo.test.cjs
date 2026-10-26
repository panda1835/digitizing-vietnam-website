const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Load the actual TS helpers without adding a runtime dependency. React's cache
// is request-scoped in Next.js; these tests exercise the URL/availability rules.
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }
  ).outputText;
  vm.runInThisContext(`(function(require, exports) {${code}\n})`)(
    (name) => dependencies[name] ?? require(name),
    exports
  );
  return exports;
}
const seo = load("src/utils/seo.ts");
const helpers = load("src/lib/collection-seo.ts", {
  "@/utils/seo": seo,
  react: { cache: (fn) => fn },
});
const enParent = { slug: "english-collection", locale: "en" };
const viParent = { slug: "bo-suu-tap", locale: "vi" };
const parent = { ...enParent, localizations: [viParent] };
const enItem = { slug: "english-item", locale: "en", collections: [enParent] };
const viItem = { slug: "tai-lieu", locale: "vi", collections: [viParent] };

test("different translated collection slugs produce reciprocal paginated alternates", () => {
  const forward = helpers.getLocalizedCollectionLanguages(parent, "2");
  const reverse = helpers.getLocalizedCollectionLanguages(
    { ...viParent, localizations: [enParent] },
    "2"
  );
  assert.deepEqual(forward, reverse);
  assert.equal(
    forward.en,
    `${seo.SITE_URL}/en/our-collections/english-collection?page=2`
  );
  assert.equal(
    forward.vi,
    `${seo.SITE_URL}/vi/our-collections/bo-suu-tap?page=2`
  );
});
test("item alternates use both translated parent and translated item slugs", () => {
  const forward = helpers.getLocalizedItemLanguages(
    { ...enItem, localizations: [viItem] },
    parent
  );
  const reverse = helpers.getLocalizedItemLanguages(
    { ...viItem, localizations: [enItem] },
    { ...viParent, localizations: [enParent] }
  );
  assert.deepEqual(forward, reverse);
  assert.equal(
    forward.vi,
    `${seo.SITE_URL}/vi/our-collections/bo-suu-tap/tai-lieu`
  );
});
test("an untranslated collection or item does not advertise a translated URL", () => {
  assert.deepEqual(
    Object.keys(helpers.getLocalizedCollectionLanguages(enParent)),
    ["en"]
  );
  assert.deepEqual(
    Object.keys(helpers.getLocalizedItemLanguages(enItem, parent)),
    ["en"]
  );
});
test("a translated item without a published translated parent is omitted", () => {
  const languages = helpers.getLocalizedItemLanguages(
    { ...enItem, localizations: [viItem] },
    enParent
  );
  assert.deepEqual(Object.keys(languages), ["en"]);
});
test("a translated item belonging to a different collection is omitted", () => {
  const languages = helpers.getLocalizedItemLanguages(
    {
      ...enItem,
      localizations: [
        { ...viItem, collections: [{ locale: "vi", slug: "other" }] },
      ],
    },
    parent
  );
  assert.deepEqual(Object.keys(languages), ["en"]);
});
test("unsupported locales and absent records cannot create alternate URLs", () => {
  assert.deepEqual(seo.getCollectionLanguages([]), {});
  assert.deepEqual(seo.getCollectionLanguages([{ locale: "fr" }]), {});
});

test("CMS failures and missing records do not invent available translations", async () => {
  const originalFetch = global.fetch;
  try {
    for (const response of [
      { ok: false },
      { ok: true, json: async () => ({ data: [] }) },
      {
        ok: true,
        json: async () => {
          throw new SyntaxError("Invalid JSON");
        },
      },
    ]) {
      global.fetch = async () => response;
      assert.equal(await helpers.getLocalizedCollection("missing", "en"), null);
    }
    global.fetch = async () => {
      throw new Error("CMS unavailable");
    };
    assert.equal(await helpers.getLocalizedCollection("missing", "vi"), null);
  } finally {
    global.fetch = originalFetch;
  }
});

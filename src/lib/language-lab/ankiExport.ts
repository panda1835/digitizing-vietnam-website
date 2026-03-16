/**
 * ankiExport.js
 * Generates an Anki-compatible .apkg file from a vocabulary list.
 *
 * .apkg is a zip file containing:
 *   - collection.anki2  (SQLite database)
 *   - media             (JSON mapping of media files, empty for text-only)
 *
 * Because Next.js API routes run in Node.js, we can use the 'better-sqlite3'
 * and 'jszip' packages. Add them first:
 *   npm install better-sqlite3 jszip
 *
 * NOTE: For a simpler no-dependency approach, we export a TSV file that Anki
 * can import directly via File → Import. This works without any native modules
 * and is what this file does by default.
 *
 * To upgrade to true .apkg generation, swap the export function body with the
 * SQLite approach (see comments below).
 */

/**
 * Build an Anki-importable TSV string from a vocabulary list.
 * Anki TSV format: Front[tab]Back[tab]Tags
 *
 * @param {Array} vocabulary - array of vocab objects from generateStudyMaterial
 * @param {string} deckName - name for the Anki deck tag
 * @returns {string} TSV content
 */
export function buildAnkiTsv(vocabulary, deckName = "DigitizingVietnam") {
  const sanitize = (s) => String(s ?? "").replace(/\t/g, " ").replace(/\n/g, "<br>");

  const rows = vocabulary.map((v) => {
    const front = sanitize(v.word);
    const back = [
      `<b>${sanitize(v.definition)}</b>`,
      v.partOfSpeech ? `<i>${sanitize(v.partOfSpeech)}</i>` : "",
      v.exampleSentence
        ? `<hr>${sanitize(v.exampleSentence)}<br><small>${sanitize(v.exampleTranslation)}</small>`
        : "",
    ]
      .filter(Boolean)
      .join("<br>");

    const tag = sanitize(deckName).replace(/\s+/g, "_");
    return `${front}\t${back}\t${tag}`;
  });

  // Anki TSV header line (optional but helpful)
  const header = "#separator:tab\n#html:true\n#notetype:Basic\n#deck:" + deckName;
  return header + "\n" + rows.join("\n");
}

/**
 * Return TSV as a Blob URL for browser download.
 * Call this client-side.
 *
 * @param {Array} vocabulary
 * @param {string} deckName
 * @returns {{ url: string, filename: string }}
 */
export function createAnkiDownload(vocabulary, deckName = "DigitizingVietnam") {
  const tsv = buildAnkiTsv(vocabulary, deckName);
  const blob = new Blob([tsv], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const filename = `${deckName.replace(/\s+/g, "_")}_vocab.txt`;
  return { url, filename };
}

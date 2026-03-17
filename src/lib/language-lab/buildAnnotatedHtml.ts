/**
 * Builds annotated HTML from plain Vietnamese text and a vocabulary list.
 * Wraps each vocab word in <span class="vl-word" data-id="..."> for hover cards.
 * Processes longest words first to avoid sub-word matches inside compounds.
 */
export function buildAnnotatedHtml(
  text: string,
  vocabulary: Array<{ id: string; word: string }>
): string {
  const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0);

  const sortedVocab = [...vocabulary].sort((a, b) => b.word.length - a.word.length);

  const annotate = (para: string): string => {
    let segments: Array<{ text: string; done: boolean }> = [
      { text: para, done: false },
    ];

    for (const item of sortedVocab) {
      const next: typeof segments = [];
      for (const seg of segments) {
        if (seg.done || !seg.text.includes(item.word)) {
          next.push(seg);
          continue;
        }
        const parts = seg.text.split(item.word);
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].length > 0) next.push({ text: parts[i], done: false });
          if (i < parts.length - 1) {
            next.push({
              text: `<span class="vl-word" data-id="${item.id}">${item.word}</span>`,
              done: true,
            });
          }
        }
      }
      segments = next;
    }

    return segments.map((s) => s.text).join("");
  };

  return paragraphs.map((p) => `<p>${annotate(p.trim())}</p>`).join("\n");
}

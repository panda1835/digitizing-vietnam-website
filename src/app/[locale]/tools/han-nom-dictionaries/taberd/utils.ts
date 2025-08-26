import { TaberdDictionaryEntry } from "./types";

export const getImageUrl = (
  character: TaberdDictionaryEntry | null,
  height: number | null = null
) => {
  if (!character || !character.pages) {
    return ["https://iiif.digitizingvietnam.com/iiif/2/taberd"];
  }
  // Ensure 'pages' is a 4-digit string, e.g., "0003"
  const pages = character.pages.split(",");
  const pagesPadded = pages.map((page) =>
    (Number(page) + 68).toString().padStart(4, "0")
  );
  let results: string[] = [];
  if (height) {
    for (let i = 0; i < pagesPadded.length; i++) {
      results.push(
        `https://iiif.digitizingvietnam.com/iiif/2/taberd/taberd-${pagesPadded[i]}.jpg/full/${height},/0/default.jpg`
      );
    }
    return results;
  }
  for (let i = 0; i < pagesPadded.length; i++) {
    results.push(
      `https://iiif.digitizingvietnam.com/iiif/2/taberd/taberd-${pagesPadded[i]}.jpg/full/full/0/default.jpg`
    );
  }
  return results;
};

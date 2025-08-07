import { NDTDDictionaryEntry } from "./types";

export const getImageUrl = (
  character: NDTDDictionaryEntry | null,
  height: number | null = null
) => {
  if (!character || !character.trang) {
    return "https://iiif.digitizingvietnam.com/iiif/2/nhat-dung-thuong-dam";
  }
  // Ensure 'trang' is a 4-digit string, e.g., "0003"
  const trangPadded = character.trang.padStart(4, "0");
  if (height) {
    return `https://iiif.digitizingvietnam.com/iiif/2/nhat-dung-thuong-dam/nlvnpf-0693-${trangPadded}.jpg/full/${height},/0/default.jpg`;
  }
  return `https://iiif.digitizingvietnam.com/iiif/2/nhat-dung-thuong-dam/nlvnpf-0693-${trangPadded}.jpg/full/full/0/default.jpg`;
};

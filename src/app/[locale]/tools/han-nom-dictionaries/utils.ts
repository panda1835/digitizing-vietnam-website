export const search = (
  searchKeyword,
  entries: DictionaryEntry[] | GDNVHVDictionaryEntry[],
  dictionary
) => {
  if (searchKeyword === "") {
    return [];
  } else {
    if (dictionary == "tu-dien-chu-nom-dan-giai") {
      const result = entries.filter(
        (entry: DictionaryEntry) =>
          entry.hn[0] == searchKeyword ||
          entry.qn[0].toLowerCase() == searchKeyword.toLowerCase()
      );

      return result as DictionaryEntry[];
    } else if (dictionary == "giup-doc-nom-va-han-viet") {
      const result = entries.filter(
        (entry: GDNVHVDictionaryEntry) =>
          entry.orthography[0].orth.includes(searchKeyword) ||
          entry.hdwd[0]._.toLowerCase() == searchKeyword.toLowerCase()
      );

      return result as GDNVHVDictionaryEntry[];
    } else {
      return [];
    }
  }
};

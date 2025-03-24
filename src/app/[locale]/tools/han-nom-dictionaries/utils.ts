export const search = (searchKeyword, entries, dictionary) => {
  if (searchKeyword === "") {
    return [];
  } else {
    if (dictionary == "tu-dien-chu-nom-dan-giai") {
      const result = entries.filter(
        (entry) =>
          entry.hn[0] == searchKeyword ||
          entry.qn[0].toLowerCase() == searchKeyword.toLowerCase()
      );

      return result;
    }
  }
};

export const generateCollectionFilters = (collections) => {
  const filterGroups = {
    languages: new Array<string>(),
    subjects: new Array<string>(),
  };

  collections.forEach((item) => {
    item.languages.forEach((lang) => filterGroups.languages.push(lang.name));
    item.subjects.forEach((subject) =>
      filterGroups.subjects.push(subject.name)
    );
  });

  const filterCounts = Object.entries(filterGroups).reduce(
    (acc, [name, options]) => {
      acc[name] = options.reduce((countMap, option) => {
        countMap[option] = (countMap[option] || 0) + 1;
        return countMap;
      }, {});
      return acc;
    },
    {}
  );

  return Object.entries(filterGroups).map(([name, options]) => ({
    name,
    options: Array.from(new Set(options)).map((option, index) => ({
      name: option,
      count: filterCounts[name][option],
    })),
  }));
};

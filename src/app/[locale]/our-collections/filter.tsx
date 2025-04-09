export const generateCollectionFilters = (collections) => {
  const filterGroups = {
    languages: new Array<string>(),
    resourceTypes: new Array<string>(),
    subjects: new Array<string>(),
    formats: new Array<string>(),
    collectionLocations: new Array<string>(),
    accessCondition: new Array<string>(),
  };

  collections.forEach((item) => {
    item.languages.forEach((lang) => filterGroups.languages.push(lang));
    item.resourceTypes.forEach((type) => filterGroups.resourceTypes.push(type));
    item.subjects.forEach((subject) => filterGroups.subjects.push(subject));
    item.formats.forEach((format) => filterGroups.formats.push(format));
    filterGroups.collectionLocations.push(item.collectionLocation);
    filterGroups.accessCondition.push(item.accessCondition);
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

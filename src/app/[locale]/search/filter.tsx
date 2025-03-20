export const preprocessSearchResults = (hits) => {
  const processedHits = hits.map((hit) => {
    // If collection
    if (hit.collection_location) {
      return {
        id: hit.id, // preserve the id for the key
        title: hit.title,
        abstract: hit.abstract,
        thumbnail: hit.thumbnail[0],
        slug: hit.slug,
        formats: hit.formats.map((format) => format.name),
        languages: hit.languages.map((language) => language.name),
        subjects: hit.subjects.map((subject) => subject.name),
        collection_location: hit.collection_location.name,
        access_condition: hit.access_condition.name,
        resource_types: hit.resource_types.map(
          (resourceType) => resourceType.name
        ),
      };
    }
    // If collection item
    else if (hit.collections) {
      return {
        id: hit.id, // preserve the id for the key
        title: hit.title,
        abstract: hit.abstract,
        thumbnail: hit.thumbnail,
        slug: hit.slug,
        collections: hit.collections.map((collection) => collection.title),
        collection_slugs: hit.collections.map((collection) => collection.slug),
        author: hit.contributor.map((contributor) => contributor.author.name),
        formats: [hit.format ? hit.format.name : ""],
        languages: hit.languages.map((language) => language.name),
        subjects: hit.subjects.map((subject) => subject.name),
        access_condition: [
          hit.access_condition ? hit.access_condition.name : "",
        ],
        resource_types: hit.resource_types.map(
          (resourceType) => resourceType.name
        ),
      };
    }
    // If online resource
    else if (hit.online_resource_types) {
      return {
        id: hit.id, // preserve the id for the key
        name: hit.name,
        description: hit.description,
        online_resource_types: hit.online_resource_types.map(
          (type) => type.name
        ),
      };
    } else {
      return hit;
    }
  });

  return processedHits;
};

export const generateCollectionFilters = (hits, locale) => {
  const filterGroups = {
    part_of: new Array<string>(),
    collections: new Array<string>(),
    collection_slugs: new Array<string>(),
    authors: new Array<string>(),
    languages: new Array<string>(),
    subjects: new Array<string>(),
    formats: new Array<string>(),
    resource_types: new Array<string>(),
    collection_locations: new Array<string>(),
    access_condition: new Array<string>(),
    online_resource_types: new Array<string>(),
  };

  hits.forEach((item) => {
    // If the item is a Collection, specified by the presence of a collection_location
    if (item.collection_location) {
      // console.log("Item", item);
      filterGroups.part_of.push(locale == "en" ? "Collections" : "Bộ sưu tập");
      item.languages.forEach((lang) => filterGroups.languages.push(lang));
      item.resource_types.forEach((type) =>
        filterGroups.resource_types.push(type)
      );
      item.subjects.forEach((subject) => filterGroups.subjects.push(subject));
      item.formats.forEach((format) => filterGroups.formats.push(format));
      filterGroups.collection_locations.push(item.collection_location);
      filterGroups.access_condition.push(item.access_condition);
    }
    // If the item is a Collection item, specified by the presence of a collections property
    else if (item.collections) {
      item.collections.forEach((collection) =>
        filterGroups.collections.push(collection)
      );
      item.collection_slugs.forEach((collection_slug) =>
        filterGroups.collection_slugs.push(collection_slug)
      );
      item.author.forEach((author) => filterGroups.authors.push(author));
      item.languages.forEach((lang) => filterGroups.languages.push(lang));
      item.resource_types.forEach((type) =>
        filterGroups.resource_types.push(type)
      );
      item.subjects.forEach((subject) => filterGroups.subjects.push(subject));
      item.formats.forEach((format) => filterGroups.formats.push(format));
      filterGroups.collection_locations.push(item.collection_location);
      filterGroups.access_condition.push(item.access_condition);
    }
    // If online resource
    else if (item.online_resource_types) {
      filterGroups.part_of.push(
        locale == "en" ? "Online resources" : "Tài nguyên trực tuyến"
      );
      item.online_resource_types.forEach((type) =>
        filterGroups.online_resource_types.push(type)
      );
    }
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

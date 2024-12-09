export function formatDate(date: string, locale: string) {
  // Format date as "Month Day, Year"
  const formattedDate = new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return formattedDate;
}

interface StrapiDate {
  full_date: string;
  year_month_only: string;
  year_only: string;
  approximate_date: string;
}

export function formatStrapiDate(date: StrapiDate, locale: string) {
  // Format date from Strapi date object
  if (date.full_date) {
    return new Date(date.full_date).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  if (date.year_month_only) {
    return new Date(date.year_month_only.slice(0, 7)).toLocaleDateString(
      locale,
      {
        year: "numeric",
        month: "long",
      }
    );
  }
  if (date.year_only) {
    return new Date(date.year_only.slice(0, 4)).toLocaleDateString(locale, {
      year: "numeric",
    });
  }
  if (date.approximate_date) {
    return new Date(date.year_only.slice(0, 4)).toLocaleDateString(locale, {
      year: "numeric",
    });
  }
}

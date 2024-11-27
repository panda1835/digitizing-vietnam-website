export function formatDate(date: string, locale: string) {
  const formattedDate = new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return formattedDate;
}

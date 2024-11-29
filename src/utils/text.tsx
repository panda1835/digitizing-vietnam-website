export const trimDescription = (content, max_word) => {
  const words = content.split(" ");
  if (words.length > max_word) {
    return `${words.slice(0, max_word).join(" ")} ...`;
  }
  return content;
};

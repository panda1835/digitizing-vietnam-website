export function getImageByKey(
  formats: Formats,
  requestedSize: string
): ImageFormat | null {
  // Define the order of size keys from largest to smallest
  const sizeOrder: string[] = ["large", "medium", "small", "thumbnail"];

  // Check if the requested size is valid
  if (!sizeOrder.includes(requestedSize)) {
    throw new Error(`Invalid size requested: ${requestedSize}`);
  }

  // Find the index of the requested size in the sizeOrder array
  const requestedIndex = sizeOrder.indexOf(requestedSize);

  // Iterate over the sizeOrder array starting from the largest possible image under the requested size
  for (let i = requestedIndex; i < sizeOrder.length; i++) {
    const sizeKey = sizeOrder[i];
    if (formats[sizeKey]) {
      return formats[sizeKey]; // Return the image that matches the largest size under the requested size
    }
  }

  // If no image found, return null
  return formats.thumbnail;
}

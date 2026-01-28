"use server";

export async function searchDictionary(character: string) {
  try {
    // This runs on the server - users never see this URL or any headers
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
      }/han-nom-dictionary/all/nom?q=${character}`,
      {
        headers: {
          "User-Agent": "DigitizingVietnam-Internal",
        },
        next: { revalidate: 3600 }, // Cache dictionary lookups for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch dictionary entry");
    }

    return await response.json();
  } catch (error) {
    console.error("Dictionary lookup error:", error);
    throw new Error("Dictionary lookup failed");
  }
}

"use server";

export async function searchDictionary(character: string) {
  try {
    // This runs on the server - users never see this URL or any headers
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/api/han-nom-dictionary/all/nom?q=${character}`,
      {
        headers: {
          "User-Agent": "DigitizingVietnam-Internal",
        },
        cache: "no-store", // Ensure fresh data for dictionary lookups
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

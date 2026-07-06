export async function fetcher(url: string, options = {}) {
  try {
    if (!url || url.startsWith("undefined")) {
      throw new Error(`API URL is undefined or not configured: "${url}"`);
    }

    let response;
    if (!options) {
      response = await fetch(url);
    } else {
      response = await fetch(url, options);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[Fetcher Error] Failed to fetch from "${url}":`, error);
    // Return a safe fallback object so the pages do not crash when the backend is offline
    return { data: [], meta: {} };
  }
}


/**
 * IIIF manifest utilities for extracting canvas lists and image URLs.
 * Supports both IIIF Presentation API 2 and 3.
 */

export interface CanvasInfo {
  id: string;
  label: string;
  imageUrl: string | null;
}

/** Extract ordered canvas list from a IIIF manifest (API 2 or 3). */
export function getCanvasesFromManifest(manifest: any): CanvasInfo[] {
  const rawCanvases: any[] =
    manifest.items ?? manifest.sequences?.[0]?.canvases ?? [];

  return rawCanvases.map((canvas) => {
    const id: string = canvas.id ?? canvas["@id"] ?? "";
    const label: string =
      typeof canvas.label === "string"
        ? canvas.label
        : canvas.label?.["@value"] ?? canvas.label?.en?.[0] ?? "";
    const imageUrl = extractImageUrl(canvas);
    return { id, label, imageUrl };
  });
}

/** Check if an image service supports arbitrary size requests (level1+). */
function isLevel1OrHigher(service: any): boolean {
  const profile = service?.profile ?? "";
  const profileStr = typeof profile === "string" ? profile : Array.isArray(profile) ? profile[0] : "";
  return /level[12]/.test(profileStr);
}

/**
 * Build the best image URL from an image service.
 * - Level 1+: construct arbitrary size (1500px wide).
 * - Level 0: use /full/full/0/default.jpg (original resolution, always works).
 */
function buildServiceImageUrl(service: any): string | null {
  const serviceId = (service.id ?? service["@id"] ?? "").replace(/\/$/, "");
  if (!serviceId) return null;

  if (isLevel1OrHigher(service)) {
    return `${serviceId}/full/1500,/0/default.jpg`;
  }

  // Level 0: use 1280px (most common pre-generated size for Columbia DLC)
  return `${serviceId}/full/1280,/0/default.jpg`;
}

/**
 * For OCR processing: fetch info.json to discover the actual largest
 * pre-generated size for Level 0 IIIF servers.
 * This handles cases where the default 1280px isn't available.
 */
export async function resolveOcrImageUrl(url: string): Promise<string> {
  // Extract the service ID and current size from the URL
  const match = url.match(/^(.+)\/full\/([^/]+)\/0\/default\.jpg$/);
  if (!match) return url;

  const serviceId = match[1];
  try {
    const res = await fetch(`${serviceId}/info.json`);
    if (!res.ok) return url;
    const info = await res.json();
    const sizes: Array<{ width: number; height: number }> = info.sizes ?? [];
    if (sizes.length > 0) {
      const largest = sizes.reduce((a, b) => (a.width > b.width ? a : b));
      return `${serviceId}/full/${largest.width},/0/default.jpg`;
    }
  } catch { /* use original URL */ }
  return url;
}

/**
 * Extract an image URL from a IIIF canvas at a reasonable OCR resolution.
 *
 * IIIF 3: canvas.items[0].items[0].body  (Annotation body)
 * IIIF 2: canvas.images[0].resource      (Image resource)
 */
export function extractImageUrl(canvas: any): string | null {
  // Try IIIF 3 first
  const body = canvas.items?.[0]?.items?.[0]?.body;
  if (body) {
    const service = body.service?.[0];
    if (service) {
      const url = buildServiceImageUrl(service);
      if (url) return url;
    }
    if (body.id) return body.id;
  }

  // Try IIIF 2
  const resource = canvas.images?.[0]?.resource;
  if (resource) {
    const service = Array.isArray(resource.service) ? resource.service[0] : resource.service;
    if (service) {
      const url = buildServiceImageUrl(service);
      if (url) return url;
    }
    if (resource["@id"]) return resource["@id"];
  }

  return null;
}

/** Get thumbnail URL from a canvas (smaller resolution for previews). */
export function extractThumbnailUrl(canvas: any): string | null {
  // Try canvas thumbnail first
  if (canvas.thumbnail?.[0]?.id) return canvas.thumbnail[0].id;

  // Use image service at small size
  const body = canvas.items?.[0]?.items?.[0]?.body;
  const service = body?.service?.[0];
  if (service) {
    const serviceId = (service.id ?? service["@id"] ?? "").replace(/\/$/, "");
    if (serviceId) return `${serviceId}/full/200,/0/default.jpg`;
  }

  const resource = canvas.images?.[0]?.resource;
  const svc2 = resource?.service;
  if (svc2) {
    const serviceId = (
      (Array.isArray(svc2) ? svc2[0] : svc2)?.["@id"] ?? ""
    ).replace(/\/$/, "");
    if (serviceId) return `${serviceId}/full/200,/0/default.jpg`;
  }

  return null;
}

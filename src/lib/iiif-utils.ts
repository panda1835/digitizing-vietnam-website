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
 * - Level 0: fetch info.json for pre-defined sizes, pick the largest.
 *   Since this is sync, we construct the URL using the largest common
 *   pre-defined size pattern: /full/max/0/default.jpg won't work for level0,
 *   so we use /full/full/0/default.jpg which returns the original resolution.
 *   To avoid huge images, we try /full/1280,/0/default.jpg first (a common
 *   pre-generated size for Columbia DLC) and fall back to full.
 */
function buildServiceImageUrl(service: any): string | null {
  const serviceId = (service.id ?? service["@id"] ?? "").replace(/\/$/, "");
  if (!serviceId) return null;

  if (isLevel1OrHigher(service)) {
    return `${serviceId}/full/1500,/0/default.jpg`;
  }

  // Level 0: use largest pre-generated size (1280px is the max for Columbia DLC)
  return `${serviceId}/full/1280,/0/default.jpg`;
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

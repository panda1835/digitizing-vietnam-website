// src/app/[locale]/our-collections/[collectionid]/staticCollections.ts
//
// Registry of collections whose ITEMS come from local data rather than Strapi.
//
// Most collections are entirely Strapi-driven. A few mirror an external
// repository, where the item records live in a committed snapshot and the scans
// are loaded from the holding institution's IIIF. `han-nom-collection` was the
// first; this registry exists so the second one doesn't turn the render branch
// into a ternary chain that grows with every collection.
//
// Note what stays in Strapi even for these: the page header, breadcrumb and
// featured articles. A static collection still wants a Strapi `collections`
// record so it appears on /our-collections and under a category tab — the index
// page builds its tabs purely from `collection_categories`, with no code path
// that injects a locally-defined collection.
//
// `fallbackHeader` covers the window before that record exists, and doubles as
// resilience if Strapi is ever unreachable.

import { EDICTS_COLLECTION_SLUG } from "@/lib/pennstate-edicts";

export interface StaticCollectionHeader {
  title: string;
  abstract: string;
}

export interface StaticCollectionConfig {
  slug: string;
  /** Used only when Strapi has no record for this slug. */
  fallbackHeader: Record<"en" | "vi", StaticCollectionHeader>;
}

export const STATIC_COLLECTIONS: Record<string, StaticCollectionConfig> = {
  "han-nom-collection": {
    slug: "han-nom-collection",
    fallbackHeader: {
      en: {
        title: "Hán-Nôm Collection",
        abstract:
          "The world's first digital library dedicated to Hán-Nôm studies.",
      },
      vi: {
        title: "Bộ sưu tập Hán-Nôm",
        abstract:
          "Thư viện số đầu tiên trên thế giới dành riêng cho nghiên cứu Hán-Nôm.",
      },
    },
  },
  [EDICTS_COLLECTION_SLUG]: {
    slug: EDICTS_COLLECTION_SLUG,
    fallbackHeader: {
      // Scope drawn from Penn State's finding aid (Guide to the Collection of
      // Vietnamese edicts and official documents, compiled by Mae Casey, 2025).
      // Paraphrased rather than copied: their note is itself adapted from the
      // dealer's description, so DVN summarises it and cites the source instead
      // of reproducing it.
      en: {
        title: "Vietnamese Edicts and Official Documents",
        abstract:
          "Thirty-two imperial edicts and high-level bureaucratic documents from the Lê (1428–1789) and Nguyễn (1802–1945) dynasties, dating from 1638 to 1944 and handwritten in Chinese characters (chữ Nho). The formal edicts are generally on royal yellow paper, centred on a large dragon frequently painted in silver ink and surrounded by clouds, flaming pearls and knots of longevity, their colophons stamped with the imperial seal of ordinance, Sắc mệnh chi bảo (敕命之寶). Several record emperors naming and promoting the deities of the land — an expression of sovereignty exercised not over human subjects but over the gods — and a few grant promotions to military officials. The plainer administrative papers, on plain white paper and stamped with the seal of the creating office, shed light on the earthly politics of the Nguyễn court through the period of French colonial rule; one carries a French seal, indicating it was valid because the colonial office rather than the emperor had approved it. The collection is of particular interest for its continued use of Chinese characters at a time when the practice had largely given way to quốc ngữ. Digitizing Việt Nam (DVN) gratefully acknowledges Penn State University for granting permission to mirror and present this collection on the Digitizing Việt Nam platform, helping make these valuable historical materials more accessible to researchers and the public.",
      },
      vi: {
        title: "Sắc phong và Văn bản Hành chính Việt Nam",
        abstract:
          "Ba mươi hai sắc phong và văn bản hành chính cấp cao thời Lê (1428–1789) và Nguyễn (1802–1945), niên đại từ 1638 đến 1944, viết tay bằng chữ Nho. Các sắc phong trang trọng thường dùng giấy vàng hoàng gia, chính giữa vẽ rồng lớn, phần nhiều vẽ bằng mực bạc, chung quanh là mây, hỏa châu và nút thọ; phần lạc khoản đóng ấn Sắc mệnh chi bảo (敕命之寶). Một số sắc phong ghi việc hoàng đế ban tên hiệu và thăng phong cho các vị thần bản địa — biểu hiện quyền uy không phải đối với thần dân mà đối với thần linh — và một vài đạo thăng thưởng cho quan võ. Những văn bản hành chính giản dị hơn, trên giấy trắng và đóng dấu của nha môn ban hành, phản ánh hoạt động chính sự của triều Nguyễn trong thời kỳ Pháp thuộc; một văn bản mang dấu của Pháp, cho thấy nó có hiệu lực nhờ được nha thuộc địa chuẩn y thay vì hoàng đế. Bộ sưu tập đặc biệt có giá trị ở việc tiếp tục dùng chữ Hán vào giai đoạn mà chữ quốc ngữ đã dần thay thế. Digitizing Việt Nam (DVN) trân trọng cảm ơn Đại học Penn State đã cho phép sao lưu và giới thiệu bộ sưu tập này trên nền tảng Digitizing Việt Nam, góp phần đưa những tư liệu lịch sử quý giá này đến gần hơn với giới nghiên cứu và công chúng.",
      },
    },
  },
};

export const isStaticCollection = (slug: string) => slug in STATIC_COLLECTIONS;

export const getStaticCollection = (slug: string): StaticCollectionConfig | undefined =>
  STATIC_COLLECTIONS[slug];

/**
 * Header for a static collection: Strapi's values win when present, so editors
 * keep control of the copy, and the local text fills any gap.
 */
export const resolveStaticHeader = (
  slug: string,
  locale: string,
  fromStrapi: { title?: string; abstract?: string }
): StaticCollectionHeader | null => {
  const config = getStaticCollection(slug);
  if (!config) return null;

  const fallback =
    config.fallbackHeader[locale === "vi" ? "vi" : "en"] ?? config.fallbackHeader.en;

  return {
    title: fromStrapi.title?.trim() || fallback.title,
    abstract: fromStrapi.abstract?.trim() || fallback.abstract,
  };
};

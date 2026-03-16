/**
 * vietnameseSources.js
 * Curated list of Vietnamese news RSS feeds for the automated daily pipeline.
 * Each source has a difficulty rating and topic tags to help filter content.
 */

export const VIETNAMESE_SOURCES = [
  {
    id: "vnexpress-thoi-su",
    name: "VnExpress – Thời Sự",
    url: "https://vnexpress.net/rss/tin-tuc-su-kien.rss",
    language: "Vietnamese",
    difficulty: "intermediate",
    tags: ["current-events", "politics", "society"],
  },
  {
    id: "vnexpress-giao-duc",
    name: "VnExpress – Giáo Dục",
    url: "https://vnexpress.net/rss/giao-duc.rss",
    language: "Vietnamese",
    difficulty: "intermediate",
    tags: ["education", "culture"],
  },
  {
    id: "vnexpress-giai-tri",
    name: "VnExpress – Giải Trí",
    url: "https://vnexpress.net/rss/giai-tri.rss",
    language: "Vietnamese",
    difficulty: "beginner",
    tags: ["entertainment", "youth", "culture"],
  },
  {
    id: "tuoitre-thoi-su",
    name: "Tuổi Trẻ – Thời Sự",
    url: "https://tuoitre.vn/rss/thoi-su.rss",
    language: "Vietnamese",
    difficulty: "intermediate",
    tags: ["current-events", "society"],
  },
  {
    id: "tuoitre-van-hoa",
    name: "Tuổi Trẻ – Văn Hoá",
    url: "https://tuoitre.vn/rss/van-hoa.rss",
    language: "Vietnamese",
    difficulty: "intermediate",
    tags: ["culture", "arts"],
  },
  {
    id: "thanhnien-thoi-su",
    name: "Thanh Niên – Thời Sự",
    url: "https://thanhnien.vn/rss/home.rss",
    language: "Vietnamese",
    difficulty: "advanced",
    tags: ["current-events", "politics"],
  },
  {
    id: "nhan-dan",
    name: "Nhân Dân",
    url: "https://nhandan.vn/rss/tin-tuc.rss",
    language: "Vietnamese",
    difficulty: "advanced",
    tags: ["politics", "formal-register"],
  },
];

export const TOPIC_LABELS = {
  "current-events": "Thời Sự",
  politics: "Chính Trị",
  society: "Xã Hội",
  education: "Giáo Dục",
  culture: "Văn Hóa",
  arts: "Nghệ Thuật",
  entertainment: "Giải Trí",
  youth: "Giới Trẻ",
  "formal-register": "Văn Phong Chính Thức",
};

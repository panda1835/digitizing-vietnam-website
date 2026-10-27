// src/lib/pennstate-edicts-vi.ts
//
// Vietnamese titles and descriptions for the Penn State edicts.
//
// HAND-MAINTAINED — unlike PennStateEdictsMetadata.ts, which the fetch script
// regenerates. Penn State catalogues this collection in English only, so the
// Vietnamese item pages would otherwise put English headings over Vietnamese
// documents. These are translations of PSU's own title and scope note, keyed by
// dmrecord; the English snapshot remains the record of what PSU said.
//
// Keys must match a dmrecord in PENN_STATE_EDICTS. A record with no entry here
// falls back to the English text, so this file can be filled in incrementally.
//
// Two judgement calls worth knowing about:
//   - record 31: PSU's "imperial academy" is ambiguous between Quốc Tử Giám and
//     Hàn lâm viện, so it is rendered neutrally as "học viện của triều đình"
//     rather than silently picking one.
//   - record 27: PSU's "first reign of Lê Thần Tông" means his first spell on
//     the throne (1619–1643); the Vietnamese keeps that explicit.

export interface EdictVietnameseText {
  title: string;
  description: string;
}

/**
 * Vietnamese labels for the catalogue values that appear as card headings,
 * facet options and metadata rows.
 *
 * Display only. The English value stays the key everywhere it matters — filter
 * state, query strings, the snapshot — so a filtered URL means the same thing
 * in either language and PSU's own vocabulary remains the record.
 *
 * Eras are already Vietnamese ("Tự Đức", "Cảnh Hưng") and subject headings are
 * Library of Congress authority strings, so neither is translated here.
 */
export const EDICT_VI_LABELS = {
  documentType: {
    Edict: "Sắc phong",
    "Promotion document": "Văn bản thăng thưởng",
    "Appointment document": "Văn bản bổ nhiệm",
    "Military document": "Văn bản quân sự",
    "Transfer document": "Văn bản điều chuyển",
    "Financial document": "Văn bản tài chính",
    Document: "Văn bản",
  },
  language: {
    "Vietnamese, Script Han (Traditional variant)":
      "Tiếng Việt, chữ Hán (dạng phồn thể)",
  },
  place: {
    Vietnam: "Việt Nam",
  },
  container: {
    "Box 01": "Hộp 01",
    "Box 02": "Hộp 02",
  },
} as const satisfies Record<string, Record<string, string>>;

export type EdictLabelKind = keyof typeof EDICT_VI_LABELS;

export const EDICT_VI_TEXT: Record<number, EdictVietnameseText> = {
  27: {
    title: "Sắc phong niên hiệu Dương Hòa (陽和) triều Lê",
    description:
      "Sắc phong ban bốn mỹ tự cho một vị thần; ban hành ngày 25 tháng 5 năm thứ 4 lần trị vì thứ nhất của vua Lê Thần Tông (黎神宗).",
  },
  43: {
    title: "Sắc phong niên hiệu Cảnh Hưng (景興) triều Lê",
    description:
      "Sắc phong ban ba mỹ tự cho một vị thần; ban hành ngày 21 tháng 5 năm thứ 4 đời vua Lê Hiển Tông (黎顯宗).",
  },
  9: {
    title: "Sắc phong niên hiệu Cảnh Hưng (景興) triều Lê",
    description:
      "Sắc phong ban ba mỹ tự vào tên hiệu của một vị thần; ban hành ngày 26 tháng 7 năm thứ 44 đời vua Lê Hiển Tông (黎顯宗).",
  },
  7: {
    title: "Sắc phong niên hiệu Chiêu Thống (昭統) triều Lê",
    description:
      "Sắc phong ban hai mỹ tự vào tước hiệu của một nữ thần; ban hành ngày 22 tháng 3 năm thứ nhất đời vua Lê Mẫn Đế (黎愍帝).",
  },
  21: {
    title: "Sắc phong niên hiệu Chiêu Thống (昭統) triều Lê",
    description:
      "Sắc phong ban ba mỹ tự vào tên hiệu của một vị thần; ban hành ngày 22 tháng 3 năm thứ nhất đời vua Lê Mẫn Đế (黎愍帝).",
  },
  57: {
    title: "Sắc phong niên hiệu Gia Long (嘉隆) triều Nguyễn",
    description:
      "Sắc phong ban ba mỹ tự vào tên hiệu của một vị thần được thờ ở huyện Thanh Oai (Hà Nội). Ban hành ngày 15 tháng 6 năm thứ 9 đời vua Gia Long (嘉隆帝), hoàng đế đầu tiên của triều Nguyễn.",
  },
  41: {
    title: "Sắc phong niên hiệu Minh Mạng (明命) triều Nguyễn",
    description: "Sắc phong ban ba mỹ tự vào tước hiệu của một vị thần.",
  },
  55: {
    title: "Sắc phong niên hiệu Minh Mạng (明命) triều Nguyễn",
    description: "Sắc phong thăng một vị long thần lên hàng trung đẳng thần.",
  },
  23: {
    title: "Văn bản thăng thưởng niên hiệu Minh Mạng (明命) triều Nguyễn",
    description:
      "Văn bản do Bộ Binh ban hành, thăng thưởng cho các quan võ; ban hành ngày 29 tháng 9 năm thứ 19 đời vua Minh Mạng (明命帝).",
  },
  47: {
    title: "Văn bản thăng thưởng niên hiệu Minh Mạng (明命) triều Nguyễn",
    description:
      "Văn bản thăng thưởng cho một quan võ; ban hành ngày 15 tháng 4 năm thứ 21 đời vua Minh Mạng (明命帝).",
  },
  39: {
    title: "Văn bản bổ nhiệm niên hiệu Thiệu Trị (紹治) triều Nguyễn",
    description:
      "Văn bản bổ nhiệm các chức quan trong đội cấm vệ; ban hành ngày 25 tháng 9 năm thứ 2 đời vua Thiệu Trị (紹治帝).",
  },
  35: {
    title: "Văn bản bổ nhiệm niên hiệu Tự Đức (嗣德) triều Nguyễn",
    description:
      "Văn bản do Bộ Binh ban hành để bổ nhiệm một quan võ. Ban hành ngày 16 tháng 6 năm thứ 2 đời vua Tự Đức (嗣德帝).",
  },
  53: {
    title: "Văn bản thăng thưởng niên hiệu Tự Đức (嗣德) triều Nguyễn",
    description:
      "Văn bản thăng thưởng cho một quan võ trong đội cấm vệ. Ban hành ngày 18 tháng 1 năm thứ 2 đời vua Tự Đức (嗣德帝).",
  },
  19: {
    title: "Sắc phong niên hiệu Tự Đức (嗣德) triều Nguyễn",
    description:
      "Sắc phong ban tước hiệu cho một vị thần ở tỉnh Sơn Tây. Ban hành ngày 11 tháng 1 năm thứ 6 đời vua Tự Đức (嗣德帝).",
  },
  37: {
    title: "Văn bản quân sự niên hiệu Tự Đức (嗣德) triều Nguyễn",
    description:
      "Văn bản bàn về việc quân, do Bộ Binh ban hành. Ban hành ngày 10 tháng 4 năm thứ 21 đời vua Tự Đức (嗣德帝).",
  },
  25: {
    title: "Văn bản quân sự niên hiệu Tự Đức (嗣德) triều Nguyễn",
    description:
      "Văn bản về việc quân. Ban hành ngày 19 tháng 3 năm thứ 24 đời vua Tự Đức (嗣德帝).",
  },
  49: {
    title: "Văn bản quân sự niên hiệu Tự Đức (嗣德) triều Nguyễn",
    description:
      "Văn bản về việc quân. Ban hành ngày 28 tháng 9 năm thứ 24 đời vua Tự Đức (嗣德帝).",
  },
  13: {
    title: "Văn bản quân sự niên hiệu Tự Đức (嗣德) triều Nguyễn",
    description:
      "Văn bản về việc quân. Ban hành ngày 19 tháng 9 năm thứ 29 đời vua Tự Đức (嗣德帝).",
  },
  17: {
    title: "Văn bản điều chuyển niên hiệu Tự Đức (嗣德) triều Nguyễn",
    description:
      "Văn bản sắp xếp việc điều chuyển nhân sự. Ban hành ngày 6 tháng 3 năm thứ 32 đời vua Tự Đức (嗣德帝).",
  },
  51: {
    title: "Sắc phong niên hiệu Đồng Khánh (同慶) triều Nguyễn",
    description:
      "Sắc phong ban tước hiệu cho một vị thần ở huyện Phú Xuyên (Hà Nội). Ban hành ngày 1 tháng 7 năm thứ 2 đời vua Đồng Khánh (同慶帝).",
  },
  59: {
    title: "Sắc phong niên hiệu Đồng Khánh (同慶) triều Nguyễn",
    description:
      "Sắc phong thăng phong cho một vị thần ở tỉnh Sơn Tây. Ban hành ngày 1 tháng 7 năm thứ 2 đời vua Đồng Khánh (同慶帝).",
  },
  11: {
    title: "Sắc phong niên hiệu Thành Thái (成泰) triều Nguyễn",
    description:
      "Sắc phong thăng thưởng cho một quan võ; ban hành ngày 16 tháng 2 năm thứ nhất đời vua Thành Thái (成泰帝).",
  },
  29: {
    title: "Sắc phong niên hiệu Thành Thái (成泰) triều Nguyễn",
    description:
      "Sắc phong thăng phong cho một vị thần ở Thọ Xương (Hà Nội). Ban hành ngày 18 tháng 11 năm thứ nhất đời vua Thành Thái (成泰帝).",
  },
  64: {
    title: "Sắc phong niên hiệu Thành Thái (成泰) triều Nguyễn",
    description:
      "Sắc phong thăng một vị thần ở tỉnh Nam Định từ trung đẳng thần lên thượng đẳng thần. Ban hành ngày 20 tháng 2 năm thứ 2 đời vua Thành Thái (成泰帝).",
  },
  45: {
    title: "Văn bản tài chính niên hiệu Thành Thái (成泰) triều Nguyễn",
    description:
      "Văn bản về việc cấp phát bổng lộc, do Bộ Hộ ban hành. Ban hành ngày 25 tháng 11 năm thứ 5 đời vua Thành Thái (成泰帝).",
  },
  3: {
    title: "Sắc phong niên hiệu Thành Thái (成泰) triều Nguyễn",
    description:
      "Sắc phong thăng một quan võ lên hàm tướng quân. Ban hành ngày 29 tháng 11 năm thứ 10 đời vua Thành Thái (成泰帝).",
  },
  1: {
    title: "Sắc phong niên hiệu Khải Định (啟定) triều Nguyễn",
    description:
      "Sắc phong thăng một vị thần ở tỉnh Hoà Bình từ trung đẳng thần lên thượng đẳng thần; ban hành ngày 25 tháng 7 năm thứ 9 đời vua Khải Định (啓定帝).",
  },
  5: {
    title: "Văn bản thăng thưởng niên hiệu Bảo Đại (保大) triều Nguyễn",
    description:
      "Văn bản thăng thưởng cho một quan văn; ban hành ngày 30 tháng 7 năm thứ 3 đời vua Bảo Đại (保大帝).",
  },
  62: {
    title: "Văn bản thăng thưởng niên hiệu Bảo Đại (保大) triều Nguyễn",
    description:
      "Văn bản của Bộ Lại về việc thăng thưởng nhân sự. Văn bản mang dấu xanh và chữ ký của Khâm sứ Pháp (Résident Supérieur), cho thấy nó chỉ có giá trị nhờ được viên chức này chuẩn y chứ không phải hoàng đế. Đây là minh chứng cho sự thay đổi trong quyền lực mang tính biểu tượng của hoàng đế khi đất nước nằm dưới ách cai trị thuộc địa. Ban hành ngày 3 tháng 3 năm thứ 5 đời vua Bảo Đại (保大帝).",
  },
  15: {
    title: "Sắc phong niên hiệu Bảo Đại (保大) triều Nguyễn",
    description:
      "Văn bản thăng phong cho một vị thần ở tỉnh Sa Đéc (Nam Bộ); ban hành ngày 19 tháng 4 năm thứ 10 đời vua Bảo Đại (保大帝).",
  },
  31: {
    title: "Văn bản niên hiệu Bảo Đại (保大) triều Nguyễn",
    description:
      "Văn bản liên quan đến học viện của triều đình; ban hành ngày 11 tháng 9 năm thứ 17 đời vua Bảo Đại (保大帝).",
  },
  33: {
    title: "Sắc phong niên hiệu Bảo Đại (保大) triều Nguyễn",
    description:
      "Sắc phong truy tặng tước hiệu cho một quan võ. Ban hành ngày 23 tháng 2 năm thứ 19 đời vua Bảo Đại (保大帝), một năm trước khi triều Nguyễn cáo chung.",
  },
};

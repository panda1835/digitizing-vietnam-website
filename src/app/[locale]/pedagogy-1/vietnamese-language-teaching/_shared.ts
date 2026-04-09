export type VltSectionKey =
  | "lesson-plans"
  | "syllabi"
  | "instructional-materials"
  | "direct-professional-development";

export interface VltNavItem {
  key: "directory" | VltSectionKey;
  label: string;
  href: string;
}

export interface VltResourceItem {
  id: string;
  title: string;
  fileName?: string | null;
  summary: string;
  institutionAuthor: string;
  semester?: string | null;
  level?: "Novice" | "Intermediate" | "Advanced" | "Superior" | null;
  skills?: Array<"Speaking" | "Listening" | "Reading" | "Writing">;
  tags?: Array<string | null>;
  pdfUrl?: string | null;
  url?: string | null;
}

export interface VltFilterConfig {
  key: "institutionAuthor" | "semester" | "level" | "skills" | "tags";
  label: string;
}

export const VLT_BASE_PATH = "/pedagogy-1/vietnamese-language-teaching";

export const vltNavItems: VltNavItem[] = [
  {
    key: "lesson-plans",
    label: "Lesson Plans",
    href: `${VLT_BASE_PATH}/lesson-plans`,
  },
  { key: "syllabi", label: "Syllabi", href: `${VLT_BASE_PATH}/syllabi` },
  {
    key: "instructional-materials",
    label: "Instructional Materials",
    href: `${VLT_BASE_PATH}/instructional-materials`,
  },
  {
    key: "direct-professional-development",
    label: "Professional Development",
    href: `${VLT_BASE_PATH}/direct-professional-development`,
  },
  { key: "directory", label: "Directory", href: `${VLT_BASE_PATH}/directory` },
];

export const lessonPlanItems: VltResourceItem[] = [
  {
    "id": "1cTUnKp-IAFXaDRcmzV9xdKhyO_A8ab4V",
    "title": "Grocery Shopping 2nd Semester Vietnamese FINAL Ready To Upload",
    "summary": "Imported from Lesson Plans / 1.3 Novice High.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Novice",
    "tags": [
      "1.3 Novice High"
    ],
    "pdfUrl": null,
    "url": "https://drive.google.com/file/d/1cTUnKp-IAFXaDRcmzV9xdKhyO_A8ab4V/view?usp=drive_web",
    "fileName": "Grocery Shopping-2nd semester Vietnamese - FINAL_ready to upload.docx"
  },
  {
    "id": "1IXZDFBGQ1h0AgGV1-x4ne3dMKrU2HAmS",
    "title": "Hanh Oral Housing 3rd Semester Readings",
    "summary": "Imported from Lesson Plans / 1.1 Novice Low.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Novice",
    "tags": [
      "1.1 Novice Low"
    ],
    "pdfUrl": null,
    "url": "https://drive.google.com/file/d/1IXZDFBGQ1h0AgGV1-x4ne3dMKrU2HAmS/view?usp=drive_web",
    "fileName": "Hanh-Oral-Housing-3rd Semester_Readings.docx"
  },
  {
    "id": "1eSSJe-ZEeP6EDrwiwXbnQ90BZb92CITp",
    "title": "Housing 2nd Semester Source And Transcript Rental Video Căn Hộ Cho Thuê 2 Ngủ 63m2",
    "summary": "Imported from Lesson Plans / 1.1 Novice Low.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Novice",
    "tags": [
      "1.1 Novice Low"
    ],
    "pdfUrl": null,
    "url": "https://drive.google.com/file/d/1eSSJe-ZEeP6EDrwiwXbnQ90BZb92CITp/view?usp=drive_web",
    "fileName": "Housing 2nd semester_ source and transcript_rental video_Căn Hộ Cho Thuê 2 Ngủ 63m2.docx"
  },
  {
    "id": "1U5wm8EEMm132WZB7YIbLMtF5E5Ep0njb",
    "title": "Housing 2nd Semester Reading Hồng Nhung's Villa",
    "summary": "Imported from Lesson Plans / 1.1 Novice Low.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Novice",
    "tags": [
      "1.1 Novice Low"
    ],
    "pdfUrl": null,
    "url": "https://drive.google.com/file/d/1U5wm8EEMm132WZB7YIbLMtF5E5Ep0njb/view?usp=drive_web",
    "fileName": "Housing 2nd semester-Reading-Hồng Nhung's villa.docx"
  },
  {
    "id": "1Lpz_tZrwAjrbh3bxSuqK26VsWOh5Y_7C",
    "title": "Housing 2nd Semester Vietnamese FINAL Ready To Upload",
    "summary": "Imported from Lesson Plans / 1.2 Novice Mid.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Novice",
    "tags": [
      "1.2 Novice Mid"
    ],
    "pdfUrl": null,
    "url": "https://drive.google.com/file/d/1Lpz_tZrwAjrbh3bxSuqK26VsWOh5Y_7C/view?usp=drive_web",
    "fileName": "Housing-2nd semester Vietnamese - FINAL_ready to upload.docx"
  },
  {
    "id": "1OCq3xX___JhAL6QODIFfKHpVOpNn65lW",
    "title": "Housing 3rd Semester Vietnamese FINAL Ready To Upload",
    "summary": "Imported from Lesson Plans / 1.3 Novice High.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Novice",
    "tags": [
      "1.3 Novice High"
    ],
    "pdfUrl": null,
    "url": "https://drive.google.com/file/d/1OCq3xX___JhAL6QODIFfKHpVOpNn65lW/view?usp=drive_web",
    "fileName": "Housing-3rd semester Vietnamese - FINAL_ready to upload.docx"
  },
  {
    "id": "1G129F26e9fieGDI7fi21sX-YzRyDgVhO",
    "title": "Ordering Food At A Phở Restaurant (nov 24)",
    "summary": "Imported from Lesson Plans / 1.1 Novice Low.",
    "institutionAuthor": "Source: Google Drive",
    "semester": "Nov 2024",
    "level": "Novice",
    "tags": [
      "1.1 Novice Low"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1G129F26e9fieGDI7fi21sX-YzRyDgVhO/preview",
    "url": "https://drive.google.com/file/d/1G129F26e9fieGDI7fi21sX-YzRyDgVhO/view?usp=drive_web",
    "fileName": "Ordering food at a Phở restaurant Nov 24.pdf"
  },
  {
    "id": "1-NrYxOiCAQYm1BxzlhlDLbYA8ueZiyHA",
    "title": "Setting Up An Appointment (nov 24)",
    "summary": "Imported from Lesson Plans / 1.1 Novice Low.",
    "institutionAuthor": "Source: Google Drive",
    "semester": "Nov 2024",
    "level": "Novice",
    "tags": [
      "1.1 Novice Low"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1-NrYxOiCAQYm1BxzlhlDLbYA8ueZiyHA/preview",
    "url": "https://drive.google.com/file/d/1-NrYxOiCAQYm1BxzlhlDLbYA8ueZiyHA/view?usp=drive_web",
    "fileName": "Setting up an appointment Nov 24.pdf"
  },
  {
    "id": "1tcxo1YpwJhLOivKp5RaqPxbkwyOMNkTv",
    "title": "Shopping Services 3rd Semester FINAL Ready To Upload",
    "summary": "Imported from Lesson Plans / 1.3 Novice High.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Novice",
    "tags": [
      "1.3 Novice High"
    ],
    "pdfUrl": null,
    "url": "https://drive.google.com/file/d/1tcxo1YpwJhLOivKp5RaqPxbkwyOMNkTv/view?usp=drive_web",
    "fileName": "Shopping Services 3rd semester - FINAL _ready to upload.docx"
  },
  {
    "id": "1ObmtB0TsncSlHZM_iqhLRdHCnSD0T3av",
    "title": "Vietnamese By Hanh And Hong",
    "summary": "Imported from Lesson Plans / 2.2 Intermediate Mid.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Intermediate",
    "tags": [
      "2.2 Intermediate Mid"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1ObmtB0TsncSlHZM_iqhLRdHCnSD0T3av/preview",
    "url": "https://drive.google.com/file/d/1ObmtB0TsncSlHZM_iqhLRdHCnSD0T3av/view?usp=drive_web",
    "fileName": "Vietnamese_by_Hanh_and_Hong.pdf"
  },
  {
    "id": "1y2QWh0LLhqwJB_cIJXYJtBXwM8Lju_jR",
    "title": "Vietnamese By Kim",
    "summary": "Imported from Lesson Plans / 1.3 Novice High.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Novice",
    "tags": [
      "1.3 Novice High"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1y2QWh0LLhqwJB_cIJXYJtBXwM8Lju_jR/preview",
    "url": "https://drive.google.com/file/d/1y2QWh0LLhqwJB_cIJXYJtBXwM8Lju_jR/view?usp=drive_web",
    "fileName": "Vietnamese_by_Kim.pdf"
  },
  {
    "id": "1h2RplMlxjo8mz3YLv16TcoOyhPi9xCCV",
    "title": "Vietnamese By Thuba And Thuyanh",
    "summary": "Imported from Lesson Plans / 1.3 Novice High.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Novice",
    "tags": [
      "1.3 Novice High"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1h2RplMlxjo8mz3YLv16TcoOyhPi9xCCV/preview",
    "url": "https://drive.google.com/file/d/1h2RplMlxjo8mz3YLv16TcoOyhPi9xCCV/view?usp=drive_web",
    "fileName": "Vietnamese_by_ThuBa_and_ThuyAnh.pdf"
  },
  {
    "id": "133BhD69gZIaGpr4u86k7OkqksEKaMbNz",
    "title": "Vietnamese By Thuy",
    "summary": "Imported from Lesson Plans / 1.3 Novice High.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Novice",
    "tags": [
      "1.3 Novice High"
    ],
    "pdfUrl": "https://drive.google.com/file/d/133BhD69gZIaGpr4u86k7OkqksEKaMbNz/preview",
    "url": "https://drive.google.com/file/d/133BhD69gZIaGpr4u86k7OkqksEKaMbNz/view?usp=drive_web",
    "fileName": "Vietnamese_by_Thuy.pdf"
  },
  {
    "id": "1WXxAjt6FwkP2ru6rhYjyTJROs5dPhdbq",
    "title": "Vietnamese Cornerstones Flyer 2016 2017",
    "summary": "Imported from Lesson Plans / 2.2 Intermediate Mid.",
    "institutionAuthor": "Source: Google Drive",
    "semester": "2017",
    "level": "Intermediate",
    "tags": [
      "2.2 Intermediate Mid"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1WXxAjt6FwkP2ru6rhYjyTJROs5dPhdbq/preview",
    "url": "https://drive.google.com/file/d/1WXxAjt6FwkP2ru6rhYjyTJROs5dPhdbq/view?usp=drive_web",
    "fileName": "Vietnamese_Cornerstones_Flyer_2016-2017.pdf"
  },
  {
    "id": "1_qBMgZmyGlD3M7fcs8BVjnBQxmwfIn8Z",
    "title": "Vietnamese Handouts By Hanh And Hong",
    "summary": "Imported from Lesson Plans / SEALC Lesson/Unit Plans.",
    "institutionAuthor": "SEALC",
    "tags": [
      "SEALC Lesson/Unit Plans"
    ],
    "pdfUrl": null,
    "url": "https://drive.google.com/file/d/1_qBMgZmyGlD3M7fcs8BVjnBQxmwfIn8Z/view?usp=drive_web",
    "fileName": "Vietnamese_Handouts_by_Hanh_and_Hong.zip"
  },
  {
    "id": "1_-keg9OJ3DO6oFL7HqCNl2gXZucYT9bk",
    "title": "Vietnamese Lesson Final",
    "summary": "Imported from Lesson Plans / 2.1 Intermediate Low.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Intermediate",
    "tags": [
      "2.1 Intermediate Low"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1_-keg9OJ3DO6oFL7HqCNl2gXZucYT9bk/preview",
    "url": "https://drive.google.com/file/d/1_-keg9OJ3DO6oFL7HqCNl2gXZucYT9bk/view?usp=drive_web",
    "fileName": "Vietnamese_Lesson_Final.pdf"
  },
  {
    "id": "1z3byLcro_zBJ1wlHxV7D_TanvcdGSjNQ",
    "title": "Vietnamese HL PBLL Lesson Health And Wellness Final (nov 24)",
    "summary": "Imported from Lesson Plans / 2.1 Intermediate Low.",
    "institutionAuthor": "Source: Google Drive",
    "semester": "Nov 2024",
    "level": "Intermediate",
    "tags": [
      "2.1 Intermediate Low"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1z3byLcro_zBJ1wlHxV7D_TanvcdGSjNQ/preview",
    "url": "https://drive.google.com/file/d/1z3byLcro_zBJ1wlHxV7D_TanvcdGSjNQ/view?usp=drive_web",
    "fileName": "Vietnamese-HL-PBLL-Lesson-Health-and-Wellness-Final Nov 24.pdf"
  },
  {
    "id": "1Mu_Xq9eCYEWnK21i1i_9ld_b6KQddWdG",
    "title": "Vietnamese2016 Intermed",
    "summary": "Imported from Lesson Plans / 2.2 Intermediate Mid.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Intermediate",
    "tags": [
      "2.2 Intermediate Mid"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1Mu_Xq9eCYEWnK21i1i_9ld_b6KQddWdG/preview",
    "url": "https://drive.google.com/file/d/1Mu_Xq9eCYEWnK21i1i_9ld_b6KQddWdG/view?usp=drive_web",
    "fileName": "Vietnamese2016_Intermed.pdf"
  },
  {
    "id": "1EWUNWau6fX3Er36W0Ba7xRz1t18YahO_",
    "title": "Vietnamese2016 Upper Intermed",
    "summary": "Imported from Lesson Plans / 2.3 Intermediate High.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Intermediate",
    "tags": [
      "2.3 Intermediate High"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1EWUNWau6fX3Er36W0Ba7xRz1t18YahO_/preview",
    "url": "https://drive.google.com/file/d/1EWUNWau6fX3Er36W0Ba7xRz1t18YahO_/view?usp=drive_web",
    "fileName": "Vietnamese2016_Upper_Intermed.pdf"
  },
  {
    "id": "1ckfOgxaX--wDmLyqVIn62BEmuTSh6axh",
    "title": "Vietnamese2016 Upper Intermed2",
    "summary": "Imported from Lesson Plans / 2.3 Intermediate High.",
    "institutionAuthor": "Source: Google Drive",
    "level": "Intermediate",
    "tags": [
      "2.3 Intermediate High"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1ckfOgxaX--wDmLyqVIn62BEmuTSh6axh/preview",
    "url": "https://drive.google.com/file/d/1ckfOgxaX--wDmLyqVIn62BEmuTSh6axh/view?usp=drive_web",
    "fileName": "Vietnamese2016_Upper_Intermed2.pdf"
  }
];

export const syllabiItems: VltResourceItem[] = [
  {
    "id": "1SQ-eFc7bpUjlZyIxppICkqfWFEYfsF_M",
    "title": "54c8025d0cf238bb7d0c81af",
    "summary": "Imported from Syllabi / UF Hoa Pham.",
    "institutionAuthor": "Source: Google Drive",
    "tags": [
      "UF Hoa Pham"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1SQ-eFc7bpUjlZyIxppICkqfWFEYfsF_M/preview",
    "url": "https://drive.google.com/file/d/1SQ-eFc7bpUjlZyIxppICkqfWFEYfsF_M/view?usp=drive_web",
    "fileName": "54c8025d0cf238bb7d0c81af.pdf"
  },
  {
    "id": "1CHY3YF5H23HUHuB_zdE54Wfyg_BJmp6u",
    "title": "Advance Vietnamese Spring 2015",
    "summary": "Imported from Syllabi / washinton.edu.",
    "institutionAuthor": "Washington University",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1CHY3YF5H23HUHuB_zdE54Wfyg_BJmp6u/preview",
    "url": "https://drive.google.com/file/d/1CHY3YF5H23HUHuB_zdE54Wfyg_BJmp6u/view?usp=drive_web",
    "fileName": "advance_vietnamese_spring_2015.pdf"
  },
  {
    "id": "1t2tjPuwFzO4ddT91PIyzEiBKC-o2jvZh",
    "title": "Approval Letter Legal PHUNG",
    "summary": "Imported from Syllabi / HuyPhung-UNC/UHM/UCSD.",
    "institutionAuthor": "University of North Carolina",
    "tags": [
      "HuyPhung-UNC/UHM/UCSD"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1t2tjPuwFzO4ddT91PIyzEiBKC-o2jvZh/preview",
    "url": "https://drive.google.com/file/d/1t2tjPuwFzO4ddT91PIyzEiBKC-o2jvZh/view?usp=drive_web",
    "fileName": "Approval_Letter_Legal_PHUNG.pdf"
  },
  {
    "id": "1zBYpFoSVyStnsbxtmlBR8NkOwgP2r6Pd",
    "title": "CU Vietnamese Course Syllabus 101",
    "summary": "Imported from Syllabi / Vietnamese _ Columbia.",
    "institutionAuthor": "Columbia University",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1zBYpFoSVyStnsbxtmlBR8NkOwgP2r6Pd/preview",
    "url": "https://drive.google.com/file/d/1zBYpFoSVyStnsbxtmlBR8NkOwgP2r6Pd/view?usp=drive_web",
    "fileName": "CU Vietnamese Course Syllabus 101.pdf"
  },
  {
    "id": "1hOOHV6O7Pm0YyV7dLsJVxtDUuy_a9PWl",
    "title": "CU Vietnamese Course Syllabus 102",
    "summary": "Imported from Syllabi / Vietnamese _ Columbia.",
    "institutionAuthor": "Columbia University",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1hOOHV6O7Pm0YyV7dLsJVxtDUuy_a9PWl/preview",
    "url": "https://drive.google.com/file/d/1hOOHV6O7Pm0YyV7dLsJVxtDUuy_a9PWl/view?usp=drive_web",
    "fileName": "CU Vietnamese Course Syllabus 102.pdf"
  },
  {
    "id": "1-HtGo7BK1wyBJ6P5nybwcSujbwQgSgFb",
    "title": "CU Vietnamese Course Syllabus 201",
    "summary": "Imported from Syllabi / Vietnamese _ Columbia.",
    "institutionAuthor": "Columbia University",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1-HtGo7BK1wyBJ6P5nybwcSujbwQgSgFb/preview",
    "url": "https://drive.google.com/file/d/1-HtGo7BK1wyBJ6P5nybwcSujbwQgSgFb/view?usp=drive_web",
    "fileName": "CU Vietnamese Course Syllabus 201.pdf"
  },
  {
    "id": "1MQu-fKYCXdSNO0ffmC_CSN1lxkv0DnB2",
    "title": "CU Vietnamese Course Syllabus 202",
    "summary": "Imported from Syllabi / Vietnamese _ Columbia.",
    "institutionAuthor": "Columbia University",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1MQu-fKYCXdSNO0ffmC_CSN1lxkv0DnB2/preview",
    "url": "https://drive.google.com/file/d/1MQu-fKYCXdSNO0ffmC_CSN1lxkv0DnB2/view?usp=drive_web",
    "fileName": "CU Vietnamese Course Syllabus 202.pdf"
  },
  {
    "id": "1JbA0vQ-N123Umsp-R1AUtA-XNOD4Yis4",
    "title": "CU Vietnamese Course Syllabus 301",
    "summary": "Imported from Syllabi / Vietnamese _ Columbia.",
    "institutionAuthor": "Columbia University",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1JbA0vQ-N123Umsp-R1AUtA-XNOD4Yis4/preview",
    "url": "https://drive.google.com/file/d/1JbA0vQ-N123Umsp-R1AUtA-XNOD4Yis4/view?usp=drive_web",
    "fileName": "CU Vietnamese Course Syllabus 301.pdf"
  },
  {
    "id": "1Tqhm6wjCH3KQWhJySDvkBO1V_yyFLXHk",
    "title": "CU Vietnamese Course Syllabus 302",
    "summary": "Imported from Syllabi / Vietnamese _ Columbia.",
    "institutionAuthor": "Columbia University",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1Tqhm6wjCH3KQWhJySDvkBO1V_yyFLXHk/preview",
    "url": "https://drive.google.com/file/d/1Tqhm6wjCH3KQWhJySDvkBO1V_yyFLXHk/view?usp=drive_web",
    "fileName": "CU Vietnamese Course Syllabus 302.pdf"
  },
  {
    "id": "1kRU9EsTv-sw2-FtagSxdZgAIsKXavUcF",
    "title": "CU Vietnamese Course Syllabus 401",
    "summary": "Imported from Syllabi / Vietnamese _ Columbia.",
    "institutionAuthor": "Columbia University",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1kRU9EsTv-sw2-FtagSxdZgAIsKXavUcF/preview",
    "url": "https://drive.google.com/file/d/1kRU9EsTv-sw2-FtagSxdZgAIsKXavUcF/view?usp=drive_web",
    "fileName": "CU Vietnamese Course Syllabus 401.pdf"
  },
  {
    "id": "1GP6C4jl7bqHTLcDfLbcPD68NQ2-UuxgL",
    "title": "CU Vietnamese Course Syllabus 402",
    "summary": "Imported from Syllabi / Vietnamese _ Columbia.",
    "institutionAuthor": "Columbia University",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1GP6C4jl7bqHTLcDfLbcPD68NQ2-UuxgL/preview",
    "url": "https://drive.google.com/file/d/1GP6C4jl7bqHTLcDfLbcPD68NQ2-UuxgL/view?usp=drive_web",
    "fileName": "CU Vietnamese Course Syllabus 402.pdf"
  },
  {
    "id": "1rF-QaSNahQy4H-bsF7LP-YXVie1ZMJcv",
    "title": "Easternphilosophysyllabus",
    "summary": "Imported from Syllabi / Yale-2015.",
    "institutionAuthor": "Yale",
    "semester": "2015",
    "tags": [],
    "pdfUrl": null,
    "url": "https://drive.google.com/file/d/1rF-QaSNahQy4H-bsF7LP-YXVie1ZMJcv/view?usp=drive_web",
    "fileName": "easternphilosophysyllabus.doc"
  },
  {
    "id": "1xuR_sRoKWnCr8G6iadvwEhepiqk-p_Cy",
    "title": "Elementary Vietnamese Spring 2015",
    "summary": "Imported from Syllabi / washinton.edu.",
    "institutionAuthor": "Washington University",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1xuR_sRoKWnCr8G6iadvwEhepiqk-p_Cy/preview",
    "url": "https://drive.google.com/file/d/1xuR_sRoKWnCr8G6iadvwEhepiqk-p_Cy/view?usp=drive_web",
    "fileName": "elementary_vietnamese_spring_2015.pdf"
  },
  {
    "id": "1Cm4wCYCGJU2R7Oqqzcl7S7gzSNnOD-G8",
    "title": "Intermediate Vietnamese Spring 2015",
    "summary": "Imported from Syllabi / washinton.edu.",
    "institutionAuthor": "Washington University",
    "level": "Intermediate",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1Cm4wCYCGJU2R7Oqqzcl7S7gzSNnOD-G8/preview",
    "url": "https://drive.google.com/file/d/1Cm4wCYCGJU2R7Oqqzcl7S7gzSNnOD-G8/view?usp=drive_web",
    "fileName": "intermediate_vietnamese_spring_2015.pdf"
  },
  {
    "id": "11DmD4XN_nJdqXBmgqyBX4gQYJiS4wHHY",
    "title": "LCA 319 1st Semester 2014",
    "summary": "Imported from Syllabi.",
    "institutionAuthor": "Language/Culture Program (LCA)",
    "semester": "2014",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/11DmD4XN_nJdqXBmgqyBX4gQYJiS4wHHY/preview",
    "url": "https://drive.google.com/file/d/11DmD4XN_nJdqXBmgqyBX4gQYJiS4wHHY/view?usp=drive_web",
    "fileName": "LCA 319 - 1st semester 2014.pdf"
  },
  {
    "id": "1JidZLiEERiEvuPMGU-r6YGugNaUWZLyY",
    "title": "LCA 419 3rd Semester 2014",
    "summary": "Imported from Syllabi.",
    "institutionAuthor": "Language/Culture Program (LCA)",
    "semester": "2014",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1JidZLiEERiEvuPMGU-r6YGugNaUWZLyY/preview",
    "url": "https://drive.google.com/file/d/1JidZLiEERiEvuPMGU-r6YGugNaUWZLyY/view?usp=drive_web",
    "fileName": "LCA 419 - 3rd semester 2014.pdf"
  },
  {
    "id": "1x6OnwS8uF71_hh4M5tISxSMs_a4tJwew",
    "title": "LCA 519 5th Semester 2014",
    "summary": "Imported from Syllabi.",
    "institutionAuthor": "Language/Culture Program (LCA)",
    "semester": "2014",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1x6OnwS8uF71_hh4M5tISxSMs_a4tJwew/preview",
    "url": "https://drive.google.com/file/d/1x6OnwS8uF71_hh4M5tISxSMs_a4tJwew/view?usp=drive_web",
    "fileName": "LCA 519 - 5th semester 2014.pdf"
  },
  {
    "id": "1v63leHcV_zzntT0B4E6ENQzT8l27S3WZ",
    "title": "Phan Approval Letter",
    "summary": "Imported from Syllabi / Vietnamese-Venice.",
    "institutionAuthor": "Phung/Phan Program Materials",
    "tags": [
      "Vietnamese-Venice"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1v63leHcV_zzntT0B4E6ENQzT8l27S3WZ/preview",
    "url": "https://drive.google.com/file/d/1v63leHcV_zzntT0B4E6ENQzT8l27S3WZ/view?usp=drive_web",
    "fileName": "Phan-approval letter.pdf"
  },
  {
    "id": "1mDDMQztSS-3wOfAtF2XynZKaB7dQKTXn",
    "title": "PHAN VIETNAMESE 1",
    "summary": "Imported from Syllabi / Vietnamese-Venice.",
    "institutionAuthor": "Phung/Phan Program Materials",
    "tags": [
      "Vietnamese-Venice"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1mDDMQztSS-3wOfAtF2XynZKaB7dQKTXn/preview",
    "url": "https://drive.google.com/file/d/1mDDMQztSS-3wOfAtF2XynZKaB7dQKTXn/view?usp=drive_web",
    "fileName": "PHAN-VIETNAMESE 1.pdf"
  },
  {
    "id": "1FnNfx97COoKnyXIEMm6GdVD7RUTruw0d",
    "title": "PHAN VIETNAMESE 2",
    "summary": "Imported from Syllabi / Vietnamese-Venice.",
    "institutionAuthor": "Phung/Phan Program Materials",
    "tags": [
      "Vietnamese-Venice"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1FnNfx97COoKnyXIEMm6GdVD7RUTruw0d/preview",
    "url": "https://drive.google.com/file/d/1FnNfx97COoKnyXIEMm6GdVD7RUTruw0d/view?usp=drive_web",
    "fileName": "PHAN-VIETNAMESE 2.pdf"
  },
  {
    "id": "1EDb2Upg7Q2BtXqd7HxkQoH6JkBCRbm0l",
    "title": "PHAN VIETNAMESE 3",
    "summary": "Imported from Syllabi / Vietnamese-Venice.",
    "institutionAuthor": "Phung/Phan Program Materials",
    "tags": [
      "Vietnamese-Venice"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1EDb2Upg7Q2BtXqd7HxkQoH6JkBCRbm0l/preview",
    "url": "https://drive.google.com/file/d/1EDb2Upg7Q2BtXqd7HxkQoH6JkBCRbm0l/view?usp=drive_web",
    "fileName": "PHAN-VIETNAMESE 3.pdf"
  },
  {
    "id": "1E92IvT_DDSrJHY8FAJ6S6hS0aaZlWBcX",
    "title": "SYLLABUS 420, 2015",
    "summary": "Imported from Syllabi.",
    "institutionAuthor": "Source: Google Drive",
    "semester": "2015",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1E92IvT_DDSrJHY8FAJ6S6hS0aaZlWBcX/preview",
    "url": "https://drive.google.com/file/d/1E92IvT_DDSrJHY8FAJ6S6hS0aaZlWBcX/view?usp=drive_web",
    "fileName": "SYLLABUS 420, 2015.pdf"
  },
  {
    "id": "1eO8tke3_HyikZQ5iai_PsjPYRCyTwCoc",
    "title": "UHM VIET201 Fall2021 Phung",
    "summary": "Imported from Syllabi / HuyPhung-UNC/UHM/UCSD.",
    "institutionAuthor": "University of North Carolina",
    "tags": [
      "HuyPhung-UNC/UHM/UCSD"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1eO8tke3_HyikZQ5iai_PsjPYRCyTwCoc/preview",
    "url": "https://drive.google.com/file/d/1eO8tke3_HyikZQ5iai_PsjPYRCyTwCoc/view?usp=drive_web",
    "fileName": "UHM_VIET201_Fall2021_Phung.pdf"
  },
  {
    "id": "1kvaGrRwKXEjPwCt7pJ9XVmYXLnN9v41Y",
    "title": "UNC VIET101 001 Fall2025 Phung",
    "summary": "Imported from Syllabi / HuyPhung-UNC/UHM/UCSD.",
    "institutionAuthor": "University of North Carolina",
    "tags": [
      "HuyPhung-UNC/UHM/UCSD"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1kvaGrRwKXEjPwCt7pJ9XVmYXLnN9v41Y/preview",
    "url": "https://drive.google.com/file/d/1kvaGrRwKXEjPwCt7pJ9XVmYXLnN9v41Y/view?usp=drive_web",
    "fileName": "UNC_VIET101_001_Fall2025_Phung.pdf"
  },
  {
    "id": "1n8L5INHC-OniCBhnXNSXH8DNDsDBFBDG",
    "title": "UNC VIET102 001 Spring2026 Phung",
    "summary": "Imported from Syllabi / HuyPhung-UNC/UHM/UCSD.",
    "institutionAuthor": "University of North Carolina",
    "tags": [
      "HuyPhung-UNC/UHM/UCSD"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1n8L5INHC-OniCBhnXNSXH8DNDsDBFBDG/preview",
    "url": "https://drive.google.com/file/d/1n8L5INHC-OniCBhnXNSXH8DNDsDBFBDG/view?usp=drive_web",
    "fileName": "UNC_VIET102_001_Spring2026_Phung.pdf"
  },
  {
    "id": "1P2ybZWYlh_lw7GVGFkB3e3PI6y-fv2LG",
    "title": "UNC VIET203 Fall2025 Phung",
    "summary": "Imported from Syllabi / HuyPhung-UNC/UHM/UCSD.",
    "institutionAuthor": "University of North Carolina",
    "tags": [
      "HuyPhung-UNC/UHM/UCSD"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1P2ybZWYlh_lw7GVGFkB3e3PI6y-fv2LG/preview",
    "url": "https://drive.google.com/file/d/1P2ybZWYlh_lw7GVGFkB3e3PI6y-fv2LG/view?usp=drive_web",
    "fileName": "UNC_VIET203_Fall2025_Phung.pdf"
  },
  {
    "id": "1Kumc7a-d5ROxHoPXWNzu-5yndb_ql5F4",
    "title": "Viet Syllabus 320, 2015",
    "summary": "Imported from Syllabi.",
    "institutionAuthor": "Source: Google Drive",
    "semester": "2015",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1Kumc7a-d5ROxHoPXWNzu-5yndb_ql5F4/preview",
    "url": "https://drive.google.com/file/d/1Kumc7a-d5ROxHoPXWNzu-5yndb_ql5F4/view?usp=drive_web",
    "fileName": "Viet Syllabus 320, 2015.pdf"
  },
  {
    "id": "1zOtwiq6Vcor7ZwGdo6u1h4sdLHxVhf8L",
    "title": "Viet Syllabus 520, 2015",
    "summary": "Imported from Syllabi.",
    "institutionAuthor": "Source: Google Drive",
    "semester": "2015",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1zOtwiq6Vcor7ZwGdo6u1h4sdLHxVhf8L/preview",
    "url": "https://drive.google.com/file/d/1zOtwiq6Vcor7ZwGdo6u1h4sdLHxVhf8L/view?usp=drive_web",
    "fileName": "Viet syllabus 520, 2015.pdf"
  },
  {
    "id": "1tnVe8X-O9lFNMGBbhoAIyD5IVE1gJCKw",
    "title": "Vietnamese110syllabus2012 2",
    "summary": "Imported from Syllabi / Yale-2015.",
    "institutionAuthor": "Yale",
    "semester": "2015",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1tnVe8X-O9lFNMGBbhoAIyD5IVE1gJCKw/preview",
    "url": "https://drive.google.com/file/d/1tnVe8X-O9lFNMGBbhoAIyD5IVE1gJCKw/view?usp=drive_web",
    "fileName": "vietnamese110Syllabus2012 _2_.pdf"
  },
  {
    "id": "1Kcwlsv6NkMwu19NjJo7Dtg8vU1o47bsj",
    "title": "Vietnamese130syllabus2012",
    "summary": "Imported from Syllabi / Yale-2015.",
    "institutionAuthor": "Yale",
    "semester": "2015",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1Kcwlsv6NkMwu19NjJo7Dtg8vU1o47bsj/preview",
    "url": "https://drive.google.com/file/d/1Kcwlsv6NkMwu19NjJo7Dtg8vU1o47bsj/view?usp=drive_web",
    "fileName": "vietnamese130Syllabus2012.pdf"
  },
  {
    "id": "1W0hU_kPAa1J9_5oU7aJ-jbYx31TFqw-M",
    "title": "Vietnamese132syllabus",
    "summary": "Imported from Syllabi / Yale-2015.",
    "institutionAuthor": "Yale",
    "semester": "2015",
    "tags": [],
    "pdfUrl": null,
    "url": "https://drive.google.com/file/d/1W0hU_kPAa1J9_5oU7aJ-jbYx31TFqw-M/view?usp=drive_web",
    "fileName": "vietnamese132Syllabus.doc"
  },
  {
    "id": "1412sWO4XTqEVTajtxUo6EieuJjCMvIKP",
    "title": "Vietnamese150syllabus2012",
    "summary": "Imported from Syllabi / Yale-2015.",
    "institutionAuthor": "Yale",
    "semester": "2015",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1412sWO4XTqEVTajtxUo6EieuJjCMvIKP/preview",
    "url": "https://drive.google.com/file/d/1412sWO4XTqEVTajtxUo6EieuJjCMvIKP/view?usp=drive_web",
    "fileName": "vietnamese150Syllabus2012.pdf"
  },
  {
    "id": "1dT5NNwxzo1yknHUcza4070gjlXwj4xs4",
    "title": "VTN 1130beginning Vietnamese 1 Pham Huy",
    "summary": "Imported from Syllabi / UF Hoa Pham.",
    "institutionAuthor": "Source: Google Drive",
    "tags": [
      "UF Hoa Pham"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1dT5NNwxzo1yknHUcza4070gjlXwj4xs4/preview",
    "url": "https://drive.google.com/file/d/1dT5NNwxzo1yknHUcza4070gjlXwj4xs4/view?usp=drive_web",
    "fileName": "VTN 1130beginning-vietnamese-1-pham Huy.pdf"
  },
  {
    "id": "1rzdma20cQRFc49KLoo3W_bJRHJu0R2Wg",
    "title": "VTN 1130beginning Vietnamese 1 Pham",
    "summary": "Imported from Syllabi / UF Hoa Pham.",
    "institutionAuthor": "Source: Google Drive",
    "tags": [
      "UF Hoa Pham"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1rzdma20cQRFc49KLoo3W_bJRHJu0R2Wg/preview",
    "url": "https://drive.google.com/file/d/1rzdma20cQRFc49KLoo3W_bJRHJu0R2Wg/view?usp=drive_web",
    "fileName": "VTN 1130beginning-vietnamese-1-pham.pdf"
  },
  {
    "id": "1Zyqh71fp_e-amTOxoJGlj1_ozlzd4QxE",
    "title": "VTN 2220 Intermediaire Vietnamese 1 Pham",
    "summary": "Imported from Syllabi / UF Hoa Pham.",
    "institutionAuthor": "Source: Google Drive",
    "tags": [
      "UF Hoa Pham"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1Zyqh71fp_e-amTOxoJGlj1_ozlzd4QxE/preview",
    "url": "https://drive.google.com/file/d/1Zyqh71fp_e-amTOxoJGlj1_ozlzd4QxE/view?usp=drive_web",
    "fileName": "VTN 2220-intermediaire-vietnamese-1-pham.pdf"
  },
  {
    "id": "16goE4V3g8Mxo4Y52gUYpcHY7TxPa6OsO",
    "title": "VTN1131 Beginning Viet 2 Pham",
    "summary": "Imported from Syllabi / UF Hoa Pham.",
    "institutionAuthor": "Source: Google Drive",
    "tags": [
      "UF Hoa Pham"
    ],
    "pdfUrl": "https://drive.google.com/file/d/16goE4V3g8Mxo4Y52gUYpcHY7TxPa6OsO/preview",
    "url": "https://drive.google.com/file/d/16goE4V3g8Mxo4Y52gUYpcHY7TxPa6OsO/view?usp=drive_web",
    "fileName": "VTN1131-beginning-viet-2-pham.pdf"
  },
  {
    "id": "1GLomikNfB7uQ8AcDQWKLEHswV6P-uYAn",
    "title": "VTN2340 Vietnamese For Heritage Learners1",
    "summary": "Imported from Syllabi / UF Hoa Pham.",
    "institutionAuthor": "Source: Google Drive",
    "tags": [
      "UF Hoa Pham"
    ],
    "pdfUrl": "https://drive.google.com/file/d/1GLomikNfB7uQ8AcDQWKLEHswV6P-uYAn/preview",
    "url": "https://drive.google.com/file/d/1GLomikNfB7uQ8AcDQWKLEHswV6P-uYAn/view?usp=drive_web",
    "fileName": "VTN2340-vietnamese-for-heritage-learners1.pdf"
  },
  {
    "id": "12tNmaBXk-15qcA5p-oqZ-s6HIURL6i7W",
    "title": "VTN4930 Structure Of Vietnamese Pham",
    "summary": "Imported from Syllabi.",
    "institutionAuthor": "Source: Google Drive",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/12tNmaBXk-15qcA5p-oqZ-s6HIURL6i7W/preview",
    "url": "https://drive.google.com/file/d/12tNmaBXk-15qcA5p-oqZ-s6HIURL6i7W/view?usp=drive_web",
    "fileName": "VTN4930-structure-of-vietnamese-pham.pdf"
  }
];

export const instructionalMaterialItems: VltResourceItem[] = [];

export const professionalDevelopmentItems: VltResourceItem[] = [
  {
    "id": "106Mm2qcF-YaEcwDFg4ZeGbhUY8P3dw5I",
    "title": "GUAVA Newsletter December2021",
    "summary": "Imported from Professional Development.",
    "institutionAuthor": "GUAVA",
    "semester": "December 2021",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/106Mm2qcF-YaEcwDFg4ZeGbhUY8P3dw5I/preview",
    "url": "https://drive.google.com/file/d/106Mm2qcF-YaEcwDFg4ZeGbhUY8P3dw5I/view?usp=drive_web",
    "fileName": "GUAVA-Newsletter_December2021.pdf"
  },
  {
    "id": "1TYJYS6Ny4yxGkYS0ycLsRQ9H5lp9q5Kc",
    "title": "GUAVA Newsletter December2022",
    "summary": "Imported from Professional Development.",
    "institutionAuthor": "GUAVA",
    "semester": "December 2022",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1TYJYS6Ny4yxGkYS0ycLsRQ9H5lp9q5Kc/preview",
    "url": "https://drive.google.com/file/d/1TYJYS6Ny4yxGkYS0ycLsRQ9H5lp9q5Kc/view?usp=drive_web",
    "fileName": "GUAVA-Newsletter_December2022.pdf"
  },
  {
    "id": "1dyHORGCt2mX-m9fxC86eRlIDzwNm9eVl",
    "title": "GUAVA Newsletter December2023",
    "summary": "Imported from Professional Development.",
    "institutionAuthor": "GUAVA",
    "semester": "December 2023",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1dyHORGCt2mX-m9fxC86eRlIDzwNm9eVl/preview",
    "url": "https://drive.google.com/file/d/1dyHORGCt2mX-m9fxC86eRlIDzwNm9eVl/view?usp=drive_web",
    "fileName": "GUAVA-Newsletter_December2023.pdf"
  },
  {
    "id": "1siifXaUMbc_BAOVwt6529yT4VkH8vf2Y",
    "title": "GUAVA Newsletter December2024",
    "summary": "Imported from Professional Development.",
    "institutionAuthor": "GUAVA",
    "semester": "December 2024",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1siifXaUMbc_BAOVwt6529yT4VkH8vf2Y/preview",
    "url": "https://drive.google.com/file/d/1siifXaUMbc_BAOVwt6529yT4VkH8vf2Y/view?usp=drive_web",
    "fileName": "GUAVA-Newsletter_December2024.pdf"
  },
  {
    "id": "1tpq4WNmjWQynUDquUeTcNkgaQcRyoUve",
    "title": "GUAVA Newsletter December2025",
    "summary": "Imported from Professional Development.",
    "institutionAuthor": "GUAVA",
    "semester": "December 2025",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1tpq4WNmjWQynUDquUeTcNkgaQcRyoUve/preview",
    "url": "https://drive.google.com/file/d/1tpq4WNmjWQynUDquUeTcNkgaQcRyoUve/view?usp=drive_web",
    "fileName": "GUAVA-Newsletter_December2025.pdf"
  },
  {
    "id": "1-dz8LcgbqCf5YiNSWRu6dgCM0O3NPsCL",
    "title": "GUAVA Newsletter May2022",
    "summary": "Imported from Professional Development.",
    "institutionAuthor": "GUAVA",
    "semester": "May 2022",
    "tags": [],
    "pdfUrl": "https://drive.google.com/file/d/1-dz8LcgbqCf5YiNSWRu6dgCM0O3NPsCL/preview",
    "url": "https://drive.google.com/file/d/1-dz8LcgbqCf5YiNSWRu6dgCM0O3NPsCL/view?usp=drive_web",
    "fileName": "GUAVA-Newsletter_May2022.pdf"
  }
];

export const lessonPlanById = Object.fromEntries(
  lessonPlanItems.map((item) => [item.id, item])
) as Record<string, VltResourceItem>;

export const instructionalMaterialById = Object.fromEntries(
  instructionalMaterialItems.map((item) => [item.id, item])
) as Record<string, VltResourceItem>;

export const professionalDevelopmentById = Object.fromEntries(
  professionalDevelopmentItems.map((item) => [item.id, item])
) as Record<string, VltResourceItem>;

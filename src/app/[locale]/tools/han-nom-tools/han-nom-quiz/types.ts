export type BookType = "luc-van-tien" | "ho-xuan-huong" | "nguyen-trai";

export type QuizType = "full-sentence" | "fill-in-blank";

export type QuizMode = "sentences" | "missing-words" | "mixed";

export type Quiz = {
  id: number;
  type: QuizType;
  hanNomText: string;
  correctAnswer: string;
  userAnswer: string;
  isAnswered: boolean;
  isCorrect: boolean | null;
  hiddenWord?: string;
  displayText?: string;
  lineNumber: number;
  pageNumber: number; // For Luc Van Tien
  poemTitle?: string; // For Ho Xuan Huong and Nguyen Trai
  poemId?: number; // For Nguyen Trai
  titleNum?: number; // For Nguyen Trai
};

export type LineData = {
  hanNom: string;
  quocNgu: string;
  lineNumber: number;
};

// Luc Van Tien page data
export type LucVanTienPageData = {
  text: {
    page: {
      $: {
        pi: string;
        n: string;
      };
      div: Array<{
        lg: Array<{
          l: Array<{
            _: string;
          }>;
        }>;
      }>;
    };
  };
  rawText: any;
  count: number;
};

// Ho Xuan Huong poem data
export type HoXuanHuongPoemData = {
  nom_topic: string;
  qn_topic: string;
  en_topic: string;
  nom: string;
  qn: string;
  en: string;
  note_en: string;
  note_vi: string;
  all_nom_topic: string[];
  all_qn_topic: string[];
  all_en_topic: string[];
};

// Nguyen Trai Quoc Am Thi Tap data
export type NguyenTraiPoemData = {
  id: number;
  group: string;
  qn_title: string;
  title_num: number;
  hn_title: string;
  qn_body: {
    body: {
      lg: Array<{
        l: Array<{
          seg: string[];
        }>;
      }>;
    };
  };
  hn_body: {
    body: {
      lg: Array<{
        l: Array<{
          seg: string[];
        }>;
      }>;
    };
  };
  all_ids: number[];
  all_groups: string[];
  all_qn_titles: string[];
  all_hn_titles: string[];
  all_title_nums: number[];
};

export type PageData =
  | LucVanTienPageData
  | HoXuanHuongPoemData
  | NguyenTraiPoemData;

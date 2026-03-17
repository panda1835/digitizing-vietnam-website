/**
 * seed-lessons.mjs
 * One-time script to generate 15 beginner Vietnamese lessons via Gemini
 * and save them to /data/language-lab-lessons.json.
 *
 * Usage:
 *   GEMINI_API_KEY=<key> node scripts/seed-lessons.mjs
 *
 * Or if you have a .env.local file:
 *   node --env-file=.env.local scripts/seed-lessons.mjs
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../data/language-lab-lessons.json");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is not set.");
  process.exit(1);
}

// ─── Lesson topics ────────────────────────────────────────────────────────────

const LESSONS = [
  {
    lessonNumber: 1,
    id: "01-chao-hoi",
    topicEn: "Greetings & Introductions",
    topicVi: "Chào Hỏi và Giới Thiệu",
    prompt:
      "A short dialogue where two people meet for the first time, exchange greetings, introduce themselves (name, nationality), and say goodbye. Teach: xin chào, tên tôi là, bạn tên là gì, rất vui được gặp bạn, tạm biệt, người Mỹ/người Việt Nam.",
  },
  {
    lessonNumber: 2,
    id: "02-so-dem",
    topicEn: "Numbers 1–20",
    topicVi: "Số Đếm",
    prompt:
      "A short dialogue at a market where someone counts items and asks about quantities. Teach the numbers 1–20 in Vietnamese, plus: bao nhiêu (how many), cái (classifier for objects), con (classifier for animals), and simple counting questions.",
  },
  {
    lessonNumber: 3,
    id: "03-gia-dinh",
    topicEn: "Family Members",
    topicVi: "Gia Đình",
    prompt:
      "A short narrative where someone describes their family — parents, siblings, grandparents. Teach family vocabulary: bố/cha, mẹ, anh, chị, em, ông, bà, con, gia đình. Include the concept of age-based pronouns (anh/chị vs em) and the sentence pattern 'Tôi có [number] [family member]'.",
  },
  {
    lessonNumber: 4,
    id: "04-do-an",
    topicEn: "Food & Drinks",
    topicVi: "Đồ Ăn và Thức Uống",
    prompt:
      "A dialogue at a Vietnamese food stall where someone orders food and drink. Teach common food/drink words: cơm, phở, bánh mì, cà phê, nước, trà, ngon, ăn, uống, và muốn/thích ordering phrases. Include the cultural context of Vietnamese street food.",
  },
  {
    lessonNumber: 5,
    id: "05-mau-sac",
    topicEn: "Colors & Descriptions",
    topicVi: "Màu Sắc và Mô Tả",
    prompt:
      "A short dialogue where two friends are shopping for clothes and describing what they see. Teach colors (đỏ, xanh lá, xanh dương, vàng, trắng, đen, hồng, tím, cam) and basic adjectives (đẹp, xấu, to, nhỏ, dài, ngắn). Include how adjectives come after nouns in Vietnamese.",
  },
  {
    lessonNumber: 6,
    id: "06-thoi-gian",
    topicEn: "Days, Months & Time",
    topicVi: "Ngày, Tháng và Thời Gian",
    prompt:
      "A short dialogue about making plans and asking what day/time something happens. Teach: days of the week (thứ Hai → Chủ Nhật), hôm nay, ngày mai, hôm qua, giờ, phút, buổi sáng/chiều/tối, and how to tell time in Vietnamese (mấy giờ rồi?).",
  },
  {
    lessonNumber: 7,
    id: "07-di-lai",
    topicEn: "Getting Around",
    topicVi: "Đi Lại",
    prompt:
      "A short dialogue where someone asks for directions and a local helps them. Teach: bên trái, bên phải, thẳng, gần, xa, rẽ, đường, xe máy, taxi, xe buýt, đi bộ, and how to ask 'How do I get to X?' in Vietnamese.",
  },
  {
    lessonNumber: 8,
    id: "08-mua-sam",
    topicEn: "Shopping & Money",
    topicVi: "Mua Sắm và Tiền Bạc",
    prompt:
      "A dialogue at a market where someone haggles over prices. Teach: bao nhiêu tiền, đắt, rẻ, mắc, giảm giá, trả tiền, mua, bán, đồng (VND), nghìn, and common shopping phrases. Include cultural note on bargaining in Vietnamese markets.",
  },
  {
    lessonNumber: 9,
    id: "09-co-the",
    topicEn: "The Human Body",
    topicVi: "Cơ Thể Người",
    prompt:
      "A short dialogue at a pharmacy where someone explains they are not feeling well. Teach body parts (đầu, mắt, tai, mũi, miệng, tay, chân, bụng, lưng) and illness vocabulary (đau, sốt, ho, mệt, bệnh). Include the pattern 'Tôi bị đau [body part]'.",
  },
  {
    lessonNumber: 10,
    id: "10-thoi-quen",
    topicEn: "Daily Routines",
    topicVi: "Thói Quen Hằng Ngày",
    prompt:
      "A short narrative where someone describes their daily routine from morning to night. Teach time-of-day words, routine verbs: thức dậy, đánh răng, ăn sáng, đi làm, ăn trưa, về nhà, ăn tối, ngủ, and the adverb 'thường' for habitual actions.",
  },
  {
    lessonNumber: 11,
    id: "11-thoi-tiet",
    topicEn: "Weather",
    topicVi: "Thời Tiết",
    prompt:
      "A short dialogue where two people talk about the weather and make plans based on it. Teach weather vocabulary: nóng, lạnh, ấm, mát, mưa, nắng, gió, bão, mây, and the structures 'Hôm nay trời [weather]' and 'Thời tiết [adjective] quá!'.",
  },
  {
    lessonNumber: 12,
    id: "12-so-thich",
    topicEn: "Hobbies & Free Time",
    topicVi: "Sở Thích",
    prompt:
      "A dialogue where two people discuss their hobbies and free-time activities. Teach: thích, không thích, yêu, ghét, chơi thể thao, nghe nhạc, xem phim, đọc sách, nấu ăn, du lịch, and the pattern 'Tôi thích + verb/noun'.",
  },
  {
    lessonNumber: 13,
    id: "13-nha-hang",
    topicEn: "At the Restaurant",
    topicVi: "Ở Nhà Hàng",
    prompt:
      "A dialogue in a Vietnamese restaurant: being seated, ordering food, asking about the menu, and paying the bill. Teach: thực đơn, gọi món, tính tiền, ngon, no, đói, thêm, bữa ăn, phục vụ, and polite ordering phrases.",
  },
  {
    lessonNumber: 14,
    id: "14-nghe-nghiep",
    topicEn: "Jobs & Occupations",
    topicVi: "Nghề Nghiệp",
    prompt:
      "A short dialogue where two people get to know each other and ask about jobs. Teach occupations: giáo viên, bác sĩ, kỹ sư, sinh viên, nhân viên, nông dân, bán hàng, làm việc, and the question 'Bạn làm nghề gì?'.",
  },
  {
    lessonNumber: 15,
    id: "15-cam-xuc",
    topicEn: "Emotions & Feelings",
    topicVi: "Cảm Xúc",
    prompt:
      "A supportive dialogue between two friends where one has had a bad day and the other cheers them up. Teach emotion words: vui, buồn, tức, sợ, lo lắng, hạnh phúc, mệt mỏi, ngạc nhiên, and the expression 'Tôi cảm thấy...' alongside empathetic responses.",
  },
];

// ─── Gemini helper ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Vietnamese language pedagogy expert creating structured beginner lessons for English-speaking learners of Vietnamese.

Given a lesson topic, you will:
1. Write a short, natural Vietnamese dialogue or narrative (150–200 words) appropriate for absolute beginners. Use simple, common vocabulary and short sentences.
2. Select 10–14 key vocabulary items that appear in the text.
3. Identify 2–3 grammar patterns demonstrated in the text.
4. Include 1–2 cultural notes relevant to the topic.
5. Write 3–4 comprehension questions.

Always respond with ONLY valid JSON — no preamble, no markdown fences.

The JSON must match this exact shape:
{
  "title": "string — e.g. 'Lesson 1: Greetings & Introductions'",
  "titleVi": "string — Vietnamese title, e.g. 'Chào Hỏi và Giới Thiệu'",
  "difficulty": "beginner",
  "summary": "string — 2–3 sentence English description of what the learner will practice",
  "text": "string — the full Vietnamese dialogue or narrative as plain text with newlines between paragraphs or speaker turns",
  "vocabulary": [
    {
      "id": "string — unique kebab-case slug prefixed with the lesson id, e.g. '01-chao-hoi-xin-chao'",
      "word": "string — Vietnamese word or phrase EXACTLY as it appears in the text",
      "pronunciation": "string — tone-marked romanisation or IPA",
      "partOfSpeech": "noun | verb | adjective | adverb | conjunction | particle | classifier | other",
      "definition": "string — clear English definition",
      "exampleSentence": "string — the sentence from the text where this word appears",
      "exampleTranslation": "string — English translation of that sentence"
    }
  ],
  "grammarPoints": [
    {
      "id": "string",
      "pattern": "string — the grammatical construction, e.g. 'Subject + là + Noun'",
      "explanation": "string — clear English explanation for beginners",
      "exampleFromText": "string — direct quote from the lesson text showing this pattern",
      "additionalExample": "string — one more example sentence"
    }
  ],
  "culturalNotes": [
    {
      "id": "string",
      "term": "string — the word, phrase, or concept",
      "note": "string — cultural/contextual explanation in English"
    }
  ],
  "comprehensionQuestions": [
    {
      "id": "string",
      "question": "string — question in Vietnamese",
      "questionTranslation": "string — English translation",
      "type": "multiple-choice | short-answer",
      "options": ["string"],
      "answer": "string"
    }
  ]
}

Guidelines:
- The text must be genuinely beginner-level: short sentences, present tense, minimal particles, common vocabulary only
- Vocabulary words must be the EXACT string as written in the text (same capitalisation, same diacritics)
- For dialogues, use speaker labels like "A:" and "B:" on separate lines
- Comprehension questions should be answerable from the text alone
- Cultural notes should give useful real-world context`;

async function callGemini(lesson) {
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const userMessage = `Generate Lesson ${lesson.lessonNumber}: ${lesson.topicEn} (${lesson.topicVi}).

Topic description: ${lesson.prompt}

The lesson ID is "${lesson.id}". Make sure all vocabulary IDs are unique slugs prefixed with "${lesson.id}-".`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.3 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error for lesson ${lesson.lessonNumber}: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`JSON parse failed for lesson ${lesson.lessonNumber}: ${e.message}\n\nRaw: ${raw.slice(0, 400)}`);
  }
}

// ─── buildAnnotatedHtml (inlined) ─────────────────────────────────────────────

function buildAnnotatedHtml(text, vocabulary) {
  const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0);
  const sortedVocab = [...vocabulary].sort((a, b) => b.word.length - a.word.length);

  const annotate = (para) => {
    let segments = [{ text: para, done: false }];
    for (const item of sortedVocab) {
      const next = [];
      for (const seg of segments) {
        if (seg.done || !seg.text.includes(item.word)) {
          next.push(seg);
          continue;
        }
        const parts = seg.text.split(item.word);
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].length > 0) next.push({ text: parts[i], done: false });
          if (i < parts.length - 1) {
            next.push({
              text: `<span class="vl-word" data-id="${item.id}">${item.word}</span>`,
              done: true,
            });
          }
        }
      }
      segments = next;
    }
    return segments.map((s) => s.text).join("");
  };

  return paragraphs.map((p) => `<p>${annotate(p.trim())}</p>`).join("\n");
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Load existing lessons if the file exists (so we can resume/skip)
  let existing = [];
  if (existsSync(OUT_PATH)) {
    try {
      const raw = readFileSync(OUT_PATH, "utf-8");
      existing = JSON.parse(raw).lessons ?? [];
    } catch {}
  }
  const existingIds = new Set(existing.map((l) => l.id));

  const lessons = [...existing];

  for (const topic of LESSONS) {
    if (existingIds.has(topic.id)) {
      console.log(`⏭  Skipping lesson ${topic.lessonNumber} (already generated): ${topic.topicEn}`);
      continue;
    }

    console.log(`⏳ Generating lesson ${topic.lessonNumber}: ${topic.topicEn}...`);
    try {
      const material = await callGemini(topic);
      material.annotatedHtml = buildAnnotatedHtml(material.text ?? "", material.vocabulary ?? []);

      lessons.push({
        id: topic.id,
        lessonNumber: topic.lessonNumber,
        level: "beginner",
        studyMaterial: material,
      });

      // Save after each lesson so progress isn't lost on failure
      lessons.sort((a, b) => a.lessonNumber - b.lessonNumber);
      writeFileSync(OUT_PATH, JSON.stringify({ lessons }, null, 2), "utf-8");
      console.log(`✅ Lesson ${topic.lessonNumber} saved.`);

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      console.error(`❌ Failed lesson ${topic.lessonNumber}:`, err.message);
    }
  }

  console.log(`\nDone. ${lessons.length} lessons saved to ${OUT_PATH}`);
}

main();

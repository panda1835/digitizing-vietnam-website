/**
 * seed-readings.mjs
 * One-time script to generate 30 curated AI readings (10 per difficulty level)
 * and save them to /data/language-lab-readings.json.
 *
 * Usage:
 *   node --env-file=.env scripts/seed-readings.mjs
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../data/language-lab-readings.json");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
if (!GEMINI_API_KEY) { console.error("ERROR: GEMINI_API_KEY not set."); process.exit(1); }

// ─── Reading topics ────────────────────────────────────────────────────────────

const READINGS = [
  // ── BEGINNER ──────────────────────────────────────────────────────────────
  {
    id: "b01-mang-xa-hoi",
    level: "beginner",
    tag: "youth",
    topicEn: "Social Media and Young Vietnamese",
    topicVi: "Mạng Xã Hội và Giới Trẻ Việt Nam",
    prompt: "Write about how young Vietnamese people use social media (Facebook, TikTok, Zalo) in their daily lives — posting photos, chatting with friends, watching short videos. Use simple present tense and everyday vocabulary.",
    wordCount: "200–230",
  },
  {
    id: "b02-ca-phe",
    level: "beginner",
    tag: "culture",
    topicEn: "Vietnamese Coffee Culture",
    topicVi: "Văn Hóa Cà Phê Việt Nam",
    prompt: "Write about the role of coffee in Vietnamese daily life — cà phê sữa đá, cà phê trứng, sitting at a street-side café, catching up with friends. Keep vocabulary simple and the tone warm.",
    wordCount: "200–230",
  },
  {
    id: "b03-mua-sam-online",
    level: "beginner",
    tag: "youth",
    topicEn: "Online Shopping in Vietnam",
    topicVi: "Mua Sắm Online ở Việt Nam",
    prompt: "Write about online shopping habits in Vietnam today — platforms like Shopee and Lazada, ordering food on apps, receiving packages, the convenience of shopping from home. Use simple vocabulary and present tense.",
    wordCount: "200–230",
  },
  {
    id: "b04-vpop",
    level: "beginner",
    tag: "entertainment",
    topicEn: "V-pop: Vietnamese Pop Music",
    topicVi: "V-pop: Âm Nhạc Đại Chúng Việt Nam",
    prompt: "Write about the popularity of Vietnamese pop music (V-pop) among young people — listening to music on Spotify and YouTube, favourite artists, going to concerts. Use simple vocabulary.",
    wordCount: "200–230",
  },
  {
    id: "b05-the-duc",
    level: "beginner",
    tag: "youth",
    topicEn: "Fitness and Health Trends",
    topicVi: "Xu Hướng Thể Dục và Sức Khỏe",
    prompt: "Write about fitness trends among young Vietnamese — going to the gym, jogging in the park, cycling, yoga. Include simple descriptions of activities and motivations for staying healthy.",
    wordCount: "200–230",
  },
  {
    id: "b06-du-lich-trong-nuoc",
    level: "beginner",
    tag: "culture",
    topicEn: "Exploring Vietnam: Domestic Travel",
    topicVi: "Du Lịch Trong Nước",
    prompt: "Write about young Vietnamese people going on domestic trips — visiting Đà Nẵng, Hội An, Phú Quốc. Talk about booking tickets, packing, taking photos, eating local food. Use simple past and present tense.",
    wordCount: "200–230",
  },
  {
    id: "b07-dien-thoai",
    level: "beginner",
    tag: "youth",
    topicEn: "Smartphones in Everyday Life",
    topicVi: "Điện Thoại Thông Minh trong Cuộc Sống Hằng Ngày",
    prompt: "Write about how Vietnamese people use smartphones every day — waking up to phone alarms, using maps, calling family, watching videos, paying for things with apps. Simple vocabulary, present tense.",
    wordCount: "200–230",
  },
  {
    id: "b08-thuc-an-duong-pho",
    level: "beginner",
    tag: "culture",
    topicEn: "Street Food in the Modern City",
    topicVi: "Thức Ăn Đường Phố ở Thành Phố Hiện Đại",
    prompt: "Write about the vibrant street food scene in Vietnamese cities today — bánh mì stalls, phở shops, bún bò, fresh fruit stands. Talk about prices, flavours, and why Vietnamese people love eating on the street.",
    wordCount: "200–230",
  },
  {
    id: "b09-moi-truong",
    level: "beginner",
    tag: "society",
    topicEn: "Environmental Awareness Among Youth",
    topicVi: "Ý Thức Bảo Vệ Môi Trường của Giới Trẻ",
    prompt: "Write about how young Vietnamese are becoming more environmentally conscious — recycling, using reusable bags, reducing plastic straws, planting trees. Use simple vocabulary and positive, encouraging tone.",
    wordCount: "200–230",
  },
  {
    id: "b10-hoc-ngoai-ngu",
    level: "beginner",
    tag: "education",
    topicEn: "Learning Foreign Languages in Vietnam",
    topicVi: "Học Ngoại Ngữ ở Việt Nam",
    prompt: "Write about the craze for learning foreign languages (especially English and Korean) among Vietnamese students — language centres, apps like Duolingo, English-speaking clubs, reasons for wanting to learn.",
    wordCount: "200–230",
  },

  // ── INTERMEDIATE ──────────────────────────────────────────────────────────
  {
    id: "i01-khoi-nghiep-cong-nghe",
    level: "intermediate",
    tag: "technology",
    topicEn: "Vietnam's Tech Startup Boom",
    topicVi: "Làn Sóng Khởi Nghiệp Công Nghệ tại Việt Nam",
    prompt: "Write a news-style article about Vietnam's growing tech startup ecosystem — unicorn companies like VNG and MoMo, government support, young entrepreneurs, venture capital investment, challenges facing founders. Use journalistic Vietnamese with some formal vocabulary.",
    wordCount: "320–370",
  },
  {
    id: "i02-bien-doi-khi-hau-nong-nghiep",
    level: "intermediate",
    tag: "society",
    topicEn: "Climate Change and Vietnamese Farmers",
    topicVi: "Biến Đổi Khí Hậu và Nông Dân Việt Nam",
    prompt: "Write about how climate change is affecting Vietnamese farmers — rising temperatures, irregular rainfall, saltwater intrusion in the Mekong Delta, how farmers are adapting. Journalistic style, intermediate vocabulary.",
    wordCount: "320–370",
  },
  {
    id: "i03-dien-anh-viet-nam",
    level: "intermediate",
    tag: "entertainment",
    topicEn: "The Rise of Vietnamese Cinema",
    topicVi: "Sự Trỗi Dậy của Điện Ảnh Việt Nam",
    prompt: "Write about the modern Vietnamese film industry — box office hits, directors like Victor Vũ, international co-productions, streaming platforms, the challenge of competing with Hollywood. Journalistic tone, intermediate vocabulary.",
    wordCount: "320–370",
  },
  {
    id: "i04-do-thi-hoa",
    level: "intermediate",
    tag: "society",
    topicEn: "Urbanisation and Changing Vietnamese Lifestyles",
    topicVi: "Đô Thị Hóa và Sự Thay Đổi Lối Sống Người Việt",
    prompt: "Write about rapid urbanisation in Vietnam — people moving from rural areas to cities, changing family structures, the rise of apartment living, traffic congestion, both opportunities and challenges. Intermediate journalistic Vietnamese.",
    wordCount: "320–370",
  },
  {
    id: "i05-influencer-economy",
    level: "intermediate",
    tag: "youth",
    topicEn: "Influencers and the Creator Economy",
    topicVi: "Influencer và Kinh Tế Sáng Tạo Nội Dung",
    prompt: "Write about the influencer and content creator economy in Vietnam — YouTubers, TikTokers, brand deals, income from social media, both the opportunities and the pressures of being an online personality. Intermediate Vietnamese.",
    wordCount: "320–370",
  },
  {
    id: "i06-du-lich-phuc-hoi",
    level: "intermediate",
    tag: "culture",
    topicEn: "Vietnam's Tourism Recovery",
    topicVi: "Du Lịch Việt Nam Phục Hồi sau Đại Dịch",
    prompt: "Write about Vietnam's tourism sector recovering after the pandemic — returning international visitors, domestic tourism boom, popular destinations, new tourism models (eco-tourism, community tourism), remaining challenges. Intermediate journalistic style.",
    wordCount: "320–370",
  },
  {
    id: "i07-xe-dien",
    level: "intermediate",
    tag: "technology",
    topicEn: "Electric Vehicles on Vietnamese Roads",
    topicVi: "Xe Điện trên Đường Phố Việt Nam",
    prompt: "Write about the electric vehicle revolution in Vietnam — VinFast's rise, government incentives for EVs, charging infrastructure, consumer attitudes, environmental benefits, and the transition from motorbikes to electric. Intermediate vocabulary.",
    wordCount: "320–370",
  },
  {
    id: "i08-giao-duc-so",
    level: "intermediate",
    tag: "education",
    topicEn: "Education in the Digital Age",
    topicVi: "Giáo Dục trong Thời Đại Số",
    prompt: "Write about how digital technology is transforming education in Vietnam — online learning platforms, hybrid classrooms post-pandemic, coding education for children, EdTech startups, digital divide challenges. Intermediate Vietnamese.",
    wordCount: "320–370",
  },
  {
    id: "i09-am-thuc-quoc-te",
    level: "intermediate",
    tag: "culture",
    topicEn: "Vietnamese Cuisine Goes Global",
    topicVi: "Ẩm Thực Việt Nam Vươn Ra Thế Giới",
    prompt: "Write about Vietnamese food's growing international reputation — phở and bánh mì becoming global, Vietnamese restaurants abroad, chefs promoting Vietnamese cuisine on international stages, food tourism, cultural diplomacy through food.",
    wordCount: "320–370",
  },
  {
    id: "i10-viet-kieu",
    level: "intermediate",
    tag: "culture",
    topicEn: "The Vietnamese Diaspora",
    topicVi: "Cộng Đồng Việt Kiều",
    prompt: "Write about the Vietnamese diaspora — communities in the US, Australia, France, the ties they maintain with Vietnam, remittances sent home, their role in Vietnam's economy and culture, the experience of being between two cultures. Intermediate Vietnamese.",
    wordCount: "320–370",
  },

  // ── ADVANCED ──────────────────────────────────────────────────────────────
  {
    id: "a01-dia-chinh-tri",
    level: "advanced",
    tag: "politics",
    topicEn: "Vietnam's Geopolitical Balancing Act",
    topicVi: "Cân Bằng Địa Chính Trị của Việt Nam giữa Các Cường Quốc",
    prompt: "Write an analytical piece about Vietnam's strategic diplomacy between China and the United States — the 'bamboo diplomacy' doctrine, comprehensive strategic partnerships, the South China Sea disputes, economic dependence on China versus security alignment with the West. Use formal, academic Vietnamese with complex sentence structures.",
    wordCount: "420–470",
  },
  {
    id: "a02-ai-kinh-te-so",
    level: "advanced",
    tag: "technology",
    topicEn: "AI and Vietnam's Digital Economy",
    topicVi: "Trí Tuệ Nhân Tạo và Kinh Tế Số Việt Nam",
    prompt: "Write a formal analysis of artificial intelligence adoption in Vietnam's digital economy — government AI strategies, the impact on labour markets, Vietnamese AI startups, data governance challenges, opportunities and risks for a developing economy embracing AI transformation. Formal, sophisticated Vietnamese.",
    wordCount: "420–470",
  },
  {
    id: "a03-di-san-van-hoa",
    level: "advanced",
    tag: "culture",
    topicEn: "Preserving Cultural Heritage in a Modernising Vietnam",
    topicVi: "Bảo Tồn Di Sản Văn Hóa trong Bối Cảnh Việt Nam Hiện Đại Hóa",
    prompt: "Write an analytical article about the tension between rapid modernisation and the preservation of Vietnam's tangible and intangible cultural heritage — UNESCO-listed sites, traditional crafts, folk music, urban development threatening old quarters. Use formal literary Vietnamese.",
    wordCount: "420–470",
  },
  {
    id: "a04-dong-bang-scl",
    level: "advanced",
    tag: "society",
    topicEn: "The Mekong Delta's Existential Climate Crisis",
    topicVi: "Đồng Bằng Sông Cửu Long Trước Cuộc Khủng Hoảng Khí Hậu",
    prompt: "Write a deeply analytical piece about the compound environmental threats facing Vietnam's Mekong Delta — upstream dams, sea-level rise, saltwater intrusion, land subsidence, population exodus, food security implications. Use advanced, precise Vietnamese with technical environmental vocabulary.",
    wordCount: "420–470",
  },
  {
    id: "a05-cai-cach-giao-duc",
    level: "advanced",
    tag: "education",
    topicEn: "Higher Education Reform in Vietnam",
    topicVi: "Cải Cách Giáo Dục Đại Học tại Việt Nam",
    prompt: "Write a critical analysis of Vietnam's higher education reform — university autonomy legislation, the push for research output, rankings ambitions, quality vs. access tensions, brain drain, and the challenges of producing graduates who meet market demands. Formal academic Vietnamese.",
    wordCount: "420–470",
  },
  {
    id: "a06-van-hoc-duong-dai",
    level: "advanced",
    tag: "culture",
    topicEn: "Contemporary Vietnamese Literature and Identity",
    topicVi: "Văn Học Việt Nam Đương Đại và Bản Sắc Dân Tộc",
    prompt: "Write a literary-critical piece about contemporary Vietnamese literature — post-Đổi Mới fiction, writers exploring war memory, diaspora writing, the tension between official narratives and personal expression, new voices in the digital age, literature as a mirror of social change. Sophisticated literary Vietnamese.",
    wordCount: "420–470",
  },
  {
    id: "a07-di-cu-lao-dong",
    level: "advanced",
    tag: "society",
    topicEn: "Labour Migration and Its Social Consequences",
    topicVi: "Di Cư Lao Động và Hệ Quả Xã Hội",
    prompt: "Write an analytical piece about internal and international labour migration from Vietnam — workers going to Japan, South Korea, Taiwan under trainee programs, rural-to-urban migration, remittances, broken families, exploitation risks, policy responses. Formal Vietnamese with sociological vocabulary.",
    wordCount: "420–470",
  },
  {
    id: "a08-bat-binh-dang",
    level: "advanced",
    tag: "society",
    topicEn: "Income Inequality in the Era of Vietnam's Economic Miracle",
    topicVi: "Bất Bình Đẳng Thu Nhập trong Kỷ Nguyên Phát Triển Kinh Tế của Việt Nam",
    prompt: "Write a sophisticated analysis of income inequality in Vietnam amid rapid economic growth — the urban-rural divide, the emergence of a billionaire class, middle-class growth, welfare gaps, regional disparities between the north and south. Academic-journalistic Vietnamese with economics vocabulary.",
    wordCount: "420–470",
  },
  {
    id: "a09-suc-khoe-tam-than",
    level: "advanced",
    tag: "society",
    topicEn: "Mental Health Awareness and Shifting Social Norms",
    topicVi: "Nhận Thức về Sức Khỏe Tâm Thần và Sự Thay Đổi Chuẩn Mực Xã Hội",
    prompt: "Write an analytical piece about the emerging mental health conversation in Vietnam — how stigma is slowly eroding, youth burnout and academic pressure, social media's psychological effects, the shortage of mental health professionals, generational shifts in attitudes toward seeking help. Sophisticated Vietnamese.",
    wordCount: "420–470",
  },
  {
    id: "a10-asean-vai-tro",
    level: "advanced",
    tag: "politics",
    topicEn: "Vietnam's Role and Influence within ASEAN",
    topicVi: "Vai Trò và Ảnh Hưởng của Việt Nam trong ASEAN",
    prompt: "Write a formal analysis of Vietnam's evolving role within ASEAN — from a cautious new member to an increasingly assertive voice, Vietnam's ASEAN chairmanship 2020, mediating great-power competition, the South China Sea code of conduct negotiations, economic integration. Formal diplomatic Vietnamese.",
    wordCount: "420–470",
  },
];

// ─── Level-specific instructions ──────────────────────────────────────────────

const LEVEL_INSTRUCTIONS = {
  beginner: `The passage MUST be at beginner level: short simple sentences, present tense or simple past only, only the most common everyday Vietnamese vocabulary (CEFR A1–A2). Target length: {wordCount} Vietnamese words. No complex subordinate clauses. Write in an approachable, friendly register.`,
  intermediate: `The passage should be at intermediate level: varied sentence lengths, mixed tenses, news/journalism vocabulary (CEFR B1–B2). Target length: {wordCount} Vietnamese words. Use conjunctions like tuy nhiên, mặc dù, trong khi, bên cạnh đó naturally. Journalistic register.`,
  advanced: `The passage must be at advanced level: complex syntax, formal academic or journalistic register, specialised vocabulary appropriate to the topic (CEFR C1–C2). Target length: {wordCount} Vietnamese words. Use sophisticated connectors, nominalisations, passive constructions, and formal discourse markers appropriate to written Vietnamese.`,
};

// ─── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert Vietnamese language pedagogy assistant who also writes excellent Vietnamese prose. You will generate an original Vietnamese reading passage on a given contemporary topic and then produce structured study material for learners.

Always respond with ONLY valid JSON — no preamble, no markdown fences.

The JSON must match this exact shape:
{
  "title": "string — Vietnamese title of the passage",
  "titleEn": "string — English title",
  "difficulty": "beginner | intermediate | advanced",
  "summary": "string — 2–3 sentence English summary of what the passage covers",
  "text": "string — the full original Vietnamese passage as plain text with \\n between paragraphs",
  "vocabulary": [
    {
      "id": "string — unique kebab-case slug",
      "word": "string — Vietnamese word or phrase EXACTLY as it appears in the text",
      "pronunciation": "string — tone-marked romanisation",
      "partOfSpeech": "noun | verb | adjective | adverb | conjunction | particle | classifier | other",
      "definition": "string — clear English definition",
      "exampleSentence": "string — sentence from the text containing this word",
      "exampleTranslation": "string — English translation of that sentence"
    }
  ],
  "grammarPoints": [
    {
      "id": "string",
      "pattern": "string — grammatical construction demonstrated in the text",
      "explanation": "string — clear English explanation",
      "exampleFromText": "string — direct quote from the passage",
      "additionalExample": "string — another example sentence"
    }
  ],
  "culturalNotes": [
    {
      "id": "string",
      "term": "string",
      "note": "string — English cultural/contextual explanation"
    }
  ],
  "comprehensionQuestions": [
    {
      "id": "string",
      "question": "string — in Vietnamese",
      "questionTranslation": "string — English translation",
      "type": "multiple-choice | short-answer",
      "options": ["string"],
      "answer": "string"
    }
  ]
}

Vocabulary guidelines by level:
- beginner: select 8–12 items; include common words a true beginner would not yet know
- intermediate: select 12–16 items; journalistic compounds, formal particles, topic-specific vocabulary
- advanced: select 15–20 items; formal collocations, academic terms, sophisticated conjunctions

Grammar points: 2–3 for beginner, 3–4 for intermediate, 4–5 for advanced
Cultural notes: 1–2 for beginner, 2–3 for intermediate/advanced
Comprehension questions: 3–4 for beginner, 4–5 for intermediate/advanced`;

// ─── Gemini helper ─────────────────────────────────────────────────────────────

async function callGemini(reading) {
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const levelInstruction = LEVEL_INSTRUCTIONS[reading.level].replace("{wordCount}", reading.wordCount);

  const userMessage = `Topic: ${reading.topicEn} / ${reading.topicVi}
Level: ${reading.level}
Level instruction: ${levelInstruction}

Writing prompt: ${reading.prompt}

Generate the passage and study material now.`;

  const maxTokens = reading.level === "advanced" ? 6144 : reading.level === "intermediate" ? 5120 : 4096;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`JSON parse failed: ${e.message}\n\nRaw: ${raw.slice(0, 400)}`);
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
        if (seg.done || !seg.text.includes(item.word)) { next.push(seg); continue; }
        const parts = seg.text.split(item.word);
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].length > 0) next.push({ text: parts[i], done: false });
          if (i < parts.length - 1)
            next.push({ text: `<span class="vl-word" data-id="${item.id}">${item.word}</span>`, done: true });
        }
      }
      segments = next;
    }
    return segments.map((s) => s.text).join("");
  };

  return paragraphs.map((p) => `<p>${annotate(p.trim())}</p>`).join("\n");
}

function slugify(str) {
  return str.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let existing = [];
  if (existsSync(OUT_PATH)) {
    try { existing = JSON.parse(readFileSync(OUT_PATH, "utf-8")).readings ?? []; } catch {}
  }
  const existingIds = new Set(existing.map((r) => r.id));
  const readings = [...existing];

  for (const topic of READINGS) {
    if (existingIds.has(topic.id)) {
      console.log(`⏭  Skip ${topic.id}`);
      continue;
    }

    console.log(`⏳ [${topic.level}] ${topic.topicEn}…`);
    try {
      const material = await callGemini(topic);
      material.annotatedHtml = buildAnnotatedHtml(material.text ?? "", material.vocabulary ?? []);

      readings.push({
        id: topic.id,
        level: topic.level,
        tag: topic.tag,
        title: material.titleEn ?? topic.topicEn,
        titleVi: material.title ?? topic.topicVi,
        summary: material.summary ?? "",
        processedAt: new Date().toISOString(),
        studyMaterial: material,
      });

      readings.sort((a, b) => {
        const order = { beginner: 0, intermediate: 1, advanced: 2 };
        return (order[a.level] - order[b.level]) || a.id.localeCompare(b.id);
      });

      writeFileSync(OUT_PATH, JSON.stringify({ readings }, null, 2), "utf-8");
      console.log(`✅ Saved ${topic.id}`);

      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      console.error(`❌ Failed ${topic.id}:`, err.message);
    }
  }

  console.log(`\nDone. ${readings.length} readings in ${OUT_PATH}`);
}

main();

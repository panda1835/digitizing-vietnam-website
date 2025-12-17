# Multi-Book Quiz Architecture

## Book Selection Flow

```
User Opens Quiz
       │
       ├─→ Select Book Type
       │   ├─→ Luc Van Tien
       │   │   └─→ Select Page (1-104)
       │   │
       │   └─→ Ho Xuan Huong
       │       ├─→ Fetch Available Poems
       │       └─→ Select Poem from List
       │
       ├─→ Select Question Count (5/10/15/20)
       │
       └─→ Start Quiz
```

## Data Flow by Book Type

### Luc Van Tien Flow:

```
API: /api/searchable-text/luc-van-tien?page=X
     │
     ├─→ Parse XML Structure
     │   ├─→ Extract Han Nom Lines (div[0].lg[0].l)
     │   └─→ Extract Quoc Ngu Lines (div[1].lg[0].l)
     │
     ├─→ Generate Quiz Questions
     │   └─→ Add page number metadata
     │
     └─→ Display Quiz
         ├─→ Show page image (optional)
         ├─→ Link to manuscript page/line
         └─→ Toggle image visibility
```

### Ho Xuan Huong Flow:

```
API: /api/searchable-text/tinh-hoa-mua-xuan?topic=PoemTitle
     │
     ├─→ Parse Delimited Text
     │   ├─→ Split Han Nom by "#"
     │   └─→ Split Quoc Ngu by "#"
     │
     ├─→ Generate Quiz Questions
     │   └─→ Add poem title metadata
     │
     └─→ Display Quiz
         ├─→ No image (full width)
         └─→ Link to poem page
```

## Component Interaction

```
                    HanNomQuizClient
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   QuizSetup          Quiz Interface     QuizResults
        │                  │                  │
        │         ┌────────┼────────┐         │
        │         │        │        │         │
        ▼         ▼        ▼        ▼         ▼
   BookSelect  QuizHeader QuizCard PageImage  Results
        │         │        │        │         Display
        │         │        │        │         │
        ├─→ Luc Van Tien  │        │         ├─→ Book Links
        │   - Page Select │        │         │
        │                 │        │         │
        └─→ Ho Xuan Huong │        │         └─→ Context Links
            - Poem Select │        │
                         │        │
                    Based on Book Type
```

## State Management by Book

```typescript
// Common State
{
  selectedBook: BookType,          // "luc-van-tien" | "ho-xuan-huong"
  quizzes: Quiz[],                 // Generated questions
  currentQuizIndex: number,        // Current question
  score: number,                   // Current score
  quizCount: number,               // Total questions
  isQuizStarted: boolean           // Quiz state
}

// Luc Van Tien Specific
{
  selectedPage: number,            // 1-104
  totalPages: number,              // 104
  showPageImage: boolean,          // true/false
  pageData: LucVanTienPageData     // Page content
}

// Ho Xuan Huong Specific
{
  selectedPoem: string,            // Poem title
  availablePoems: string[],        // List of all poems
  pageData: HoXuanHuongPoemData   // Poem content
}
```

## Type System

```typescript
// Book Type
type BookType = "luc-van-tien" | "ho-xuan-huong";

// Quiz Type (same for both books)
type Quiz = {
  id: number;
  type: QuizType;
  hanNomText: string;
  correctAnswer: string;
  userAnswer: string;
  isAnswered: boolean;
  isCorrect: boolean | null;
  lineNumber: number;

  // Book-specific metadata
  pageNumber: number; // For Luc Van Tien
  poemTitle?: string; // For Ho Xuan Huong
};

// Data Types
type PageData = LucVanTienPageData | HoXuanHuongPoemData;

type LucVanTienPageData = {
  text: {
    page: {
      $: { pi: string; n: string };
      div: Array<{ lg: Array<{ l: Array<{ _: string }> }> }>;
    };
  };
  rawText: any;
  count: number;
};

type HoXuanHuongPoemData = {
  nom_topic: string; // Title in Han Nom
  qn_topic: string; // Title in Quoc Ngu
  en_topic: string; // Title in English
  nom: string; // Poem in Han Nom (# delimited)
  qn: string; // Poem in Quoc Ngu (# delimited)
  en: string; // Poem in English
  all_nom_topic: string[]; // All poem titles (Han Nom)
  all_qn_topic: string[]; // All poem titles (Quoc Ngu)
  all_en_topic: string[]; // All poem titles (English)
};
```

## Rendering Logic

```
if (!isQuizStarted)
  → Render: QuizSetup
    ├─→ Book Selection Dropdown
    ├─→ if (selectedBook === "luc-van-tien")
    │   └─→ Page Selection Dropdown
    └─→ if (selectedBook === "ho-xuan-huong")
        └─→ Poem Selection Dropdown

else if (isLoading || quizzes.length === 0)
  → Render: Loading Indicator

else if (showResults)
  → Render: QuizResults
    └─→ Book-aware reference links

else
  → Render: Quiz Interface
    ├─→ QuizHeader
    │   ├─→ Display: page OR poem
    │   └─→ Toggle: only if Luc Van Tien
    │
    ├─→ if (selectedBook === "luc-van-tien" && showPageImage)
    │   └─→ PageImage (2-column layout)
    │
    ├─→ QuizCard
    │   └─→ Layout: 2/3 width OR full width
    │
    └─→ Progress Bar
```

## Line Extraction Logic

```typescript
// Luc Van Tien: XML structure with nested objects
function extractLinesFromLucVanTien(data) {
  const hanNomLines = data.text.page.div[0].lg[0].l;
  const quocNguLines = data.text.page.div[1].lg[0].l;

  return lines.map((_, i) => ({
    hanNom:
      typeof hanNomLines[i] === "string" ? hanNomLines[i] : hanNomLines[i]._,
    quocNgu:
      typeof quocNguLines[i] === "string" ? quocNguLines[i] : quocNguLines[i]._,
    lineNumber: i + 1,
  }));
}

// Ho Xuan Huong: Delimited strings
function extractLinesFromHoXuanHuong(data) {
  const hanNomLines = data.nom.split("#");
  const quocNguLines = data.qn.split("#");

  return hanNomLines
    .filter((line, i) => line.trim() && quocNguLines[i]?.trim())
    .map((line, i) => ({
      hanNom: line.trim(),
      quocNgu: quocNguLines[i].trim(),
      lineNumber: i + 1,
    }));
}
```

## URL Structure

### Collection Pages:

```
Luc Van Tien:
  /[locale]/our-collections/luc-van-tien/van-tien-co-tich-tan-truyen
  ?page=X&line=Y

Ho Xuan Huong:
  /[locale]/our-collections/tho-ho-xuan-huong/tinh-hoa-mua-xuan
  ?topic=PoemTitle
```

### Quiz Page:

```
/[locale]/tools/han-nom-tools/han-nom-quiz
```

## Adding a New Book

To add a new book (e.g., Truyen Kieu):

1. **Update types.ts**

   ```typescript
   type BookType = "luc-van-tien" | "ho-xuan-huong" | "truyen-kieu";
   type TruyenKieuPageData = {
     /* structure */
   };
   ```

2. **Add fetch function in HanNomQuizClient**

   ```typescript
   const fetchTruyenKieuData = async (page: number) => {
     /* ... */
   };
   ```

3. **Add extraction function**

   ```typescript
   const extractLinesFromTruyenKieu = (data) => {
     /* ... */
   };
   ```

4. **Update QuizSetup**

   ```typescript
   <SelectItem value="truyen-kieu">Truyện Kiều</SelectItem>
   // Add selection UI (page/chapter/etc)
   ```

5. **Update startQuiz logic**

   ```typescript
   if (selectedBook === "truyen-kieu") {
     data = await fetchTruyenKieuData(selectedChapter);
     lines = extractLinesFromTruyenKieu(data);
   }
   ```

6. **Update QuizHeader, QuizResults with new book links**

## Performance Considerations

```
Initial Load:
  Luc Van Tien:    ~1-2s  (XML parsing)
  Ho Xuan Huong:   ~1-2s  (poem list + data)

Quiz Generation:  <100ms  (same for both)
Image Loading:    ~2-3s   (Luc Van Tien only)
```

## Error Handling

```
API Errors:
  ├─→ Network failure: Show error message
  ├─→ Invalid page/poem: Fallback to first available
  └─→ Empty response: Show "No data available"

Data Parsing:
  ├─→ Missing lines: Filter out empty entries
  ├─→ Mismatched counts: Use minimum length
  └─→ Invalid format: Log error, skip entry

Quiz Generation:
  ├─→ Insufficient lines: Reduce quiz count
  ├─→ Empty strings: Filter before generation
  └─→ Special characters: Handle in normalization
```

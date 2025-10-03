# Han Nom Quiz Component Structure

This folder contains the Han Nom Quiz application for testing reading skills on classical Vietnamese texts in Han Nom script.

## Supported Books

1. **Lục Vân Tiên** (Luc Van Tien) - Organized by pages (1-104)
2. **Thơ Hồ Xuân Hương** (Ho Xuan Huong Poems) - Organized by individual poems

## File Structure

```
han-nom-quiz/
├── page.tsx                      # Next.js page wrapper
├── HanNomQuizClient.tsx          # Main client component (orchestrates all parts)
├── types.ts                      # TypeScript type definitions
├── utils.ts                      # Utility functions (quiz generation, text normalization)
├── QuizSetup.tsx                 # Initial setup screen (book/page/poem/question selection)
├── QuizResults.tsx               # Results screen showing score and review
├── QuizHeader.tsx                # Header with stats and controls
├── QuizCard.tsx                  # Main quiz question card
├── PageImage.tsx                 # Manuscript page image display (Luc Van Tien only)
└── README.md                     # This file
```

## Component Responsibilities

### `HanNomQuizClient.tsx` (Main Component)
- **Purpose**: Orchestrates the entire quiz flow for both books
- **State Management**: Manages all quiz state (questions, score, progress, book selection)
- **API Calls**: Fetches data from appropriate API endpoints
- **Renders**: Different screens based on quiz state (setup, quiz, results)
- **Book Support**: Handles both Luc Van Tien (page-based) and Ho Xuan Huong (poem-based)

### `types.ts`
- **Purpose**: Centralized TypeScript type definitions
- **Contains**: 
  - BookType: "luc-van-tien" | "ho-xuan-huong"
  - Quiz, LineData types
  - LucVanTienPageData, HoXuanHuongPoemData
  - Unified PageData type

### `utils.ts`
- **Purpose**: Pure utility functions
- **Functions**:
  - `generateQuizzes()`: Creates random quiz questions from lines
  - `normalizeText()`: Normalizes text for answer comparison

### `QuizSetup.tsx`
- **Purpose**: Initial configuration screen
- **Features**:
  - Book selection (Luc Van Tien or Ho Xuan Huong)
  - Page selection dropdown for Luc Van Tien (1-104)
  - Poem selection dropdown for Ho Xuan Huong
  - Question count selection (5, 10, 15, 20)
  - Quick links to dictionary and full texts
  - Start quiz button

### `QuizResults.tsx`
- **Purpose**: Display final results and review
- **Features**:
  - Score display with percentage
  - List of all questions with correct/incorrect indicators
  - Links to manuscript/poem for each question
  - Book-aware reference links
  - Restart button

### `QuizHeader.tsx`
- **Purpose**: Top navigation and controls during quiz
- **Features**:
  - Progress indicator (question X of Y)
  - Current score
  - Current page/poem display
  - Toggle page image visibility (Luc Van Tien only)
  - Restart button
  - Book-aware quick links to dictionary and source text

### `QuizCard.tsx`
- **Purpose**: Display individual quiz question
- **Features**:
  - Han Nom text display (using custom font)
  - Input field for answer
  - Submit button
  - Feedback display (correct/incorrect)
  - Next question button

### `PageImage.tsx`
- **Purpose**: Display manuscript page image (Luc Van Tien only)
- **Features**:
  - IIIF image integration
  - Responsive sizing
  - Page number display
  - Fallback for missing images

## Features

### 1. Multi-Book Support
- **Luc Van Tien**: Page-based selection (1-104 pages)
- **Ho Xuan Huong**: Poem-based selection (individual poems)

### 2. Flexible Selection
- Choose which book to study
- Select specific page (Luc Van Tien) or poem (Ho Xuan Huong)
- Customize number of questions (5, 10, 15, or 20)

### 3. Two Question Types
- **Full Sentence Translation**: Translate entire line from Han Nom to Quoc Ngu
- **Fill-in-the-Blank**: Supply missing word in the translation

### 4. Context-Aware References
- **Luc Van Tien**: Page image displayed, links to specific page/line
- **Ho Xuan Huong**: Links to specific poem

### 5. Dictionary Integration
- Quick link to Han Nom dictionary tool for both books

### 6. Answer Validation
- Normalized comparison (case-insensitive, punctuation-agnostic)
- Immediate feedback

### 7. Progress Tracking
- Visual progress bar
- Current score display
- Question counter

## Data Flow

### Luc Van Tien Flow:
1. Select "Luc Van Tien" book
2. Choose page (1-104)
3. Choose question count
4. Fetch page data from `/api/searchable-text/luc-van-tien?page=X`
5. Extract Han Nom and Quoc Ngu lines
6. Generate quiz questions
7. Display with manuscript page image

### Ho Xuan Huong Flow:
1. Select "Ho Xuan Huong" book
2. Fetch available poems list
3. Choose poem from dropdown
4. Choose question count
5. Fetch poem data from `/api/searchable-text/tinh-hoa-mua-xuan?topic=X`
6. Extract Han Nom and Quoc Ngu lines from poem
7. Generate quiz questions
8. Display without page image

## API Integration

### Luc Van Tien API:
```
GET /api/searchable-text/luc-van-tien?page={pageNumber}
```

Response:
```typescript
{
  text: {
    page: {
      $: { pi: string, n: string },
      div: [
        { lg: [{ l: [{ _: string }] }] },  // Han Nom lines
        { lg: [{ l: [{ _: string }] }] }   // Quoc Ngu lines
      ]
    }
  },
  rawText: any,
  count: number
}
```

### Ho Xuan Huong API:
```
GET /api/searchable-text/tinh-hoa-mua-xuan?topic={poemTitle}
```

Response:
```typescript
{
  nom_topic: string,      // Poem title in Han Nom
  qn_topic: string,       // Poem title in Quoc Ngu
  en_topic: string,       // Poem title in English
  nom: string,            // Poem text in Han Nom (lines separated by #)
  qn: string,             // Poem text in Quoc Ngu (lines separated by #)
  en: string,             // Poem text in English
  note_en: string,        // Notes in English
  note_vi: string,        // Notes in Vietnamese
  all_nom_topic: string[],  // All poem titles in Han Nom
  all_qn_topic: string[],   // All poem titles in Quoc Ngu
  all_en_topic: string[]    // All poem titles in English
}
```

## Styling

- Uses Tailwind CSS for styling
- Shadcn/ui components for UI elements
- Custom NomNaTong font for Han Nom text
- Responsive layout (mobile-friendly)
- Adaptive UI based on selected book

## Book-Specific Behaviors

### Luc Van Tien:
- Shows page image toggle button
- Displays page number in header
- Links to manuscript viewer with page & line
- Image displayed alongside quiz

### Ho Xuan Huong:
- No page image (poems don't have manuscript images)
- Displays poem title in header
- Links to poem viewer with poem title
- Full-width quiz card

## Future Enhancements

Potential improvements:
- [ ] Add more books (Truyen Kieu, Quoc Am Thi Tap, etc.)
- [ ] Save quiz history/progress
- [ ] Multiple page/poem selection
- [ ] Difficulty levels
- [ ] Timed mode
- [ ] Leaderboard
- [ ] Export results
- [ ] Audio pronunciation
- [ ] Character-by-character mode

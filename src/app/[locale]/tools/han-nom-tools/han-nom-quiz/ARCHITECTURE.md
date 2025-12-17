# Component Architecture

## Component Hierarchy

```
page.tsx (Server Component)
└── LucVanTienQuizClient (Client Component - Main Orchestrator)
    ├── State: Setup / Quiz / Results
    │
    ├── [Setup State]
    │   └── QuizSetup
    │       ├── Page Selection (Select)
    │       ├── Quiz Count Selection (Select)
    │       └── Resource Links
    │
    ├── [Quiz State]
    │   ├── QuizHeader
    │   │   ├── Stats Display
    │   │   ├── Toggle Page Image Button
    │   │   ├── Restart Button
    │   │   └── Resource Links
    │   │
    │   ├── PageImage (conditional)
    │   │   └── Next Image with IIIF source
    │   │
    │   ├── QuizCard
    │   │   ├── Question Display (Han Nom text)
    │   │   ├── Input / Feedback
    │   │   └── Submit / Next Button
    │   │
    │   └── Progress Bar
    │
    └── [Results State]
        └── QuizResults
            ├── Score Summary
            ├── Question Review List
            │   └── Links to Manuscript
            └── Restart Button
```

## Data Flow

```
User Interaction          Component               State Update
─────────────────        ──────────              ─────────────

[Setup Phase]
Select Page         →    QuizSetup          →    setSelectedPage()
Select Count        →    QuizSetup          →    setQuizCount()
Click Start         →    QuizSetup          →    startQuiz()
                                            →    fetchPageData()
                                            →    generateQuizzes()
                                            →    setIsQuizStarted(true)

[Quiz Phase]
Type Answer         →    QuizCard           →    handleAnswerChange()
Submit Answer       →    QuizCard           →    handleSubmitAnswer()
                                            →    normalizeText()
                                            →    setScore()
Click Next          →    QuizCard           →    handleNextQuiz()
Toggle Image        →    QuizHeader         →    setShowPageImage()
Click Restart       →    QuizHeader         →    handleRestart()

[Results Phase]
View Results        →    QuizResults        →    (display only)
Click Restart       →    QuizResults        →    handleRestart()
```

## State Management

```typescript
// Main State (in LucVanTienQuizClient)
{
  quizzes: Quiz[],              // Array of quiz questions
  currentQuizIndex: number,     // Current question index
  score: number,                // Current score
  showResults: boolean,         // Show results screen
  isLoading: boolean,           // Loading state
  showPageImage: boolean,       // Toggle page image
  selectedPage: number,         // Selected manuscript page
  quizCount: number,            // Number of questions
  pageData: PageData | null,    // Fetched page data
  totalPages: number,           // Total available pages
  isQuizStarted: boolean        // Quiz state flag
}
```

## Props Flow

```
LucVanTienQuizClient
│
├─→ QuizSetup
│   ├── locale: string
│   ├── selectedPage: number
│   ├── setSelectedPage: (page: number) => void
│   ├── quizCount: number
│   ├── setQuizCount: (count: number) => void
│   ├── totalPages: number
│   ├── isLoading: boolean
│   └── onStartQuiz: () => void
│
├─→ QuizHeader
│   ├── locale: string
│   ├── currentQuizIndex: number
│   ├── totalQuizzes: number
│   ├── score: number
│   ├── selectedPage: number
│   ├── showPageImage: boolean
│   ├── onTogglePageImage: () => void
│   ├── onRestart: () => void
│   ├── currentQuizPageNumber: number
│   └── currentQuizLineNumber: number
│
├─→ PageImage (conditional)
│   ├── locale: string
│   ├── pageData: PageData | null
│   └── selectedPage: number
│
├─→ QuizCard
│   ├── locale: string
│   ├── quiz: Quiz
│   ├── currentQuizIndex: number
│   ├── totalQuizzes: number
│   ├── onAnswerChange: (value: string) => void
│   ├── onSubmitAnswer: () => void
│   └── onNextQuiz: () => void
│
└─→ QuizResults
    ├── locale: string
    ├── quizzes: Quiz[]
    ├── score: number
    └── onRestart: () => void
```

## Event Handlers

```typescript
// Setup Handlers
startQuiz(); // Fetch data & generate quiz
setSelectedPage(number); // Update selected page
setQuizCount(number); // Update quiz count

// Quiz Handlers
handleAnswerChange(value); // Update current answer
handleSubmitAnswer(); // Validate & score answer
handleNextQuiz(); // Move to next question
setShowPageImage(bool); // Toggle image display

// Navigation Handlers
handleRestart(); // Reset to setup screen
```

## Utility Functions

```typescript
// In utils.ts
generateQuizzes(lines, count); // Create quiz questions
normalizeText(text); // Normalize for comparison

// In LucVanTienQuizClient
fetchPageData(pageNumber); // API call to fetch page data
```

## Type System

```typescript
// types.ts
QuizType: "full-sentence" | "fill-in-blank"

Quiz {
  id, type, hanNomText, correctAnswer,
  userAnswer, isAnswered, isCorrect,
  hiddenWord?, displayText?,
  lineNumber, pageNumber
}

LineData {
  hanNom, quocNgu, lineNumber
}

PageData {
  text: { page: { ... } },
  rawText, count
}
```

## Rendering Logic

```
if (!isQuizStarted)
  → Render: QuizSetup

else if (isLoading || quizzes.length === 0)
  → Render: Loading Indicator

else if (showResults)
  → Render: QuizResults

else
  → Render: Quiz Interface
    ├── QuizHeader
    ├── PageImage (if showPageImage)
    ├── QuizCard
    └── Progress Bar
```

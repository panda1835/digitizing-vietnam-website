# Quick Reference Guide

## Common Tasks

### Adding a New Feature

1. **Determine which component to modify**

   - Setup-related? → `QuizSetup.tsx`
   - Quiz question display? → `QuizCard.tsx`
   - Results display? → `QuizResults.tsx`
   - Header/navigation? → `QuizHeader.tsx`
   - Page image? → `PageImage.tsx`
   - State/logic? → `LucVanTienQuizClient.tsx`

2. **Add new types if needed**

   - Edit `types.ts`

3. **Add utility functions if needed**
   - Edit `utils.ts`

### Modifying Quiz Generation Logic

```typescript
// Edit: utils.ts
export function generateQuizzes(lines: LineData[], count: number) {
  // Your logic here
}
```

### Changing Answer Validation

```typescript
// Edit: utils.ts
export function normalizeText(text: string): string {
  // Your normalization logic
}
```

### Adding a New Quiz Type

1. Update type definition:

```typescript
// types.ts
type QuizType = "full-sentence" | "fill-in-blank" | "your-new-type";
```

2. Update generation logic:

```typescript
// utils.ts - in generateQuizzes()
const quizType: QuizType = /* your selection logic */;
```

3. Update display logic:

```typescript
// QuizCard.tsx - add case for new type
```

### Modifying Page Selection

```typescript
// QuizSetup.tsx - in Page Selection section
<SelectContent className="max-h-[300px]">
  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
    // Your modification here
  ))}
</SelectContent>
```

### Changing Quiz Count Options

```typescript
// QuizSetup.tsx - in Quiz Count Selection
<SelectContent>
  {[5, 10, 15, 20, 25, 30].map((count) => ( // Add more options
    // ...
  ))}
</SelectContent>
```

### Adding a New Link

```typescript
// QuizSetup.tsx or QuizHeader.tsx
<Link
  href={`/${locale}/your-new-path`}
  className="flex items-center gap-2 text-blue-600 hover:underline"
  target="_blank"
>
  <YourIcon className="w-4 h-4" />
  {locale === "vi" ? "Vietnamese Text" : "English Text"}
  <ExternalLink className="w-3 h-3" />
</Link>
```

### Modifying Scoring Logic

```typescript
// LucVanTienQuizClient.tsx - in handleSubmitAnswer()
const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

// Add your custom scoring logic here
if (isCorrect) {
  setScore(score + 1); // Change points awarded
}
```

### Changing Progress Bar Style

```typescript
// LucVanTienQuizClient.tsx - Progress bar section
<div
  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
  style={{
    width: `${((currentQuizIndex + 1) / quizzes.length) * 100}%`,
  }}
/>
```

### Adding API Parameters

```typescript
// LucVanTienQuizClient.tsx - in fetchPageData()
const response = await fetch(
  `${apiUrl}/searchable-text/luc-van-tien?page=${pageNumber}&yourParam=${value}`
);
```

### Customizing Image Display

```typescript
// PageImage.tsx
<Image
  src={`https://.../${pageData.text.page.$.pi}/full/full/0/default.jpg`}
  width={400} // Change dimensions
  height={600}
  quality={85} // Add quality setting
  priority // Add priority loading
/>
```

## Component Communication

### Parent → Child (Props)

```typescript
<ChildComponent data={parentData} onAction={parentHandler} />
```

### Child → Parent (Callbacks)

```typescript
// In parent:
const handleAction = (value: string) => {
  // Handle the action
};

// Pass to child:
<Child onAction={handleAction} />;

// In child:
props.onAction(someValue);
```

## State Updates

### Simple State

```typescript
const [value, setValue] = useState<Type>(initialValue);
setValue(newValue);
```

### State with Objects

```typescript
const updatedQuizzes = [...quizzes]; // Copy array
updatedQuizzes[index].property = newValue;
setQuizzes(updatedQuizzes);
```

## Debugging Tips

### Check Current State

```typescript
console.log("Current Quiz:", currentQuiz);
console.log("All Quizzes:", quizzes);
console.log("Page Data:", pageData);
```

### Log API Response

```typescript
const data = await response.json();
console.log("API Response:", data);
```

### Verify Answer Comparison

```typescript
console.log("User Answer (normalized):", normalizedUserAnswer);
console.log("Correct Answer (normalized):", normalizedCorrectAnswer);
console.log("Is Correct:", isCorrect);
```

## Styling Reference

### Tailwind Classes Used

**Layout:**

- `flex`, `flex-col`, `flex-row`
- `gap-2`, `gap-4`, `gap-6`
- `w-full`, `lg:w-1/3`, `lg:w-2/3`
- `max-w-2xl`, `max-w-6xl`
- `mx-auto`, `mb-4`, `mt-4`, `p-4`

**Typography:**

- `text-sm`, `text-lg`, `text-2xl`, `text-3xl`, `text-4xl`
- `font-medium`, `font-bold`, `font-semibold`
- `text-center`

**Colors:**

- `text-gray-600`, `text-blue-600`
- `bg-green-50`, `bg-red-50`
- `border-green-500`, `border-red-500`

**Interactive:**

- `hover:underline`
- `disabled:opacity-50`
- `transition-all`, `duration-300`

## Common Issues & Solutions

### Issue: Quiz not starting

- **Check:** API response format matches expected structure
- **Check:** pageData has valid text.page.div structure

### Issue: Images not loading

- **Check:** IIIF URL is correct
- **Check:** next.config.mjs has correct domain
- **Check:** Page has valid `pi` property

### Issue: Answer always incorrect

- **Check:** normalizeText() function
- **Check:** API returns correct quocNgu text
- **Check:** No extra whitespace in data

### Issue: Page doesn't update

- **Check:** State is being set correctly
- **Check:** Component is receiving updated props
- **Check:** No stale closures in event handlers

## Testing Checklist

```
□ Setup screen displays correctly
□ Page selection works (1-104)
□ Quiz count selection works (5/10/15/20)
□ Start button triggers quiz
□ API call succeeds
□ Quiz questions generate
□ Han Nom text displays correctly
□ Answer input works
□ Submit validates answer
□ Correct/incorrect feedback shows
□ Score updates
□ Next button advances
□ Progress bar updates
□ Page image toggles
□ Links open correctly
□ Results screen shows all data
□ Restart returns to setup
□ Responsive on mobile
□ Works in both locales
```

## File Sizes (Approximate)

```
LucVanTienQuizClient.tsx  ~230 lines  ~7KB
QuizSetup.tsx             ~135 lines  ~4KB
QuizResults.tsx           ~120 lines  ~4KB
QuizCard.tsx              ~155 lines  ~5KB
QuizHeader.tsx            ~95 lines   ~3KB
PageImage.tsx             ~40 lines   ~1KB
types.ts                  ~45 lines   ~1KB
utils.ts                  ~85 lines   ~2KB
───────────────────────────────────────────
Total                     ~905 lines  ~27KB
```

## Dependencies

```json
{
  "react": "^18.x",
  "next": "^14.x",
  "next-intl": "^3.x",
  "@radix-ui/*": "^1.x", // via shadcn/ui
  "lucide-react": "^0.x",
  "tailwindcss": "^3.x"
}
```

## Environment Variables

```bash
# Optional - defaults to /api
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Performance Tips

1. Use `React.memo()` for components that re-render frequently
2. Memoize expensive calculations with `useMemo()`
3. Debounce input if needed
4. Consider virtualizing long result lists
5. Lazy load images with Next.js Image

## Accessibility Improvements

```typescript
// Add ARIA labels
<button aria-label="Submit answer">

// Add keyboard shortcuts
onKeyDown={(e) => {
  if (e.key === 'Enter') handleSubmit();
}}

// Add focus management
autoFocus
```

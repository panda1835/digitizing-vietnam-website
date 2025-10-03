import type { Quiz, LineData, QuizType } from "./types";

export function generateQuizzes(lines: LineData[], count: number = 10): Quiz[] {
  const quizzes: Quiz[] = [];
  const usedIndices = new Set<number>();

  // Ensure we don't try to generate more quizzes than available lines
  const actualCount = Math.min(count, lines.length);

  // Generate quizzes ensuring we have a mix
  for (let i = 0; i < actualCount; i++) {
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * lines.length);
    } while (usedIndices.has(randomIndex));
    usedIndices.add(randomIndex);

    const line = lines[randomIndex];
    const quizType: QuizType = i % 2 === 0 ? "full-sentence" : "fill-in-blank";

    if (quizType === "full-sentence") {
      quizzes.push({
        id: i,
        type: "full-sentence",
        hanNomText: line.hanNom,
        correctAnswer: line.quocNgu,
        userAnswer: "",
        isAnswered: false,
        isCorrect: null,
        lineNumber: line.lineNumber,
        pageNumber: 0, // Will be set by parent component
      });
    } else {
      // For fill-in-blank, hide a random word
      const words = line.quocNgu.split(" ");
      if (words.length > 1) {
        const wordIndex = Math.floor(Math.random() * words.length);
        const hiddenWord = words[wordIndex];
        const displayText = words
          .map((w, idx) => (idx === wordIndex ? "______" : w))
          .join(" ");

        quizzes.push({
          id: i,
          type: "fill-in-blank",
          hanNomText: line.hanNom,
          correctAnswer: hiddenWord,
          userAnswer: "",
          isAnswered: false,
          isCorrect: null,
          hiddenWord: hiddenWord,
          displayText: displayText,
          lineNumber: line.lineNumber,
          pageNumber: 0, // Will be set by parent component
        });
      } else {
        // If only one word, make it full sentence instead
        quizzes.push({
          id: i,
          type: "full-sentence",
          hanNomText: line.hanNom,
          correctAnswer: line.quocNgu,
          userAnswer: "",
          isAnswered: false,
          isCorrect: null,
          lineNumber: line.lineNumber,
          pageNumber: 0, // Will be set by parent component
        });
      }
    }
  }

  return quizzes;
}

export function normalizeText(text: string): string {
  // Remove extra whitespace, normalize punctuation
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[,.\t]/g, "");
}

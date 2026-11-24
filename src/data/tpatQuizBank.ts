import { QuizExamCode, QuizQuestion } from '../types/studio';
import { TPAT21_QUESTIONS } from './tpat21Questions';
import { TPAT4_QUESTIONS } from './tpat4Questions';

export type QuizTrackFilter = 'mixed' | QuizExamCode;
export type QuizEraFilter = 'all' | 'past_5y' | 'forecast_5y';

export const ALL_TPAT_QUESTIONS: QuizQuestion[] = [
  ...TPAT4_QUESTIONS,
  ...TPAT21_QUESTIONS,
];

export const DAILY_QUIZ_LIMIT = 5;

export function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shuffleQuestionOptions(q: QuizQuestion): QuizQuestion {
  const indexed = q.options.map((text, idx) => ({
    text,
    isCorrect: idx === q.correctIndex,
  }));
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  return {
    ...q,
    options: indexed.map((item) => item.text),
    correctIndex: Math.max(0, indexed.findIndex((item) => item.isCorrect)),
  };
}

export function pickNonRepeatingQuizQuestion(
  trackFilter: QuizTrackFilter,
  eraFilter: QuizEraFilter,
  answeredIds: string[],
  currentQuestionId?: string
): { question: QuizQuestion; poolExhausted: boolean; remainingCount: number; totalCount: number } {
  const filteredPool = ALL_TPAT_QUESTIONS.filter((q) => {
    if (trackFilter !== 'mixed' && q.examCode !== trackFilter) return false;
    if (eraFilter !== 'all' && q.era !== eraFilter) return false;
    return true;
  });

  const answeredSet = new Set(answeredIds);
  const unseen = filteredPool.filter(
    (q) => !answeredSet.has(q.id) && q.id !== currentQuestionId
  );

  if (unseen.length > 0) {
    const picked = unseen[Math.floor(Math.random() * unseen.length)];
    return {
      question: shuffleQuestionOptions(picked),
      poolExhausted: false,
      remainingCount: unseen.length,
      totalCount: filteredPool.length,
    };
  }

  // Fallback only if user finished 100% of all questions in the filtered pool
  const fallbackPool = filteredPool.filter((q) => q.id !== currentQuestionId);
  const source = fallbackPool.length > 0 ? fallbackPool : filteredPool;
  const picked = source[Math.floor(Math.random() * source.length)];
  return {
    question: shuffleQuestionOptions(picked),
    poolExhausted: true,
    remainingCount: 0,
    totalCount: filteredPool.length,
  };
}

export interface SRSCard {
  interval: number;      // days until next review
  repetitions: number;   // consecutive successful reviews
  easeFactor: number;    // minimum 1.3, default 2.5
  nextReview: string;    // YYYY-MM-DD
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createCard(): SRSCard {
  return { interval: 1, repetitions: 0, easeFactor: 2.5, nextReview: todayStr() };
}

// SM-2 algorithm: quality 0-5 (≥3 = correct, <3 = incorrect)
export function reviewCard(card: SRSCard, quality: 0 | 1 | 2 | 3 | 4 | 5): SRSCard {
  let { interval, repetitions, easeFactor } = card;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return { interval, repetitions, easeFactor, nextReview: next.toISOString().slice(0, 10) };
}

export function isDue(card: SRSCard): boolean {
  return card.nextReview <= todayStr();
}

export function countDue(srsData: Record<string, SRSCard>): number {
  return Object.values(srsData).filter(isDue).length;
}

export function nextReviewLabel(card: SRSCard): string {
  const diff = Math.ceil(
    (new Date(card.nextReview).getTime() - new Date(todayStr()).getTime()) / 86400000
  );
  if (diff <= 0) return 'Сегодня';
  if (diff === 1) return 'Завтра';
  if (diff < 7) return `Через ${diff} дн.`;
  if (diff < 30) return `Через ${Math.round(diff / 7)} нед.`;
  return `Через ${Math.round(diff / 30)} мес.`;
}

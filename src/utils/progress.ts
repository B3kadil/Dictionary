import { Category, Progress, WordStatus } from '../types';

export function getCategoryStats(category: Category, progress: Progress) {
  const cat = progress[category.id] ?? {};
  const total = category.words.length;
  const known = Object.values(cat).filter(s => s === 'known').length;
  const unknown = Object.values(cat).filter(s => s === 'unknown').length;
  const unseen = total - known - unknown;
  const percent = total === 0 ? 0 : Math.round((known / total) * 100);
  return { total, known, unknown, unseen, percent };
}

export function getTotalKnown(categories: Category[], progress: Progress): number {
  return categories.reduce((sum, cat) => {
    const catProg = progress[cat.id] ?? {};
    return sum + Object.values(catProg).filter(s => s === 'known').length;
  }, 0);
}

export function getWordStatus(
  categoryId: number,
  wordIndex: number,
  progress: Progress
): WordStatus {
  return progress[categoryId]?.[wordIndex] ?? 'unseen';
}

export function getUnknownIndices(category: Category, progress: Progress): number[] {
  const cat = progress[category.id] ?? {};
  return category.words.map((_, i) => i).filter(i => {
    const s = cat[i];
    return s === 'unknown' || s === 'unseen';
  });
}

export function progressColor(percent: number): string {
  if (percent === 0) return '#ef4444';
  if (percent < 50) return '#f97316';
  if (percent < 100) return '#eab308';
  return '#22c55e';
}

export function categoryGradient(index: number): string {
  const gradients = [
    'from-blue-600 to-blue-800',
    'from-purple-600 to-purple-800',
    'from-pink-600 to-pink-800',
    'from-indigo-600 to-indigo-800',
    'from-teal-600 to-teal-800',
    'from-cyan-600 to-cyan-800',
    'from-violet-600 to-violet-800',
    'from-fuchsia-600 to-fuchsia-800',
    'from-sky-600 to-sky-800',
    'from-emerald-600 to-emerald-800',
  ];
  return gradients[index % gradients.length];
}

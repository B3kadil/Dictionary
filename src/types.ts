export interface Word {
  english: string;
  transcription: string;
  russian: string;
}

export interface Category {
  id: number;
  name: string;
  words: Word[];
}

export interface VocabularyMeta {
  title: string;
  subtitle?: string;
  author?: string;
  total_words: number;
  total_categories: number;
}

export interface VocabularyData {
  meta: VocabularyMeta;
  categories: Category[];
}

export type WordStatus = 'known' | 'unknown' | 'unseen';

export interface CategoryProgress {
  [wordIndex: number]: WordStatus;
}

export interface Progress {
  [categoryId: number]: CategoryProgress;
}

export interface StudySession {
  categoryId: number;
  studyUnknownOnly: boolean;
  shuffled: boolean;
  reversed: boolean;
}

export type Screen =
  | { type: 'home' }
  | { type: 'flashcard'; session: StudySession }
  | { type: 'results'; categoryId: number; results: SessionResult[] }
  | { type: 'stats' };

export interface SessionResult {
  wordIndex: number;
  word: Word;
  status: WordStatus;
}

export interface DifficultyRecord {
  [wordKey: string]: number; // key = "catId-wordIndex", value = wrong count
}

export interface AppStorage {
  progress: Progress;
  difficulty: DifficultyRecord;
  lastStudied: string | null; // ISO date string
  streakDays: number;
  streakLastDate: string | null;
}

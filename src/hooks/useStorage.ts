import { useState, useCallback } from 'react';
import { AppStorage, Progress, DifficultyRecord, SRSData } from '../types';
import { createCard, reviewCard } from '../utils/srs';

const STORAGE_KEY = 'flashcard_progress';

const defaultStorage: AppStorage = {
  progress: {},
  difficulty: {},
  lastStudied: null,
  streakDays: 0,
  streakLastDate: null,
  srs: {},
};

function load(): AppStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStorage;
    return { ...defaultStorage, ...JSON.parse(raw) };
  } catch {
    return defaultStorage;
  }
}

function save(data: AppStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function useStorage() {
  const [storage, setStorage] = useState<AppStorage>(load);

  const updateProgress = useCallback((
    categoryId: number,
    wordIndex: number,
    status: 'known' | 'unknown'
  ) => {
    setStorage(prev => {
      const next: AppStorage = {
        ...prev,
        progress: {
          ...prev.progress,
          [categoryId]: {
            ...prev.progress[categoryId],
            [wordIndex]: status,
          },
        },
        lastStudied: todayISO(),
      };

      // Difficulty tracking
      if (status === 'unknown') {
        const key = `${categoryId}-${wordIndex}`;
        next.difficulty = {
          ...prev.difficulty,
          [key]: (prev.difficulty[key] ?? 0) + 1,
        };
      }

      // SRS update: enter SRS when first known; reset interval when unknown
      const srsKey = `${categoryId}-${wordIndex}`;
      const existing = prev.srs[srsKey];
      if (status === 'known') {
        next.srs = {
          ...prev.srs,
          [srsKey]: existing ? reviewCard(existing, 4) : createCard(),
        };
      } else if (status === 'unknown' && existing) {
        next.srs = {
          ...prev.srs,
          [srsKey]: reviewCard(existing, 1),
        };
      }

      // Streak logic
      const today = todayISO();
      const last = prev.streakLastDate;
      if (last !== today) {
        if (last === yesterday()) {
          next.streakDays = prev.streakDays + 1;
        } else {
          next.streakDays = 1;
        }
        next.streakLastDate = today;
      }

      save(next);
      return next;
    });
  }, []);

  // SRS-only review (doesn't touch binary progress/difficulty)
  const reviewSRS = useCallback((
    categoryId: number,
    wordIndex: number,
    quality: 0 | 1 | 2 | 3 | 4 | 5
  ) => {
    setStorage(prev => {
      const srsKey = `${categoryId}-${wordIndex}`;
      const existing = prev.srs[srsKey] ?? createCard();
      const next: AppStorage = {
        ...prev,
        srs: { ...prev.srs, [srsKey]: reviewCard(existing, quality) },
      };
      save(next);
      return next;
    });
  }, []);

  const resetCategory = useCallback((categoryId: number) => {
    setStorage(prev => {
      const next: AppStorage = {
        ...prev,
        progress: { ...prev.progress, [categoryId]: {} },
      };
      save(next);
      return next;
    });
  }, []);

  const getProgress = useCallback((): Progress => storage.progress, [storage.progress]);
  const getDifficulty = useCallback((): DifficultyRecord => storage.difficulty, [storage.difficulty]);
  const getSRS = useCallback((): SRSData => storage.srs, [storage.srs]);

  return { storage, updateProgress, reviewSRS, resetCategory, getProgress, getDifficulty, getSRS };
}

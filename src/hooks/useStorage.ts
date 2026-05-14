import { useState, useCallback } from 'react';
import { AppStorage, Progress, DifficultyRecord } from '../types';

const STORAGE_KEY = 'flashcard_progress';

const defaultStorage: AppStorage = {
  progress: {},
  difficulty: {},
  lastStudied: null,
  streakDays: 0,
  streakLastDate: null,
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

      if (status === 'unknown') {
        const key = `${categoryId}-${wordIndex}`;
        next.difficulty = {
          ...prev.difficulty,
          [key]: (prev.difficulty[key] ?? 0) + 1,
        };
      }

      // streak logic
      const today = todayISO();
      const last = prev.streakLastDate;
      if (last === today) {
        // same day, no change
      } else if (last === yesterday()) {
        next.streakDays = prev.streakDays + 1;
        next.streakLastDate = today;
      } else {
        next.streakDays = 1;
        next.streakLastDate = today;
      }

      save(next);
      return next;
    });
  }, []);

  const resetCategory = useCallback((categoryId: number) => {
    setStorage(prev => {
      const next: AppStorage = {
        ...prev,
        progress: {
          ...prev.progress,
          [categoryId]: {},
        },
      };
      save(next);
      return next;
    });
  }, []);

  const getProgress = useCallback((): Progress => {
    return storage.progress;
  }, [storage.progress]);

  const getDifficulty = useCallback((): DifficultyRecord => {
    return storage.difficulty;
  }, [storage.difficulty]);

  return {
    storage,
    updateProgress,
    resetCategory,
    getProgress,
    getDifficulty,
  };
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

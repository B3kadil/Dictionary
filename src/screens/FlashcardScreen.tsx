import { useState, useEffect, useCallback, useMemo } from 'react';
import { Category, Progress, Screen, SessionResult, StudySession } from '../types';
import { getUnknownIndices } from '../utils/progress';
import Flashcard from '../components/Flashcard';
import ProgressBar from '../components/ProgressBar';

interface Props {
  session: StudySession;
  categories: Category[];
  progress: Progress;
  onWordResult: (categoryId: number, wordIndex: number, status: 'known' | 'unknown') => void;
  onNavigate: (screen: Screen) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardScreen({ session, categories, progress, onWordResult, onNavigate }: Props) {
  const category = categories.find(c => c.id === session.categoryId)!;

  const indices = useMemo(() => {
    let base: number[];
    if (session.studyUnknownOnly) {
      base = getUnknownIndices(category, progress);
      if (base.length === 0) base = category.words.map((_, i) => i);
    } else {
      base = category.words.map((_, i) => i);
    }
    return session.shuffled ? shuffle(base) : base;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.categoryId, session.studyUnknownOnly, session.shuffled]);

  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [, setIsFlipped] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');

  const currentIndex = indices[current];
  const currentWord = category.words[currentIndex];
  const total = indices.length;
  const percent = Math.round((current / total) * 100);

  const advance = useCallback((status: 'known' | 'unknown') => {
    onWordResult(session.categoryId, currentIndex, status);
    const result: SessionResult = { wordIndex: currentIndex, word: currentWord, status };

    if (current + 1 >= total) {
      onNavigate({
        type: 'results',
        categoryId: session.categoryId,
        results: [...results, result],
      });
      return;
    }

    setSlideDir(status === 'known' ? 'right' : 'left');
    setResults(r => [...r, result]);
    setCurrent(c => c + 1);
    setAnimKey(k => k + 1);
    setIsFlipped(false);
  }, [current, currentIndex, currentWord, results, session.categoryId, total, onWordResult, onNavigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(f => !f);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        advance('known');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        advance('unknown');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0f2340 0%, #1A365D 100%)' }}>
      {/* Top bar */}
      <div className="px-4 pt-5 pb-3 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => onNavigate({ type: 'home' })}
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-sm truncate">{category.name}</h2>
          </div>
          <span className="text-white/50 text-sm tabular-nums flex-shrink-0">
            {current + 1} / {total}
          </span>
        </div>
        <ProgressBar percent={percent} height={4} />
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 max-w-lg mx-auto w-full">
        <div
          key={animKey}
          className={slideDir === 'right' ? 'animate-slide-in-right w-full' : 'animate-slide-in-left w-full'}
        >
          <Flashcard
            word={currentWord}
            reversed={session.reversed}
            onFlip={setIsFlipped}
            animationKey={animKey}
          />
        </div>

        {/* Hint */}
        <p className="text-white/25 text-xs mt-4 text-center">
          Space / tap card to flip · ← Don't know · → Know it
        </p>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-8 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => advance('unknown')}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition-all active:scale-95 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #b91c1c, #991b1b)',
              boxShadow: '0 4px 20px rgba(185, 28, 28, 0.4)',
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Don't know
          </button>
          <button
            onClick={() => advance('known')}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition-all active:scale-95 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #15803d, #166534)',
              boxShadow: '0 4px 20px rgba(21, 128, 61, 0.4)',
            }}
          >
            Know it!
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

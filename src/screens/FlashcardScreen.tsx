import { useState, useEffect, useCallback, useMemo } from 'react';
import { Category, Progress, Screen, SessionResult, StudySession } from '../types';
import { getUnknownIndices } from '../utils/progress';
import { useSwipe } from '../hooks/useSwipe';
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
  const [animKey, setAnimKey] = useState(0);
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');
  const [reversed, setReversed] = useState(session.reversed);
  const [history, setHistory] = useState<number[]>([]);

  const currentIndex = indices[current];
  const currentWord = category.words[currentIndex];
  const total = indices.length;
  const percent = Math.round((current / total) * 100);

  const isBrowse = !!session.browse;

  const advance = useCallback((status: 'known' | 'unknown') => {
    onWordResult(session.categoryId, currentIndex, status);
    const result: SessionResult = { wordIndex: currentIndex, word: currentWord, status };
    const newResults = [...results.filter(r => r.wordIndex !== currentIndex), result];

    if (current + 1 >= total) {
      onNavigate({ type: 'results', categoryId: session.categoryId, results: newResults });
      return;
    }

    setSlideDir(status === 'known' ? 'right' : 'left');
    setResults(newResults);
    setHistory(h => [...h, current]);
    setCurrent(c => c + 1);
    setAnimKey(k => k + 1);
  }, [current, currentIndex, currentWord, results, session.categoryId, total, onWordResult, onNavigate]);

  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setSlideDir('left');
    setCurrent(prev);
    setAnimKey(k => k + 1);
  }, [history]);

  const browseNext = useCallback(() => {
    if (current + 1 >= total) {
      onNavigate({ type: 'home' });
      return;
    }
    setHistory(h => [...h, current]);
    setSlideDir('right');
    setCurrent(c => c + 1);
    setAnimKey(k => k + 1);
  }, [current, total, onNavigate]);

  const browsePrev = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setSlideDir('left');
    setCurrent(prev);
    setAnimKey(k => k + 1);
  }, [history]);

  const swipe = useSwipe({
    onSwipeLeft: () => isBrowse ? browsePrev() : advance('unknown'),
    onSwipeRight: () => isBrowse ? browseNext() : advance('known'),
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); isBrowse ? browseNext() : advance('known'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); isBrowse ? browsePrev() : advance('unknown'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, browseNext, browsePrev, isBrowse]);

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
            Назад
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-sm truncate">{category.name}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isBrowse && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                Просмотр
              </span>
            )}
            {/* Reversed toggle */}
            <button
              onClick={() => setReversed(r => !r)}
              className={`p-1.5 rounded-lg transition-colors ${reversed ? 'bg-blue-500/30 text-blue-300' : 'text-white/30 hover:text-white/60'}`}
              title="Рус ↔ Англ"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
            <span className="text-white/50 text-sm tabular-nums">{current + 1}/{total}</span>
          </div>
        </div>
        <ProgressBar percent={percent} height={4} />
      </div>

      {/* Card area with swipe */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 max-w-lg mx-auto w-full">
        <div
          key={animKey}
          className={`w-full ${slideDir === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
          style={{ touchAction: 'pan-y' }}
          onTouchStart={swipe.onTouchStart}
          onTouchEnd={swipe.onTouchEnd}
          onClickCapture={swipe.onClickCapture}
        >
          <Flashcard
            word={currentWord}
            reversed={reversed}
            onFlip={() => {}}
            animationKey={animKey}
          />
        </div>

        <p className="text-white/20 text-xs mt-4 text-center">
          {isBrowse
            ? '← Назад · Коснитесь чтобы перевернуть · Вперёд →'
            : '← Не знаю · Коснитесь чтобы перевернуть · Знаю →'}
        </p>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-8 max-w-lg mx-auto w-full" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        {isBrowse ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={browsePrev}
              disabled={history.length === 0}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white bg-white/12 hover:bg-white/18 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>
            {current + 1 < total ? (
              <button
                onClick={browseNext}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}
              >
                Вперёд
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => onNavigate({ type: 'home' })}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #15803d, #166534)', boxShadow: '0 4px 20px rgba(21,128,61,0.4)' }}
              >
                Готово
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {/* Back button */}
            <button
              onClick={goBack}
              disabled={history.length === 0}
              className="flex items-center justify-center py-4 rounded-2xl font-semibold text-white bg-white/10 hover:bg-white/15 disabled:opacity-25 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => advance('unknown')}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #b91c1c, #991b1b)', boxShadow: '0 4px 20px rgba(185,28,28,0.4)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Нет
            </button>
            <button
              onClick={() => advance('known')}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #15803d, #166534)', boxShadow: '0 4px 20px rgba(21,128,61,0.4)' }}
            >
              Да
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

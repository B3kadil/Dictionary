import { useState, useMemo, useCallback, useRef } from 'react';
import { Category, Screen, SRSCard, SRSData, Word } from '../types';
import { isDue, reviewCard, nextReviewLabel } from '../utils/srs';
import { useSwipe } from '../hooks/useSwipe';
import Flashcard from '../components/Flashcard';
import ProgressBar from '../components/ProgressBar';

interface Props {
  categories: Category[];
  srsData: SRSData;
  onReview: (categoryId: number, wordIndex: number, quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
  onNavigate: (screen: Screen) => void;
}

interface DueItem {
  catId: number;
  wordIndex: number;
  word: Word;
  catName: string;
  card: SRSCard;
}

type Phase = 'idle' | 'reviewing' | 'done';

export default function SRSScreen({ categories, srsData, onReview, onNavigate }: Props) {
  const dueItems = useMemo<DueItem[]>(() => {
    const items: DueItem[] = [];
    for (const [key, card] of Object.entries(srsData)) {
      if (!isDue(card)) continue;
      const [catId, wordIndex] = key.split('-').map(Number);
      const cat = categories.find(c => c.id === catId);
      if (!cat) continue;
      const word = cat.words[wordIndex];
      if (!word) continue;
      items.push({ catId, wordIndex, word, catName: cat.name, card });
    }
    return items.sort(() => Math.random() - 0.5);
  }, [srsData, categories]);

  const [phase, setPhase] = useState<Phase>('idle');
  const [queue, setQueue] = useState<DueItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [slideDir, setSlideDir] = useState<'right' | 'left'>('right');
  const [reviewed, setReviewed] = useState<{ item: DueItem; quality: 4 | 1 }[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [feedbackIdx, setFeedbackIdx] = useState<number | null>(null);

  const startReview = () => {
    setQueue([...dueItems]);
    setCurrent(0);
    setAnimKey(0);
    setReviewed([]);
    setFeedbackIdx(null);
    setPhase('reviewing');
  };

  const handleAnswer = useCallback((quality: 4 | 1) => {
    if (feedbackIdx !== null) return;
    const item = queue[current];
    onReview(item.catId, item.wordIndex, quality);
    setReviewed(r => [...r, { item, quality }]);
    setFeedbackIdx(quality);

    timerRef.current = setTimeout(() => {
      setFeedbackIdx(null);
      if (current + 1 >= queue.length) {
        setPhase('done');
      } else {
        setSlideDir(quality === 4 ? 'right' : 'left');
        setCurrent(c => c + 1);
        setAnimKey(k => k + 1);
      }
    }, 800);
  }, [feedbackIdx, queue, current, onReview]);

  const swipe = useSwipe({
    onSwipeLeft: () => handleAnswer(1),
    onSwipeRight: () => handleAnswer(4),
  });

  // ── Idle: show overview ──────────────────────────────────────────────────
  if (phase === 'idle') {
    const nextDue = Object.values(srsData)
      .filter(c => !isDue(c))
      .map(c => c.nextReview)
      .sort()[0];

    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0f2340 0%, #1A365D 100%)' }}>
        <div className="px-4 pt-6 pb-8 max-w-lg mx-auto w-full flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => onNavigate({ type: 'home' })} className="text-white/60 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-white text-xl font-bold">Интервальное повторение</h1>
          </div>

          {dueItems.length > 0 ? (
            <>
              {/* Due cards info */}
              <div
                className="rounded-3xl p-6 mb-6 text-center border border-amber-500/20"
                style={{ background: 'rgba(245,158,11,0.12)' }}
              >
                <div className="text-5xl mb-3">📅</div>
                <div className="text-white text-4xl font-bold mb-1">{dueItems.length}</div>
                <div className="text-amber-300/80 text-sm">слов ожидают повторения</div>
              </div>

              {/* SM-2 explanation */}
              <div className="bg-white/5 border border-white/8 rounded-2xl p-4 mb-6">
                <p className="text-white/50 text-sm leading-relaxed">
                  Алгоритм интервального повторения (SM-2) показывает слова в оптимальный момент — когда вы вот-вот начнёте забывать. Это в 5× эффективнее обычного повторения.
                </p>
              </div>

              <button
                onClick={startReview}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', boxShadow: '0 4px 24px rgba(217,119,6,0.4)' }}
              >
                Начать повторение
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">😌</div>
                <h2 className="text-white text-xl font-bold mb-2">Всё повторено!</h2>
                <p className="text-white/50 text-sm mb-2">Нет карточек для повторения сегодня.</p>
                {nextDue && (
                  <p className="text-white/35 text-sm">
                    Следующее повторение: {nextReviewLabel({ interval: 0, repetitions: 0, easeFactor: 2.5, nextReview: nextDue })}
                  </p>
                )}
                {Object.keys(srsData).length === 0 && (
                  <p className="text-white/35 text-sm mt-4 max-w-xs">
                    Изучите слова в режиме карточек — они автоматически добавятся в очередь повторения.
                  </p>
                )}
              </div>
              <button
                onClick={() => onNavigate({ type: 'home' })}
                className="w-full py-3.5 rounded-2xl font-semibold text-white/80 bg-white/10 hover:bg-white/15 transition-all active:scale-95"
              >
                На главную
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Reviewing ────────────────────────────────────────────────────────────
  if (phase === 'reviewing') {
    const item = queue[current];
    const total = queue.length;
    const percent = Math.round((current / total) * 100);
    const nextCard = reviewCard(item.card, (feedbackIdx ?? 4) as 0 | 1 | 2 | 3 | 4 | 5);

    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0f2340 0%, #1A365D 100%)' }}>
        <div className="px-4 pt-5 pb-3 max-w-lg mx-auto w-full">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); setPhase('idle'); }}
              className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Выйти
            </button>
            <div className="flex-1" />
            <span className="text-white/50 text-sm tabular-nums">{current + 1}/{total}</span>
            {/* Interval preview */}
            {feedbackIdx !== null && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${feedbackIdx === 4 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {nextReviewLabel(nextCard)}
              </span>
            )}
          </div>
          <ProgressBar percent={percent} height={4} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-lg mx-auto w-full">
          <p className="text-white/35 text-xs mb-2 uppercase tracking-widest">{item.catName}</p>
          <div
            key={animKey}
            className={`w-full ${slideDir === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
            style={{ touchAction: 'pan-y' }}
            onTouchStart={swipe.onTouchStart}
            onTouchEnd={swipe.onTouchEnd}
            onClickCapture={swipe.onClickCapture}
          >
            <Flashcard word={item.word} reversed={false} onFlip={() => {}} animationKey={animKey} />
          </div>
          <p className="text-white/20 text-xs mt-4">← Не знаю · Знаю →</p>
        </div>

        <div className="px-4 pb-8 max-w-lg mx-auto w-full" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAnswer(1)}
              disabled={feedbackIdx !== null}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #b91c1c, #991b1b)', boxShadow: '0 4px 20px rgba(185,28,28,0.4)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Не знаю
            </button>
            <button
              onClick={() => handleAnswer(4)}
              disabled={feedbackIdx !== null}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #15803d, #166534)', boxShadow: '0 4px 20px rgba(21,128,61,0.4)' }}
            >
              Знаю
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  const knownCount = reviewed.filter(r => r.quality === 4).length;
  const unknownCount = reviewed.length - knownCount;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f2340 0%, #1A365D 100%)' }}>
      <div className="px-4 pt-8 pb-10 max-w-lg mx-auto">
        <div
          className="rounded-3xl p-6 mb-6 text-center border border-white/10"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div className="text-5xl mb-3">
            {knownCount / reviewed.length >= 0.8 ? '🎯' : '📚'}
          </div>
          <div className="text-white text-3xl font-bold mb-1">
            {knownCount}/{reviewed.length}
          </div>
          <div className="text-white/50 text-sm">слов повторено</div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="text-green-400 font-bold text-xl">{knownCount}</div>
              <div className="text-white/40 text-xs">знаю</div>
            </div>
            <div className="text-center">
              <div className="text-red-400 font-bold text-xl">{unknownCount}</div>
              <div className="text-white/40 text-xs">не знаю</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={startReview}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}
          >
            Ещё раз
          </button>
          <button
            onClick={() => onNavigate({ type: 'home' })}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-white/80 bg-white/10 hover:bg-white/15 transition-all active:scale-95"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Category, Screen, SessionResult } from '../types';
import Confetti from '../components/Confetti';

interface Props {
  categoryId: number;
  results: SessionResult[];
  categories: Category[];
  onNavigate: (screen: Screen) => void;
  onReset: (categoryId: number) => void;
}

export default function ResultsScreen({ categoryId, results, categories, onNavigate, onReset }: Props) {
  const category = categories.find(c => c.id === categoryId)!;
  const known = results.filter(r => r.status === 'known');
  const unknown = results.filter(r => r.status === 'unknown');
  const total = results.length;
  const percent = total === 0 ? 0 : Math.round((known.length / total) * 100);
  const perfect = percent === 100;

  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0f2340 0%, #1A365D 100%)' }}>
      {perfect && <Confetti />}

      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-lg mx-auto w-full">
        {/* Score card */}
        <div
          className={`w-full rounded-3xl p-6 mb-6 text-center transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{
            background: perfect
              ? 'linear-gradient(135deg, #14532d, #15803d)'
              : 'linear-gradient(135deg, #1e3a6e, #2a4d8f)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <div className="text-5xl mb-3">
            {perfect ? '🎉' : percent >= 70 ? '💪' : percent >= 40 ? '📚' : '🌱'}
          </div>
          <h2 className="text-white text-2xl font-bold mb-1">
            {perfect ? 'Идеальный результат!' : 'Раунд завершён!'}
          </h2>
          <p className="text-white/60 text-sm mb-6">{category.name}</p>

          <div className="flex items-end justify-center gap-1 mb-2">
            <span className="text-white text-6xl font-bold">{known.length}</span>
            <span className="text-white/50 text-2xl mb-2">/ {total}</span>
          </div>
          <p className="text-white/60 text-sm">слов ты знал</p>

          {/* Mini progress bar */}
          <div className="mt-5 w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: show ? `${percent}%` : '0%',
                backgroundColor: perfect ? '#4ade80' : percent >= 70 ? '#60a5fa' : '#f59e0b',
              }}
            />
          </div>
          <p className="text-white/40 text-xs mt-1.5">{percent}%</p>
        </div>

        {/* Unknown words list */}
        {unknown.length > 0 && (
          <div className={`w-full mb-6 transition-all duration-500 delay-200 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              Слова для повторения ({unknown.length})
            </h3>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {unknown.map(r => (
                <div
                  key={r.wordIndex}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/8"
                >
                  <div>
                    <span className="text-white font-medium text-sm">{r.word.english}</span>
                    <span className="text-white/40 text-xs ml-2">{r.word.transcription}</span>
                  </div>
                  <span className="text-white/60 text-sm">{r.word.russian}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className={`w-full space-y-3 transition-all duration-500 delay-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {unknown.length > 0 && (
            <button
              onClick={() =>
                onNavigate({
                  type: 'flashcard',
                  session: {
                    categoryId,
                    studyUnknownOnly: true,
                    shuffled: true,
                    reversed: false,
                  },
                })
              }
              className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all active:scale-95 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
            >
              Учить незнакомые слова ({unknown.length})
            </button>
          )}

          <button
            onClick={() => {
              onReset(categoryId);
              onNavigate({
                type: 'flashcard',
                session: { categoryId, studyUnknownOnly: false, shuffled: false, reversed: false },
              });
            }}
            className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all active:scale-95 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1e4d8c, #1e3a6e)' }}
          >
            Сначала
          </button>

          <button
            onClick={() => onNavigate({ type: 'home' })}
            className="w-full py-3.5 rounded-2xl font-semibold text-white/80 bg-white/8 hover:bg-white/12 transition-all active:scale-95"
          >
            К категориям
          </button>
        </div>
      </div>
    </div>
  );
}

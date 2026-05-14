import { useState, useEffect } from 'react';
import { Word } from '../types';

interface Props {
  word: Word;
  reversed: boolean;
  onFlip?: (isFlipped: boolean) => void;
  animationKey: number;
}

function speak(text: string, lang: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

export default function Flashcard({ word, reversed, onFlip, animationKey }: Props) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false);
  }, [animationKey]);

  const handleFlip = () => {
    const next = !flipped;
    setFlipped(next);
    onFlip?.(next);
  };

  const front = reversed
    ? { main: word.russian, sub: null, label: 'Русский', lang: 'ru-RU' }
    : { main: word.english, sub: word.transcription, label: 'Английский', lang: 'en-US' };

  const back = reversed
    ? { main: word.english, sub: word.transcription, label: 'Английский', lang: 'en-US' }
    : { main: word.russian, sub: null, label: 'Русский', lang: 'ru-RU' };

  return (
    <div
      className="card-scene w-full cursor-pointer select-none"
      style={{ height: 260 }}
      onClick={handleFlip}
    >
      <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
        {/* Front */}
        <div
          className="card-face rounded-3xl flex flex-col items-center justify-center p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, #1e3a6e 0%, #2a4d8f 50%, #1e3a6e 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div className="text-white/30 text-xs font-medium uppercase tracking-widest mb-6">
            {front.label}
          </div>
          <div className="text-white text-3xl font-bold leading-tight mb-3">
            {front.main}
          </div>
          {front.sub && (
            <div className="text-blue-300/70 text-base font-mono mt-1">{front.sub}</div>
          )}
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={e => { e.stopPropagation(); speak(front.main, front.lang); }}
              className="text-white/25 hover:text-white/60 transition-colors p-1"
              title="Произнести"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M6.343 6.343a8 8 0 000 11.314" />
              </svg>
            </button>
            <span className="text-white/20 text-xs flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              перевернуть
            </span>
          </div>
        </div>

        {/* Back */}
        <div
          className="card-face card-back rounded-3xl flex flex-col items-center justify-center p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, #1a4a2e 0%, #1e6b3a 50%, #1a4a2e 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <div className="text-white/30 text-xs font-medium uppercase tracking-widest mb-6">
            {back.label}
          </div>
          <div className="text-white text-3xl font-bold leading-tight mb-3">
            {back.main}
          </div>
          {back.sub && (
            <div className="text-green-300/70 text-base font-mono mt-1">{back.sub}</div>
          )}
          <button
            onClick={e => { e.stopPropagation(); speak(back.main, back.lang); }}
            className="mt-6 text-white/25 hover:text-white/60 transition-colors p-1"
            title="Произнести"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M6.343 6.343a8 8 0 000 11.314" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

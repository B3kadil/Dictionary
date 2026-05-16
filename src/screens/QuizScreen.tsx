import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Category, Progress, Screen, Word } from '../types';
import ProgressBar from '../components/ProgressBar';

interface Props {
  categories: Category[];
  progress: Progress;
  onNavigate: (screen: Screen) => void;
}

interface QuizQuestion {
  word: Word;
  catName: string;
  options: string[];
  correctIndex: number;
}

type Phase = 'setup' | 'playing' | 'done';
type QuizMode = 'choice' | 'type';

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

function buildQuestions(
  categories: Category[],
  catId: number | null,
  count: number
): QuizQuestion[] {
  const allRussian = categories.flatMap(c => c.words.map(w => w.russian));

  const pool = catId !== null
    ? categories.find(c => c.id === catId)!.words.map(w => ({
        word: w,
        catName: categories.find(c => c.id === catId)!.name,
        catWords: categories.find(c => c.id === catId)!.words,
      }))
    : categories.flatMap(c => c.words.map(w => ({ word: w, catName: c.name, catWords: c.words })));

  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);

  return shuffled.map(item => {
    const correct = item.word.russian;
    const sameCatWrongs = item.catWords
      .map(w => w.russian)
      .filter(r => r !== correct)
      .sort(() => Math.random() - 0.5);

    let wrongs: string[];
    if (sameCatWrongs.length >= 3) {
      wrongs = sameCatWrongs.slice(0, 3);
    } else {
      const otherWrongs = allRussian
        .filter(r => r !== correct && !sameCatWrongs.includes(r))
        .sort(() => Math.random() - 0.5);
      wrongs = [...sameCatWrongs, ...otherWrongs.slice(0, 3 - sameCatWrongs.length)];
    }

    const options = [...wrongs, correct].sort(() => Math.random() - 0.5);
    return {
      word: item.word,
      catName: item.catName,
      options,
      correctIndex: options.indexOf(correct),
    };
  });
}

// ─── Setup ───────────────────────────────────────────────────────────────────

interface SetupProps {
  categories: Category[];
  catId: number | null;
  setCatId: (id: number | null) => void;
  count: number;
  setCount: (n: number) => void;
  maxCount: number;
  mode: QuizMode;
  setMode: (m: QuizMode) => void;
  timerSec: number;
  setTimerSec: (s: number) => void;
  onStart: () => void;
  onBack: () => void;
}

function SetupView({
  categories, catId, setCatId, count, setCount, maxCount,
  mode, setMode, timerSec, setTimerSec, onStart, onBack,
}: SetupProps) {
  const presets = [10, 20, 50].filter(n => n <= maxCount);
  if (!presets.includes(maxCount)) presets.push(maxCount);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0f2340 0%, #1A365D 100%)' }}>
      <div className="px-4 pt-6 pb-8 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="text-white/60 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-bold">Режим тестирования</h1>
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="text-white/60 text-sm font-medium mb-2 block">Категория</label>
          <div className="relative">
            <select
              value={catId ?? ''}
              onChange={e => setCatId(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none appearance-none cursor-pointer"
            >
              <option value="" style={{ background: '#1A365D' }}>Все категории</option>
              {categories.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#1A365D' }}>{c.name}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Answer mode */}
        <div className="mb-6">
          <label className="text-white/60 text-sm font-medium mb-2 block">Режим ответа</label>
          <div className="grid grid-cols-2 gap-2">
            {(['choice', 'type'] as QuizMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 text-white/60 hover:bg-white/15'
                }`}
              >
                {m === 'choice' ? '4 варианта' : 'Ввод текста'}
              </button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="mb-6">
          <label className="text-white/60 text-sm font-medium mb-2 block">Таймер</label>
          <div className="flex gap-2">
            {[0, 5, 10, 15].map(s => (
              <button
                key={s}
                onClick={() => setTimerSec(s)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  timerSec === s
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 text-white/60 hover:bg-white/15'
                }`}
              >
                {s === 0 ? 'Выкл' : `${s}с`}
              </button>
            ))}
          </div>
        </div>

        {/* Question count */}
        <div className="mb-8">
          <label className="text-white/60 text-sm font-medium mb-2 block">Количество вопросов</label>
          <div className="flex gap-2">
            {presets.map(n => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                  count === n
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 text-white/60 hover:bg-white/15'
                }`}
              >
                {n === maxCount && n !== 10 && n !== 20 && n !== 50 ? 'Все' : n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all active:scale-95 hover:scale-[1.01]"
          style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            boxShadow: '0 4px 24px rgba(37, 99, 235, 0.5)',
          }}
        >
          Начать тест
        </button>
      </div>
    </div>
  );
}

// ─── Playing ─────────────────────────────────────────────────────────────────

interface PlayingProps {
  question: QuizQuestion;
  current: number;
  total: number;
  score: number;
  selected: number | null;
  mode: QuizMode;
  timerSec: number;
  typedValue: string;
  onTypedChange: (v: string) => void;
  onAnswer: (idx: number) => void;
  onTypedSubmit: () => void;
  onBack: () => void;
}

function PlayingView({
  question, current, total, score, selected, mode, timerSec,
  typedValue, onTypedChange, onAnswer, onTypedSubmit, onBack,
}: PlayingProps) {
  const [timeLeft, setTimeLeft] = useState(timerSec);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeLeft(timerSec);
    if (mode === 'type') setTimeout(() => inputRef.current?.focus(), 50);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  useEffect(() => {
    if (timerSec === 0 || selected !== null) return;
    if (timeLeft <= 0) { onAnswer(-1); return; }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, timerSec, selected, onAnswer]);

  const percent = Math.round((current / total) * 100);
  const timerRatio = timerSec > 0 ? timeLeft / timerSec : 1;
  const timerColor = timerRatio > 0.5 ? '#93c5fd' : timerRatio > 0.25 ? '#fbbf24' : '#f87171';

  const btnStyle = (idx: number) => {
    if (selected === null) return 'bg-white/10 border-white/10 text-white hover:bg-white/15 active:scale-95';
    if (idx === question.correctIndex) return 'bg-green-600/80 border-green-500/60 text-white scale-[1.01]';
    if (idx === selected) return 'bg-red-600/80 border-red-500/60 text-white';
    return 'bg-white/5 border-white/5 text-white/30';
  };

  const isCorrectTyped = selected !== null && selected === question.correctIndex;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0f2340 0%, #1A365D 100%)' }}>
      {/* Top bar */}
      <div className="px-4 pt-5 pb-3 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Выйти
          </button>
          <div className="flex-1" />
          {timerSec > 0 && selected === null && (
            <span className="text-sm font-bold tabular-nums transition-colors" style={{ color: timerColor }}>
              {timeLeft}с
            </span>
          )}
          <span className="text-white/50 text-sm tabular-nums">{current + 1} / {total}</span>
          <span
            className="ml-2 px-2.5 py-0.5 rounded-full text-sm font-semibold tabular-nums"
            style={{ background: 'rgba(37,99,235,0.3)', color: '#93c5fd' }}
          >
            {score} ✓
          </span>
        </div>
        <ProgressBar percent={percent} height={4} />
        {timerSec > 0 && (
          <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${timerRatio * 100}%`, background: timerColor }}
            />
          </div>
        )}
      </div>

      {/* Question card */}
      <div className="flex-1 flex flex-col justify-center px-4 max-w-lg mx-auto w-full">
        <div className="bg-white/8 border border-white/10 rounded-3xl p-6 mb-6 text-center">
          <p className="text-white/40 text-xs mb-3 uppercase tracking-widest">Переведи слово</p>
          <h2 className="text-white text-3xl font-bold mb-2">{question.word.english}</h2>
          <p className="text-white/40 text-sm">{question.word.transcription}</p>
          <p className="text-white/25 text-xs mt-2">{question.catName}</p>
          <button
            onClick={() => speak(question.word.english)}
            className="mt-3 text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/10"
            title="Произнести"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M6.343 6.343a8 8 0 000 11.314" />
            </svg>
          </button>
        </div>

        {mode === 'choice' ? (
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => onAnswer(idx)}
                disabled={selected !== null}
                className={`w-full py-4 px-5 rounded-2xl border text-left font-medium transition-all ${btnStyle(idx)}`}
              >
                <span className="text-white/40 text-sm mr-3">{String.fromCharCode(65 + idx)}.</span>
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={typedValue}
              onChange={e => onTypedChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && selected === null && typedValue.trim()) onTypedSubmit(); }}
              disabled={selected !== null}
              placeholder="Введи перевод на русском..."
              className={`w-full px-5 py-4 rounded-2xl text-white text-base font-medium focus:outline-none transition-all border ${
                selected === null
                  ? 'bg-white/10 border-white/10 placeholder-white/30 focus:border-blue-400/50 focus:bg-white/15'
                  : isCorrectTyped
                  ? 'bg-green-600/30 border-green-500/50 text-green-200'
                  : 'bg-red-600/30 border-red-500/50 text-red-200'
              }`}
            />
            {selected !== null && !isCorrectTyped && (
              <div className="px-4 py-3 rounded-2xl bg-green-600/20 border border-green-500/30 text-green-300 text-sm text-center">
                Правильно: <span className="font-semibold">{question.options[question.correctIndex]}</span>
              </div>
            )}
            {selected === null && (
              <button
                onClick={onTypedSubmit}
                disabled={!typedValue.trim()}
                className="w-full py-4 rounded-2xl font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}
              >
                Проверить
              </button>
            )}
          </div>
        )}
      </div>
      <div className="pb-6" />
    </div>
  );
}

// ─── Done ────────────────────────────────────────────────────────────────────

interface DoneProps {
  score: number;
  total: number;
  questions: QuizQuestion[];
  userAnswers: number[];
  typedInputs: string[];
  mode: QuizMode;
  onRetry: () => void;
  onHome: () => void;
}

function DoneView({ score, total, questions, userAnswers, typedInputs, mode, onRetry, onHome }: DoneProps) {
  const percent = Math.round((score / total) * 100);
  const grade =
    percent >= 90 ? { emoji: '🏆', label: 'Отлично!', color: '#22c55e' } :
    percent >= 70 ? { emoji: '👍', label: 'Хорошо!', color: '#3b82f6' } :
    percent >= 50 ? { emoji: '📚', label: 'Неплохо', color: '#f59e0b' } :
                    { emoji: '💪', label: 'Нужно повторить', color: '#ef4444' };

  const wrong = questions
    .map((q, i) => ({ q, userIdx: userAnswers[i], typed: typedInputs[i] ?? '' }))
    .filter(({ q, userIdx }) => userIdx !== q.correctIndex);

  const wrongLabel = (q: QuizQuestion, userIdx: number, typed: string) => {
    if (userIdx === -1) return typed || 'Время вышло';
    return mode === 'type' ? typed : q.options[userIdx] ?? '—';
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f2340 0%, #1A365D 100%)' }}>
      <div className="px-4 pt-8 pb-10 max-w-lg mx-auto">
        <div
          className="rounded-3xl p-6 mb-6 text-center border border-white/10"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div className="text-5xl mb-3">{grade.emoji}</div>
          <div className="text-white text-4xl font-bold mb-1">{score}/{total}</div>
          <div className="font-semibold text-lg mb-1" style={{ color: grade.color }}>{grade.label}</div>
          <div className="text-white/40 text-sm">{percent}% правильных ответов</div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={onRetry}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}
          >
            Повторить
          </button>
          <button
            onClick={onHome}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-white/80 bg-white/10 hover:bg-white/15 transition-all active:scale-95"
          >
            На главную
          </button>
        </div>

        {wrong.length > 0 && (
          <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
            <h3 className="text-white/60 text-sm font-semibold mb-3">Ошибки ({wrong.length})</h3>
            <div className="space-y-3">
              {wrong.map(({ q, userIdx, typed }, i) => (
                <div key={i} className="border-b border-white/5 last:border-0 pb-3 last:pb-0">
                  <div className="text-white text-sm font-medium mb-1">{q.word.english}</div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-red-400 line-through">{wrongLabel(q, userIdx, typed)}</span>
                    <span className="text-white/30">→</span>
                    <span className="text-green-400">{q.options[q.correctIndex]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {wrong.length === 0 && (
          <div className="text-center py-4 text-white/30 text-sm">Все ответы верны!</div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function QuizScreen({ categories, onNavigate }: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [catId, setCatId] = useState<number | null>(null);
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState<QuizMode>('choice');
  const [timerSec, setTimerSec] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [typedInputs, setTypedInputs] = useState<string[]>([]);
  const [typedValue, setTypedValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxCount = useMemo(() => {
    if (catId !== null) {
      return categories.find(c => c.id === catId)?.words.length ?? 10;
    }
    return Math.min(categories.reduce((s, c) => s + c.words.length, 0), 50);
  }, [catId, categories]);

  useEffect(() => {
    const clamped = Math.min(count, maxCount);
    if (clamped !== count) setCount(clamped || 10);
  }, [maxCount, count]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const startQuiz = useCallback(() => {
    const qs = buildQuestions(categories, catId, count);
    setQuestions(qs);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setUserAnswers([]);
    setTypedInputs([]);
    setTypedValue('');
    setPhase('playing');
  }, [categories, catId, count]);

  const handleAnswer = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const isCorrect = idx !== -1 && idx === questions[current].correctIndex;
    if (isCorrect) setScore(s => s + 1);
    setUserAnswers(a => [...a, idx]);

    timerRef.current = setTimeout(() => {
      if (current + 1 >= questions.length) {
        setPhase('done');
      } else {
        setCurrent(c => c + 1);
        setSelected(null);
        setTypedValue('');
      }
    }, 900);
  }, [selected, questions, current]);

  const handleTypedSubmit = useCallback(() => {
    if (!typedValue.trim() || selected !== null) return;
    const correct = questions[current].options[questions[current].correctIndex];
    const isCorrect = typedValue.trim().toLowerCase() === correct.toLowerCase();
    setTypedInputs(t => [...t, typedValue.trim()]);
    handleAnswer(isCorrect ? questions[current].correctIndex : -1);
  }, [typedValue, selected, questions, current, handleAnswer]);

  if (phase === 'setup') {
    return (
      <SetupView
        categories={categories}
        catId={catId}
        setCatId={setCatId}
        count={count}
        setCount={setCount}
        maxCount={maxCount}
        mode={mode}
        setMode={setMode}
        timerSec={timerSec}
        setTimerSec={setTimerSec}
        onStart={startQuiz}
        onBack={() => onNavigate({ type: 'home' })}
      />
    );
  }

  if (phase === 'playing') {
    return (
      <PlayingView
        question={questions[current]}
        current={current}
        total={questions.length}
        score={score}
        selected={selected}
        mode={mode}
        timerSec={timerSec}
        typedValue={typedValue}
        onTypedChange={setTypedValue}
        onAnswer={handleAnswer}
        onTypedSubmit={handleTypedSubmit}
        onBack={() => { if (timerRef.current) clearTimeout(timerRef.current); setPhase('setup'); }}
      />
    );
  }

  return (
    <DoneView
      score={score}
      total={questions.length}
      questions={questions}
      userAnswers={userAnswers}
      typedInputs={typedInputs}
      mode={mode}
      onRetry={startQuiz}
      onHome={() => onNavigate({ type: 'home' })}
    />
  );
}

import { useState, useMemo, useEffect } from 'react';
import { Category, Progress, Screen, WordStatus } from '../types';

interface Props {
  categories: Category[];
  progress: Progress;
  onNavigate: (screen: Screen) => void;
}

type StatusFilter = 'all' | 'known' | 'unknown' | 'unseen';

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: 'Все',
  known: 'Знаю',
  unknown: 'Не знаю',
  unseen: 'Новые',
};

const STATUS_DOT: Record<WordStatus, string> = {
  known: 'bg-green-400',
  unknown: 'bg-red-400',
  unseen: 'bg-white/25',
};

export default function WordListScreen({ categories, progress, onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const allWords = useMemo(
    () =>
      categories.flatMap(cat =>
        cat.words.map((word, i) => ({
          word,
          catId: cat.id,
          catName: cat.name,
          idx: i,
          status: (progress[cat.id]?.[i] ?? 'unseen') as WordStatus,
        }))
      ),
    [categories, progress]
  );

  const filtered = useMemo(() => {
    return allWords.filter(item => {
      if (catFilter !== null && item.catId !== catFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.word.english.toLowerCase().includes(q) ||
          item.word.russian.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allWords, catFilter, statusFilter, search]);

  const counts = useMemo(() => {
    const base = catFilter !== null ? allWords.filter(w => w.catId === catFilter) : allWords;
    const c = { all: base.length, known: 0, unknown: 0, unseen: 0 };
    base.forEach(w => c[w.status]++);
    return c;
  }, [allWords, catFilter]);

  const [visibleCount, setVisibleCount] = useState(100);
  useEffect(() => { setVisibleCount(100); }, [search, catFilter, statusFilter]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f2340 0%, #1A365D 100%)' }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 px-4 pt-5 pb-3 backdrop-blur-sm"
        style={{ background: 'rgba(15, 35, 64, 0.92)' }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Title row */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => onNavigate({ type: 'home' })}
              className="text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-white text-xl font-bold flex-1">Словарь</h1>
            <span className="text-white/40 text-sm">{filtered.length} слов</span>
          </div>

          {/* Search */}
          <div className="relative mb-2.5">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Поиск по английскому или русскому..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400/50 transition-all"
            />
          </div>

          {/* Category dropdown */}
          <div className="relative mb-2.5">
            <select
              value={catFilter ?? ''}
              onChange={e => setCatFilter(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm focus:outline-none appearance-none cursor-pointer"
            >
              <option value="" style={{ background: '#1A365D' }}>
                Все категории ({categories.length})
              </option>
              {categories.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#1A365D' }}>
                  {c.name}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Status filter chips */}
          <div className="flex gap-2">
            {(['all', 'known', 'unknown', 'unseen'] as StatusFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/55 hover:bg-white/15'
                }`}
              >
                {STATUS_LABEL[f]}
                <span className="ml-1 opacity-60">({counts[f]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Word list */}
      <div className="px-4 pb-10 pt-2 max-w-2xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <p className="text-lg">Ничего не найдено</p>
            <p className="text-sm mt-1">Попробуйте другой поиск или фильтр</p>
          </div>
        ) : (
          <div className="space-y-1">
            {visible.map(item => (
              <div
                key={`${item.catId}-${item.idx}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[item.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm">{item.word.english}</span>
                    <span className="text-white/35 text-xs">{item.word.transcription}</span>
                  </div>
                  <div className="text-white/60 text-sm mt-0.5">{item.word.russian}</div>
                </div>
                <span className="text-white/25 text-xs flex-shrink-0 text-right truncate" style={{ maxWidth: 72 }}>
                  {item.catName.replace(/^\d+[A-Za-z]* — /, '').slice(0, 14)}
                </span>
              </div>
            ))}
            {hasMore && (
              <button
                onClick={() => setVisibleCount(c => c + 100)}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 text-sm transition-colors mt-2"
              >
                Показать ещё {Math.min(100, filtered.length - visibleCount)} из {filtered.length - visibleCount}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

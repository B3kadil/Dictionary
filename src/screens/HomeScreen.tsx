import { useState } from 'react';
import { Category, Progress, Screen } from '../types';
import { getTotalKnown } from '../utils/progress';
import CategoryCard from '../components/CategoryCard';
import ProgressBar from '../components/ProgressBar';

interface Props {
  categories: Category[];
  totalWords: number;
  progress: Progress;
  onNavigate: (screen: Screen) => void;
}

export default function HomeScreen({ categories, totalWords, progress, onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const totalKnown = getTotalKnown(categories, progress);
  const totalPercent = totalWords === 0 ? 0 : Math.round((totalKnown / totalWords) * 100);

  const filtered = search.trim()
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f2340 0%, #1A365D 50%, #1e3a5f 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 pt-6 pb-4 backdrop-blur-sm" style={{ background: 'rgba(15, 35, 64, 0.85)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                My English Dictionary
              </h1>
              <p className="text-white/50 text-sm mt-0.5">English File 4th Edition</p>
            </div>
            <button
              onClick={() => onNavigate({ type: 'stats' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white/80 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Stats
            </button>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => onNavigate({ type: 'wordlist' })}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/16 transition-colors text-white/85 text-sm font-medium border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Словарь
            </button>
            <button
              onClick={() => onNavigate({ type: 'quiz' })}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors text-white text-sm font-medium border border-blue-500/40"
              style={{ background: 'rgba(37,99,235,0.25)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Тест
            </button>
          </div>

          {/* Overall progress */}
          <div className="bg-white/8 rounded-2xl p-4 border border-white/10 mb-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-white/70 text-sm">Overall progress</span>
              <span className="text-white font-bold text-lg">{totalKnown} <span className="text-white/50 font-normal text-sm">/ {totalWords}</span></span>
            </div>
            <ProgressBar percent={totalPercent} height={8} />
            <p className="text-white/40 text-xs mt-2">{totalPercent}% of all vocabulary learned</p>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Category grid */}
      <div className="px-4 pb-8 max-w-2xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <p className="text-lg">No categories found</p>
            <p className="text-sm mt-1">Try a different search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                index={i}
                progress={progress}
                onClick={() =>
                  onNavigate({
                    type: 'flashcard',
                    session: {
                      categoryId: cat.id,
                      studyUnknownOnly: false,
                      shuffled: false,
                      reversed: false,
                    },
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

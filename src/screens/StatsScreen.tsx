import { Category, Screen } from '../types';
import { AppStorage } from '../types';
import { getCategoryStats, getTotalKnown } from '../utils/progress';

interface Props {
  categories: Category[];
  totalWords: number;
  storage: AppStorage;
  onNavigate: (screen: Screen) => void;
}

export default function StatsScreen({ categories, totalWords, storage, onNavigate }: Props) {
  const { progress, difficulty, streakDays } = storage;

  const totalKnown = getTotalKnown(categories, progress);
  const totalPercent = totalWords === 0 ? 0 : Math.round((totalKnown / totalWords) * 100);

  // Hard words: wrong 3+ times
  const hardWords = Object.entries(difficulty)
    .filter(([, count]) => count >= 3)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([key, count]) => {
      const [catId, wordIdx] = key.split('-').map(Number);
      const cat = categories.find(c => c.id === catId);
      const word = cat?.words[wordIdx];
      return word ? { word, count, catName: cat!.name } : null;
    })
    .filter(Boolean) as { word: { english: string; transcription: string; russian: string }; count: number; catName: string }[];

  // Category completion breakdown
  const completed = categories.filter(c => getCategoryStats(c, progress).percent === 100);
  const inProgress = categories.filter(c => {
    const { percent, known } = getCategoryStats(c, progress);
    return percent < 100 && known > 0;
  });

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f2340 0%, #1A365D 100%)' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => onNavigate({ type: 'home' })}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-xl font-bold">Статистика</h1>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard value={totalKnown.toString()} label="Изучено слов" icon="📚" color="from-blue-700 to-blue-900" />
          <StatCard value={`${streakDays}d`} label="Серия дней" icon="🔥" color="from-orange-700 to-orange-900" />
          <StatCard value={`${totalPercent}%`} label="Выполнено" icon="🎯" color="from-purple-700 to-purple-900" />
        </div>

        {/* Category breakdown */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/8 mb-4">
          <h3 className="text-white/70 text-sm font-semibold mb-3">Статус категорий</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                Завершено
              </span>
              <span className="text-white font-semibold">{completed.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                В процессе
              </span>
              <span className="text-white font-semibold">{inProgress.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/20 inline-block" />
                Не начато
              </span>
              <span className="text-white font-semibold">{categories.length - completed.length - inProgress.length}</span>
            </div>
          </div>
        </div>

        {/* Hard words */}
        {hardWords.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/8">
            <h3 className="text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
              <span>⚠️</span> Сложные слова
            </h3>
            <div className="space-y-2">
              {hardWords.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <span className="text-white text-sm font-medium">{item.word.english}</span>
                    <span className="text-white/40 text-xs ml-1.5">{item.word.russian}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-xs">{item.catName.slice(0, 12)}…</span>
                    <span className="text-red-400 text-xs font-semibold bg-red-400/10 px-2 py-0.5 rounded-full">
                      ✗{item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hardWords.length === 0 && (
          <div className="text-center py-8 text-white/30">
            <div className="text-4xl mb-2">🌟</div>
            <p className="text-sm">Сложных слов нет!</p>
            <p className="text-xs mt-1">Слова с 3+ ошибками появятся здесь.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
  return (
    <div className={`rounded-2xl p-3 bg-gradient-to-br ${color} border border-white/10 text-center`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-white font-bold text-xl leading-none">{value}</div>
      <div className="text-white/50 text-xs mt-1 leading-tight">{label}</div>
    </div>
  );
}

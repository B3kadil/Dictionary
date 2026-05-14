import { Category, Progress, Screen } from '../types';
import { getCategoryStats, categoryGradient } from '../utils/progress';
import ProgressBar from './ProgressBar';

interface Props {
  category: Category;
  index: number;
  progress: Progress;
  onClick: () => void;
  onBrowse: () => void;
}

export default function CategoryCard({ category, index, progress, onClick, onBrowse }: Props) {
  const { total, known, percent } = getCategoryStats(category, progress);
  const gradient = categoryGradient(index);

  return (
    <div
      className={`
        relative w-full rounded-2xl bg-gradient-to-br ${gradient}
        border border-white/10 shadow-lg
        hover:shadow-xl active:scale-[0.98]
        transition-all duration-200 ease-out overflow-hidden
      `}
      style={{ animationDelay: `${Math.min(index * 25, 500)}ms`, animationFillMode: 'both' }}
    >
      {/* Main study area */}
      <button
        onClick={onClick}
        className="w-full text-left px-4 pt-4 pb-2 hover:brightness-110 transition-all"
      >
        {percent === 100 && (
          <div className="absolute top-3 right-3 text-base" title="Завершено!">✅</div>
        )}
        <div className="pr-6">
          <h3 className="text-white font-semibold text-sm leading-tight mb-1 line-clamp-2">
            {category.name}
          </h3>
        </div>
      </button>

      {/* Bottom row: progress bar + browse */}
      <div className="px-4 pb-3">
        <ProgressBar percent={percent} height={5} />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-white/40 text-xs">{known} / {total}</span>
          <button
            onClick={onBrowse}
            className="flex items-center gap-1 text-white/30 hover:text-white/65 text-xs transition-colors py-0.5"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Просмотр
          </button>
        </div>
      </div>
    </div>
  );
}

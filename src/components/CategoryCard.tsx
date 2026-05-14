import { Category, Progress } from '../types';
import { getCategoryStats, categoryGradient } from '../utils/progress';
import ProgressBar from './ProgressBar';

interface Props {
  category: Category;
  index: number;
  progress: Progress;
  onClick: () => void;
}

export default function CategoryCard({ category, index, progress, onClick }: Props) {
  const { total, known, percent } = getCategoryStats(category, progress);
  const gradient = categoryGradient(index);

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full text-left rounded-2xl p-4 bg-gradient-to-br ${gradient}
        border border-white/10 shadow-lg
        hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]
        transition-all duration-200 ease-out
      `}
      style={{
        animationDelay: `${Math.min(index * 25, 500)}ms`,
        animationFillMode: 'both',
      }}
    >
      {percent === 100 && (
        <div className="absolute top-3 right-3 text-base" title="Completed!">✅</div>
      )}

      <div className="pr-6">
        <h3 className="text-white font-semibold text-sm leading-tight mb-1 line-clamp-2">
          {category.name}
        </h3>
        <p className="text-white/60 text-xs mb-3">
          {known} / {total} words
        </p>
      </div>

      <ProgressBar percent={percent} height={5} />
    </button>
  );
}

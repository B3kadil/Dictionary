import { progressColor } from '../utils/progress';

interface Props {
  percent: number;
  showLabel?: boolean;
  height?: number;
}

export default function ProgressBar({ percent, showLabel = false, height = 6 }: Props) {
  const color = progressColor(percent);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-white/60 mb-1">
          <span>Progress</span>
          <span>{percent}%</span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden bg-white/10"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

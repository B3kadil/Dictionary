import { useState } from 'react';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#a855f7', '#06b6d4', '#fbbf24'];

interface Piece {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  shape: 'square' | 'circle' | 'rect';
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    duration: 2 + Math.random() * 2,
    delay: Math.random() * 1.5,
    shape: (['square', 'circle', 'rect'] as const)[Math.floor(Math.random() * 3)],
  }));
}

export default function Confetti() {
  const [pieces] = useState(() => makePieces(80));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece absolute"
          style={{
            left: `${p.x}%`,
            width: p.shape === 'rect' ? p.size * 2 : p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : '2px',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

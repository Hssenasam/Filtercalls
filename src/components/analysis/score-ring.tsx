import { cn } from '@/lib/utils';

export const ScoreRing = ({ label, score }: { label: string; score: number }) => {
  const color = score > 70 ? 'text-danger' : score > 45 ? 'text-warning' : 'text-success';
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn('mt-2 text-2xl font-semibold', color)}>{score}</p>
    </div>
  );
};

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn('inline-flex items-center rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs text-muted', className)} {...props} />
);

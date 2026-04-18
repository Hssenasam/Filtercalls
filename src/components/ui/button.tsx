import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'secondary';
}

export const Button = ({ className, variant = 'primary', ...props }: ButtonProps) => (
  <button
    className={cn(
      'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60',
      variant === 'primary' && 'bg-primary text-white shadow-glow hover:opacity-90',
      variant === 'secondary' && 'bg-white/10 text-foreground hover:bg-white/20 border border-white/20',
      variant === 'ghost' && 'text-muted hover:text-foreground hover:bg-white/10',
      className
    )}
    {...props}
  />
);

import { cn } from '@/lib/utils';

interface AmountDisplayProps {
  amount: number;
  type?: 'income' | 'expense' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSign?: boolean;
  className?: string;
}

export function AmountDisplay({
  amount,
  type = 'neutral',
  size = 'md',
  showSign = false,
  className,
}: AmountDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
  };

  const colorClasses = {
    income: 'text-emerald-500',
    expense: 'text-red-500',
    neutral: 'text-zinc-900',
  };

  const formattedAmount = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = showSign
    ? amount > 0
      ? '+'
      : amount < 0
      ? '-'
      : ''
    : '';

  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        sizeClasses[size],
        colorClasses[type],
        className
      )}
    >
      {sign}
      {type === 'expense' && !showSign && '-'}
      {formattedAmount}
    </span>
  );
}

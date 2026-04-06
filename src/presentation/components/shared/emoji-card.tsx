import { cn } from '@/lib/utils';

interface EmojiCardProps {
  emoji: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function EmojiCard({
  emoji,
  title,
  value,
  subtitle,
  trend,
  className,
  onClick,
}: EmojiCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl p-6 shadow-sm border border-zinc-200',
        'hover:shadow-md transition-shadow duration-200',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl" role="img" aria-label={title}>
          {emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="text-2xl font-semibold text-zinc-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-zinc-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {trend.isPositive ? '+' : '-'}{trend.value}%
              </span>
              <span className="text-xs text-zinc-400">vs mes anterior</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

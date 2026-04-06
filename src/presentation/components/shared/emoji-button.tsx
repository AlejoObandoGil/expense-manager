import { cn } from '@/lib/utils';

interface EmojiButtonProps {
  emoji: string;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function EmojiButton({
  emoji,
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
}: EmojiButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600',
    secondary: 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
    ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-3 rounded-lg font-medium',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <span className="text-2xl" role="img" aria-hidden>
        {emoji}
      </span>
      <span>{label}</span>
    </button>
  );
}

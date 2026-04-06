import { EmojiButton } from './emoji-button';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionEmoji?: string;
  onAction?: () => void;
}

export function EmptyState({
  emoji,
  title,
  description,
  actionLabel,
  actionEmoji = '➕',
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-6xl mb-4" role="img" aria-label={title}>
        {emoji}
      </span>
      <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <EmojiButton
          emoji={actionEmoji}
          label={actionLabel}
          onClick={onAction}
          variant="primary"
        />
      )}
    </div>
  );
}

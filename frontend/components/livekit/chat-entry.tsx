import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /** The locale to use for the timestamp. */
  locale: string;
  /** The timestamp of the message. */
  timestamp: number;
  /** The message to display. */
  message: string;
  /** The origin of the message. */
  messageOrigin: 'local' | 'remote';
  /** The sender's name. */
  name?: string;
  /** Whether the message has been edited. */
  hasBeenEdited?: boolean;
}

export const ChatEntry = ({
  name,
  locale,
  timestamp,
  message,
  messageOrigin,
  hasBeenEdited = false,
  className,
  ...props
}: ChatEntryProps) => {
  const time = new Date(timestamp);
  const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });

  return (
    <li
      title={title}
      data-lk-message-origin={messageOrigin}
      className={cn('group flex w-full flex-col gap-0.5', className)}
      {...props}
    >
      <header
        className={cn(
          'flex items-center gap-2 text-xs font-mono',
          messageOrigin === 'local'
            ? 'flex-row-reverse text-terminal-amber'
            : 'text-left text-terminal-green glow'
        )}
      >
        {name && <strong className="font-bold">{name}</strong>}
        <span className="font-mono text-xs opacity-0 transition-opacity ease-linear group-hover:opacity-70 text-terminal-dim">
          {hasBeenEdited && '*'}
          {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
        </span>
      </header>
      <span
        className={cn(
          'max-w-4/5 px-2 py-1 text-sm font-mono',
          messageOrigin === 'local'
            ? 'ml-auto text-terminal-amber'
            : 'mr-auto text-terminal-green'
        )}
      >
        {message}
      </span>
    </li>
  );
};

'use client'

import { UIMessage } from 'ai'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: UIMessage
}

function getMessageText(message: UIMessage): string {
  if (!message.parts || !Array.isArray(message.parts)) return ''
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const text = getMessageText(message)

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        <div className="text-xs font-medium mb-1 opacity-70">
          {isUser ? 'You' : 'Assistant'}
        </div>
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{text}</div>
      </div>
    </div>
  )
}

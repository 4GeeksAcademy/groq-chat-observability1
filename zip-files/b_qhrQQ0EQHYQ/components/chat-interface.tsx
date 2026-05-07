'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, UIMessage } from 'ai'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { StatsDashboard } from './stats-dashboard'
import { useMetricsStore } from '@/hooks/use-metrics-store'
import { useSessionStorage } from '@/hooks/use-session-storage'
import { Button } from '@/components/ui/button'

const MESSAGES_STORAGE_KEY = 'groq-chat-messages'

export function ChatInterface() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [requestStartTime, setRequestStartTime] = useState<number | null>(null)
  const { metrics, sessionStats, addMetric, clearMetrics, isHydrated: metricsHydrated } = useMetricsStore()
  
  // Persist messages to sessionStorage
  const { 
    value: storedMessages, 
    setValue: setStoredMessages, 
    clearValue: clearStoredMessages,
    isHydrated: messagesHydrated 
  } = useSessionStorage<UIMessage[]>(MESSAGES_STORAGE_KEY, [])

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onFinish: (message, options) => {
      // Capture metrics when response completes
      if (requestStartTime && options.usage) {
        const latencyMs = Date.now() - requestStartTime
        addMetric({
          id: message.id,
          promptTokens: options.usage.promptTokens || 0,
          completionTokens: options.usage.completionTokens || 0,
          totalTokens: (options.usage.promptTokens || 0) + (options.usage.completionTokens || 0),
          latencyMs,
        })
        setRequestStartTime(null)
      }
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'
  const isHydrated = metricsHydrated && messagesHydrated

  // Load persisted messages on mount
  useEffect(() => {
    if (messagesHydrated && storedMessages.length > 0 && messages.length === 0) {
      setMessages(storedMessages)
    }
  }, [messagesHydrated, storedMessages, messages.length, setMessages])

  // Persist messages whenever they change (after initial hydration)
  useEffect(() => {
    if (messagesHydrated && messages.length > 0) {
      setStoredMessages(messages)
    }
  }, [messages, messagesHydrated, setStoredMessages])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (text: string) => {
    setRequestStartTime(Date.now())
    sendMessage({ text })
  }

  const handleClearChat = () => {
    setMessages([])
    clearStoredMessages()
    clearMetrics()
  }

  // Show loading skeleton until hydrated to prevent flash
  if (!isHydrated) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Groq Chat</h1>
              <p className="text-sm text-muted-foreground">Powered by Llama 3.3 70B</p>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading session...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Groq Chat</h1>
            <p className="text-sm text-muted-foreground">Powered by Llama 3.3 70B</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="text-muted-foreground"
          >
            Clear Chat
          </Button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-muted-foreground"
                >
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-foreground mb-2">Start a Conversation</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Send a message to begin chatting with the AI. Token usage and costs will be tracked in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Stats Sidebar */}
      <aside className="w-80 border-l border-border bg-muted/30 p-4 overflow-y-auto hidden lg:block">
        <h2 className="text-lg font-semibold text-foreground mb-4">Observability</h2>
        <StatsDashboard
          stats={sessionStats}
          metrics={metrics}
          isStreaming={isLoading}
        />
      </aside>
    </div>
  )
}

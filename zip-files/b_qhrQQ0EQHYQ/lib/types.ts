export interface MessageMetrics {
  id: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  latencyMs: number
  tokensPerSecond: number
  cost: number
  timestamp: Date
}

export interface SessionStats {
  totalMessages: number
  totalPromptTokens: number
  totalCompletionTokens: number
  totalTokens: number
  totalCost: number
  averageLatency: number
  messagesPerMinute: number
  sessionStartTime: Date
}

// Groq pricing per 1M tokens (as of 2024)
// llama-3.3-70b-versatile: $0.59 input, $0.79 output
export const GROQ_PRICING = {
  'llama-3.3-70b-versatile': {
    input: 0.59 / 1_000_000,
    output: 0.79 / 1_000_000,
  },
} as const

export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: keyof typeof GROQ_PRICING = 'llama-3.3-70b-versatile'
): number {
  const pricing = GROQ_PRICING[model]
  return promptTokens * pricing.input + completionTokens * pricing.output
}

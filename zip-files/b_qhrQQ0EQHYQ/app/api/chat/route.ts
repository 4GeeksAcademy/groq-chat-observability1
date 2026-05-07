import { streamText, convertToModelMessages, UIMessage } from 'ai'
import { createGroq } from '@ai-sdk/groq'

export const maxDuration = 30

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()
  const startTime = Date.now()

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ usage, response }) => {
      const endTime = Date.now()
      const latency = endTime - startTime
      
      // Log usage for debugging - this data is also sent to the client via headers
      console.log('[Groq Response]', {
        promptTokens: usage?.promptTokens,
        completionTokens: usage?.completionTokens,
        totalTokens: usage?.totalTokens,
        latency: `${latency}ms`,
        model: response?.modelId,
      })
    },
  })
}

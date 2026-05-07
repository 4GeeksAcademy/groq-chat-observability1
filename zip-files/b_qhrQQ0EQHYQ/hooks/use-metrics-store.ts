'use client'

import { useCallback, useMemo } from 'react'
import { MessageMetrics, SessionStats, calculateCost } from '@/lib/types'
import { useSessionStorage } from './use-session-storage'

interface StoredMetricsState {
  metrics: MessageMetrics[]
  sessionStartTime: string
}

const STORAGE_KEY = 'groq-chat-metrics'

export function useMetricsStore() {
  const initialState: StoredMetricsState = {
    metrics: [],
    sessionStartTime: new Date().toISOString(),
  }

  const { value: state, setValue: setState, clearValue, isHydrated } = useSessionStorage<StoredMetricsState>(
    STORAGE_KEY,
    initialState
  )

  const addMetric = useCallback((metric: Omit<MessageMetrics, 'id' | 'timestamp' | 'cost' | 'tokensPerSecond'> & { id?: string }) => {
    const cost = calculateCost(metric.promptTokens, metric.completionTokens)
    // Calculate tokens per second (completion tokens / latency in seconds)
    const tokensPerSecond = metric.latencyMs > 0 
      ? (metric.completionTokens / (metric.latencyMs / 1000)) 
      : 0
    const newMetric: MessageMetrics = {
      ...metric,
      id: metric.id || crypto.randomUUID(),
      tokensPerSecond,
      cost,
      timestamp: new Date(),
    }
    setState(prev => ({
      ...prev,
      metrics: [...prev.metrics, newMetric],
    }))
    return newMetric
  }, [setState])

  const sessionStats = useMemo<SessionStats>(() => {
    const metrics = state.metrics
    const sessionStartTime = new Date(state.sessionStartTime)
    const now = new Date()
    const sessionDurationMinutes = Math.max(
      (now.getTime() - sessionStartTime.getTime()) / 60000,
      1
    )

    const totalPromptTokens = metrics.reduce((sum, m) => sum + m.promptTokens, 0)
    const totalCompletionTokens = metrics.reduce((sum, m) => sum + m.completionTokens, 0)
    const totalLatency = metrics.reduce((sum, m) => sum + m.latencyMs, 0)
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0)

    return {
      totalMessages: metrics.length,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      totalCost,
      averageLatency: metrics.length > 0 ? totalLatency / metrics.length : 0,
      messagesPerMinute: metrics.length / sessionDurationMinutes,
      sessionStartTime,
    }
  }, [state.metrics, state.sessionStartTime])

  const clearMetrics = useCallback(() => {
    clearValue()
  }, [clearValue])

  return {
    metrics: state.metrics,
    sessionStats,
    addMetric,
    clearMetrics,
    isHydrated,
  }
}

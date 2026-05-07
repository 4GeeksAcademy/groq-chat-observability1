'use client'

import { SessionStats, MessageMetrics } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatsDashboardProps {
  stats: SessionStats
  metrics: MessageMetrics[]
  isStreaming: boolean
}

function formatCost(cost: number): string {
  if (cost < 0.0001) return '< $0.0001'
  return `$${cost.toFixed(6)}`
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}

export function StatsDashboard({ stats, metrics, isStreaming }: StatsDashboardProps) {
  const latestMetric = metrics[metrics.length - 1]

  return (
    <div className="space-y-4">
      {/* Session Overview */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Session Overview</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Tokens</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold text-foreground">{formatNumber(stats.totalTokens)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="text-chart-1">{formatNumber(stats.totalPromptTokens)} in</span>
                {' / '}
                <span className="text-chart-2">{formatNumber(stats.totalCompletionTokens)} out</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Est. Cost</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold text-foreground">{formatCost(stats.totalCost)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.totalMessages} request{stats.totalMessages !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Avg Latency</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold text-foreground">
                {stats.totalMessages > 0 ? formatLatency(stats.averageLatency) : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.messagesPerMinute.toFixed(1)} req/min
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">Throughput</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-xl font-bold text-foreground">
                {latestMetric ? `${Math.round(latestMetric.tokensPerSecond)}` : '-'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                tokens/sec
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Latest Request */}
      {latestMetric && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Latest Request</h3>
          <Card className="bg-card border-border">
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Prompt:</span>
                  <span className="ml-2 font-medium text-foreground">{formatNumber(latestMetric.promptTokens)} tokens</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Completion:</span>
                  <span className="ml-2 font-medium text-foreground">{formatNumber(latestMetric.completionTokens)} tokens</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Latency:</span>
                  <span className="ml-2 font-medium text-foreground">{formatLatency(latestMetric.latencyMs)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="ml-2 font-medium text-foreground">{formatCost(latestMetric.cost)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Speed:</span>
                  <span className="ml-2 font-medium text-foreground">{Math.round(latestMetric.tokensPerSecond)} tokens/sec</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                Model: llama-3.3-70b-versatile
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Request History */}
      {metrics.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Request History</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {metrics.slice().reverse().map((metric, index) => (
              <div
                key={metric.id}
                className="text-xs p-2 rounded-md bg-muted/50 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">#{metrics.length - index}</span>
                  <span className="font-medium text-foreground">{formatNumber(metric.totalTokens)} tokens</span>
                  <span className="text-chart-2">{Math.round(metric.tokensPerSecond)} tok/s</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{formatLatency(metric.latencyMs)}</span>
                  <span>{formatCost(metric.cost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

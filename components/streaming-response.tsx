'use client'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Source } from '@/types/api'

// Step display names
const STEP_LABELS: Record<string, string> = {
  classified: 'Intent classified',
  executing: 'Querying graph...',
  validation_failed: 'Retrying...',
  execution_error: 'Retrying...',
  empty_results: 'Broadening search...',
  fallback: 'Fulltext search...',
  resolving: 'Resolving amendments...',
  synthesizing: 'Generating answer...',
}

export interface StreamState {
  status: 'streaming' | 'complete' | 'error'
  intent: string
  cypher: string
  steps: string[]
  sources: Source[]
  graphPath: string[]
  tokens: string
  errorMessage: string
}

interface StreamingResponseProps {
  state: StreamState
}

export function StreamingResponse({ state }: StreamingResponseProps) {
  return (
    <Card className="rounded-lg shadow-sm bg-white border border-slate-200">
      <CardHeader className="pb-3">
        {/* Step pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {state.intent && (
            <Badge
              style={{ backgroundColor: '#4F46E5', color: '#ffffff', fontSize: '12px' }}
            >
              {state.intent.replace(/_/g, ' ')}
            </Badge>
          )}
          {state.steps.map((step, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-xs"
              style={{
                color: '#64748B',
                borderColor: '#E2E8F0',
              }}
            >
              {STEP_LABELS[step] ?? step}
            </Badge>
          ))}
          {state.status === 'streaming' && (
            <Badge
              className="animate-pulse text-xs"
              style={{ backgroundColor: '#10B981', color: '#ffffff', fontSize: '12px' }}
            >
              Live
            </Badge>
          )}
        </div>

        {/* Cypher preview */}
        {state.cypher && (
          <pre
            className="rounded p-3 overflow-x-auto text-sm leading-relaxed mb-4"
            style={{
              backgroundColor: '#F8FAFC',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: '12px',
              lineHeight: '1.5',
              color: '#64748B',
              maxHeight: '80px',
            }}
          >
            <code>{state.cypher}</code>
          </pre>
        )}

        {/* Streaming answer text */}
        {state.tokens && (
          <div
            className="text-base leading-relaxed"
            style={{ color: '#0F172A', fontSize: '16px', lineHeight: '1.75' }}
          >
            {state.tokens}
            {state.status === 'streaming' && (
              <span className="inline-block w-2 h-5 ml-1 animate-pulse rounded-sm" style={{ backgroundColor: '#4F46E5' }} />
            )}
          </div>
        )}

        {/* Empty state while waiting for tokens */}
        {!state.tokens && state.status === 'streaming' && (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#64748B' }}>
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#4F46E5' }} />
            Processing your question...
          </div>
        )}

        {/* Error state */}
        {state.status === 'error' && (
          <div
            className="rounded-lg p-4 border mt-4"
            style={{ borderColor: '#EF4444', backgroundColor: '#FEF2F2' }}
          >
            <p className="text-sm" style={{ color: '#EF4444' }}>
              {state.errorMessage || 'An error occurred while processing your query.'}
            </p>
          </div>
        )}
      </CardHeader>

      {/* Sources preview (appears during streaming once sources arrive) */}
      {state.sources.length > 0 && state.status === 'streaming' && (
        <CardContent className="pt-0">
          <p className="text-xs font-medium mb-2" style={{ color: '#64748B' }}>
            Sources found: {state.sources.length}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {state.sources.slice(0, 8).map((s) => (
              <Badge
                key={s.uid}
                variant="outline"
                className="text-xs font-mono"
              >
                {s.uid}
              </Badge>
            ))}
            {state.sources.length > 8 && (
              <Badge variant="outline" className="text-xs">
                +{state.sources.length - 8} more
              </Badge>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

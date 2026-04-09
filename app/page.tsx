'use client'
import { useState, useRef, useCallback } from 'react'
import { postQuery, streamQuery } from '@/lib/api'
import type { QueryResponse, Source } from '@/types/api'
import type { StreamEvent } from '@/lib/api'
import { QueryInput } from '@/components/query-input'
import { ResponseCard } from '@/components/response-card'
import { StreamingResponse, StreamState } from '@/components/streaming-response'

type PageState = 'idle' | 'streaming' | 'complete' | 'error' | 'fallback-loading'

export default function QueryPage() {
  const [pageState, setPageState] = useState<PageState>('idle')
  const [streamState, setStreamState] = useState<StreamState>({
    status: 'streaming',
    intent: '',
    cypher: '',
    steps: [],
    sources: [],
    graphPath: [],
    tokens: '',
    errorMessage: '',
  })
  const [finalResponse, setFinalResponse] = useState<QueryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleSubmit = useCallback(async (question: string) => {
    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Reset state
    setPageState('streaming')
    setFinalResponse(null)
    setError(null)
    setStreamState({
      status: 'streaming',
      intent: '',
      cypher: '',
      steps: [],
      sources: [],
      graphPath: [],
      tokens: '',
      errorMessage: '',
    })

    try {
      await streamQuery(
        question,
        (event: StreamEvent) => {
          setStreamState((prev) => {
            switch (event.event) {
              case 'status': {
                const step = event.data.step as string
                const intent = event.data.intent as string | undefined
                return {
                  ...prev,
                  steps: [...prev.steps, step],
                  intent: intent ?? prev.intent,
                }
              }
              case 'cypher':
                return { ...prev, cypher: event.data.query as string }
              case 'sources':
                return {
                  ...prev,
                  sources: event.data.sources as Source[],
                  graphPath: event.data.graph_path as string[],
                }
              case 'token':
                return { ...prev, tokens: prev.tokens + (event.data.text as string) }
              case 'done': {
                const d = event.data
                setFinalResponse({
                  answer: d.answer as string,
                  cypher_query: d.cypher_query as string,
                  graph_path: prev.graphPath,
                  sources: prev.sources,
                  citations: (d.citations ?? []) as QueryResponse['citations'],
                  trace_url: (d.trace_url ?? '') as string,
                  metadata: d.metadata as QueryResponse['metadata'],
                })
                setPageState('complete')
                return { ...prev, status: 'complete' as const }
              }
              case 'error':
                setError(event.data.message as string)
                setPageState('error')
                return { ...prev, status: 'error' as const, errorMessage: event.data.message as string }
              default:
                return prev
            }
          })
        },
        controller.signal,
      )

      // If we get here without a 'done' event, stream ended gracefully
      setStreamState((prev) => {
        if (prev.status === 'streaming') {
          // Stream ended without done — check if we have tokens
          if (prev.tokens) {
            setFinalResponse({
              answer: prev.tokens,
              cypher_query: prev.cypher,
              graph_path: prev.graphPath,
              sources: prev.sources,
              citations: [],
              trace_url: '',
              metadata: { intent: prev.intent, retry_count: 0, latency_ms: 0, source_type: 'cypher', fallback_used: false },
            })
            setPageState('complete')
            return { ...prev, status: 'complete' as const }
          }
        }
        return prev
      })
    } catch (err) {
      if (controller.signal.aborted) return

      // SSE failed — fall back to non-streaming
      console.warn('SSE stream failed, falling back to POST /api/query:', err)
      setPageState('fallback-loading')
      try {
        const result = await postQuery(question)
        setFinalResponse(result)
        setPageState('complete')
      } catch (fallbackErr) {
        setError((fallbackErr as Error).message)
        setPageState('error')
      }
    }
  }, [])

  const isLoading = pageState === 'streaming' || pageState === 'fallback-loading'

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
      <h1
        className="font-semibold pt-12 pb-8"
        style={{ fontSize: '20px', lineHeight: '1.2', color: '#0F172A' }}
      >
        Query
      </h1>

      <div className="pb-4">
        <QueryInput onSubmit={handleSubmit} isLoading={isLoading} />
      </div>

      <div className="pt-4">
        {/* Streaming state */}
        {pageState === 'streaming' && (
          <StreamingResponse state={streamState} />
        )}

        {/* Fallback loading (non-streaming) */}
        {pageState === 'fallback-loading' && (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mb-2" style={{ borderColor: '#4F46E5', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: '#64748B' }}>Processing query...</p>
          </div>
        )}

        {/* Complete — show response card */}
        {pageState === 'complete' && finalResponse && (
          <ResponseCard data={finalResponse} />
        )}

        {/* Error state */}
        {pageState === 'error' && (
          <div
            className="rounded-lg p-4 border"
            style={{ borderColor: '#EF4444', backgroundColor: '#FEF2F2' }}
          >
            <h2
              className="font-semibold text-base mb-1"
              style={{ color: '#EF4444' }}
            >
              Query failed
            </h2>
            <p className="text-sm" style={{ color: '#0F172A' }}>
              {error ?? 'An unknown error occurred'}. Check your connection or try rephrasing your question.
            </p>
          </div>
        )}

        {/* Idle state */}
        {pageState === 'idle' && (
          <div className="text-center py-12">
            <h2
              className="font-semibold mb-2"
              style={{ fontSize: '18px', color: '#0F172A' }}
            >
              Ask a legal question to get started
            </h2>
            <p
              className="text-sm"
              style={{ color: '#64748B', maxWidth: '480px', margin: '0 auto' }}
            >
              Type your question above, or click one of the examples below to see a traced answer from the graph.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

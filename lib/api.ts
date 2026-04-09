import { QueryResponse, SchemaResponse } from '@/types/api'

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

export async function postQuery(question: string): Promise<QueryResponse> {
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(typeof err.detail === 'object' ? err.detail.detail : err.detail ?? 'Query failed')
  }
  return res.json()
}

export async function postCypher(query: string): Promise<{ results: Record<string, unknown>[] }> {
  const res = await fetch(`${BASE_URL}/api/cypher`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(typeof err.detail === 'object' ? err.detail.detail : err.detail ?? 'Cypher query failed')
  }
  return res.json()
}

export async function fetchSchema(): Promise<SchemaResponse> {
  const res = await fetch(`${BASE_URL}/api/schema`)
  if (!res.ok) throw new Error('Failed to fetch schema')
  return res.json()
}

export async function fetchHealth(): Promise<{ status: string; neo4j: string }> {
  const res = await fetch(`${BASE_URL}/api/health`)
  if (!res.ok) throw new Error('Health check failed')
  return res.json()
}

// SSE streaming types
export interface StreamEvent {
  event: 'status' | 'cypher' | 'sources' | 'token' | 'done' | 'error'
  data: Record<string, unknown>
}

export async function streamQuery(
  question: string,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/query/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(typeof err.detail === 'object' ? err.detail.detail : err.detail ?? 'Stream failed')
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Parse SSE events from buffer
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // Keep incomplete last line

    let currentEvent = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith('data: ') && currentEvent) {
        try {
          const data = JSON.parse(line.slice(6))
          onEvent({ event: currentEvent as StreamEvent['event'], data })
        } catch {
          // Skip malformed JSON
        }
        currentEvent = ''
      }
    }
  }
}

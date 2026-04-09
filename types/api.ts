export interface Source {
  uid: string
  type: string
  text_excerpt: string
}

export interface QueryMetadata {
  intent: string
  retry_count: number
  latency_ms: number
  source_type: string   // "cypher" | "fulltext_search"
  fallback_used: boolean
}

export interface Citation {
  marker: string
  uid: string
  type: string
  text_excerpt: string
  index: number
}

export interface QueryResponse {
  answer: string
  cypher_query: string
  graph_path: string[]
  sources: Source[]
  citations: Citation[]
  trace_url: string
  metadata: QueryMetadata
}

export interface SchemaResponse {
  node_labels: Record<string, number>
  relationship_types: Record<string, number>
}

export interface ApiError {
  error: string
  detail: string
  status: number
}

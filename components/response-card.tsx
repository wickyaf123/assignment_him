'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QueryResponse } from '@/types/api'
import { CitationRenderer } from '@/components/citation-link'

interface ResponseCardProps {
  data: QueryResponse
}

export function ResponseCard({ data }: ResponseCardProps) {
  const router = useRouter()
  const [highlightedCitation, setHighlightedCitation] = useState<number | null>(null)

  const isFulltext = data.metadata.source_type === 'fulltext_search'
  const retryCount = data.metadata.retry_count

  function handleViewInGraph() {
    const uids = encodeURIComponent(data.sources.map((s) => s.uid).join(','))
    router.push(`/explore?uids=${uids}`)
  }

  return (
    <Card className="rounded-lg shadow-sm bg-white border border-slate-200">
      <CardHeader className="pb-3">
        {/* Badges row */}
        {(isFulltext || retryCount > 0) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {isFulltext && (
              <Badge
                style={{
                  backgroundColor: '#10B981',
                  color: '#ffffff',
                  fontSize: '12px',
                }}
              >
                Fulltext match
              </Badge>
            )}
            {retryCount > 0 && (
              <Badge
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#ffffff',
                  fontSize: '12px',
                }}
              >
                {retryCount} {retryCount === 1 ? 'retry' : 'retries'}
              </Badge>
            )}
          </div>
        )}
        {/* Answer text */}
        <div
          className="text-base leading-relaxed"
          style={{ color: '#0F172A', fontSize: '16px', lineHeight: '1.5' }}
        >
          {data.citations && data.citations.length > 0 ? (
            <CitationRenderer
              answer={data.answer}
              citations={data.citations}
              onHoverCitation={setHighlightedCitation}
            />
          ) : (
            <p>{data.answer}</p>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Accordion multiple className="w-full">
          {/* Cypher Query */}
          <AccordionItem value="cypher">
            <AccordionTrigger
              className="text-sm font-medium"
              style={{ color: '#0F172A', fontSize: '14px' }}
            >
              Cypher Query
            </AccordionTrigger>
            <AccordionContent>
              <pre
                className="rounded p-3 overflow-x-auto text-sm leading-relaxed"
                style={{
                  backgroundColor: '#F8FAFC',
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#0F172A',
                }}
              >
                <code>{data.cypher_query}</code>
              </pre>
            </AccordionContent>
          </AccordionItem>

          {/* Graph Path */}
          <AccordionItem value="graph-path">
            <AccordionTrigger
              className="text-sm font-medium"
              style={{ color: '#0F172A', fontSize: '14px' }}
            >
              Graph Path
            </AccordionTrigger>
            <AccordionContent>
              {data.graph_path.length === 0 ? (
                <p className="text-sm" style={{ color: '#64748B' }}>
                  No graph path available.
                </p>
              ) : (
                <ol className="space-y-1">
                  {data.graph_path.map((node, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {i > 0 && (
                        <span className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                          &#8595;
                        </span>
                      )}
                      {i === 0 && (
                        <span className="w-3 shrink-0" />
                      )}
                      <span
                        className="text-sm font-mono"
                        style={{ color: '#0F172A', fontSize: '13px' }}
                      >
                        {node}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Sources / Citation Evidence */}
          <AccordionItem value="sources">
            <AccordionTrigger
              className="text-sm font-medium"
              style={{ color: '#0F172A', fontSize: '14px' }}
            >
              {data.citations && data.citations.length > 0
                ? `Citation Evidence (${data.citations.length})`
                : `Sources (${data.sources.length})`}
            </AccordionTrigger>
            <AccordionContent>
              {data.citations && data.citations.length > 0 ? (
                <ul className="space-y-3">
                  {data.citations.map((citation) => (
                    <li
                      key={citation.marker}
                      className="border rounded p-3 transition-colors"
                      style={{
                        borderColor: highlightedCitation === citation.index ? '#4F46E5' : '#E2E8F0',
                        backgroundColor: highlightedCitation === citation.index ? '#EEF2FF' : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full"
                          style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                        >
                          {citation.index}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {citation.type}
                        </Badge>
                        <span className="text-xs font-mono" style={{ color: '#64748B' }}>
                          {citation.uid}
                        </span>
                      </div>
                      {citation.text_excerpt && (
                        <p className="text-sm mt-1" style={{ color: '#0F172A', lineHeight: '1.5' }}>
                          {citation.text_excerpt.length > 200
                            ? citation.text_excerpt.slice(0, 200) + '...'
                            : citation.text_excerpt}
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          router.push(`/explore?uids=${encodeURIComponent(citation.uid)}`)
                        }}
                        className="mt-2 text-xs"
                        style={{ borderColor: '#4F46E5', color: '#4F46E5' }}
                      >
                        View in Graph
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : data.sources.length === 0 ? (
                <p className="text-sm" style={{ color: '#64748B' }}>
                  No sources available.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.sources.map((source) => (
                    <li key={source.uid} className="border rounded p-3 border-slate-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs font-mono">
                          {source.uid}
                        </Badge>
                        <span className="text-xs" style={{ color: '#64748B' }}>
                          {source.type}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: '#0F172A', lineHeight: '1.5' }}>
                        {source.text_excerpt.length > 200
                          ? source.text_excerpt.slice(0, 200) + '...'
                          : source.text_excerpt}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* LangSmith Trace */}
          <AccordionItem value="trace">
            <AccordionTrigger
              className="text-sm font-medium"
              style={{ color: '#0F172A', fontSize: '14px' }}
            >
              LangSmith Trace
            </AccordionTrigger>
            <AccordionContent>
              {data.trace_url ? (
                <a
                  href={data.trace_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                  style={{ color: '#4F46E5' }}
                >
                  Open trace in LangSmith
                </a>
              ) : (
                <p className="text-sm" style={{ color: '#64748B' }}>
                  No trace URL available.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-0 pb-4">
        <p
          className="text-sm"
          style={{ color: '#64748B', fontSize: '14px' }}
        >
          Intent: {data.metadata.intent} &middot; Latency: {data.metadata.latency_ms}ms
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handleViewInGraph}
          style={{
            borderColor: '#4F46E5',
            color: '#4F46E5',
            minHeight: '44px',
          }}
          className="text-sm font-medium hover:bg-indigo-50"
        >
          View in Graph Explorer
        </Button>
      </CardFooter>
    </Card>
  )
}

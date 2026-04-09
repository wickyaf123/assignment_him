'use client'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { Citation } from '@/types/api'

interface CitationRendererProps {
  answer: string
  citations: Citation[]
  onHoverCitation?: (index: number | null) => void
}

export function CitationRenderer({ answer, citations, onHoverCitation }: CitationRendererProps) {
  const router = useRouter()

  // Build marker -> citation lookup
  const citationMap = new Map<string, Citation>()
  for (const c of citations) {
    citationMap.set(c.marker, c)
  }

  // Split answer on [uid] markers
  // Regex captures the bracket content: text[marker]text -> ["text", "marker", "text"]
  const parts = answer.split(/\[([a-z][\w-]*)\]/)

  function handleCitationClick(uid: string) {
    router.push(`/explore?uids=${encodeURIComponent(uid)}`)
  }

  return (
    <span>
      {parts.map((part, i) => {
        // Even indices are text, odd indices are potential markers
        if (i % 2 === 0) {
          return <span key={i}>{part}</span>
        }

        const citation = citationMap.get(part)
        if (!citation) {
          // Not a known citation marker -- render as-is
          return <span key={i}>[{part}]</span>
        }

        return (
          <span key={i} className="relative inline-block group">
            <button
              type="button"
              className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full cursor-pointer align-super ml-0.5 transition-colors"
              style={{
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                lineHeight: '1',
              }}
              onClick={() => handleCitationClick(citation.uid)}
              onMouseEnter={() => onHoverCitation?.(citation.index)}
              onMouseLeave={() => onHoverCitation?.(null)}
              aria-label={`Citation ${citation.index}: ${citation.uid}`}
            >
              {citation.index}
            </button>
            {/* Hover tooltip */}
            <span
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg text-xs hidden group-hover:block z-50 whitespace-nowrap max-w-xs"
              style={{
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
              }}
            >
              <span className="font-semibold">{citation.type}</span> · {citation.uid}
              {citation.text_excerpt && (
                <>
                  <br />
                  <span className="text-[11px] opacity-80">
                    {citation.text_excerpt.length > 100
                      ? citation.text_excerpt.slice(0, 100) + '...'
                      : citation.text_excerpt}
                  </span>
                </>
              )}
            </span>
          </span>
        )
      })}
    </span>
  )
}
